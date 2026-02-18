"""Skills loader - reads and parses skill markdown files."""
import os
import re
import yaml
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Skill:
    """Represents a skill with metadata and content."""
    name: str
    description: str
    content: str
    file_path: str


def get_skills_directory() -> Path:
    """Get the skills directory path."""
    # Go up two levels from skills_mcp/ to the project root
    module_dir = Path(__file__).parent.parent
    # The skills folder is at the project root, not in skills-mcp-server
    skills_dir = module_dir.parent / "skills"
    return skills_dir


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse YAML frontmatter from markdown content."""
    pattern = r'^---\n(.*?)\n---\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)
    
    if match:
        frontmatter_text = match.group(1)
        body = match.group(2)
        try:
            metadata = yaml.safe_load(frontmatter_text) or {}
        except yaml.YAMLError:
            metadata = {}
        return metadata, body
    
    return {}, content


def load_skill(file_path: Path) -> Optional[Skill]:
    """Load a single skill from a markdown file."""
    try:
        content = file_path.read_text(encoding='utf-8')
        metadata, body = parse_frontmatter(content)
        
        name = metadata.get('name', file_path.stem)
        description = metadata.get('description', '')
        
        return Skill(
            name=name,
            description=description,
            content=content,
            file_path=str(file_path)
        )
    except Exception as e:
        print(f"Error loading skill from {file_path}: {e}")
        return None


def load_all_skills() -> List[Skill]:
    """Load all skills from the skills directory."""
    skills_dir = get_skills_directory()
    skills = []
    
    if not skills_dir.exists():
        print(f"Skills directory not found: {skills_dir}")
        return skills
    
    # Walk through all markdown files in skills directory
    for file_path in skills_dir.rglob("*.md"):
        # Skip files in subdirectories that are not skill directories
        if file_path.parent != skills_dir:
            # It's in a subdirectory - check if it's a SKILL.md file
            if file_path.name != "SKILL.md":
                continue
        
        skill = load_skill(file_path)
        if skill:
            skills.append(skill)
    
    return skills


def match_skills(task_description: str, skills: List[Skill]) -> List[tuple[Skill, float]]:
    """Match skills to a task description using keyword matching."""
    task_lower = task_description.lower()
    task_words = set(task_lower.split())
    
    matched_skills = []
    
    for skill in skills:
        score = 0.0
        skill_name_lower = skill.name.lower()
        skill_desc_lower = skill.description.lower()
        
        # Check if skill name keywords appear in task
        for word in task_words:
            if word in skill_name_lower:
                score += 2.0
            if word in skill_desc_lower:
                score += 1.0
        
        # Check if task keywords appear in skill description
        for word in skill_name_lower.split('-'):
            if word in task_words:
                score += 1.5
        
        if score > 0:
            matched_skills.append((skill, score))
    
    # Sort by score descending
    matched_skills.sort(key=lambda x: x[1], reverse=True)
    
    return matched_skills
