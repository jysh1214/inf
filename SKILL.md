---
name: inf
description: Analyze the current repository and generate hierarchical Inf diagram notes as YAML files in the inf-notes directory. Creates root.yaml overview and nested subgraphs.
---

# Inf Repository Notes Generator

Generate comprehensive visual documentation for the current repository using the Inf YAML format.

---

# YAML Format Specification

## Core Principle

- Provide a comprehensive overview (the full picture) at the root level (root.yaml).
- Place detailed explanations in separate YAML files, using file-based subgraphs.
- Use appropriate node types:
  - rectangle — concepts, components, modules
  - circle — entry / exit points, external systems
  - diamond — decisions, conditionals
  - text — details / annotations (no border)
  - code — commands, pseudocode, or source code snippets
  - table — data or comparisons (cells may contain subgraphs)
  - url — references / resources (use text/rectangle type with URL in content)
- Create meaningful connections:
    - Directed edges for flow or dependencies
    - Undirected edges for associations
- Use groups to organize related nodes, with clear visual boundaries and labels.
- Go as deep as needed — subgraphs support infinite nesting levels.
- Separate YAML files for each subgraph, with clear and descriptive names (e.g., module-authentication.yaml, concept-event-loop.yaml). Use relative paths only.

---

## Format

### Normal Node

```yaml
nodes:
  - text: "Node Name"
    type: [rectangle|circle|diamond|text|code|table]  # default: rectangle
    align: [left|center|right]                        # default: center
```

**Node Types:**
- `rectangle` - Concepts, process steps, components, modules (default)
- `circle` - Start/end points, states, actors, external systems
- `diamond` - Decision points, conditionals, gateways
- `text` - Titles, labels, details, annotations (no border)
- `code` - Code snippets, configuration, commands, scripts

**URLs/References:**
URLs are automatically detected and highlighted in any node type (clickable with Ctrl+Click):
```yaml
- text: "API Docs\nhttps://api.example.com/docs"
  type: text
  align: left
```

**Text Alignment:**
- `left` - For lists, code blocks
- `center` - For titles, labels (default)
- `right` - For dates, metadata

**Multiline text:** Use `\n` for line breaks:
```yaml
- text: "Title\nSubtitle\nDetails"
  type: text
  align: center
```

### Subgraph

Link to another YAML file for hierarchical depth:

```yaml
nodes:
  - text: "Authentication"
    type: rectangle
    subgraph: "module-auth.yaml"

  - text: "Frontend"
    type: rectangle
    subgraph: "frontend/frontend.yaml"
```

**File-based subgraphs:**
- Always include `.yaml` extension for clarity
- Use relative paths only
- Referenced file must exist (or will be created in next level)

**Naming conventions:**
- **Top-level**: `api.yaml`, `database.yaml`, `frontend.yaml`
- **Nested (level 2+)**: `parent__child.yaml` (double underscore)
- **Prefixes**: `api-`, `module-`, `concept-`, `flow-`
- **Kebab-case**: `module-authentication.yaml`, `api-endpoints.yaml`

**Examples:**
```yaml
# Level 1: root.yaml references
- text: "API Layer"
  subgraph: "api.yaml"

# Level 2: api.yaml references
- text: "Authentication"
  subgraph: "api__authentication.yaml"

# Level 3: api__authentication.yaml references
- text: "OAuth Flow"
  subgraph: "api__authentication__oauth.yaml"
```

### Table

Use Markdown table syntax:

```yaml
nodes:
  - text: "Table Name"
    type: table
    table: |
      | Header 1 | Header 2 |
      |----------|----------|
      | Value 1  | Value 2  |
      | Value 3  | Value 4  |
```

**Table alignment:**
- `:---` = left-aligned column
- `:---:` = center-aligned column
- `---:` = right-aligned column

**Example with alignment:**
```yaml
- text: "System Config"
  type: table
  table: |
    | Component  | Status | Version |
    |:-----------|:------:|--------:|
    | API        | Active | 2.1.0   |
    | Database   | Active | 14.5    |
```

## Connections

```yaml
connections:
  - from: "Source"
    to: "Target"
    directed: [true|false]  # default: true
```

**Connection Types:**
- `directed: true` - Arrow showing flow/dependency (default)
- `directed: false` - Line without arrow for associations

**Important:** Node text must match exactly (case-sensitive, including `\n` line breaks)

## Groups

Organize related nodes with visual boundaries:

```yaml
groups:
  - name: "Group Name"
    nodes: ["Node 1", "Node 2"]
```

**Note:** Node text must match exactly (case-sensitive)

## Layout

```yaml
layout:
  engine: [dot|neato|fdp|circo|twopi]  # default: dot
  rankdir: [TB|LR|BT|RL]                # default: TB
  ranksep: 1.5                          # default: 1.0
  nodesep: 1.0                          # default: 0.5
```

**Layout Engines:**
- `dot` - Hierarchical (flowcharts, org charts)
- `neato` - Force-directed (networks)
- `fdp` - Force-directed with clustering
- `circo` - Circular layout
- `twopi` - Radial layout

**Direction:**
- `TB` - Top to bottom (default)
- `LR` - Left to right (timelines)
- `BT` - Bottom to top
- `RL` - Right to left

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

# Sequential Creation Workflow

**Output Location**: `./inf-notes/`

## Repository Analysis

Explore the codebase to understand its architecture:

- **Entry points**: main.js, app.py, index.html
- **Structure**: src/, lib/, components/, tests/
- **Config**: package.json, requirements.txt, Makefile
- **Docs**: README, docs/
- **Build system**: scripts, Dockerfile

Identify key patterns: frontend/backend separation, modules, data flow, dependencies, algorithms.

---

## Iterative Process (Breadth-First)

**Level 0: Root**

1. Create `inf-notes/root.yaml` with system overview
2. Validate: `python3 tools/yaml_convert.py inf-notes/root.yaml --validate`
3. Fix errors until validation passes

**For Each Level (1, 2, 3, ...):**

1. **Scan all nodes** in all current-level YAML files
2. **Mark nodes for expansion**: For each node, ask "Could we explain more about this?"
   - If yes: Add `subgraph: "filename.yaml"` to the node
   - If no: Skip and move to next node
3. **Create all subgraph files** at this level (BFS approach)
4. **Validate all files** at this level:
   ```bash
   python3 tools/yaml_convert.py inf-notes/<filename>.yaml --validate
   ```
5. **Fix errors** until all files pass validation

**Repeat** until no more nodes need expansion (see "When to Stop" below).

---

## When to Stop

Stop creating subgraphs when:
- Node represents a single function or file (atomic)
- Further detail would be implementation code (use code node with snippet instead)
- Node is self-explanatory with no sub-components

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

Now analyze this repository and create beautiful structured notes! 🚀
