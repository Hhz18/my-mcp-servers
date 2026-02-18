import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { CallToolResult, ListToolsResult } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

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
    .sort((a, b) => b.score - a.score)
    .map(s => s.skill);
}

const server = new Server(
  {
    name: "skills-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "list_skills",
        description: "List all available skills with their names and descriptions",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_skill",
        description: "Get the full content of a specific skill by name",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the skill to retrieve",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "match_skills",
        description: "Match skills to a task description. Returns the most relevant skills.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "The task description to match skills against",
            },
          },
          required: ["task"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    if (name === "list_skills") {
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
    }
    
    if (name === "get_skill") {
      const skillName = args.name;
      const skills = loadAllSkills();
      
      const skill = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
      
      if (!skill) {
        return { content: [{ type: "text", text: `Skill '${skillName}' not found.` }] };
      }
      
      return { content: [{ type: "text", text: skill.content }] };
    }
    
    if (name === "match_skills") {
      const task = args.task;
      const skills = loadAllSkills();
      
      if (skills.length === 0) {
        return { content: [{ type: "text", text: "No skills available." }] };
      }
      
      const matches = matchSkills(task, skills);
      
      if (matches.length === 0) {
        return { content: [{ type: "text", text: "No matching skills found." }] };
      }
      
      let result = `# Matching Skills for: "${task}"\n\n`;
      for (const skill of matches) {
        result += `## ${skill.name}\n`;
        result += `${skill.description}\n\n`;
      }
      
      return { content: [{ type: "text", text: result }] };
    }
    
    return { content: [{ type: "text", text: "Unknown tool." }] };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error}` }] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Skills MCP Server running on stdio");
}

main().catch(console.error);
