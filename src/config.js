// Configuration for API endpoints
const config = {
  development: {
    apiUrl: 'http://localhost:5001/api',
    socketUrl: 'http://localhost:5001'
  },
  production: {
    // When deployed, these will be the production URLs
    apiUrl: process.env.REACT_APP_API_URL || '/api',
    socketUrl: process.env.REACT_APP_SOCKET_URL || window.location.origin
  }
};

// Determine which environment to use
const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

export default config[environment];