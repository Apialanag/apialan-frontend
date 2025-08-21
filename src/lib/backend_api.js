import axios from 'axios';

// The Render API URL must be configured as an environment variable in Vercel
// For local development, it might point to a local server.
const RENDER_API_URL = process.env.RENDER_API_URL || 'http://localhost:3000/api';

const backendApi = axios.create({
  baseURL: RENDER_API_URL,
  // Add any other backend-specific configurations here
});

export default backendApi;
