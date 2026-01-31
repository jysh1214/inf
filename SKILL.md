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
3. **Recursive expansion** - Create deeper nested subgraphs as needed
4. **Report completion** - Summarize generated files and structure

**Output Location**: `./inf-notes/`

---

# YAML Format Specification

## Core Principle

- Provide a comprehensive overview (the full picture) at the root level (root.yaml).
- Place detailed explanations in separate YAML files, using file-based subgraphs.
- Use appropriate node types:
    - rectangle — concepts
	  - circle — entry / exit points
	  - diamond — decisions
	  - text — details / annotations
	  - code — commands, pseudocode, or source code snippets
	  - table — data or comparisons (cells may contain subgraphs)
	  - url - references / resources
- Create meaningful connections:
    - Directed edges for flow or dependencies
    - Undirected edges for associations
- Use groups to organize related nodes, with clear visual boundaries and labels.
- Go as deep as needed — subgraphs support infinite nesting levels.
- Separate YAML files for each subgraph, with clear and descriptive names (e.g., module-authentication.yaml, concept-event-loop.yaml)
- Use relative paths only.

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
**Use for**: concepts, process steps, components, modules

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
**Use for**: Titles, labels, details, annotations, headings

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
**Use for**: Structured data, comparisons

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

**Always include `.yaml` extension** in subgraph references for clarity and consistency.

Link to other YAML files for hierarchical depth:

```yaml
nodes:
  - text: "Authentication"
    subgraph: "module-auth.yaml"

  - text: "Frontend"
    subgraph: "frontend/frontend.yaml"
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

## Special Characters Warning

**CRITICAL: Avoid special characters in node text that may confuse Graphviz:**

❌ **Do NOT use these characters in node names:**
- Backslashes: `\` (except in `\n` for newlines)
- Quotes inside text: `"` or `'` (use descriptive words instead)
- Angle brackets: `<` `>`
- Curly braces in isolation: `{` `}`
- Periods and commas in isolation: `..` `,`

✅ **Use descriptive words instead:**
```yaml
# BAD - Special characters cause Graphviz errors
- text: "Check Path\n.., /, \\"

# GOOD - Descriptive words
- text: "Check Path\n(dots, slashes)"

# BAD - Quotes in text
- text: "Validate \"name\" field"

# GOOD - Descriptive alternative
- text: "Validate name field"
```

**Why this matters:** Graphviz processes node text as DOT syntax, and special characters can cause parsing errors during layout computation.

---

# Multi-Agent Strategy

## 1. Repository Analysis

Explore the codebase to understand its architecture:

- **Entry points**: main.js, app.py, index.html
- **Structure**: src/, lib/, components/, tests/
- **Config**: package.json, requirements.txt, Makefile
- **Docs**: README, docs/
- **Build system**: scripts, Dockerfile

Identify key patterns: frontend/backend separation, modules, data flow, dependencies, algorithms.

## 2. Create root.yaml

Create `inf-notes/root.yaml` with system overview:

- **Groups** for related areas (e.g., "Client Layer", "Services")
- **Most nodes should have subgraphs** (mark for deeper exploration)

## 3. Create Next Level Subgraphs (Sequential)

Generate subgraphs **one at a time** to avoid context accumulation.

**Process:**
1. Spawn ONE fresh agent for first subgraph
2. Wait for it to complete and validate
3. Agent exits (clears its context)
4. Spawn next fresh agent
5. Repeat for all subgraphs at this level

**Agent prompt template:**
```
Task(
  subagent_type="general-purpose",
  description="Document [component name]",
  prompt="Create inf-notes/[filename].yaml covering [specific areas].

  Use 5-15 nodes with appropriate types:
  - Rectangle: components, modules
  - Circle: entry/exit points, external systems
  - Diamond: decisions, conditionals
  - Code/Text/Table: as needed

  Mark 50-70% of nodes with subgraphs for deeper detail.
  Use naming: parent__child.yaml (double underscore for nested levels).

  CRITICAL - Validate before completing:
  1. Run: python3 tools/yaml_checker.py inf-notes/[filename].yaml
  2. Fix any errors immediately
  3. Re-validate until it passes
  4. Only mark complete when validation succeeds

  DO NOT convert to JSON - only validate YAML!

  Common issues:
  - Connection from/to must match node text exactly (including \\n)
  - Group nodes must reference existing node text
  - Subgraph files must exist or be removed"
)
```

**Trade-off:** Sequential is slower but prevents hitting context limits on large repos.

## 4. Batch Validation

Validate all files at current level:

```bash
# Validate each file individually
for file in inf-notes/*.yaml; do
  python3 tools/yaml_checker.py "$file" || exit 1
done
echo "✓ All files validated!"
```

**Fix errors before proceeding:**
- Text mismatch: Ensure exact text matching (including `\n`)
- Missing subgraphs: Create referenced files or remove reference
- YAML syntax: Check indentation, quotes, special characters

## 5. Review and Go Deeper

After validation passes, **review each file systematically**. For every node in every file, ask:

**"Could we explain more about this?"**

Create a subgraph when the answer is yes:

- **Component with multiple responsibilities** → Break down into sub-components
- **Complex algorithm or process** → Detail the steps and logic
- **Module with multiple files** → Show file relationships
- **Multi-step interaction** → Expand the sequence
- **Data structure with relationships** → Detail schema and connections

**When to stop:**
- Node represents a single function or file (atomic)
- Further detail would be implementation code (use code node with snippet instead)
- Node is self-explanatory with no sub-components

**Then repeat steps 3-4** for the next level, spawning fresh agents sequentially (one at a time).

**Example for level-2+:**
```
Task(
  description="Expand Authentication node",
  prompt="Read inf-notes/api.yaml and expand the 'Authentication' node.

  Create inf-notes/api__authentication.yaml covering login, token handling,
  session management. Use 8-12 nodes. Mark 40-60% with subgraphs.

  Validate with: python3 tools/yaml_checker.py inf-notes/api__authentication.yaml"
)
```

Each agent gets only what it needs - no accumulated context from previous levels.

**Target depth: 3-5 levels** for typical projects, 6+ for large/complex systems.

**File hierarchy example:**
```
root.yaml
├── api.yaml
│   ├── api__authentication.yaml
│   │   ├── api__authentication__login.yaml
│   │   └── api__authentication__oauth.yaml
│   └── api__endpoints.yaml
├── database.yaml
│   └── database__schema.yaml
└── frontend.yaml
```

## Final Report

After all levels complete:

1. **Final validation**: Verify all YAML files pass
2. **Count files**: Report total generated and depth achieved
3. **Tree structure**: Show file hierarchy overview
4. **Status**: Confirm all files valid and ready

---

# Quality Standards

## Root Level
- **Comprehensive overview** of entire system
- **Groups** for related areas (e.g., "Client Layer", "Services", "Data Layer")
- **Most nodes have subgraphs** for depth

## Subgraphs
- **Focused scope**: One topic per file
- **Clear connections** showing relationships
- **Entry point nodes** (circles) showing context from parent
- **Groups** to organize subsections

## Naming Conventions
- **Kebab-case**: `module-authentication.yaml`
- **Prefixes**: `api-`, `module-`, `concept-`, `flow-`
- **Nested**: `parent__child.yaml` (double underscore)
- **Descriptive**: Filename should clearly indicate content

## Connection Design
- **Directed**: Flow, dependencies, sequence, cause-effect
- **Undirected**: Associations, relationships, mutual dependencies
- **Semantic accuracy**: Choose based on real relationships

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
- **CRITICAL: Each agent validates** - Run tools/yaml_checker.py on every generated file
- **NO JSON conversion by agents** - Agents create YAML only
- **Agents fix their errors** - Don't mark complete until validation passes
- **Batch validate each level** - Ensure all files valid before proceeding deeper
- **Never cascade errors** - Catch errors early before they cascade
- **Exact text matching** - Connections must use full node text (including newlines)
- **Inf philosophy**: Infinite depth, no limits, complete expression

Now analyze this repository and create beautiful structured notes! 🚀
