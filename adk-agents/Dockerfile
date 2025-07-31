# Multi-stage Dockerfile for AWS Lambda with production-grade binary compatibility
# Stage 1: Builder using Amazon Linux 2 for binary compatibility
FROM amazonlinux:2 AS builder

# Install development tools and Graphviz
RUN yum update -y && \
    yum groupinstall -y "Development Tools" && \
    yum install -y gcc make python3 python3-pip python3-devel && \
    yum install -y graphviz graphviz-devel && \
    yum clean all

# Create virtual environment for dependency isolation
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies in virtual environment
COPY requirements.txt /tmp/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt

# Stage 2: Final runtime image
FROM public.ecr.aws/lambda/python:3.12

# Copy Graphviz binaries and libraries from builder stage
COPY --from=builder /usr/bin/dot /usr/bin/
COPY --from=builder /usr/bin/neato /usr/bin/
COPY --from=builder /usr/bin/twopi /usr/bin/
COPY --from=builder /usr/bin/circo /usr/bin/
COPY --from=builder /usr/bin/fdp /usr/bin/
COPY --from=builder /usr/bin/sfdp /usr/bin/
COPY --from=builder /usr/bin/patchwork /usr/bin/
COPY --from=builder /usr/bin/osage /usr/bin/
COPY --from=builder /usr/lib64/graphviz/ /usr/lib64/graphviz/
COPY --from=builder /usr/lib64/libgvc.so* /usr/lib64/
COPY --from=builder /usr/lib64/libcgraph.so* /usr/lib64/
COPY --from=builder /usr/lib64/libcdt.so* /usr/lib64/
COPY --from=builder /usr/lib64/libpathplan.so* /usr/lib64/
COPY --from=builder /usr/lib64/libexpat.so* /usr/lib64/

# Copy Python packages from builder's virtual environment
COPY --from=builder /opt/venv/lib/python3.12/site-packages/ ${LAMBDA_RUNTIME_DIR}/

# Copy application source code
COPY src/ ${LAMBDA_TASK_ROOT}/src/
COPY sensa_mindmap_generator.py ${LAMBDA_TASK_ROOT}/

# Set the Lambda handler
CMD ["sensa_mindmap_generator.handler"]