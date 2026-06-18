import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import config from '../config/constants.json';

const Recompensas = () => {
    const { showNotification } = useNotification();
    
    const [loading, setLoading] = useState(true);
    const [espeCoins, setEspeCoins] = useState(0);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [dbBadges, setDbBadges] = useState([]);
    const [userUnlockedBadges, setUserUnlockedBadges] = useState([]);

    const [showCouponModal, setShowCouponModal] = useState(false);
    const [activeCouponCode, setActiveCouponCode] = useState('');
    const [activeCouponTitle, setActiveCouponTitle] = useState('');

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    // Listado de cupones desde archivo de configuración centralizado
    const CUPONES = config.COUPONS;

    useEffect(() => {
        if (currentUser.id) {
            loadUserData();
        } else {
            setLoading(false);
        }

        // Escuchar si hay alguna actualización global de estadísticas de gamificación
        const handleUpdate = () => {
            if (currentUser.id) {
                loadUserDataSilently();
            }
        };
        window.addEventListener('gamificationStatsUpdated', handleUpdate);
        return () => {
            window.removeEventListener('gamificationStatsUpdated', handleUpdate);
        };
    }, [currentUser.id, loadUserData, loadUserDataSilently]);

    const loadUserData = useCallback(async () => {
        try {
            setLoading(true);
            const [profileRes, badgesRes] = await Promise.all([
                axios.get(`https://pilas-backend.onrender.com/api/users/profile/${currentUser.id}`),
                axios.get('https://pilas-backend.onrender.com/api/admin/badges')
            ]);
            
            if (profileRes.data) {
                setEspeCoins(profileRes.data.espe_coins || 0);
                setXp(profileRes.data.xp || 0);
                setLevel(profileRes.data.level || 1);
                setUserUnlockedBadges(profileRes.data.badges || []);
            }
            if (badgesRes.data) {
                setDbBadges(badgesRes.data);
            }
        } catch (err) {
            console.error("Error loading user data for shop:", err);
            showNotification("Error de conexión al cargar datos de gamificación.", "error");
        } finally {
            setLoading(false);
        }
    }, [currentUser.id, showNotification]);

    const loadUserDataSilently = useCallback(async () => {
        try {
            const profileRes = await axios.get(`https://pilas-backend.onrender.com/api/users/profile/${currentUser.id}`);
            if (profileRes.data) {
                setEspeCoins(profileRes.data.espe_coins || 0);
                setXp(profileRes.data.xp || 0);
                setLevel(profileRes.data.level || 1);
                setUserUnlockedBadges(profileRes.data.badges || []);
            }
        } catch (err) {
            console.error("Error loading user data silently:", err);
        }
    }, [currentUser.id]);

    // Helper para interpretar el JSON de criteria
    const getCriteriaDescription = (criteriaStr) => {
        if (!criteriaStr) return "Logro especial";
        try {
            const crit = typeof criteriaStr === 'string' ? JSON.parse(criteriaStr) : criteriaStr;
            switch(crit.type) {
                case 'xp_earned':
                    return `Alcanza un total de ${crit.value} Puntos de Experiencia (XP).`;
                case 'mentorships_given':
                    return `Imparte ${crit.value} tutorías como tutor académico.`;
                case 'mentorships_received':
                    return `Recibe ${crit.value} tutorías de tus compañeros.`;
                case 'mentorships_any':
                    return `Completa un total de ${crit.value} tutorías.`;
                case 'perfect_ratings':
                    return `Consigue ${crit.value} calificaciones perfectas (5 estrellas ★).`;
                case 'first_login':
                    return "Creaste tu Cuenta en pilas!";
                case 'profile_configured':
                    return "Configuraste tu perfil de usuario";
                default:
                    return "Criterio personalizado";
            }
        } catch {
            return "Logro especial";
        }
    };

    // Lógica para canjear cupón en el backend
    const handleRedeem = async (cupon) => {
        if (espeCoins < cupon.cost) {
            showNotification(`Saldo insuficiente. Necesitas ${cupon.cost} ESPE-Coins`, "error");
            return;
        }

        try {
            const res = await axios.post('https://pilas-backend.onrender.com/api/rewards/redeem', {
                userId: currentUser.id,
                couponId: cupon.id,
                cost: cupon.cost
            });

            if (res.data) {
                // Sincronizar espeCoins locales
                setEspeCoins(res.data.espeCoins);
                
                // Actualizar local storage
                const savedStorage = localStorage.getItem('user') ? localStorage : sessionStorage;
                const userObj = JSON.parse(savedStorage.getItem('user') || '{}');
                userObj.espe_coins = res.data.espeCoins;
                savedStorage.setItem('user', JSON.stringify(userObj));

                // Lanzar evento global para refrescar Navbar
                window.dispatchEvent(new Event('gamificationStatsUpdated'));

                setActiveCouponCode(res.data.code);
                setActiveCouponTitle(cupon.title);
                setShowCouponModal(true);

                showNotification(`¡Enhorabuena! Canjeaste "${cupon.title}" con éxito`, "success");
            }
        } catch (err) {
            console.error("Error al canjear cupón:", err);
            const errMsg = err.response?.data?.error || "Error al procesar el canje del cupón";
            showNotification(errMsg, "error");
        }
    };

    const copyCouponCode = () => {
        navigator.clipboard.writeText(activeCouponCode);
        showNotification("¡Código copiado al portapapeles!", "success");
    };

    // Cálculo del progreso de nivel
    const xpInCurrentLevel = xp % 500;
    const xpRequiredForNext = 500;
    const progressPercent = Math.min((xpInCurrentLevel / xpRequiredForNext) * 100, 100);

    // Mapear catálogo de insignias con estado del usuario
    const mappedBadges = dbBadges.map(badge => {
        const userEarned = userUnlockedBadges.find(ub => String(ub.id) === String(badge.id));
        return {
            id: badge.id,
            name: badge.name,
            icon: badge.image_url || '🏅',
            xpReward: badge.xp_reward || 0,
            coinsReward: badge.coins_reward || 0,
            criteriaDescription: getCriteriaDescription(badge.criteria),
            unlocked: !!userEarned,
            earnedAt: userEarned ? userEarned.earned_at : null
        };
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-[#ffcc00] border-r-transparent"></div>
                    <span className="text-sm font-bold text-gray-400 tracking-widest uppercase">Cargando Gamificación...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
            {/* Elementos ambientales de fondo */}
            <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                
                {/* Header Superior y Panel de Estadísticas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 items-stretch">
                    
                    {/* Tarjeta de Nivel */}
                    <div className="lg:col-span-2 bg-gradient-to-r from-blue-900/90 to-indigo-950/90 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
                        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl shadow-2xl border border-white/20 relative group">
                                    {currentUser.profile_photo_url ? (
                                        <img
                                            src={currentUser.profile_photo_url}
                                            alt={currentUser.full_name}
                                            className="w-full h-full object-cover rounded-2xl"
                                        />
                                    ) : (
                                        "⚡"
                                    )}
                                    <div className="absolute -bottom-2 -right-2 bg-[#ffcc00] text-slate-950 text-xs font-black px-2 py-0.5 rounded-full border border-slate-900 shadow-md">
                                        LVL {level}
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                                        {currentUser.full_name || "Estudiante de la ESPE"}
                                    </h1>
                                    <p className="text-amber-400 text-xs sm:text-sm font-black flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                                        <span>🏅</span> Rango: Tutor Comprometido
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-center self-start sm:self-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Experiencia Total</span>
                                <span className="text-lg font-black text-blue-300">{xp} XP</span>
                            </div>
                        </div>

                        {/* Barra de progreso de XP */}
                        <div className="mt-8">
                            <div className="flex justify-between text-xs font-black text-indigo-200 mb-2">
                                <span className="uppercase tracking-wider">Progreso al nivel {level + 1}</span>
                                <span>{xpInCurrentLevel} / {xpRequiredForNext} XP</span>
                            </div>
                            <div className="w-full h-5 bg-black/40 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-[#ffcc00] to-amber-500 rounded-full transition-all duration-1000 relative"
                                    style={{ width: `${progressPercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta de ESPE-Coins */}
                    <div className="bg-slate-900/95 rounded-[2.5rem] p-8 shadow-2xl border border-white/10 flex flex-col justify-between items-center text-center backdrop-blur-md relative group hover:border-[#ffcc00]/30 transition-all duration-300">
                        <div className="absolute -right-10 -top-10 w-28 h-28 bg-[#ffcc00]/5 rounded-full blur-2xl group-hover:bg-[#ffcc00]/10 transition-colors"></div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 block mb-2 uppercase tracking-widest">Saldo Disponible</span>
                            <div className="flex items-center justify-center gap-3 mt-2">
                                <span className="text-5xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">{espeCoins}</span>
                                <span className="text-4xl animate-bounce group-hover:rotate-12 transition-transform duration-300">🪙</span>
                            </div>
                            <span className="text-xs font-black text-amber-500 mt-2 block uppercase tracking-wider">ESPE-Coins</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-6 leading-relaxed max-w-[240px] font-medium">
                            Completa tutorías, recibe valoraciones de 5 estrellas y desbloquea insignias para acumular más ESPE-Coins.
                        </p>
                    </div>

                </div>

                {/* Grid Inferior: Logros & Tienda */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Sección Mis Logros (Insignias) */}
                    <div className="lg:col-span-6 bg-slate-900/90 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 backdrop-blur-md">
                        <div className="border-b border-white/10 pb-5 mb-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                                    <span>🏆</span> Mis Logros
                                </h2>
                                <p className="text-gray-400 text-xs mt-1.5 font-medium">
                                    Insignias y medallas obtenidas en la comunidad estudiantil.
                                </p>
                            </div>
                            <span className="text-[10px] font-black text-[#ffcc00] bg-[#ffcc00]/10 border border-[#ffcc00]/20 px-3.5 py-1.5 rounded-xl uppercase tracking-widest">
                                {userUnlockedBadges.length} desbloqueados
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {mappedBadges.map((insignia) => (
                                <div
                                    key={insignia.id}
                                    className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 relative overflow-hidden group/item ${
                                        insignia.unlocked
                                            ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border-indigo-500/20 shadow-lg shadow-indigo-950/20 hover:border-indigo-500/40 hover:-translate-y-1'
                                            : 'bg-black/20 border-white/5 opacity-50 filter grayscale hover:opacity-75 transition-opacity'
                                    }`}
                                >
                                    {/* Icono de Insignia */}
                                    <div className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-3xl shrink-0 ${
                                        insignia.unlocked
                                            ? 'bg-indigo-950/80 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover/item:scale-110 transition-transform duration-300'
                                            : 'bg-slate-800 text-gray-500 border border-slate-700/50'
                                    }`}>
                                        {insignia.unlocked ? (
                                            typeof insignia.icon === 'string' && insignia.icon.startsWith('http') ? (
                                                <img src={insignia.icon} alt={insignia.name} className="w-full h-full object-cover" />
                                            ) : (
                                                insignia.icon
                                            )
                                        ) : '🔒'}
                                    </div>

                                    {/* Información */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-extrabold text-white text-sm leading-tight truncate group-hover/item:text-amber-400 transition-colors">
                                                {insignia.name}
                                            </h4>
                                            {insignia.unlocked && (
                                                <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                    Ganado
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                                            {insignia.criteriaDescription}
                                        </p>
                                        <div className="flex gap-2.5 mt-2.5">
                                            <span className="text-[9px] font-black text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25">
                                                +{insignia.xpReward} XP
                                            </span>
                                            <span className="text-[9px] font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                                                +{insignia.coinsReward} 🪙
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sección Tienda de Beneficios */}
                    <div className="lg:col-span-6 bg-slate-900/90 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 backdrop-blur-md">
                        <div className="border-b border-white/10 pb-5 mb-6">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                                <span>🛍️</span> Canjear ESPE-Coins
                            </h2>
                            <p className="text-gray-400 text-xs mt-1.5 font-medium">
                                Intercambia tus ESPE-Coins por cupones y productos oficiales.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {CUPONES.map((cupon) => {
                                const canAfford = espeCoins >= cupon.cost;

                                return (
                                    <div
                                        key={cupon.id}
                                        className="relative bg-slate-950/60 hover:bg-slate-950/90 border border-white/5 hover:border-[#ffcc00]/20 rounded-3xl p-5 flex items-center justify-between gap-4 transition-all duration-300 group/ticket overflow-hidden"
                                    >
                                        {/* Efectos de corte circular de ticket */}
                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 border-r border-white/5 rounded-full pointer-events-none"></div>
                                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 border-l border-white/5 rounded-full pointer-events-none"></div>
                                        
                                        {/* Línea divisoria de cupón */}
                                        <div className="absolute left-[70px] top-4 bottom-4 w-px border-l border-dashed border-white/10 pointer-events-none"></div>

                                        <div className="flex items-center gap-5 min-w-0 pl-3">
                                            {/* Icono del cupón */}
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0 shadow-lg group-hover/ticket:scale-105 transition-transform duration-300">
                                                {cupon.icon}
                                            </div>
                                            {/* Info */}
                                            <div className="min-w-0 pl-1">
                                                <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    {cupon.category}
                                                </span>
                                                <h4 className="font-extrabold text-white text-sm truncate mt-1.5 leading-tight group-hover/ticket:text-amber-400 transition-colors">
                                                    {cupon.title}
                                                </h4>
                                                <p className="text-[11px] text-gray-400 mt-1 truncate leading-relaxed">
                                                    {cupon.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Botón de Canjeo */}
                                        <button
                                            onClick={() => handleRedeem(cupon)}
                                            className={`font-black text-xs px-5 py-3 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 flex items-center gap-1.5 border outline-none shadow-md ${
                                                canAfford
                                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white border-amber-400/20 shadow-amber-500/10'
                                                    : 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed'
                                            }`}
                                            disabled={!canAfford}
                                        >
                                            <span>{cupon.cost}</span>
                                            <span>🪙</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

            </div>

            {/* Modal de Cupón Exitoso */}
            {showCouponModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[3rem] shadow-2xl p-8 overflow-hidden animate-in zoom-in duration-200 flex flex-col items-center text-center relative">
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-green-500/10 rounded-full blur-2xl"></div>
                        
                        {/* Icono animado */}
                        <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400 text-4xl mb-6 shadow-lg border border-green-500/25 animate-bounce">
                            🎉
                        </div>

                        {/* Título */}
                        <h3 className="text-2xl font-black text-white tracking-tight">
                            ¡Canjeo Exitoso!
                        </h3>
                        
                        <p className="text-xs text-gray-400 mt-2.5 max-w-[240px]">
                            Has adquirido con éxito el beneficio:
                        </p>
                        
                        <strong className="text-amber-400 text-sm block mt-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 font-black max-w-full truncate">
                            {activeCouponTitle}
                        </strong>

                        {/* Campo del Código */}
                        <div className="w-full mt-6 bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col items-center shadow-inner">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">CÓDIGO DE CUPÓN</span>
                            <span className="text-lg font-black text-white tracking-widest mt-1 select-all">{activeCouponCode}</span>
                        </div>

                        <p className="text-[10px] text-gray-400 mt-3.5 italic">
                            Presenta este código en ventanilla para hacerlo válido.
                        </p>

                        {/* Controles */}
                        <div className="w-full grid grid-cols-2 gap-3 mt-8">
                            <button
                                onClick={copyCouponCode}
                                className="bg-white/5 hover:bg-white/10 text-white text-xs font-black py-3.5 rounded-2xl transition-all border border-white/10"
                            >
                                Copiar Código
                            </button>
                            <button
                                onClick={() => setShowCouponModal(false)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-600 text-white text-xs font-black py-3.5 rounded-2xl transition-all shadow-md shadow-indigo-600/15"
                            >
                                Listo
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Recompensas;
