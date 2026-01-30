# Dockerfile for tools/yaml2inf.py converter
# Includes Graphviz and all Python dependencies
#
# Build the image:
#     docker build -t yaml2inf .
#
# Usage examples:
#
# Validate YAML files only (no conversion):
#     docker run --rm -v /path/to/workspace:/workspace yaml2inf /workspace --validate --verbose
#
# Convert YAML to JSON with verbose output:
#     docker run --rm -v /path/to/workspace:/workspace yaml2inf /workspace --verbose
#
# Convert with custom layout engine:
#     docker run --rm -v /path/to/workspace:/workspace yaml2inf /workspace --engine neato --rankdir LR
#
# Convert a single file:
#     docker run --rm -v /path/to/workspace:/workspace yaml2inf /workspace/myfile.yaml --verbose

FROM python:3.11-slim

# Install system dependencies for Graphviz
RUN apt-get update && apt-get install -y \
    graphviz \
    libgraphviz-dev \
    pkg-config \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all converter tools
COPY tools/yaml2inf.py .
COPY tools/converter.py .
COPY tools/graphviz.py .

# Create directory for input/output files
WORKDIR /workspace

# Set the entrypoint to run the converter script
ENTRYPOINT ["python", "/app/yaml2inf.py"]
