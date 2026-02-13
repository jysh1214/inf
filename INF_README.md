# Inf

```bash
docker build -t inf .
```

```bash
docker run --rm --mount src=$PWD,target=/workspace,type=bind -w /workspace -it inf /bin/bash
```

```bash
mkdir -p ~/.claude/skills && rm -rf ~/.claude/skills/inf && cp -r inf ~/.claude/skills
```

```bash
claude --dangerously-skip-permissions
```

```bash
/inf
```

```bash
python3 ~/.claude/skills/inf/scripts/yaml_convert.py --dir inf-notes/
```
