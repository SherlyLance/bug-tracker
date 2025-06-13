#!/bin/bash

# Bug Tracker Deployment Script
echo "Starting Bug Tracker deployment..."

# Set environment variables for production
export NODE_ENV=production

# Backend deployment
echo "\n--- Deploying Backend ---"
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Build backend (if needed)
echo "Backend ready for deployment"

# Frontend deployment
echo "\n--- Deploying Frontend ---"
cd ../

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Build React app
echo "Building React app..."
npm run build

echo "\n--- Deployment Complete ---"
echo "You can now start the backend server with: cd backend && npm start"
echo "The frontend build is in the ./build directory and can be served with a static file server"