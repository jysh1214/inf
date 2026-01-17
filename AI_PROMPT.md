# AI Prompt for Creating Notes with Inf

Use this concise prompt when asking AI assistants to create structured notes in Inf diagram format.

---

## The Prompt

```
Please follow the inf/INF_NOTE_GUIDE.md format to create a structured note diagram for [TOPIC/DOCUMENTATION/REPOSITORY].

Structure:
- Comprehensive overview / full picture at root level
- Put detailed explanations in separate JSON files as file-based subgraphs
- Use appropriate node types: rectangle (concepts), circle (entry/exit points), diamond (decisions), text (annotations)
- Create meaningful connections (directed for flow/dependency, undirected for associations)

Output:
- Main JSON file with root-level overview
- Separate JSON files for each subgraph (named clearly, e.g., "module-authentication.json", "concept-event-loop.json")
- In parent nodes, use `"subgraph": "filename.json"` to reference the files (user will select via file picker when loading)
- Save all assets in DEST

Important:
- Subgraph references are filenames (e.g., "module-auth.json") - users select actual files via browser file picker
- canvasWidth and canvasHeight must be between 1000-20000 (use 2000 as default)
- All IDs must be unique, nextId must be greater than any used ID

Follow the format in inf/INF_NOTE_GUIDE.md.
```

---

## Usage Examples

**For Documentation:**
```
Please follow the INF_NOTE_GUIDE.md format to create a structured note diagram for Python's asyncio library.

Structure:
- Comprehensive overview / full picture at root level (event loop, coroutines, tasks, futures)
- Put detailed explanations in embedded subgraphs (each concept's API, patterns, examples)
```

**For Repository:**
```
Please follow the INF_NOTE_GUIDE.md format to create a structured note diagram for this Express.js REST API repository.

Structure:
- Comprehensive overview / full picture at root level (main folders, architecture layers)
- Put detailed explanations in embedded subgraphs (routes, middleware, models, controllers)
```

**For Learning:**
```
Please follow the INF_NOTE_GUIDE.md format to create a structured note diagram for understanding Kubernetes.

Structure:
- Comprehensive overview / full picture at root level (core components and their relationships)
- Put detailed explanations in embedded subgraphs (pods, services, deployments, networking)
```

---

## Tips

- Reference INF_NOTE_GUIDE.md for complete JSON format specification
- AI assistants can read the guide directly to understand all details
- Keep your prompt focused on what to document and how to organize it
- Let the guide handle the technical format details
- **Best practice**: Save all related diagram files in one folder, then use "Set Folder" in Inf to authorize the workspace - all files will open automatically without file picker prompts!
