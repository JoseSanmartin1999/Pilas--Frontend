import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import defaultProfile from '../assets/Default_profile.png';

const Home = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const isAuthenticated = !!token;

  const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (isAuthenticated && currentUser.id) {
      setLoadingLeaderboard(true);
      const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://pilas-backend.onrender.com';
      const tokenVal = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      axios.get(`${BACKEND_URL}/api/users/leaderboard`, {
        headers: { Authorization: `Bearer ${tokenVal}` }
      })
      .then(res => {
        setLeaderboard(res.data.slice(0, 5));
      })
      .catch(err => {
        console.error("Error al cargar ranking de tutores:", err);
      })
      .finally(() => {
        setLoadingLeaderboard(false);
      });

      axios.get(`${BACKEND_URL}/api/users/profile/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${tokenVal}` }
      })
      .then(res => {
        setUserStats(res.data);
      })
      .catch(err => {
        console.error("Error al cargar estadísticas del usuario:", err);
      });
    }
  }, [isAuthenticated, currentUser.id]);

  // Mock State para interactividad en el Dashboard visual derecho
  const [loginStreak, setLoginStreak] = useState(5);
  const [coins, setCoins] = useState(540);
  const [xp, setXp] = useState(1850);
  const [level, setLevel] = useState(4);
  const [completedMentorships, setCompletedMentorships] = useState(12);
  const [activeToast, setActiveToast] = useState(null);

  // Auto-esconder notificaciones simuladas
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const handleSimulateLogin = () => {
    setLoginStreak(prev => prev + 1);
    setCoins(prev => prev + 10);
    setXp(prev => {
      const newXp = prev + 50;
      if (newXp >= 2000) {
        setLevel(l => l + 1);
        setActiveToast({
          title: "🎉 ¡Subiste de Nivel!",
          message: `¡Felicidades! Alcanzaste el Nivel ${level + 1}.`,
          type: "level"
        });
        return newXp - 2000;
      }
      setActiveToast({
        title: "🔥 ¡Racha de Login de 1 Día Más!",
        message: "¡Racha consecutiva de inicios de sesión actualizada! +10 ESPE-Coins",
        type: "streak"
      });
      return newXp;
    });
  };

  const handleSimulateRating = () => {
    setCompletedMentorships(prev => prev + 1);
    setCoins(prev => prev + 25);
    setXp(prev => {
      const newXp = prev + 150;
      if (newXp >= 2000) {
        setLevel(l => l + 1);
        setActiveToast({
          title: "🎉 ¡Subiste de Nivel!",
          message: `¡Felicidades! Alcanzaste el Nivel ${level + 1}.`,
          type: "level"
        });
        return newXp - 2000;
      }
      setActiveToast({
        title: "⭐ Tutoría Calificada con 5★",
        message: "¡Excelente desempeño! +150 XP y +25 ESPE-Coins",
        type: "rating"
      });
      return newXp;
    });
  };

  if (isAuthenticated) {
    const initials = currentUser.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    return (
      <main className="bg-slate-50 min-h-screen text-slate-800 font-sans">
        {/* BANNER DE BIENVENIDA */}
        <section className="bg-gradient-to-r from-[#0f592f] to-[#072413] py-12 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden shadow-md">
          {/* Patrón de cuadrícula */}
          <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-1/2 right-1/10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>

          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold shadow-xl border border-white/20 relative">
                <img src={currentUser.profile_photo_url || defaultProfile} alt={currentUser.full_name} className="w-full h-full object-cover rounded-2xl" />
                {userStats && (
                  <div className="absolute -bottom-2 -right-2 bg-pilas-gold text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-[#0f592f] shadow-md">
                    LVL {userStats.level || 1}
                  </div>
                )}
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black text-pilas-gold uppercase tracking-widest bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                  Panel de Estudiante
                </span>
                <h1 className="text-3xl font-black tracking-tight mt-2 text-white leading-tight">
                  ¡Hola de nuevo, {currentUser.full_name?.split(' ')[0] || "Estudiante"}!
                </h1>
                <p className="text-xs text-slate-300 font-medium mt-1">Ingeniería de Software · ESPE</p>
              </div>
            </div>

            {/* Estadísticas rápidas del usuario */}
            {userStats && (
              <div className="flex gap-4 self-start md:self-center">
                <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center backdrop-blur-sm">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">ESPE-Coins</span>
                  <span className="text-md font-black text-pilas-gold">🪙 {userStats.espe_coins ?? 0}</span>
                </div>
                <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center backdrop-blur-sm">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Experiencia</span>
                  <span className="text-md font-black text-emerald-300">{userStats.xp ?? 0} XP</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA (8 COL): Accesos Rápidos & Información */}
          <div className="lg:col-span-8 space-y-8">
            {/* PANEL DE ACCESOS RÁPIDOS */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[#0f592f] text-left uppercase tracking-wider">Accesos Rápidos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                
                <Link to="/buscar" className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col items-center text-center group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0f592f] flex items-center justify-center text-2xl group-hover:bg-[#0f592f] group-hover:text-white transition-colors">
                    🔍
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 mt-4">Buscar Tutor</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">Agenda una nueva sesión académica</p>
                </Link>

                <Link to="/solicitudes" className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col items-center text-center group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0f592f] flex items-center justify-center text-2xl group-hover:bg-[#0f592f] group-hover:text-white transition-colors">
                    📊
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 mt-4">Mis Solicitudes</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">Mira el estado de tus tutorías</p>
                </Link>

                <Link to="/calendario" className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col items-center text-center group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0f592f] flex items-center justify-center text-2xl group-hover:bg-[#0f592f] group-hover:text-white transition-colors">
                    🗓️
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 mt-4">Mi Calendario</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">Fechas y horarios de tus reuniones</p>
                </Link>

                <Link to="/mensajes" className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col items-center text-center group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0f592f] flex items-center justify-center text-2xl group-hover:bg-[#0f592f] group-hover:text-white transition-colors">
                    📩
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 mt-4">Mensajes</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">Chats y comunicados oficiales</p>
                </Link>

                <Link to="/recompensas" className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col items-center text-center group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0f592f] flex items-center justify-center text-2xl group-hover:bg-[#0f592f] group-hover:text-white transition-colors">
                    🎁
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 mt-4">Recompensas</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">Canjea tus ESPE-Coins por premios</p>
                </Link>

                <Link to="/profile" className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col items-center text-center group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0f592f] flex items-center justify-center text-2xl group-hover:bg-[#0f592f] group-hover:text-white transition-colors">
                    👤
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 mt-4">Mi Perfil</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">Ver tus insignias y configurar biografía</p>
                </Link>

              </div>
            </div>

            {/* SECCIÓN DE TUTORÍAS COMPARTIDAS / INSTRUCCIONES */}
            <div className="bg-[#0f592f]/5 border border-[#0f592f]/10 rounded-[2rem] p-6 text-left space-y-3">
              <h4 className="font-black text-sm text-[#0f592f]">💡 Recordatorio Importante:</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                ¡Recuerda calificar cada tutoría una vez finalizada! Esto permite a tus mentores recibir sus ESPE-Coins correspondientes y a ti te otorga puntos de experiencia (XP) para subir de nivel y desbloquear insignias exclusivas en tu perfil.
              </p>
            </div>
          </div>

          {/* COLUMNA DERECHA (4 COL): Ranking de Tutores */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-lg font-black text-[#0f592f] text-left uppercase tracking-wider">Tutores Top Rankeados</h3>
            
            <div className="bg-white rounded-[2rem] border border-gray-150 shadow-sm p-6 space-y-4">
              {loadingLeaderboard ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#0f592f] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cargando Ranking...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-10 text-center">No hay tutores registrados en el ranking actualmente.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {leaderboard.map((tutor, idx) => {
                    const tutorInitials = tutor.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '✨';
                    
                    return (
                      <div key={tutor.id} className="py-4 flex items-center justify-between gap-2 text-left first:pt-0 last:pb-0 font-medium">
                        <div className="flex items-center gap-3">
                          {/* Avatar con insignia de ranking */}
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-xs text-[#0f592f] shadow-inner">
                              <img src={tutor.profile_photo_url || defaultProfile} alt={tutor.full_name} className="w-full h-full object-cover rounded-xl" />
                            </div>
                            <span className="absolute -top-2 -left-2 text-md">{medal}</span>
                          </div>
                          <div>
                            <h5 className="font-extrabold text-xs text-[#0f592f] hover:underline">
                              <Link to={`/profile/${tutor.id}`}>{tutor.full_name}</Link>
                            </h5>
                            <p className="text-[9px] text-gray-400 font-semibold mt-0.5 leading-none">{tutor.career}</p>
                            {/* Materia principal badge */}
                            <span className="inline-block mt-1 bg-emerald-50 text-[#0f592f] border border-emerald-100 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              📚 {tutor.favorite_subject || "General"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-amber-500 block">🏆 {tutor.xp} XP</span>
                          <span className="text-[8px] text-gray-400 uppercase tracking-widest font-black leading-none block mt-0.5">Nivel {Math.floor(tutor.xp / 2000) + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-100 text-center">
                <Link to="/buscar" className="inline-block text-[10px] font-black text-[#0f592f] uppercase tracking-widest hover:underline">
                  🔍 Agendar Tutoría con un Tutor
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen text-slate-800 font-sans overflow-hidden">
      {/* 1. HERO SECTION (Fondo Verde con Auroras de Gradiente y Doble Columna) */}
      <section className="relative bg-[#072413] text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Auroras de fondo translúcidas */}
        <div className="absolute top-0 left-1/4 w-[35rem] h-[35rem] bg-[#0f592f]/30 rounded-full blur-[100px] -z-10 animate-pulse duration-[8s]"></div>
        <div className="absolute bottom-10 right-1/4 w-[28rem] h-[28rem] bg-pilas-gold/15 rounded-full blur-[80px] -z-10 animate-pulse duration-[6s]"></div>
        
        {/* Patrón de cuadrícula moderna */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Columna Izquierda: Mensaje Principal */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-black bg-pilas-gold/10 text-pilas-gold border border-pilas-gold/20 mb-6 uppercase tracking-widest animate-pulse">
              🚀 Plataforma Académica Oficial
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              Ponte las <span className="bg-gradient-to-r from-pilas-gold via-amber-400 to-yellow-300 bg-clip-text text-transparent">Pilas!</span> <br />
              <span className="text-3xl sm:text-4xl md:text-5xl font-medium text-slate-100">Aprende de tus compañeros.</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-xl mb-8 leading-relaxed font-normal">
              Conéctate de forma segura con tutores destacados de tu misma carrera. Agenda clases, comparte material de estudio, sube de nivel y desbloquea insignias exclusivas mientras acumulas ESPE-Coins.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                to={isAuthenticated ? "/buscar" : "/login"} 
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-black bg-pilas-gold text-slate-900 hover:bg-[#ffdf66] hover:scale-[1.03] active:scale-95 transition-all duration-200 shadow-xl shadow-pilas-gold/10 text-xs uppercase tracking-widest text-center"
              >
                Buscar un Tutor
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link 
                to={isAuthenticated ? "/se-tutor" : "/registro"} 
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-black bg-transparent border-2 border-slate-600 text-slate-200 hover:border-white hover:text-white hover:bg-white/5 active:scale-95 transition-all duration-200 text-xs uppercase tracking-widest text-center"
              >
                Ser Mentor / Tutor
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Dashboard Mockup Interactivo */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-emerald-950/60 backdrop-blur-xl border border-emerald-800/40 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative transition-all duration-300 hover:border-pilas-gold/30 text-left">
              
              {/* Toast de Notificación Simulada dentro del Mockup */}
              {activeToast && (
                <div className="absolute top-4 left-4 right-4 bg-slate-900/95 border-l-4 border-pilas-gold p-4 rounded-xl shadow-2xl z-20 flex items-start space-x-3 animate-slide-in">
                  <span className="text-xl">
                    {activeToast.type === 'streak' ? '🔥' : activeToast.type === 'level' ? '👑' : '⭐'}
                  </span>
                  <div className="flex-1">
                    <h5 className="font-bold text-xs text-white">{activeToast.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{activeToast.message}</p>
                  </div>
                </div>
              )}

              {/* Encabezado del Perfil */}
              <div className="flex items-center space-x-4 pb-6 border-b border-emerald-800/35">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0f592f] to-emerald-400 p-0.5 flex items-center justify-center shadow-lg">
                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-white uppercase">
                      ES
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-950"></span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-100">Estudiante ESPE</h4>
                  <p className="text-xs text-slate-400 font-medium">Ingeniería de Software</p>
                </div>
              </div>

              {/* Estadísticas de Gamificación */}
              <div className="py-6 space-y-5">
                
                {/* Monedas & Nivel */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-900/40 border border-emerald-800/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center space-x-1.5 text-pilas-gold font-bold">
                      <span className="text-lg animate-bounce duration-[2s]">🪙</span>
                      <span className="text-lg font-black">{coins}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ESPE-Coins</span>
                  </div>
                  <div className="bg-emerald-900/40 border border-emerald-800/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center space-x-1.5 text-white font-bold">
                      <span className="text-lg">👑</span>
                      <span className="text-lg font-black">Nivel {level}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Reputación</span>
                  </div>
                </div>

                {/* Barra de Progreso XP */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                    <span>Progreso de XP</span>
                    <span className="text-slate-400">{xp} / 2000 XP</span>
                  </div>
                  <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#0f592f] transition-all duration-500 rounded-full"
                      style={{ width: `${(xp / 2000) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Racha y Tutorías */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 bg-emerald-900/20 px-4 py-3 rounded-2xl border border-emerald-850/20">
                    <span className="text-xl">🔥</span>
                    <div>
                      <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Racha Diaria</h6>
                      <p className="text-xs font-bold text-white">{loginStreak} Días Seguidos</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-emerald-900/20 px-4 py-3 rounded-2xl border border-emerald-850/20">
                    <span className="text-xl">🎓</span>
                    <div>
                      <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tutorías</h6>
                      <p className="text-xs font-bold text-white">{completedMentorships} Completadas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Interacción del Mockup */}
              <div className="mt-4 pt-5 border-t border-emerald-800/35 grid grid-cols-2 gap-3">
                <button 
                  onClick={handleSimulateLogin}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0f592f] hover:bg-[#0a4624] text-[#ffcc00] font-bold text-[10px] uppercase tracking-wider transition-colors active:scale-95 flex items-center justify-center space-x-1.5"
                >
                  <span>🔥 Loguearse</span>
                </button>
                <button 
                  onClick={handleSimulateRating}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors active:scale-95 flex items-center justify-center space-x-1.5"
                >
                  <span>⭐ Terminar Tutoría</span>
                </button>
              </div>
              <p className="text-[9px] text-emerald-400 text-center mt-3 italic font-medium">
                Haz clic en los botones superiores para interactuar con la gamificación
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS ROW (Métricas e Impacto Real) */}
      <section className="bg-white border-b border-gray-150 py-10 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-pilas-blue">850+</p>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Horas Compartidas</p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-pilas-blue">120+</p>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Mentores Certificados</p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-pilas-blue">4.9★</p>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Calificación Promedio</p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-pilas-blue">15K+</p>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">ESPE-Coins Entregadas</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES SECTION (Características Premium) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-pilas-blue uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
            Características
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Todo lo necesario para tu éxito académico
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-3">
            Pilas! integra herramientas modernas que hacen del aprendizaje compartido un proceso seguro, transparente y altamente recompensado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Card 1: Búsqueda Inteligente */}
          <Link to="/beneficios" className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1 text-left block">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-pilas-blue flex items-center justify-center mb-6 font-bold text-xl group-hover:bg-pilas-blue group-hover:text-white transition-colors duration-300">
                🔍
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-2">Filtros Inteligentes</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-normal">
                Encuentra al tutor ideal para ti filtrando por materias específicas, semestre (desde 4to semestre) y calificaciones reales del sistema.
              </p>
            </div>
            <span className="text-[10px] font-black text-pilas-blue mt-6 block uppercase tracking-wider group-hover:translate-x-1.5 transition-transform text-left">
              Ver Beneficios →
            </span>
          </Link>

          {/* Card 2: Monedero Virtual */}
          <Link to="/beneficios" className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1 text-left block">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-pilas-blue flex items-center justify-center mb-6 font-bold text-xl group-hover:bg-pilas-blue group-hover:text-white transition-colors duration-300">
                🪙
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-2">ESPE-Coins</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-normal">
                Gana monedas virtuales participando activamente. Intercambia ESPE-Coins en la tienda por increíbles recompensas y sorteos.
              </p>
            </div>
            <span className="text-[10px] font-black text-pilas-blue mt-6 block uppercase tracking-wider group-hover:translate-x-1.5 transition-transform text-left">
              Ver Recompensas →
            </span>
          </Link>

          {/* Card 3: Chat Integrado */}
          <Link to="/beneficios" className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1 text-left block">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-pilas-blue flex items-center justify-center mb-6 font-bold text-xl group-hover:bg-pilas-blue group-hover:text-white transition-colors duration-300">
                💬
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-2">Chat en Tiempo Real</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-normal">
                Comunícate de forma ágil y segura. Discute objetivos, coordina encuentros y comparte guías directamente en nuestra plataforma.
              </p>
            </div>
            <span className="text-[10px] font-black text-pilas-blue mt-6 block uppercase tracking-wider group-hover:translate-x-1.5 transition-transform text-left">
              Ver Chat y Canales →
            </span>
          </Link>

          {/* Card 4: Seguridad y Confianza */}
          <Link to="/terminos" className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1 text-left block">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-pilas-blue flex items-center justify-center mb-6 font-bold text-xl group-hover:bg-pilas-blue group-hover:text-white transition-colors duration-300">
                🔒
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-2">Entorno Seguro</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-normal">
                Acceso restringido y validado a través de credenciales institucionales de la ESPE, promoviendo una comunidad académica de confianza.
              </p>
            </div>
            <span className="text-[10px] font-black text-pilas-blue mt-6 block uppercase tracking-wider group-hover:translate-x-1.5 transition-transform text-left">
              Políticas de Seguridad →
            </span>
          </Link>

        </div>
      </section>

      {/* 4. HOW IT WORKS (Flujo Paso a Paso) */}
      <section className="bg-slate-100 py-20 px-4 sm:px-6 lg:px-8 border-t border-b border-gray-150">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              Método
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
              ¿Cómo funciona Ponte las Pilas!?
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-3">
              Descubre lo sencillo y gratificante que es empezar a dar o recibir soporte académico en tres rápidos pasos.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            {/* Línea conectora horizontal (solo en pantallas grandes) */}
            <div className="hidden lg:block absolute top-1/2 left-20 right-20 h-0.5 border-t-2 border-dashed border-slate-300 -translate-y-12 -z-10"></div>

            {/* Paso 1 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-pilas-blue text-white flex items-center justify-center font-black text-lg border-4 border-slate-100">
                1
              </div>
              <h4 className="text-lg font-extrabold text-slate-800 mt-4 mb-2">Crea tu Cuenta</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-normal">
                Regístrate con tu correo institucional de la ESPE, configura tus intereses de estudio y materias de dominio en tu perfil.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-pilas-gold text-slate-900 flex items-center justify-center font-black text-lg border-4 border-slate-100">
                2
              </div>
              <h4 className="text-lg font-extrabold text-slate-800 mt-4 mb-2">Agenda tu Mentoría</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-normal">
                Busca tutores disponibles en tu materia, propón una fecha y hora cómodas mediante nuestro calendario integrado y espera la confirmación.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-pilas-blue text-white flex items-center justify-center font-black text-lg border-4 border-slate-100">
                3
              </div>
              <h4 className="text-lg font-extrabold text-slate-800 mt-4 mb-2">Aprende y Gana</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-normal">
                Conéctate al chat, descarga guías de estudio del repositorio, califica al tutor al finalizar y obtén XP y ESPE-Coins por participar.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CTA SECTION BANNER (Conversión y Llamada Final) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#0f592f] to-[#072413] rounded-[2.5rem] p-8 sm:p-16 text-center relative overflow-hidden shadow-2xl border border-emerald-950/20 text-white">
          {/* Fondo de patrón luminoso */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent -z-10"></div>
          
          <div className="max-w-2xl mx-auto relative z-10 flex flex-col items-center">
            <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight tracking-tight">
              ¿Listo para dominar tu semestre académico?
            </h2>
            <p className="text-slate-200 text-sm sm:text-base md:text-lg mb-8 max-w-xl leading-relaxed">
              Únete a la comunidad de estudiantes y mentores de la ESPE. Comparte conocimientos, gana recompensas y mejora tus calificaciones hoy mismo.
            </p>
            <Link 
              to={isAuthenticated ? "/buscar" : "/registro"} 
              className="inline-flex items-center justify-center px-10 py-5 rounded-2xl font-black bg-pilas-gold text-slate-900 hover:bg-[#ffdf66] hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl shadow-pilas-gold/15 text-xs uppercase tracking-widest"
            >
              Regístrate Ahora
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
