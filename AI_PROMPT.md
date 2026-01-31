# AI Prompt for Creating Notes with Inf

## The Prompt

Follow the inf/SKILL.md specification to create a structured note diagram for [TOPIC / DOCUMENTATION / REPOSITORY].

Structure
- Provide a comprehensive overview (the full picture) at the root level.
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

Output
- root.yaml — the main diagram file containing the root-level overview
- Separate YAML files for each subgraph, with clear and descriptive names (e.g., module-authentication.yaml, concept-event-loop.yaml)
- In parent nodes, reference subgraphs using: "subgraph": "filename.yaml"
- Use relative paths only.
- Save all generated files in [DEST].
