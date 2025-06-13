#!/bin/bash

# Script to install all dependencies for the Bug Tracker application
echo "Installing dependencies for Bug Tracker application..."

# Install frontend dependencies
echo "\n--- Installing Frontend Dependencies ---"
npm install

# Install backend dependencies
echo "\n--- Installing Backend Dependencies ---"
cd backend
npm install

# Return to root directory
cd ..

echo "\n--- All dependencies installed successfully ---"
echo "You can now start the application:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: npm start"