# Bug Tracker Application

A full-stack bug tracking application with real-time notifications using Socket.io.

## Features

- User authentication and authorization
- Project management
- Ticket tracking with status, priority, and type
- Real-time notifications
- Activity logging
- Drag-and-drop interface
- Reporting and analytics

## Tech Stack

### Frontend
- React
- Axios for API requests
- Socket.io client for real-time updates
- DnD Kit for drag-and-drop functionality
- Recharts for data visualization

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication

## Deployment Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database (local or Atlas)
- Git

### Environment Setup

1. Backend Environment Variables (.env file in the backend directory):
   ```
   MONGO_URI=your_mongodb_connection_string
   PORT=5001
   JWT_SECRET=your_jwt_secret
   ```

2. Frontend Environment Variables (for production deployment):
   ```
   REACT_APP_API_URL=your_backend_api_url
   REACT_APP_SOCKET_URL=your_backend_socket_url
   ```

### Production Deployment

1. Use the provided deployment script:
   ```
   ./deploy.sh
   ```

2. Or follow these steps manually:
   ```
   # Set environment to production
   export NODE_ENV=production
   
   # Build the React frontend
   npm run build
   
   # Start the backend server
   cd backend
   npm start
   ```

3. Serve the frontend build directory with a static file server like Nginx or use a service like Netlify, Vercel, or GitHub Pages.

4. For the backend, you can deploy to services like Heroku, DigitalOcean, AWS, or any other Node.js hosting platform.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
