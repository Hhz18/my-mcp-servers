# Skills MCP Server

An MCP server that provides a shared skills repository for AI agents.

## Features

- **List Skills**: View all available skills with descriptions
- **Get Skill**: Retrieve full skill content by name
- **Match Skills**: Automatically find the most relevant skills for a given task
- **Keyword Search**: Find skills by keyword in their name

## Quick Start

### Installation

```bash
# Install dependencies
pip install -e .

# Or use uv
uv pip install -e .
```

### Running the Server

```bash
# Run directly
python -m skills_mcp.server

# Or install and run
pip install -e .
skills-mcp-server
```

## Configuration

### OpenCode

Add to your `~/.config/opencode/opencode.json`:

```json
{
  "mcpServers": {
    "skills": {
      "command": "python",
      "args": ["-m", "skills_mcp.server"],
      "cwd": "/path/to/my-mcp-servers/skills-mcp-server"
    }
  }
}
```

### Claude Desktop

Add to your `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "skills": {
      "command": "python",
      "args": ["-m", "skills_mcp.server"],
      "cwd": "/path/to/my-mcp-servers/skills-mcp-server"
    }
  }
}
```

### Cursor

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "skills": {
      "command": "python",
      "args": ["-m", "skills_mcp.server"],
      "cwd": "/path/to/my-mcp-servers/skills-mcp-server"
    }
  }
}
```

## Available Skills

- **frontend-design**: Create high-quality, unique production-grade frontend interfaces
- **api_test_doc_standard**: Generate detailed backend API testing documentation
- **agent操作手册**: Agent development operation guidelines
- **director_worker_methodology**: Director-Worker dual-layer architecture methodology

## Adding New Skills

Add markdown files to the `../skills/` directory with YAML frontmatter:

```markdown
---
name: skill-name
description: When to use this skill
---

Your skill content here...
```
