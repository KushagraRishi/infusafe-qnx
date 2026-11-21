# Linux x86_64 host for QNX SDP 8.0 tools (QNX ships Linux and Windows hosts only).
FROM --platform=linux/amd64 ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates make python3 qemu-system-x86 qemu-utils \
      libgtk-3-0 libxtst6 libxi6 libxrender1 libnss3 libasound2 \
      unzip file procps net-tools iproute2 expect less \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /work
