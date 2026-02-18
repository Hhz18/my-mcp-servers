import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import z from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKILLS_DIR = "../skills";

function getSkillsDirectory() {
  return path.join(__dirname, SKILLS_DIR);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (match) {
    try {
      const metadata = yaml.load(match[1]) || {};
      return { metadata, body: match[2] };
    } catch {
      return { metadata: {}, body: match[2] };
    }
  }
  return { metadata: {}, body: content };
}

function loadAllSkills() {
  const skillsDir = getSkillsDirectory();
  const skills = [];
  
  if (!fs.existsSync(skillsDir)) {
    console.error("Skills directory not found:", skillsDir);
    return skills;
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        const skillMdPath = path.join(filePath, "SKILL.md");
        if (fs.existsSync(skillMdPath)) {
          loadSkillFile(skillMdPath);
        }
      } else if (file.endsWith('.md') && file !== "SKILL.md") {
        loadSkillFile(filePath);
      }
    }
  }
  
  function loadSkillFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { metadata, body } = parseFrontmatter(content);
      
      const name = metadata.name || path.basename(filePath, '.md');
      const description = metadata.description || '';
      
      skills.push({
        name,
        description,
        content
      });
    } catch (e) {
      console.error("Error loading skill:", filePath, e);
    }
  }
  
  walkDir(skillsDir);
  return skills;
}

function matchSkills(task, skills) {
  const taskLower = task.toLowerCase();
  const taskWords = new Set(taskLower.split(/\s+/));
  
  const scored = skills.map(skill => {
    let score = 0;
    const nameLower = skill.name.toLowerCase();
    const descLower = skill.description.toLowerCase();
    
    for (const word of taskWords) {
      if (word.length < 2) continue;
      if (nameLower.includes(word)) score += 2;
      if (descLower.includes(word)) score += 1;
    }
    
    return { skill, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

function getConfidenceLevel(score) {
  if (score >= 5) return "高";
  if (score >= 2) return "中";
  return "低";
}

function getRecommendation(matches) {
  if (matches.length === 0) return "";
  const topScore = matches[0].score;
  if (topScore >= 5) return "\n💡 建议使用以上技能中匹配度最高的那个";
  if (topScore >= 2) return "\n💡 建议根据任务需求选择合适的技能";
  return "\n💡 未找到高匹配度技能，建议手动选择";
}

// Create MCP Server
const server = new McpServer({
  name: "skills-mcp-server",
  version: "1.0.0",
}, {
  capabilities: {},
});

// Register list_skills tool
server.registerTool("list_skills", {
  description: "List all available skills with their names and descriptions",
  inputSchema: {
    type: z.object({}),
  }
}, async () => {
  const skills = loadAllSkills();
  
  if (skills.length === 0) {
    return { content: [{ type: "text", text: "No skills found." }] };
  }
  
  let result = "# Available Skills\n\n";
  for (const skill of skills) {
    result += `## ${skill.name}\n`;
    result += `${skill.description}\n\n`;
  }
  
  return { content: [{ type: "text", text: result }] };
});

// Register get_skill tool
server.registerTool("get_skill", {
  description: "Get the full content of a specific skill by name",
  inputSchema: {
    name: z.string().describe("The name of the skill to retrieve"),
  }
}, async ({ name }) => {
  const skills = loadAllSkills();
  
  const skill = skills.find(s => s.name.toLowerCase() === name.toLowerCase());
  
  if (!skill) {
    return { content: [{ type: "text", text: `Skill '${name}' not found.` }] };
  }
  
  return { content: [{ type: "text", text: skill.content }] };
});

// Register match_skills tool - improved with multiple results and scores
server.registerTool("match_skills", {
  description: "Match skills to a task description. Returns top 3 most relevant skills with match scores.",
  inputSchema: {
    task: z.string().describe("The task description to match skills against"),
  }
}, async ({ task }) => {
  const skills = loadAllSkills();
  
  if (skills.length === 0) {
    return { content: [{ type: "text", text: "No skills available." }] };
  }
  
  const matches = matchSkills(task, skills);
  
  if (matches.length === 0) {
    return { content: [{ type: "text", text: "No matching skills found." }] };
  }
  
  const topMatches = matches.slice(0, 3);
  
  let result = `# 匹配结果: "${task}"\n\n`;
  
  topMatches.forEach((item, index) => {
    const { skill, score } = item;
    const confidence = getConfidenceLevel(score);
    const badge = score >= 5 ? "⭐ 推荐" : "";
    
    result += `## ${index + 1}. ${skill.name} (匹配度: ${score}.0) [${confidence}] ${badge}\n`;
    result += `${skill.description}\n\n`;
  });
  
  result += "---\n";
  result += getRecommendation(matches);
  
  return { content: [{ type: "text", text: result }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Skills MCP Server running on stdio");
}

main().catch(console.error);
