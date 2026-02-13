# Inf

```bash
docker build -t inf .
```

```bash
docker run --rm --mount src=$PWD,target=/workspace,type=bind -w /workspace -it inf /bin/bash
```

```bash
mkdir -p ~/.claude/skills && git clone https://github.com/jysh1214/inf.git ~/.claude/skills/inf

mkdir -p ~/.claude/skills && rm -rf ~/.claude/skills/inf && cp -r inf ~/.claude/skills
```

```bash
claude --dangerously-skip-permissions
```

```bash
/inf

/inf --yaml-convert

python3 ~/.claude/skills/inf/scripts/yaml_convert.py --dir inf-notes/
```
