import { useState, useEffect } from 'react';
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
import Beneficios from './pages/Beneficios';
import Terminos from './pages/Terminos';
import Footer from './components/Footer';
import FAQChatbot from './components/FAQChatbot';
import GuidedTour from './components/GuidedTour';

import { NotificationProvider } from './context/NotificationContext';

// Componente interno para poder usar useLocation (debe estar dentro de <Router>)
const AppContent = ({ auth, setAuth }) => {
  const location = useLocation();
  // En el workspace no queremos footer ni scroll global
  const isWorkspace = location.pathname.startsWith('/mi-tutoria');
  const isAdminView = location.pathname.startsWith('/admin');

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = localStorage.getItem('pwa_install_dismissed');
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setAuth({ isLogged: false, role: 'APRENDIZ' });
    window.location.href = '/login';
  };

  return (
    <div className={`flex flex-col ${isWorkspace ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {showInstallBanner && !isWorkspace && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium shadow-md z-50 animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📲</span>
            <span>¿Quieres una mejor experiencia? ¡Descarga la aplicación en tu celular!</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleInstallClick}
              className="bg-white text-blue-700 px-3.5 py-1.5 rounded-full font-bold shadow hover:bg-blue-50 transition cursor-pointer"
            >
              Descargar APP aquí
            </button>
            <button
              onClick={handleDismissInstall}
              className="text-white hover:text-gray-200 font-bold px-2 cursor-pointer text-lg"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <Navbar isAuthenticated={auth.isLogged} userRole={auth.role} onLogout={handleLogout} />
      <GuidedTour />

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
          <Route path="/beneficios" element={<Beneficios />} />
          <Route path="/terminos" element={<Terminos />} />

          {/* Ruta comodín para manejar errores 404 */}
          <Route path="*" element={<div className="text-center py-20">404 - Página no encontrada</div>} />
        </Routes>
      </main>

      {/* El footer no aparece en el workspace tipo Slack */}
      {!isWorkspace && <Footer />}
      {!isWorkspace && !isAdminView && <FAQChatbot />}
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
