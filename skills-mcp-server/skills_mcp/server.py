"""Skills MCP Server - provides tools for managing and matching skills."""
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
from mcp.server.lifecycle import AppLifecycleCallback
import asyncio

from .skills_loader import load_all_skills, match_skills, Skill


# Create MCP Server instance
app = Server("skills-mcp-server")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="list_skills",
            description="List all available skills with their names and descriptions",
            inputSchema={
                "type": "object",
                "properties": {},
            }
        ),
        Tool(
            name="get_skill",
            description="Get the full content of a specific skill by name",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name of the skill to retrieve"
                    }
                },
                "required": ["name"]
            }
        ),
        Tool(
            name="match_skills",
            description="Match skills to a task description. Returns the most relevant skills for the given task.",
            inputSchema={
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": "The task description to match skills against"
                    }
                },
                "required": ["task"]
            }
        ),
        Tool(
            name="get_skill_by_keyword",
            description="Get a skill by keyword in its name",
            inputSchema={
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "Keyword to search for in skill names"
                    }
                },
                "required": ["keyword"]
            }
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls."""
    
    if name == "list_skills":
        skills = load_all_skills()
        
        if not skills:
            return [TextContent(
                type="text",
                text="No skills found in the skills directory."
            )]
        
        result = "# Available Skills\n\n"
        for skill in skills:
            result += f"## {skill.name}\n"
            result += f"{skill.description}\n\n"
        
        return [TextContent(type="text", text=result)]
    
    elif name == "get_skill":
        skill_name = arguments.get("name", "")
        skills = load_all_skills()
        
        for skill in skills:
            if skill.name.lower() == skill_name.lower():
                return [TextContent(type="text", text=skill.content)]
        
        return [TextContent(type="text", text=f"Skill '{skill_name}' not found.")]
    
    elif name == "match_skills":
        task = arguments.get("task", "")
        skills = load_all_skills()
        
        if not skills:
            return [TextContent(type="text", text="No skills available.")]
        
        matches = match_skills(task, skills)
        
        if not matches:
            return [TextContent(type="text", text="No matching skills found for this task.")]
        
        result = f"# Matching Skills for: \"{task}\"\n\n"
        for skill, score in matches:
            result += f"## {skill.name} (relevance: {score:.1f})\n"
            result += f"{skill.description}\n\n"
        
        return [TextContent(type="text", text=result)]
    
    elif name == "get_skill_by_keyword":
        keyword = arguments.get("keyword", "").lower()
        skills = load_all_skills()
        
        matches = [s for s in skills if keyword in s.name.lower()]
        
        if not matches:
            return [TextContent(type="text", text=f"No skills found with keyword '{keyword}'.")]
        
        # Return the first match
        skill = matches[0]
        return [TextContent(type="text", text=skill.content)]
    
    return [TextContent(type="text", text="Unknown tool.")]


async def main():
    """Main entry point."""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
