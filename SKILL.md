---
name: inf
description: Generate hierarchical Inf diagram notes as YAML files in the inf-notes directory. First run creates root.yaml + Level 1. Subsequent runs deepen existing notes by one level. Use --focus <file> to expand only a specific subgraph.
---

# Inf Repository Notes Generator

Generate comprehensive visual documentation for the current repository using the Inf YAML format.

## Arguments

**--focus <file>** - Expand only a specific subgraph file and its children

```bash
/inf --focus api.yaml              # Only expand api.yaml
/inf --focus api__auth.yaml        # Only expand api__auth.yaml (nested file)
/inf --focus module-frontend.yaml  # Only expand module-frontend.yaml
```

**When to use `--focus`:**
- You want to deeply explore one specific area without touching others
- You're iterating on a particular module's documentation
- You want to parallelize work (multiple agents each focusing on different files)
- You need to regenerate/fix one subgraph without affecting the rest

**Behavior:**
- Scans only the specified file for nodes to expand
- Creates subgraph files only for that focused file's children
- Ignores all other YAML files in inf-notes/
- Still follows one-level-at-a-time incremental workflow

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

## Workflow

### Check if `inf-notes/` exists

**If `inf-notes/` does NOT exist (new repository):**

Generate **Level 0 (root) + Level 1 (direct children) only**:

1. Create `inf-notes/root.yaml` with system overview (5-10 major components)
2. **Mark ALL major components as extensible** by adding `subgraph: "filename.yaml"` reference (only skip truly atomic nodes)
3. Create all Level 1 subgraph files (direct children of root)
4. Validate all YAML files:
   ```bash
   python3 tools/yaml_convert.py inf-notes/root.yaml --validate
   python3 tools/yaml_convert.py inf-notes/api.yaml --validate
   # ... validate each Level 1 file
   ```
5. Fix errors until all files pass validation
6. **Stop here** - do not generate Level 2+ subgraphs yet

**If `inf-notes/` already EXISTS (deepening existing notes):**

Generate **next level deeper** based on existing YAML files:

**A. Check for `--focus` argument:**

If `--focus <file>` is provided (e.g., `/inf --focus api.yaml`):
1. **Target file**: Read only `inf-notes/<file>` (e.g., `inf-notes/api.yaml`)
2. **Verify file exists**: If file doesn't exist, report error and stop
3. **Identify nodes for expansion**: For each node in the focused file, **default to marking as extensible** unless it's truly atomic (see "When to Stop" below)
   - **Bias toward expansion**: When uncertain, mark the node as extensible with `subgraph: "parent__child.yaml"`
   - Use double underscore naming: If focusing on `api.yaml`, children are `api__*.yaml`
   - If focusing on `api__auth.yaml`, children are `api__auth__*.yaml`
4. **Create all subgraph files** for the focused file's children only
5. **Validate all new files**:
   ```bash
   python3 tools/yaml_convert.py inf-notes/<new-file>.yaml --validate
   ```
6. Fix errors until all files pass validation
7. **Stop here** - user will run `/inf --focus <file>` again to go deeper, or `/inf` to expand other areas

**B. If no `--focus` argument (expand all files at deepest level):**

1. **Scan all YAML files** in `inf-notes/` to find the current deepest level
2. **Identify nodes for expansion**: For each node at the deepest level, **default to marking as extensible** unless it's truly atomic (see "When to Stop" below)
   - **Bias toward expansion**: When uncertain, mark the node as extensible with `subgraph: "parent__child.yaml"`
   - Use double underscore naming for nested levels
   - Only skip nodes that are clearly atomic (single functions, simple concepts, no sub-components)
3. **Create all subgraph files** for the next level
4. **Validate all new files**:
   ```bash
   python3 tools/yaml_convert.py inf-notes/<new-file>.yaml --validate
   ```
5. Fix errors until all files pass validation
6. **Stop here** - user will run `/inf` again to go deeper if needed

---

## When to Stop (Extensibility Exceptions)

**Default: Mark nodes as extensible.** Only stop creating subgraphs when the node is truly atomic:
- Node represents a single function, constant, or variable (truly atomic)
- Further detail would be raw implementation code (use code node with snippet instead)
- Node is a leaf concept with no possible sub-components (e.g., "Port 3000", "UTF-8 encoding")
- Level 2+ subgraphs reached (let user run `/inf` again to continue)

**When in doubt, mark as extensible** - it's better to create expansion opportunities than to miss important details.

---

# Quality Standards

## Root Level
- **Comprehensive overview** of entire system
- **Groups** for related areas (e.g., "Client Layer", "Services", "Data Layer")
- **Nearly all nodes have subgraphs** for maximum depth - only skip truly atomic nodes (single files, constants, etc.)

## Subgraphs
- **Focused scope**: One topic per file
- **Clear connections** showing relationships
- **Entry point nodes** (circles) showing context from parent
- **Groups** to organize subsections
- **Mark components as extensible**: Most nodes should have subgraph references unless truly atomic

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

# Usage Examples

## Initial Generation

```bash
/inf                    # Create root.yaml + Level 1 files
```

## Deepening All Areas

```bash
/inf                    # Expand all files at deepest level by one level
/inf                    # Run again to go even deeper
```

## Focused Expansion

```bash
# Expand only the API documentation
/inf --focus api.yaml

# Go deeper into API authentication
/inf --focus api__auth.yaml

# Continue deepening the auth flow
/inf --focus api__auth__oauth.yaml
```

## Parallel Work Strategy

```bash
# You can run multiple focused expansions to work on different areas:
/inf --focus api.yaml              # Expand API area
/inf --focus frontend.yaml         # Expand frontend area
/inf --focus database.yaml         # Expand database area

# Then go deeper in parallel:
/inf --focus api__auth.yaml        # Deepen auth
/inf --focus frontend__ui.yaml     # Deepen UI
```

## Iterative Refinement

```bash
# Initial pass
/inf                              # Create root + Level 1

# Focus on one area to refine
/inf --focus api.yaml             # Expand API details
/inf --focus api.yaml             # Refine further (re-run to deepen)

# Switch focus to another area
/inf --focus database.yaml        # Now work on database
```

---

**Ready to generate notes!**

- First run: Creates root.yaml + Level 1 subgraphs
- Subsequent runs: Deepens existing notes by one level
- Use `--focus <file>` to target specific areas for deep exploration
- Run `/inf` multiple times to incrementally build deep hierarchical documentation
