# Deployment Guide

This document provides detailed instructions for deploying the Bug Tracker application to various platforms.

## Table of Contents

1. [Local Deployment](#local-deployment)
2. [Heroku Deployment](#heroku-deployment)
3. [Netlify Deployment](#netlify-deployment)
4. [DigitalOcean Deployment](#digitalocean-deployment)
5. [AWS Deployment](#aws-deployment)

## Local Deployment

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Steps

1. Clone the repository
   ```
   git clone <repository-url>
   cd bug-tracker
   ```

2. Set up environment variables
   - Copy `.env.example` to `.env` in the backend directory
   - Update the values with your MongoDB URI and JWT secret

3. Install dependencies
   ```
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ..
   npm install
   ```

4. Start the development servers
   ```
   # Start backend server (from the backend directory)
   npm run dev
   
   # Start frontend server (from the root directory)
   npm start
   ```

## Heroku Deployment

### Prerequisites

- Heroku account
- Heroku CLI installed
- Git

### Backend Deployment

1. Create a new Heroku app
   ```
   heroku create your-app-name
   ```

2. Add MongoDB add-on or use MongoDB Atlas
   ```
   heroku addons:create mongodb
   ```
   Or set the MONGO_URI config var to your MongoDB Atlas connection string

3. Set environment variables
   ```
   heroku config:set JWT_SECRET=your_jwt_secret
   ```

4. Deploy the backend
   ```
   cd backend
   git init
   git add .
   git commit -m "Initial backend deployment"
   git push heroku master
   ```

### Frontend Deployment

1. Update the config.js file with your Heroku backend URL

2. Build the React app
   ```
   npm run build
   ```

3. Deploy the frontend to Heroku (separate app)
   ```
   heroku create your-frontend-app-name
   git init
   git add .
   git commit -m "Initial frontend deployment"
   git push heroku master
   ```

## Netlify Deployment

### Prerequisites

- Netlify account
- Git

### Steps

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Log in to Netlify and click "New site from Git"

3. Select your repository and configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `build`

4. Add environment variables in the Netlify dashboard:
   - REACT_APP_API_URL=your_backend_api_url
   - REACT_APP_SOCKET_URL=your_backend_socket_url

5. Deploy the site

## DigitalOcean Deployment

### Prerequisites

- DigitalOcean account
- SSH access to a Droplet

### Steps

1. Create a new Droplet with Node.js pre-installed

2. SSH into your Droplet
   ```
   ssh root@your-droplet-ip
   ```

3. Clone your repository
   ```
   git clone <repository-url>
   cd bug-tracker
   ```

4. Set up environment variables
   ```
   cd backend
   cp .env.example .env
   # Edit the .env file with your values
   nano .env
   ```

5. Install dependencies and build the app
   ```
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies and build
   cd ..
   npm install
   npm run build
   ```

6. Set up a process manager (PM2)
   ```
   npm install -g pm2
   cd backend
   pm2 start server.js --name bug-tracker-backend
   ```

7. Set up Nginx to serve the frontend and proxy API requests
   ```
   sudo apt-get install nginx
   ```

8. Configure Nginx
   ```
   sudo nano /etc/nginx/sites-available/bug-tracker
   ```

   Add the following configuration:
   ```
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           root /path/to/bug-tracker/build;
           try_files $uri /index.html;
       }

       location /api {
           proxy_pass http://localhost:5001/api;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /socket.io {
           proxy_pass http://localhost:5001/socket.io;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. Enable the site and restart Nginx
   ```
   sudo ln -s /etc/nginx/sites-available/bug-tracker /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## AWS Deployment

### Prerequisites

- AWS account
- Basic knowledge of AWS services

### Backend Deployment with Elastic Beanstalk

1. Install the EB CLI
   ```
   pip install awsebcli
   ```

2. Initialize EB in your backend directory
   ```
   cd backend
   eb init
   ```

3. Create an environment
   ```
   eb create bug-tracker-backend
   ```

4. Set environment variables
   ```
   eb setenv JWT_SECRET=your_jwt_secret MONGO_URI=your_mongodb_uri
   ```

5. Deploy
   ```
   eb deploy
   ```

### Frontend Deployment with S3 and CloudFront

1. Build your React app
   ```
   npm run build
   ```

2. Create an S3 bucket
   - Go to S3 in the AWS console
   - Create a new bucket with a unique name
   - Enable static website hosting

3. Upload the build files
   ```
   aws s3 sync build/ s3://your-bucket-name
   ```

4. Create a CloudFront distribution
   - Go to CloudFront in the AWS console
   - Create a new distribution
   - Set the S3 bucket as the origin
   - Configure cache behavior

5. Update DNS records to point to your CloudFront distribution

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your backend has proper CORS configuration

2. **Socket.io Connection Issues**: Check that your socket URL is correct and that your server is properly configured for WebSocket connections

3. **MongoDB Connection Errors**: Verify your MongoDB URI and ensure your IP is whitelisted if using Atlas

4. **Environment Variables**: Make sure all required environment variables are set correctly

### Getting Help

If you encounter issues not covered in this guide, please:

1. Check the project's issue tracker
2. Search for similar issues online
3. Create a new issue with detailed information about your problem