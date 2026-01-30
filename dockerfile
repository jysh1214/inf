# Dockerfile for yaml2inf.py converter
# Includes Graphviz and all Python dependencies
#
# Build the image:
#     docker build -t yaml2inf .
# Run the converter:
#     docker run --rm -v /path/to/workspace:/workspace yaml2inf /workspace --verbose --validate

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

# Copy the converter script
COPY yaml2inf.py .

# Create directory for input/output files
WORKDIR /workspace

# Set python path to find yaml2inf.py
ENV PYTHONPATH=/app:$PYTHONPATH

# Set the entrypoint to run the converter script
ENTRYPOINT ["python", "/app/yaml2inf.py"]
