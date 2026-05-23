import axios from 'axios';
const baseURL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

const api = axios.create({
  baseURL: baseURL,
});

export default api;
