FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt psycopg2-binary

# Copy backend source code and prebuilt frontend
COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/
COPY run.py ./

# Create data directories
RUN mkdir -p /app/data_incoming /app/data_processed /app/reports

EXPOSE 8000

CMD ["python", "run.py"]
