# My MCP Servers

A collection of MCP servers for AI agents.

## Repository Structure

```
my-mcp-servers/
├── skills/                      # Shared skills repository
│   ├── frontend-design.md       # Frontend design skill
│   ├── api_test_doc_standard.md # API testing documentation skill
│   ├── agent操作手册.md         # Agent operation manual
│   └── director_worker_methodology/  # Director-Worker methodology
├── skills-mcp-server/          # Skills MCP Server
│   ├── skills_mcp/             # Python package
│   │   ├── __init__.py
│   │   ├── server.py           # MCP Server implementation
│   │   └── skills_loader.py    # Skills loading utilities
│   ├── pyproject.toml          # Project configuration
│   └── README.md               # Server-specific README
└── README.md                   # This file
```

## Skills MCP Server

### Available Tools

| Tool | Description |
|------|-------------|
| `list_skills` | List all available skills |
| `get_skill` | Get full skill content by name |
| `match_skills` | Match skills to a task description |
| `get_skill_by_keyword` | Get skill by keyword in name |

### Installation

```bash
cd skills-mcp-server
pip install -e .
```

### Usage

#### Option 1: Run directly

```bash
python -m skills_mcp.server
```

#### Option 2: Configure in OpenCode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcpServers": {
    "skills": {
      "command": "python",
      "args": ["-m", "skills_mcp.server"],
      "cwd": "path/to/my-mcp-servers/skills-mcp-server"
    }
  }
}
```

#### Option 3: Publish to npm/PyPI and use npx

(WIP)

### Adding New Skills

Simply add new `.md` files to the `skills/` directory with YAML frontmatter:

```markdown
---
name: my-new-skill
description: Description of when to use this skill
---

# Skill Content

Your skill content here...
```

## License

MIT
