import axios from 'axios';

// Frontend will use REACT_APP_API_URL in production (set in Render / env file).
// In local dev, leave REACT_APP_API_URL unset so relative calls work with proxy/docker-compose.
const baseURL = process.env.REACT_APP_API_URL || '';
const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;