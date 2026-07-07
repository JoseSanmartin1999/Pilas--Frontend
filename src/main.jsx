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
    
    // Inyectar token JWT si existe en localStorage o sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para manejar expiración del token (401 Unauthorized)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Sesión expirada o token inválido (401).");
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/registro') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
