# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install Node.js, Tesseract OCR, and system libraries needed by OpenCV
RUN apt-get update && apt-get install -y \
    curl \
    tesseract-ocr \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy English NER model (needed by OCR redaction)
RUN python -m spacy download en_core_web_sm

# Copy all project files
COPY . .

# Install Node.js dependencies and build the frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Go back to root
WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads

# Make the start script executable
RUN chmod +x start.sh

# Start the application
CMD ["./start.sh"]
