import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Interceptor global para redirigir URLs absolutas del backend de producción al local
axios.interceptors.request.use(
  (config) => {
    const apiBase = import.meta.env.VITE_API_URL;
    if (apiBase && config.url && config.url.startsWith('https://pilas-backend.onrender.com')) {
      config.url = config.url.replace('https://pilas-backend.onrender.com', apiBase);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
