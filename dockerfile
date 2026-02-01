# Dockerfile for Inf

FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV LD_LIBRARY_PATH="/usr/local/lib:/usr/local/lib/x86_64-unknown-linux-gnu:$LD_LIBRARY_PATH"

RUN apt-get update && apt-get install -y \
    build-essential \
    ninja-build \
    git \
    curl \
    wget \
    vim \
    ccache \
    swig \
    libssl-dev \
    libsqlite3-dev \
    libffi-dev \
    libbz2-dev \
    liblzma-dev \
    libatlas-base-dev \
    zlib1g-dev \
    graphviz \
    libgraphviz-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python from source
ARG CPYTHON_URL="https://github.com/python/cpython.git"
ARG CPYTHON_VERSION="v3.12.10"
ARG CPYTHON_TMP_DIR="/tmp/cpython"
WORKDIR $CPYTHON_TMP_DIR
RUN git clone -b $CPYTHON_VERSION $CPYTHON_URL $CPYTHON_TMP_DIR && \
  ./configure --enable-optimizations --enable-shared --enable-loadable-sqlite-extensions && \
  CC=clang \
  CXX=clang++ \
  make -j $(nproc) && \
  make install

# Install Python dependencies
WORKDIR /tmp
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Cleanup
RUN rm -rf /tmp/*

# Create non-root user BEFORE installing NVM/Node
RUN useradd -m -s /bin/bash claude && \
    mkdir -p /workspace && \
    chown -R claude:claude /workspace

# Switch to non-root user
USER claude
WORKDIR /home/claude

# Install NVM and Node as non-root user
ENV NVM_DIR="/home/claude/.nvm"
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && \
    . "$NVM_DIR/nvm.sh" && \
    nvm install 24 && \
    nvm use 24 && \
    npm install -g @anthropic-ai/claude-code

# Set up PATH for Node/Claude
ENV PATH="$NVM_DIR/versions/node/v24.0.0/bin:$PATH"

# Set working directory
WORKDIR /workspace
