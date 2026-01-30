# YAML Format Guide for AI Assistants

**Purpose**: Quick reference for AI to generate Inf diagram YAML files.

---

## Core Principle

**AI writes structure, script handles layout.**

✅ **AI specifies**: Node text, types, connections, relationships
❌ **AI does NOT specify**: Coordinates, IDs, sizes, canvas dimensions

---

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

layout:
  engine: dot          # Optional: dot (default), neato, fdp, circo, twopi
  rankdir: TB          # Optional: TB (default), LR, BT, RL
```

---

## Node Types Reference

### Rectangle (Default)
```yaml
- text: "Process Step"
  type: rectangle
```
**Use for**: Standard boxes, process steps, components

### Circle
```yaml
- text: "Start"
  type: circle
```
**Use for**: Start/end points, states, actors

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
**Use for**: Titles, labels, annotations

### Code
```yaml
- text: "function main() {\n  return true;\n}"
  type: code
  align: left
```
**Use for**: Code snippets, configuration, commands

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
**Use for**: Structured data, entities, schemas

---

## Text Alignment

```yaml
nodes:
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
- Titles → `center`
- Labels → `center`
- Lists → `left`

---

## Connections

### Directed (Default)
```yaml
connections:
  - from: "Source"
    to: "Target"
    directed: true  # Arrow
```

### Undirected
```yaml
connections:
  - from: "Node A"
    to: "Node B"
    directed: false  # Line without arrow
```

**Important**: Node text must match exactly (case-sensitive)

---

## File-Based Subgraphs

**Always include `.yaml` extension** for clarity and consistency.

```yaml
nodes:
  - text: "Authentication"
    subgraph: "module-auth.yaml"

  - text: "Frontend"
    subgraph: "frontend/frontend.yaml"
```

**Format**: `subgraph: "filename.yaml"` or `subgraph: "path/filename.yaml"`

---

## Groups

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
- Group needs at least 2 nodes
- Node text must match exactly

---

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

---

## Common Patterns

### Flowchart
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

### System Architecture
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

layout:
  engine: dot
  rankdir: LR
```

### Network Diagram
```yaml
nodes:
  - text: "Router"
  - text: "Switch A"
  - text: "Switch B"
  - text: "Server 1"
  - text: "Server 2"

connections:
  - from: "Router"
    to: "Switch A"
    directed: false
  - from: "Router"
    to: "Switch B"
    directed: false
  - from: "Switch A"
    to: "Server 1"
    directed: false
  - from: "Switch B"
    to: "Server 2"
    directed: false

layout:
  engine: neato  # Force-directed for networks
```

### Organization Chart
```yaml
nodes:
  - text: "CEO"
  - text: "CTO"
  - text: "VP Engineering"
  - text: "Team Lead A"
  - text: "Team Lead B"

connections:
  - from: "CEO"
    to: "CTO"
  - from: "CTO"
    to: "VP Engineering"
  - from: "VP Engineering"
    to: "Team Lead A"
  - from: "VP Engineering"
    to: "Team Lead B"

layout:
  engine: dot
  rankdir: TB
  ranksep: 1.5
```

### State Machine
```yaml
nodes:
  - text: "Idle"
    type: circle
  - text: "Processing"
    type: circle
  - text: "Complete"
    type: circle
  - text: "Error"
    type: circle

connections:
  - from: "Idle"
    to: "Processing"
  - from: "Processing"
    to: "Complete"
  - from: "Processing"
    to: "Error"
  - from: "Error"
    to: "Idle"
  - from: "Complete"
    to: "Idle"

layout:
  engine: circo  # Circular for state machines
```

---

## Best Practices

### ✅ Do

1. **Use descriptive, unique node text**
   ```yaml
   - text: "User Authentication Service"  # Clear and specific
   ```

2. **Match node text exactly in connections**
   ```yaml
   nodes:
     - text: "Frontend"
   connections:
     - from: "Frontend"  # Exact match
   ```

3. **Choose appropriate node types**
   - Rectangle: Standard components
   - Circle: Start/end/states
   - Diamond: Decisions
   - Text: Labels/titles
   - Code: Code blocks

4. **Use appropriate layout engines**
   - Flowcharts → `dot` with `TB`
   - Timelines → `dot` with `LR`
   - Networks → `neato` or `fdp`
   - Org charts → `dot` with `TB`, large `ranksep`

5. **Keep diagrams focused**
   - 5-15 nodes per file
   - Use subgraphs for complex systems

### ❌ Don't

1. **Don't specify coordinates or IDs**
   ```yaml
   # Wrong:
   - text: "Node"
     id: 1
     x: 100
     y: 200

   # Right:
   - text: "Node"
   ```

2. **Don't use ambiguous node text**
   ```yaml
   # Wrong:
   - text: "Service"
   - text: "Service"  # Duplicate!

   # Right:
   - text: "Auth Service"
   - text: "Payment Service"
   ```

3. **Don't create circular references with text**
   ```yaml
   # Wrong (confusing):
   connections:
     - from: "A"
       to: "B"
     - from: "B"
       to: "A"

   # Consider directed: false or different structure
   ```

4. **Don't overcomplicate single files**
   ```yaml
   # If > 15 nodes, break into subgraphs
   ```

---

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

**Auto-sizing**: Height expands automatically for multiple lines.

---

## Validation Checklist

Before generating YAML, check:

- [ ] All node text is unique within the file
- [ ] All connection references match node text exactly
- [ ] Node types are valid: rectangle, circle, diamond, text, code, table
- [ ] Alignment values are valid: left, center, right
- [ ] Layout engine is valid: dot, neato, fdp, circo, twopi
- [ ] Layout direction is valid: TB, LR, BT, RL
- [ ] Groups have at least 2 nodes
- [ ] No coordinates, IDs, or sizes specified

---

## Example: Complete System Diagram

```yaml
# system.yaml - Main architecture diagram
nodes:
  - text: "Web Client"
    type: rectangle

  - text: "API Gateway"
    type: rectangle

  - text: "Authentication Service"
    type: rectangle
    subgraph: "auth.yaml"

  - text: "Business Logic"
    type: rectangle
    subgraph: "backend.yaml"

  - text: "Database"
    type: circle

  - text: "Cache"
    type: circle

connections:
  - from: "Web Client"
    to: "API Gateway"

  - from: "API Gateway"
    to: "Authentication Service"

  - from: "API Gateway"
    to: "Business Logic"

  - from: "Business Logic"
    to: "Database"

  - from: "Business Logic"
    to: "Cache"

groups:
  - name: "Client Layer"
    nodes: ["Web Client", "API Gateway"]

  - name: "Services"
    nodes: ["Authentication Service", "Business Logic"]

  - name: "Data Layer"
    nodes: ["Database", "Cache"]

layout:
  engine: dot
  rankdir: LR
  ranksep: 1.5
  nodesep: 1.0
```

---

## Conversion

```bash
# Convert YAML to Inf JSON
python3 yaml2inf.py project/

# With verbose output
python3 yaml2inf.py project/ --verbose

# Validate first
python3 yaml2inf.py project/ --validate --strict
```

---

## Quick Reference Card

| Feature | Property | Values | Default |
|---------|----------|--------|---------|
| Node type | `type` | rectangle, circle, diamond, text, code, table | rectangle |
| Text align | `align` | left, center, right | center |
| Connection | `directed` | true, false | true |
| Layout engine | `engine` | dot, neato, fdp, circo, twopi | dot |
| Direction | `rankdir` | TB, LR, BT, RL | TB |
| Subgraph | `subgraph` | "filename.yaml" | - |

---

## Summary

**Remember**: AI writes **structure** (what connects to what), Python script handles **layout** (where things go).

**Focus on**:
- Clear, descriptive node text
- Appropriate node types
- Accurate connections
- Logical grouping

**Don't worry about**:
- Exact coordinates
- Node dimensions
- Canvas size
- ID management

The script automatically:
- ✅ Assigns IDs sequentially
- ✅ Calculates sizes from text
- ✅ Positions nodes with Graphviz
- ✅ Resolves subgraph paths
- ✅ Generates valid Inf JSON

---

**Ready to generate diagrams!** 🎨
