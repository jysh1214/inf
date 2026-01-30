---
name: inf
description: Analyze the current repository and generate hierarchical Inf diagram notes as YAML files in the inf-notes directory. Creates root.yaml overview and nested subgraphs with multi-agent orchestration.
---

# Inf Repository Notes Generator

Generate comprehensive visual documentation for the current repository using the Inf YAML format.

## What You Do

When `/inf` is invoked:

1. **Analyze the repository** - Explore files, understand architecture
2. **Create root overview** - Generate `inf-notes/root.yaml` with main components
3. **Spawn agents for subgraphs** - Use Task tool to create detailed subgraphs in parallel
4. **Recursive expansion** - Create deeper nested subgraphs as needed
5. **Report completion** - Summarize generated files and structure

**Output Location**: `./inf-notes/`

---

# YAML Format Specification

## Core Principle

**AI writes structure, script handles layout.**

✅ **You specify**: Node text, types, connections, relationships, groups
❌ **You do NOT specify**: Coordinates, IDs, sizes, canvas dimensions

## Basic Template

```yaml
nodes:
  - text: "Node 1"
    type: rectangle    # Optional: rectangle (default), circle, diamond, text, code, table
    align: center      # Optional: left, center (default), right

  - text: "Node 2"
    type: circle

connections:
  - from: "Node 1"
    to: "Node 2"
    directed: true     # Optional: true (default), false

groups:
  - name: "Group Name"
    nodes: ["Node 1", "Node 2"]

layout:
  engine: dot          # Optional: dot (default), neato, fdp, circo, twopi
  rankdir: TB          # Optional: TB (default), LR, BT, RL
```

## Node Types

### Rectangle (Default)
```yaml
- text: "Process Step"
  type: rectangle
```
**Use for**: Standard boxes, process steps, components, modules

### Circle
```yaml
- text: "Start"
  type: circle
```
**Use for**: Start/end points, states, actors, external systems

### Diamond
```yaml
- text: "Decision"
  type: diamond
```
**Use for**: Decision points, conditionals, gateways

### Text (No Border)
```yaml
- text: "Title or Label"
  type: text
  align: center
```
**Use for**: Titles, labels, annotations, headings

### Code
```yaml
- text: "function main() {\n  return true;\n}"
  type: code
  align: left
```
**Use for**: Code snippets, configuration, commands, scripts

### Table
```yaml
- text: "Data Table"
  type: table
  table:
    rows: 3
    cols: 2
    cells:
      "[0, 0]": "Header 1"
      "[0, 1]": "Header 2"
      "[1, 0]": "Value 1"
      "[1, 1]": "Value 2"
```
**Use for**: Structured data, entities, database schemas

## Text Alignment

```yaml
- text: "Left-aligned\nBullet points:\n- Item 1\n- Item 2"
  type: text
  align: left

- text: "Centered\nTitle"
  type: text
  align: center

- text: "Right-aligned\nDate: 2026-01-30"
  type: text
  align: right
```

**Guidelines**:
- Code → `left`
- Titles/Labels → `center`
- Lists → `left`

## Connections

### Directed (Default)
```yaml
- from: "Source"
  to: "Target"
  directed: true  # Arrow showing flow/dependency
```

### Undirected
```yaml
- from: "Node A"
  to: "Node B"
  directed: false  # Line without arrow for associations
```

**Important**: Node text must match exactly (case-sensitive)

## File-Based Subgraphs

Link to other YAML files for hierarchical depth:

```yaml
nodes:
  - text: "Authentication"
    subgraph: "module-auth.yaml"

  - text: "Frontend"
    subgraph: "frontend/frontend.yaml"

  - text: "Backend"
    subgraph: "backend"  # Looks for backend.yaml or backend/backend.yaml
```

## Groups

Organize related nodes with visual boundaries:

```yaml
nodes:
  - text: "Web Server"
  - text: "App Server"
  - text: "Database"

groups:
  - name: "Application Tier"
    nodes: ["Web Server", "App Server"]
  - name: "Data Tier"
    nodes: ["Database"]
```

**Requirements**:
- Groups can contain 1+ nodes
- Node text must match exactly

## Layout Configuration

### Layout Engines

```yaml
layout:
  engine: dot      # Hierarchical (best for flowcharts, org charts)
  # engine: neato  # Force-directed (best for networks)
  # engine: fdp    # Force-directed with clustering
  # engine: circo  # Circular layout
  # engine: twopi  # Radial layout
```

### Direction

```yaml
layout:
  rankdir: TB      # Top to bottom (default)
  # rankdir: LR    # Left to right (good for timelines)
  # rankdir: BT    # Bottom to top
  # rankdir: RL    # Right to left
```

### Spacing

```yaml
layout:
  ranksep: 1.5     # Vertical spacing (default: 1.0)
  nodesep: 1.0     # Horizontal spacing (default: 0.5)
```

## Multi-line Text

Use `\n` for line breaks:

```yaml
nodes:
  - text: "Title\nSubtitle\nDetails"

  - text: "Code Example\nfunction main() {\n  return true;\n}"
    type: code
    align: left

  - text: "List:\n- Item 1\n- Item 2\n- Item 3"
    type: text
    align: left
```

---

# Multi-Agent Strategy

## Phase 1: Repository Analysis (You)

1. **Explore the codebase**:
   - Main entry points (main.js, app.py, index.html)
   - Directory structure (src/, lib/, components/, tests/)
   - Configuration files (package.json, requirements.txt, Makefile)
   - Documentation (README, docs/)
   - Build system (build scripts, Dockerfile)

2. **Identify architecture**:
   - Frontend/backend separation
   - Modules and their responsibilities
   - Data flow patterns
   - External dependencies
   - Key algorithms

3. **Create root.yaml**:
   - 5-10 major components at root level
   - Use groups to organize related areas
   - Mark 70% of nodes with subgraphs
   - Choose appropriate layout (dot/LR for systems, dot/TB for flows)

## Phase 2: Parallel Subgraph Creation

**Don't create subgraphs sequentially!** Use Task tool to spawn 3-5 agents in parallel:

```
Task(
  subagent_type="general-purpose",
  description="Document auth module",
  prompt="Explore the authentication module and create inf-notes/module-auth.yaml with a detailed diagram covering: login flow, token handling, session management, password reset. Use appropriate node types (circle for entry points, diamond for decisions, rectangle for components). Include connections showing data flow. Follow YAML format from /inf skill."
)
```

**Key points**:
- Each agent explores one component deeply
- Each creates a focused YAML file (5-15 nodes)
- Agents work simultaneously
- Monitor progress, wait for all to complete

## Phase 3: Deep Nesting (Recursive)

After level-1 subgraphs are created:

1. Review generated files
2. Identify nodes needing more detail
3. Spawn agents for level-2 subgraphs
4. Use naming: `parent-name__child-name.yaml`
5. Continue recursively (no depth limit!)

Example:
```
api.yaml
├── api__authentication.yaml
│   ├── api__authentication__login.yaml
│   └── api__authentication__oauth.yaml
└── api__endpoints.yaml
    ├── api__endpoints__users.yaml
    └── api__endpoints__products.yaml
```

## Phase 4: Validation

1. Check all subgraph references point to existing files
2. Verify YAML syntax is valid
3. Ensure node text is unique within each file
4. Verify connection references match node text exactly
5. Report completion with file count and depth

---

# Quality Standards

## Root Level
- **Comprehensive overview** of entire system
- **5-10 major components** (not too sparse, not too dense)
- **Groups** for related areas (e.g., "Client Layer", "Services", "Data Layer")
- **70% of nodes have subgraphs** for depth
- **Appropriate layout**: LR for system architecture, TB for process flows

## Subgraphs
- **Focused scope**: One topic per file
- **5-15 nodes** (manageable complexity)
- **Clear connections** showing relationships
- **Entry point nodes** (circles) showing context from parent
- **Groups** to organize subsections

## Naming Conventions
- **Kebab-case**: `module-authentication.yaml`
- **Prefixes**: `api-`, `module-`, `concept-`, `flow-`
- **Nested**: `parent__child.yaml` (double underscore)
- **Descriptive**: Filename should clearly indicate content

## Node Types (Semantic)
- **Rectangle**: Components, modules, services
- **Circle**: Entry/exit points, external systems, states
- **Diamond**: Decisions, conditionals, branching logic
- **Text**: Titles, annotations, explanations
- **Code**: Commands, config, code snippets
- **Table**: Data structures, schemas

## Connection Design
- **Directed**: Flow, dependencies, sequence, cause-effect
- **Undirected**: Associations, relationships, mutual dependencies
- **Semantic accuracy**: Choose based on real relationships

---

# Common Patterns

## System Architecture
```yaml
nodes:
  - text: "Frontend"
    subgraph: "frontend.yaml"
  - text: "Backend API"
    subgraph: "backend.yaml"
  - text: "Database"
    type: circle

connections:
  - from: "Frontend"
    to: "Backend API"
  - from: "Backend API"
    to: "Database"

groups:
  - name: "Application"
    nodes: ["Frontend", "Backend API"]

layout:
  engine: dot
  rankdir: LR
```

## Process Flow
```yaml
nodes:
  - text: "Start"
    type: circle
  - text: "Input Data"
    type: rectangle
  - text: "Valid?"
    type: diamond
  - text: "Process"
    type: rectangle
  - text: "End"
    type: circle

connections:
  - from: "Start"
    to: "Input Data"
  - from: "Input Data"
    to: "Valid?"
  - from: "Valid?"
    to: "Process"
  - from: "Process"
    to: "End"

layout:
  engine: dot
  rankdir: TB
```

## Module Dependencies
```yaml
nodes:
  - text: "Core Module"
  - text: "Auth Module"
  - text: "Database Module"
  - text: "Utils"

connections:
  - from: "Core Module"
    to: "Utils"
  - from: "Auth Module"
    to: "Database Module"
  - from: "Auth Module"
    to: "Utils"

layout:
  engine: dot
  rankdir: TB
  ranksep: 1.5
```

---

# Validation Checklist

Before saving each YAML file:

- [ ] All node text is unique within the file
- [ ] All connection references match node text exactly
- [ ] Node types are valid: rectangle, circle, diamond, text, code, table
- [ ] Alignment values are valid: left, center, right
- [ ] Layout engine is valid: dot, neato, fdp, circo, twopi
- [ ] Layout direction is valid: TB, LR, BT, RL
- [ ] Groups contain 1+ nodes
- [ ] No coordinates, IDs, or sizes specified
- [ ] Subgraph references are clear and will be created

---

# Status Updates

Keep the user informed throughout:

- "🔍 Analyzing repository structure..."
- "📝 Creating root.yaml with 8 major components..."
- "🤖 Spawning 5 agents for parallel subgraph creation..."
- "⏳ Agents working... (3/5 complete)"
- "🔄 Reviewing subgraphs for deeper expansion..."
- "🤖 Spawning 3 agents for level-2 subgraphs..."
- "✅ Generated 23 YAML files with 3 levels of depth in inf-notes/"

---

# Best Practices

1. **Explore before creating** - Understand structure before documenting
2. **Parallel execution** - Spawn multiple agents, don't work sequentially
3. **Appropriate depth** - Go deep where complexity exists, stay shallow for simple areas
4. **Semantic node types** - Choose based on meaning, not appearance
5. **Meaningful connections** - Show real relationships and flow
6. **Groups for organization** - Visual structure helps comprehension
7. **No artificial limits** - Embrace infinite depth if topic requires it
8. **Consistent naming** - Use clear, descriptive filenames
9. **Single responsibility** - Each file covers one cohesive topic
10. **Validate early** - Check YAML syntax as you go

---

# Installation

To enable this skill in Claude Code:

```bash
# Create skills directory if it doesn't exist
mkdir -p ~/.claude/skills/inf

# Copy the skill file
cp SKILL.md ~/.claude/skills/inf/

# Now you can use /inf in any repository!
```

---

# Remember

- You're creating **visual documentation**, not text summaries
- **Structure over style** - Focus on accurate relationships
- **Connections show meaning** - Use directed/undirected appropriately
- **Subgraphs manage complexity** - Break large topics into focused files
- **Groups show organization** - Organize related nodes visually
- **Parallel agents save time** - Don't create files one by one
- **Inf philosophy**: Infinite depth, no limits, complete expression

Now analyze this repository and create beautiful structured notes! 🚀
