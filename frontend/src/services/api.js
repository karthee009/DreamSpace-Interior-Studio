
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:8090/api'),
  withCredentials: true
});

api.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (config.data && typeof config.data === 'object') {
    config.headers.set('Content-Type', 'application/json');
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Request failed';

    return Promise.reject(new Error(message));
  }
);

export default api;
