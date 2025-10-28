#!/bin/bash

echo "Starting Syllabus Application..."
echo ""
echo "Installing dependencies..."

# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

echo ""
echo "All dependencies installed!"
echo ""
echo "Starting server and client..."
echo "Server will run on http://localhost:5000"
echo "Client will run on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev

