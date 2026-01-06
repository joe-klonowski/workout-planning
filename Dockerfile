# Use Python 3.10 as base image
FROM python:3.10-slim

# Install Node.js for building the React frontend
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy frontend package files and install Node dependencies
COPY app/package*.json /app/app/
WORKDIR /app/app
RUN npm install

# Copy all application code
WORKDIR /app
COPY . .

# Build the React frontend
WORKDIR /app/app
RUN npm run build

# Set working directory back to app root
WORKDIR /app

# Expose port (Railway will override this with $PORT)
EXPOSE 5000

# Set environment variable
ENV FLASK_ENV=production

# Run gunicorn
CMD cd backend && gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app
