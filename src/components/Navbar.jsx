import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';
import logoEspePilas from '../assets/logoespepilas.png';
import { useNotification } from '../context/NotificationContext';

const Badge = ({ count }) => {
    if (!count || count <= 0) return null;
    return (
        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-sm">
            {count > 9 ? '+9' : count}
        </span>
    );
};

const Navbar = ({ isAuthenticated, userRole, onLogout }) => {
    const { showNotification } = useNotification();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
    const [counts, setCounts] = useState({ pendingSolicitudes: 0, newInboxMessages: 0 });
    const navigate = useNavigate();

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const [userCoins, setUserCoins] = useState(currentUser.espe_coins || 0);
    const [userLevel, setUserLevel] = useState(currentUser.level || 1);

    const fetchCounts = useCallback(async () => {
        try {
            const res = await axios.get(`https://pilas-backend.onrender.com/api/mentorships/counts/${currentUser.id}`);
            setCounts(res.data);

            if (currentUser.role !== 'ADMIN') {
                const profileRes = await axios.get(`https://pilas-backend.onrender.com/api/users/profile/${currentUser.id}`);
                if (profileRes.data) {
                    setUserCoins(profileRes.data.espe_coins || 0);
                    setUserLevel(profileRes.data.level || 1);

                    const savedStorage = localStorage.getItem('user') ? localStorage : sessionStorage;
                    const userObj = JSON.parse(savedStorage.getItem('user') || '{}');
                    userObj.espe_coins = profileRes.data.espe_coins;
                    userObj.level = profileRes.data.level;
                    userObj.xp = profileRes.data.xp;
                    savedStorage.setItem('user', JSON.stringify(userObj));

                    // Detección de nuevas insignias ganadas
                    const serverBadges = profileRes.data.badges || [];
                    const serverBadgeIds = serverBadges.map(b => b.id);
                    const cacheKey = `unlocked_badge_ids_${currentUser.id}`;
                    const cachedIdsStr = localStorage.getItem(cacheKey);

                    if (cachedIdsStr === null) {
                        // Inicialización silenciosa en el primer arranque para evitar spam de medallas previas
                        localStorage.setItem(cacheKey, JSON.stringify(serverBadgeIds));
                    } else {
                        try {
                            const cachedIds = JSON.parse(cachedIdsStr) || [];
                            const newBadges = serverBadges.filter(b => !cachedIds.includes(b.id));

                            if (newBadges.length > 0) {
                                newBadges.forEach(badge => {
                                    showNotification(
                                        `¡Has obtenido la insignia "${badge.name}"!`,
                                        'badge',
                                        {
                                            name: badge.name,
                                            icon: badge.image_url || badge.icon
                                        }
                                    );
                                });
                                const updatedIds = Array.from(new Set([...cachedIds, ...serverBadgeIds]));
                                localStorage.setItem(cacheKey, JSON.stringify(updatedIds));
                            }
                        } catch (e) {
                            console.error("Error al procesar caché de insignias:", e);
                            localStorage.setItem(cacheKey, JSON.stringify(serverBadgeIds));
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching notification/gamification counts:", err);
        }
    }, [currentUser.id, currentUser.role, showNotification]);

    useEffect(() => {
        if (isAuthenticated && currentUser.id) {
            fetchCounts();
            const interval = setInterval(fetchCounts, 15000); // Polling cada 15 segundos
            
            // Listener para actualización inmediata desde otros componentes
            const handleUpdateEvent = () => fetchCounts();
            window.addEventListener('updateNotificationCounts', handleUpdateEvent);
            window.addEventListener('gamificationStatsUpdated', handleUpdateEvent);

            return () => {
                clearInterval(interval);
                window.removeEventListener('updateNotificationCounts', handleUpdateEvent);
                window.removeEventListener('gamificationStatsUpdated', handleUpdateEvent);
            };
        }
    }, [isAuthenticated, currentUser.id, fetchCounts]);

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50 border-b-2 border-pilas-gold">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">

                    {/* Logo Pilas! */}
                    <Link to="/" className="flex-shrink-0 flex items-center space-x-3">
                        <img className="h-12 w-auto" src={logo} alt="Pilas!" />
                        <span className="h-8 w-px bg-gray-200 block"></span>
                        <img className="h-10 w-auto" src={logoEspePilas} alt="ESPE Pilas!" />
                    </Link>

                    <div className="hidden md:flex space-x-6 items-center">
                        {isAuthenticated ? (
                            <>
                                {userRole === 'ADMIN' ? (
                                    <>
                                        <Link to="/admin" className="nav-link">Panel Admin</Link>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/buscar" className="nav-link">Busca Tutor</Link>
                                        <Link to="/mi-tutoria" className="nav-link relative">
                                            MiTutoría
                                        </Link>
                                        <Link to="/calendario" className="nav-link">Calendario</Link>
                                        <Link to="/mensajes" className="nav-link relative">
                                            Bandeja de Entrada
                                            <Badge count={counts.newInboxMessages} />
                                        </Link>
                                        {userRole === 'MENTOR' ? (
                                            <Link to="/solicitudes" className="nav-link relative">
                                                Solicitudes Pendientes
                                                <Badge count={counts.pendingSolicitudes} />
                                            </Link>
                                        ) : (
                                            <Link to="/se-tutor" className="nav-link relative">
                                                Sé Tutor
                                            </Link>
                                        )}
                                        <Link to="/recompensas" className="nav-link">Recompensas</Link>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <Link to="/" className="nav-link">Inicio</Link>
                                <Link to="/beneficios" className="nav-link">Beneficios</Link>
                                <Link to="/registro" className="nav-link">Regístrate</Link>
                            </>
                        )}

                        {/* Icono de Usuario o Iniciar Sesión con Gamificación */}
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3 relative">
                                {/* Nivel (XP Pill) */}
                                {currentUser.role !== 'ADMIN' && (
                                    <div className="flex items-center gap-1 bg-[#0f592f] text-[#ffcc00] border border-[#ffcc00]/20 px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm tracking-wide">
                                        <span className="text-sm">⭐</span>
                                        <span>NIVEL {userLevel}</span>
                                    </div>
                                )}

                                {/* ESPE-Coins Pill */}
                                {currentUser.role !== 'ADMIN' && (
                                    <button 
                                        onClick={() => navigate('/recompensas')}
                                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 outline-none"
                                        title="Ver mis recompensas"
                                    >
                                        <span className="text-sm">🪙</span>
                                        <span>{userCoins}</span>
                                    </button>
                                )}

                                <div className="relative">
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="p-2.5 rounded-full bg-gray-50 text-pilas-blue hover:bg-pilas-gold hover:text-white transition-all shadow-sm border border-gray-100 flex items-center justify-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </button>

                                    {showDropdown && (
                                        <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl py-2 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conectado como</p>
                                                <p className="text-xs font-black text-slate-700 truncate">{currentUser?.full_name}</p>
                                            </div>
                                            <Link to={`/profile/${currentUser?.id || ''}`} className="block px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-pilas-blue transition-colors">Mi Perfil</Link>
                                            <Link to="/tickets" className="block px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-pilas-blue transition-colors">🛠️ Soporte</Link>
                                            <button
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    if (onLogout) onLogout();
                                                }}
                                                className="w-full text-left block px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="nav-link font-semibold">Iniciar sesión</Link>
                        )}
                    </div>

                    {/* Botón de Menú Móvil (Hamburger) */}
                    <div className="flex md:hidden items-center gap-3">
                        {isAuthenticated && currentUser.role !== 'ADMIN' && (
                            <button 
                                onClick={() => navigate('/recompensas')}
                                className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2.5 py-1.5 rounded-full text-[10px] font-black shadow-sm"
                                title="Mis recompensas"
                            >
                                <span className="text-sm">🪙</span>
                                <span>{userCoins}</span>
                            </button>
                        )}
                        <button
                            onClick={() => setIsOpenMobileMenu(!isOpenMobileMenu)}
                            className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-[#0f592f] transition-all outline-none animate-in fade-in"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isOpenMobileMenu ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Menu Panel */}
            {isOpenMobileMenu && (
                <div className="md:hidden bg-white border-t border-gray-100 shadow-inner px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
                    <div className="flex flex-col gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* User Info Card inside mobile menu */}
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between mb-2">
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Conectado como</p>
                                        <p className="text-xs font-black text-slate-700 truncate max-w-[150px]">{currentUser?.full_name}</p>
                                    </div>
                                    {currentUser.role !== 'ADMIN' && (
                                        <div className="flex items-center gap-2">
                                            <span className="bg-[#0f592f] text-[#ffcc00] px-2.5 py-1 rounded-full text-[9px] font-black">
                                                LVL {userLevel}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {currentUser.role === 'ADMIN' ? (
                                    <Link 
                                        to="/admin" 
                                        onClick={() => setIsOpenMobileMenu(false)}
                                        className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all"
                                    >
                                        Panel Admin
                                    </Link>
                                ) : (
                                    <>
                                        <Link 
                                            to="/buscar" 
                                            onClick={() => setIsOpenMobileMenu(false)}
                                            className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all flex justify-between"
                                        >
                                            <span>Busca Tutor</span>
                                        </Link>
                                        <Link 
                                            to="/mi-tutoria" 
                                            onClick={() => setIsOpenMobileMenu(false)}
                                            className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all"
                                        >
                                            MiTutoría
                                        </Link>
                                        <Link 
                                            to="/calendario" 
                                            onClick={() => setIsOpenMobileMenu(false)}
                                            className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all"
                                        >
                                            Calendario
                                        </Link>
                                        <Link 
                                            to="/mensajes" 
                                            onClick={() => setIsOpenMobileMenu(false)}
                                            className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all flex justify-between items-center"
                                        >
                                            <span>Bandeja de Entrada</span>
                                            {counts.newInboxMessages > 0 && (
                                                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                                    {counts.newInboxMessages}
                                                </span>
                                            )}
                                        </Link>
                                        {userRole === 'MENTOR' ? (
                                            <Link 
                                                to="/solicitudes" 
                                                onClick={() => setIsOpenMobileMenu(false)}
                                                className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all flex justify-between items-center"
                                            >
                                                <span>Solicitudes Pendientes</span>
                                                {counts.pendingSolicitudes > 0 && (
                                                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                                        {counts.pendingSolicitudes}
                                                    </span>
                                                )}
                                            </Link>
                                        ) : (
                                            <Link 
                                                to="/se-tutor" 
                                                onClick={() => setIsOpenMobileMenu(false)}
                                                className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all"
                                            >
                                                Sé Tutor
                                            </Link>
                                        )}
                                        <Link 
                                            to="/recompensas" 
                                            onClick={() => setIsOpenMobileMenu(false)}
                                            className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all"
                                        >
                                            Recompensas
                                        </Link>
                                    </>
                                )}

                                <hr className="border-gray-100 my-2" />

                                <Link 
                                    to={`/profile/${currentUser?.id || ''}`} 
                                    onClick={() => setIsOpenMobileMenu(false)}
                                    className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all"
                                >
                                    Mi Perfil
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsOpenMobileMenu(false);
                                        onLogout();
                                    }}
                                    className="px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl text-left transition-all"
                                >
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <>
                                <Link 
                                    to="/" 
                                    onClick={() => setIsOpenMobileMenu(false)}
                                    className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all"
                                >
                                    Inicio
                                </Link>
                                <Link 
                                    to="/beneficios" 
                                    onClick={() => setIsOpenMobileMenu(false)}
                                    className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all"
                                >
                                    Beneficios
                                </Link>
                                <Link 
                                    to="/registro" 
                                    onClick={() => setIsOpenMobileMenu(false)}
                                    className="px-4 py-3 bg-gray-50 hover:bg-[#0f592f]/5 text-xs font-bold rounded-xl text-slate-700 hover:text-[#0f592f] transition-all"
                                >
                                    Regístrate
                                </Link>
                                <Link 
                                    to="/login" 
                                    onClick={() => setIsOpenMobileMenu(false)}
                                    className="px-4 py-3 bg-[#0f592f] text-[#ffcc00] hover:bg-[#0a4624] text-xs font-black rounded-xl text-center shadow-md uppercase tracking-wider transition-all"
                                >
                                    Iniciar sesión
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
