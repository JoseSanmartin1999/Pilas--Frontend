import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import BuscarTutor from './pages/BuscarTutor';
import Profile from './pages/Profile';
import Mensajes from './pages/Mensajes';
import Solicitudes from './pages/Solicitudes';
import MiTutoria from './pages/MiTutoria';
import Calendario from './pages/Calendario';
import Recompensas from './pages/Recompensas';
import SeTutor from './pages/SeTutor';
import AdminDashboard from './pages/AdminDashboard';
import SoporteTickets from './pages/SoporteTickets';
import Footer from './components/Footer';

import { NotificationProvider } from './context/NotificationContext';

// Componente interno para poder usar useLocation (debe estar dentro de <Router>)
const AppContent = ({ auth, setAuth }) => {
  const location = useLocation();
  // En el workspace no queremos footer ni scroll global
  const isWorkspace = location.pathname.startsWith('/mi-tutoria');

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    setAuth({ isLogged: false, role: 'APRENDIZ' });
    window.location.href = '/login';
  };

  return (
    <div className={`flex flex-col ${isWorkspace ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Navbar isAuthenticated={auth.isLogged} userRole={auth.role} onLogout={handleLogout} />

      <main className={`flex-grow ${isWorkspace ? 'overflow-hidden' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setAuth={setAuth} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/buscar" element={<BuscarTutor />} />
          {/* Mantenemos el parámetro :id para cargar perfiles específicos
              Ejemplo: /profile/1
          */}
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mensajes" element={<Mensajes />} />
          <Route path="/solicitudes" element={<Solicitudes />} />
          <Route path="/mi-tutoria" element={<MiTutoria />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/recompensas" element={<Recompensas />} />
          <Route path="/se-tutor" element={<SeTutor setAuth={setAuth} />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/tickets" element={<SoporteTickets />} />

          {/* Ruta comodín para manejar errores 404 */}
          <Route path="*" element={<div className="text-center py-20">404 - Página no encontrada</div>} />
        </Routes>
      </main>

      {/* El footer no aparece en el workspace tipo Slack */}
      {!isWorkspace && <Footer />}
    </div>
  );
};

function App() {
  const [auth, setAuth] = useState(() => {
    // Restaurar sesión si existe en localStorage o sessionStorage
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return { isLogged: true, role: user.role };
    }
    return { isLogged: false, role: 'APRENDIZ' };
  });

  return (
    <Router>
      <NotificationProvider>
        <AppContent auth={auth} setAuth={setAuth} />
      </NotificationProvider>
    </Router>
  );
}

export default App;
