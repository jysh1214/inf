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

**Don't create subgraphs sequentially!** Use Task tool to spawn 8-16 agents in parallel:

```
Task(
  subagent_type="general-purpose",
  description="Document auth module",
  prompt="Explore the authentication module and create inf-notes/module-auth.yaml with a detailed diagram covering: login flow, token handling, session management, password reset. Use appropriate node types (circle for entry points, diamond for decisions, rectangle for components). Include connections showing data flow.

CRITICAL: After creating the YAML file, you MUST validate it:
1. Run: python3 tools/yaml_checker.py inf-notes/module-auth.yaml
2. If validation fails, fix the errors immediately
3. Re-run validation until it passes
4. Only mark your task complete when validation succeeds

DO NOT convert YAML to JSON! Only validate:
- Use tools/yaml_checker.py for validation
- Your job is to create valid YAML, not JSON

Common issues to fix:
- Connection 'from'/'to' must match node text exactly (including \\n line breaks)
- Group 'nodes' must reference existing node text
- Subgraph files must exist if referenced

Follow YAML format from /inf skill."
)
```

**Key points**:
- Each agent explores one component deeply
- Each creates a focused YAML file (5-15 nodes)
- **CRITICAL**: Each agent MUST validate their YAML before completing
- Agents work simultaneously
- Monitor progress, wait for all to complete

## Phase 2.5: Validation

**CRITICAL: Each agent validates their own YAML, then you verify all files!**

### Individual Agent Validation (Required)

Each agent MUST validate their YAML file before completing:

```bash
# Agent validates their own file
python3 tools/yaml_checker.py inf-notes/module-auth.yaml
```

**Expected output:**
```
Validating: inf-notes/module-auth.yaml

  [INFO] Converting YAML to Inf: inf-notes/module-auth.yaml (validate_only=True)
  [INFO] Successfully converted: 8 nodes, 7 connections, 2 groups

Structure:
  Nodes:       8
  Connections: 7
  Groups:      2
  Subgraphs:   3

✓ Valid
```

**If validation fails**, agent must:
1. Read the error messages carefully
2. Fix the issues in the YAML file
3. Re-run validation until it passes
4. Only then mark task complete

**IMPORTANT: DO NOT convert to JSON!**
- Agents only create and validate YAML files
- Conversion to JSON happens later (Phase 4)
- Use `tools/yaml_checker.py` only (validation)

### Batch Validation (After All Agents Complete)

After all agents complete, verify all files together.

**Validate each file individually**
```bash
# Validate all files one by one
for file in inf-notes/*.yaml; do
  echo "Validating: $file"
  python3 tools/yaml_checker.py "$file" || exit 1
done
echo "✓ All files validated!"
```

**Common validation errors**:
- `Node text '...' not found in nodes` - Connection/group references don't match node text exactly
- `Subgraph file not found: ...` - Subgraph reference points to non-existent file
- `Invalid YAML` - Syntax error in YAML file

**How to fix**:
- For text mismatch: Ensure connection `from`/`to` and group `nodes` use exact node text (including all `\n` line breaks)
- For missing subgraphs: Either create the referenced file or remove the subgraph reference
- For YAML errors: Check indentation, quotes, special characters

**Only proceed when**:
- All individual files validated by agents
- Batch validation shows "✓ All files validated successfully!"
- Zero warnings across all files

**Why this matters**:
- Catches errors early before they cascade to deeper levels
- Each agent is responsible for their output quality
- Ensures YAML structure is valid and ready for conversion
- Validates that connections and groups reference real nodes
- Confirms all subgraph references are resolvable

## Phase 3: Deep Nesting (Recursive)

After level-1 subgraphs are validated:

1. Review generated files
2. Identify nodes needing more detail
3. Spawn agents for level-2 subgraphs
4. Use naming: `parent-name__child-name.yaml`
5. **Each agent validates their YAML** (using tools/yaml_checker.py)
6. **Batch validate this level** (run Phase 2.5 batch validation)
7. Continue recursively (no depth limit!)

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

## Phase 4: Final Report & Conversion

**After all YAML files are created and validated:**

1. Run final batch validation on all files:
   ```bash
   # Option 1: Validate each file
   for file in inf-notes/*.yaml; do
     python3 tools/yaml_checker.py "$file" || exit 1
   done
   ```

2. Confirm all subgraph references point to existing files

3. Verify YAML syntax is valid across all levels

4. Report completion summary:
   - Total YAML files generated
   - Hierarchy depth achieved
   - File structure overview
   - Validation status (all files valid)

**Important**: All YAML files must be validated before completing Phase 4.

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

**CRITICAL: After creating each YAML file, MUST run validation tool!**

```bash
python3 tools/yaml_checker.py inf-notes/your-file.yaml
```

**Manual checks before running validator:**

- [ ] All node text is unique within the file
- [ ] All connection references match node text exactly (including `\n` in multiline text)
- [ ] **No special characters in node text** (avoid: `\` `"` `'` `<` `>` `{` `}` `..` - use descriptive words instead)
- [ ] Node types are valid: rectangle, circle, diamond, text, code, table
- [ ] Alignment values are valid: left, center, right
- [ ] Layout engine is valid: dot, neato, fdp, circo, twopi
- [ ] Layout direction is valid: TB, LR, BT, RL
- [ ] Groups contain 1+ nodes
- [ ] No coordinates, IDs, or sizes specified
- [ ] Subgraph references point to files that exist or will be created

**Automated validation (REQUIRED):**

- [ ] Run `tools/yaml_checker.py` on your file
- [ ] Validation passes with "✓ Valid"
- [ ] Fix any errors reported
- [ ] Re-validate until clean
- [ ] DO NOT convert to JSON (that happens later in Phase 4)

---

# Status Updates

Keep the user informed throughout:

- "🔍 Analyzing repository structure..."
- "📝 Creating root.yaml with 8 major components..."
- "🤖 Spawning 5 agents for parallel subgraph creation..."
- "⏳ Agents working... (3/5 complete)"
- "✅ All agents complete!"
- "🔍 Validating level-1 YAML files..."
- "✅ Validation passed! All files valid."
- "🔄 Reviewing subgraphs for deeper expansion..."
- "🤖 Spawning 3 agents for level-2 subgraphs..."
- "⏳ Agents working... (2/3 complete)"
- "✅ All agents complete!"
- "🔍 Validating level-2 YAML files..."
- "✅ Validation passed! All files valid."
- "✅ Generated 23 YAML files with 3 levels of depth in inf-notes/"
- "🔄 Converting YAML to JSON..."
- "✅ Converted 23 files successfully!"

---

# Best Practices

1. **Explore before creating** - Understand structure before documenting
2. **Parallel execution** - Spawn multiple agents, don't work sequentially
3. **Each agent validates** - Every agent MUST run tools/yaml_checker.py on their file
4. **NO conversion by agents** - Agents create YAML only, NO JSON conversion
5. **Fix errors immediately** - Agents fix validation errors before marking complete
6. **Batch validate each level** - Validate all files with yaml_checker.py loop before proceeding deeper
7. **Don't cascade errors** - Never proceed to next level with validation failures
8. **Convert only at end** - JSON conversion happens in Phase 4, after all YAML complete
9. **Appropriate depth** - Go deep where complexity exists, stay shallow for simple areas
10. **Semantic node types** - Choose based on meaning, not appearance
11. **Meaningful connections** - Show real relationships and flow
12. **Exact text matching** - Connection references must match node text exactly (including \n)
13. **Avoid special characters** - Use descriptive words instead of `\` `"` `'` `<` `>` `{}` `..` in node text (prevents Graphviz errors)
14. **Groups for organization** - Visual structure helps comprehension
15. **No artificial limits** - Embrace infinite depth if topic requires it
16. **Consistent naming** - Use clear, descriptive filenames
17. **Single responsibility** - Each file covers one cohesive topic

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
- **NO JSON conversion by agents** - Agents create YAML only, conversion happens in Phase 4
- **Agents fix their errors** - Don't mark complete until validation passes
- **Batch validate each level** - Ensure all files valid before proceeding deeper
- **Never cascade errors** - Catch errors early before they cascade
- **Exact text matching** - Connections must use full node text (including newlines)
- **Inf philosophy**: Infinite depth, no limits, complete expression

Now analyze this repository and create beautiful structured notes! 🚀
