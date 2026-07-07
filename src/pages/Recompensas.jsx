import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import config from '../config/constants.json';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import defaultProfile from '../assets/Default_profile.png';

// Helper para interpretar el JSON de criteria (definido fuera del componente para evitar TDZ y recreación en render)
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
            case 'early_adopter':
                return "Otorgado por participar en las pruebas beta de Pilas!.";
            case 'consecutive_logins':
                return `Inicia sesión ${crit.value} días seguidos consecutivos. 🔥`;
            case 'high_rating_streak':
                return `Acumula ${crit.value} tutorías con calificación de 4★ o más como tutor.`;
            default:
                return "Criterio personalizado";
        }
    } catch (e) {
        return "Logro especial";
    }
};

const getBadgeEmoji = (badgeName) => {
    switch (badgeName) {
        case 'Primeros Pasos':
            return '🎯';
        case 'Cerebro de Oro':
            return '💡';
        case 'Siempre Puntual':
            return '⚡';
        case 'Mentor Estrella':
            return '⭐';
        case 'Súper Aprendiz':
            return '🎓';
        case 'Héroe de la ESPE':
        case 'Maestro ESPE':
            return '🏆';
        case 'Hola Mundo':
            return '🌍';
        case 'Perfil Estelar':
            return '✨';
        default:
            return '🏅';
    }
};

const Recompensas = () => {
    const { showNotification } = useNotification();
    
        const [loading, setLoading] = useState(true);
    const [brokenInsignias, setBrokenInsignias] = useState({});
    
    const handleInsigniaImageError = (id) => {
        setBrokenInsignias(prev => ({ ...prev, [id]: true }));
    };
    const [espeCoins, setEspeCoins] = useState(0);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [dbBadges, setDbBadges] = useState([]);
    const [userUnlockedBadges, setUserUnlockedBadges] = useState([]);
    const [apprenticeHours, setApprenticeHours] = useState([]);
    const [mentorHours, setMentorHours] = useState([]);
    
    const [activeTab, setActiveTab] = useState('tienda'); // 'tienda', 'insignias', 'certificados'
    const [certData, setCertData] = useState(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const [showCouponModal, setShowCouponModal] = useState(false);
    const [activeCouponCode, setActiveCouponCode] = useState('');
    const [activeCouponTitle, setActiveCouponTitle] = useState('');

    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [selectedFeaturedBadgeIds, setSelectedFeaturedBadgeIds] = useState([]);

    // Nuevos estados para tienda y recompensas dinámicas
    const [rewards, setRewards] = useState([]);
    const [reqStatus, setReqStatus] = useState({ firstLogin: false, hasTutoring: false, surveyCompleted: false });
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    const [selectedOption, setSelectedOption] = useState('Kit Gamer Mouse + Teclado Gamer');
    const [contactPhone, setContactPhone] = useState('');
    const [claiming, setClaiming] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    const handleOpenFeatureModal = () => {
        const currentFeatured = userUnlockedBadges
            .filter(b => b.is_featured)
            .map(b => b.id);
        setSelectedFeaturedBadgeIds(currentFeatured);
        setShowFeatureModal(true);
    };

    const handleToggleFeaturedBadge = (id) => {
        if (selectedFeaturedBadgeIds.includes(id)) {
            setSelectedFeaturedBadgeIds(prev => prev.filter(bId => bId !== id));
        } else {
            if (selectedFeaturedBadgeIds.length >= 4) {
                showNotification("Solo puedes destacar hasta 4 logros.", "warning");
                return;
            }
            setSelectedFeaturedBadgeIds(prev => [...prev, id]);
        }
    };

    const handleSaveFeaturedBadges = async () => {
        try {
            await axios.put(`https://pilas-backend.onrender.com/api/users/profile/${currentUser.id}/featured-badges`, {
                badgeIds: selectedFeaturedBadgeIds
            });
            showNotification("Logros destacados actualizados con éxito", "success");
            setShowFeatureModal(false);
            await loadUserData();
        } catch (err) {
            console.error("Error al guardar logros destacados:", err);
            showNotification("Error al guardar logros destacados", "error");
        }
    };

    // Listado de cupones desde archivo de configuración centralizado
    const CUPONES = config.COUPONS;

    // Helper determinista para generar códigos de verificación
    const generateVerificationCode = (userId, subject, hours, role) => {
        const val = `${userId}-${subject}-${hours}-${role}`;
        let hash = 0;
        for (let i = 0; i < val.length; i++) {
            hash = val.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hex = Math.abs(hash).toString(16).toUpperCase();
        return `CERT-${hex.substring(0, 8)}-${hours}`;
    };

    // Función para manejar la descarga del PDF
    const handleDownloadCertificate = useCallback(async (certInfo) => {
        if (generatingPdf) return;
        setGeneratingPdf(true);
        
        const code = generateVerificationCode(currentUser.id, certInfo.subject, certInfo.hours, certInfo.role);
        
        setCertData({
            name: currentUser.full_name || 'Estudiante de la ESPE',
            type: certInfo.type,
            hours: certInfo.hours,
            subject: certInfo.subject,
            role: certInfo.role,
            code: code,
            date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        });
        
        setTimeout(async () => {
            try {
                const element = document.getElementById('certificate-print-template');
                if (!element) {
                    throw new Error("No se encontró la plantilla de certificado.");
                }
                
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [1123, 794]
                });
                
                pdf.addImage(imgData, 'PNG', 0, 0, 1123, 794);
                pdf.save(`certificado-${certInfo.role}-${certInfo.subject.replace(/\s+/g, '_')}-${certInfo.hours}h.pdf`);
                showNotification("¡Certificado descargado con éxito!", "success");
            } catch (err) {
                console.error("Error al generar PDF:", err);
                showNotification("Hubo un error al generar el certificado en PDF.", "error");
            } finally {
                setCertData(null);
                setGeneratingPdf(false);
            }
        }, 600);
    }, [currentUser.id, currentUser.full_name, generatingPdf, showNotification]);

    // loadUserData y loadUserDataSilently
    const loadUserData = useCallback(async () => {
        try {
            setLoading(true);
            const [profileRes, badgesRes, rewardsRes, statusRes] = await Promise.all([
                axios.get(`https://pilas-backend.onrender.com/api/users/profile/${currentUser.id}`),
                axios.get('https://pilas-backend.onrender.com/api/admin/badges'),
                axios.get('https://pilas-backend.onrender.com/api/rewards'),
                axios.get('https://pilas-backend.onrender.com/api/rewards/status')
            ]);
            
            if (profileRes.data) {
                setEspeCoins(profileRes.data.espe_coins || 0);
                setXp(profileRes.data.xp || 0);
                setLevel(profileRes.data.level || 1);
                setUserUnlockedBadges(profileRes.data.badges || []);
                setApprenticeHours(profileRes.data.apprentice_hours || []);
                setMentorHours(profileRes.data.mentor_hours || []);
            }
            if (badgesRes.data) {
                setDbBadges(badgesRes.data);
            }
            if (rewardsRes.data) {
                setRewards(rewardsRes.data);
            }
            if (statusRes.data) {
                setReqStatus(statusRes.data);
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
            const [profileRes, statusRes] = await Promise.all([
                axios.get(`https://pilas-backend.onrender.com/api/users/profile/${currentUser.id}`),
                axios.get('https://pilas-backend.onrender.com/api/rewards/status')
            ]);
            if (profileRes.data) {
                setEspeCoins(profileRes.data.espe_coins || 0);
                setXp(profileRes.data.xp || 0);
                setLevel(profileRes.data.level || 1);
                setUserUnlockedBadges(profileRes.data.badges || []);
                setApprenticeHours(profileRes.data.apprentice_hours || []);
                setMentorHours(profileRes.data.mentor_hours || []);
            }
            if (statusRes.data) {
                setReqStatus(statusRes.data);
            }
        } catch (err) {
            console.error("Error loading user data silently:", err);
        }
    }, [currentUser.id]);

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

    // Nuevas funciones para manejo de canje y encuestas
    const handleSurveyClick = async () => {
        window.open('https://forms.gle/1pB1RJS9B9b6ASMD7', '_blank');
        try {
            const res = await axios.post('https://pilas-backend.onrender.com/api/rewards/complete-survey');
            if (res.data) {
                setReqStatus(prev => ({ ...prev, surveyCompleted: true }));
                showNotification("¡Encuesta registrada como completada!", "success");
            }
        } catch (err) {
            console.error("Error al registrar encuesta:", err);
        }
    };

    const confirmClaimDirectly = async (reward) => {
        try {
            setClaiming(true);
            const res = await axios.post('https://pilas-backend.onrender.com/api/rewards/claim', {
                rewardId: reward.id
            });

            if (res.data) {
                setEspeCoins(res.data.newCoins);
                
                // Actualizar local storage
                const savedStorage = localStorage.getItem('user') ? localStorage : sessionStorage;
                const userObj = JSON.parse(savedStorage.getItem('user') || '{}');
                userObj.espe_coins = res.data.newCoins;
                savedStorage.setItem('user', JSON.stringify(userObj));

                window.dispatchEvent(new Event('gamificationStatsUpdated'));
                
                setActiveCouponCode('ESPE-COIN-' + Math.random().toString(36).substring(2, 8).toUpperCase());
                setActiveCouponTitle(reward.title);
                setShowCouponModal(true);

                showNotification(`¡Enhorabuena! Canjeaste "${reward.title}" con éxito`, "success");
            }
        } catch (err) {
            console.error("Error al canjear recompensa:", err);
            const errMsg = err.response?.data?.error || "Error al procesar el canje de recompensa";
            showNotification(errMsg, "error");
        } finally {
            setClaiming(false);
        }
    };

    const handleClaimClick = (reward) => {
        if (espeCoins < reward.cost) {
            showNotification(`Saldo insuficiente. Necesitas ${reward.cost} ESPE-Coins`, "error");
            return;
        }

        if (reward.is_special) {
            if (!reqStatus.firstLogin || !reqStatus.hasTutoring || !reqStatus.surveyCompleted) {
                showNotification("No cumples con todos los requisitos para este sorteo.", "error");
                return;
            }
            setSelectedReward(reward);
            setSelectedOption('Kit Gamer Mouse + Teclado Gamer');
            setContactPhone('');
            setShowClaimModal(true);
        } else {
            confirmClaimDirectly(reward);
        }
    };

    const handleConfirmSpecialClaim = async () => {
        if (!contactPhone.trim()) {
            showNotification("Por favor ingresa un número de teléfono de contacto.", "warning");
            return;
        }

        try {
            setClaiming(true);
            const res = await axios.post('https://pilas-backend.onrender.com/api/rewards/claim', {
                rewardId: selectedReward.id,
                selectedOption,
                contactPhone
            });

            if (res.data) {
                setEspeCoins(res.data.newCoins);
                
                // Actualizar local storage
                const savedStorage = localStorage.getItem('user') ? localStorage : sessionStorage;
                const userObj = JSON.parse(savedStorage.getItem('user') || '{}');
                userObj.espe_coins = res.data.newCoins;
                savedStorage.setItem('user', JSON.stringify(userObj));

                window.dispatchEvent(new Event('gamificationStatsUpdated'));
                setShowClaimModal(false);
                showNotification(`¡Enhorabuena! Estás participando en el sorteo por: ${selectedOption}`, "success");
            }
        } catch (err) {
            console.error("Error al canjear boleto de sorteo:", err);
            const errMsg = err.response?.data?.error || "Error al reclamar el boleto de sorteo";
            showNotification(errMsg, "error");
        } finally {
            setClaiming(false);
        }
    };

    const copyCouponCode = useCallback(() => {
        navigator.clipboard.writeText(activeCouponCode);
        showNotification("¡Código copiado al portapapeles!", "success");
    }, [activeCouponCode, showNotification]);

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
            earnedAt: userEarned ? userEarned.earned_at : null,
            is_featured: userEarned ? !!userEarned.is_featured : false
        };
    });

    const renderCertificateCard = ({ type, required, current, subject, role, desc, equiv }) => {
        const isUnlocked = current >= required;
        const progress = Math.min((current / required) * 100, 100);
        
        return (
            <div 
                key={type + '-' + subject}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
                    isUnlocked 
                        ? 'bg-gradient-to-br from-[#0f592f]/20 to-slate-900/60 border-[#0f592f]/40 hover:border-[#0f592f]/80 shadow-lg shadow-[#0f592f]/5'
                        : 'bg-black/20 border-white/5 opacity-60'
                }`}
            >
                <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                        <h5 className={`font-black text-xs uppercase tracking-wider leading-tight ${isUnlocked ? 'text-[#ffcc00]' : 'text-gray-400'}`}>
                            {type}
                        </h5>
                        <span className="text-lg shrink-0">
                            {isUnlocked ? '📜' : '🔒'}
                        </span>
                    </div>
                    
                    <p className="text-[11px] text-gray-300 leading-snug font-medium mb-3">
                        {desc}
                    </p>
                    
                    <span className="text-[9px] block text-gray-500 font-bold uppercase tracking-wider mb-4">
                        ⏱️ {equiv}
                    </span>
                </div>
                
                <div>
                    {isUnlocked ? (
                        <button
                            onClick={() => handleDownloadCertificate({ type, hours: current, subject, role })}
                            disabled={generatingPdf}
                            className="w-full py-2.5 bg-[#0f592f] hover:bg-[#0a4624] text-[#ffcc00] border border-[#ffcc00]/20 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {generatingPdf ? (
                                <>
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-amber-400 border-r-transparent"></div>
                                    <span>Generando...</span>
                                </>
                            ) : (
                                <>
                                    <span>📥 Descargar PDF</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <div>
                            <div className="flex justify-between text-[9px] font-black text-gray-400 mb-1.5">
                                <span>REQUISITO: {required} HORAS</span>
                                <span>{current} / {required} H</span>
                            </div>
                            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                                <div 
                                    className="h-full bg-slate-600 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
            {/* Elementos ambientales de fondo */}
            <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                
                {/* Header Superior y Panel de Estadísticas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 items-stretch">
                    
                    {/* Tarjeta de Nivel */}
                    <div className="lg:col-span-2 bg-gradient-to-r from-emerald-950/90 to-emerald-900/90 rounded-[2.5rem] p-8 text-white shadow-2xl border border-emerald-500/20 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
                        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl shadow-2xl border border-white/20 relative group">
                                    <img
                                        src={currentUser.profile_photo_url || defaultProfile}
                                        alt={currentUser.full_name}
                                        className="w-full h-full object-cover rounded-2xl"
                                    />
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
                                <span className="text-lg font-black text-emerald-300">{xp} XP</span>
                            </div>
                        </div>

                        {/* Barra de progreso de XP */}
                        <div className="mt-8">
                            <div className="flex justify-between text-xs font-black text-emerald-250 mb-2">
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

                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 mb-8 gap-2 overflow-x-auto scrollbar-none">
                    <button
                        onClick={() => setActiveTab('tienda')}
                        className={`pb-4 px-6 text-sm font-black uppercase tracking-wider transition-all border-b-2 outline-none cursor-pointer shrink-0 ${
                            activeTab === 'tienda'
                                ? 'border-[#ffcc00] text-[#ffcc00]'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        🛍️ Tienda de Beneficios
                    </button>
                    <button
                        onClick={() => setActiveTab('insignias')}
                        className={`pb-4 px-6 text-sm font-black uppercase tracking-wider transition-all border-b-2 outline-none cursor-pointer shrink-0 ${
                            activeTab === 'insignias'
                                ? 'border-[#ffcc00] text-[#ffcc00]'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        🏆 Mis Logros
                    </button>
                    <button
                        onClick={() => setActiveTab('certificados')}
                        className={`pb-4 px-6 text-sm font-black uppercase tracking-wider transition-all border-b-2 outline-none cursor-pointer shrink-0 ${
                            activeTab === 'certificados'
                                ? 'border-[#ffcc00] text-[#ffcc00]'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        📜 Mis Certificados
                    </button>
                </div>

                {/* Tab content rendering */}
                {/* Tab content rendering */}
                {activeTab === 'tienda' && (
                    <div className="bg-slate-900/90 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 backdrop-blur-md animate-fade-in relative overflow-hidden">
                        {/* Header de la sección */}
                        <div className="border-b border-white/10 pb-5 mb-6">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                                <span>🛍️</span> Canjear ESPE-Coins
                            </h2>
                            <p className="text-gray-400 text-xs mt-1.5 font-medium">
                                Intercambia tus ESPE-Coins por cupones, productos oficiales y boletos de sorteos.
                            </p>
                        </div>

                        {/* RECOMPENSA ESPECIAL (SORTEO) */}
                        {rewards.find(r => r.is_special) && (() => {
                            const specialReward = rewards.find(r => r.is_special);
                            const hasTutoring = reqStatus.hasTutoring;
                            const surveyCompleted = reqStatus.surveyCompleted;
                            const firstLogin = reqStatus.firstLogin;
                            const specialClaimed = reqStatus.specialClaimed;
                            const meetsRequirements = firstLogin && hasTutoring && surveyCompleted;
                            const canAfford = espeCoins >= specialReward.cost;

                            return (
                                <div className="bg-gradient-to-br from-[#0f592f]/20 via-emerald-950/30 to-slate-950 border border-[#0f592f]/40 rounded-[2rem] p-6 md:p-8 mb-8 text-left relative overflow-hidden shadow-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffcc00]/5 rounded-bl-[6rem] pointer-events-none"></div>
                                    
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="space-y-4 max-w-2xl">
                                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/35 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                                🔥 Sorteo Especial Gamer & Steam
                                            </span>
                                            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mt-2">
                                                {specialReward.title}
                                            </h3>
                                            <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                                {specialReward.description}
                                            </p>

                                            {/* CHECKLIST DE REQUISITOS */}
                                            <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-3 mt-4">
                                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Requisitos para Reclamar</h4>
                                                
                                                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                                                    <span className="text-lg">✅</span>
                                                    <span className="font-semibold text-gray-200">1. Iniciar sesión por primera vez</span>
                                                </div>

                                                <div className="flex items-center justify-between gap-4 text-xs">
                                                    <div className="flex items-center gap-2.5 text-gray-300">
                                                        <span className="text-lg">{hasTutoring ? '✅' : '🔒'}</span>
                                                        <span className={`font-semibold ${hasTutoring ? 'text-gray-200' : 'text-gray-500'}`}>2. Crear o participar en una tutoría</span>
                                                    </div>
                                                    {!hasTutoring && (
                                                        <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                            Pendiente
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                                                    <div className="flex items-center gap-2.5 text-gray-300">
                                                        <span className="text-lg">{surveyCompleted ? '✅' : '🔒'}</span>
                                                        <span className={`font-semibold ${surveyCompleted ? 'text-gray-200' : 'text-gray-500'}`}>3. Llenar la encuesta de opinión</span>
                                                    </div>
                                                    {!surveyCompleted ? (
                                                        <button
                                                            onClick={handleSurveyClick}
                                                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
                                                        >
                                                            📝 Llenar Encuesta
                                                        </button>
                                                    ) : (
                                                        <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                            Completada
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botón de Canjeo Especial */}
                                        <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl p-6 text-center lg:w-64 shrink-0">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Costo de Boleto</span>
                                            <div className="flex items-center gap-1.5 justify-center mb-5">
                                                <span className="text-3xl font-black text-[#ffcc00]">{specialReward.cost}</span>
                                                <span className="text-2xl">🪙</span>
                                            </div>
                                            <button
                                                onClick={() => handleClaimClick(specialReward)}
                                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-md ${
                                                    specialClaimed
                                                        ? 'bg-[#0f592f]/20 text-gray-500 border border-white/5 cursor-not-allowed'
                                                        : meetsRequirements && canAfford
                                                            ? 'bg-[#0f592f] hover:bg-[#0a4624] text-[#ffcc00] border border-[#ffcc00]/20 hover:scale-105 active:scale-95 cursor-pointer'
                                                            : 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed'
                                                }`}
                                                disabled={specialClaimed || !meetsRequirements || !canAfford || claiming}
                                            >
                                                {claiming ? "Procesando..." : specialClaimed ? "✓ Ya Participando" : "Reclamar Boleto"}
                                            </button>
                                            {specialClaimed && (
                                                <span className="text-[9px] text-[#ffcc00] font-black uppercase tracking-wider mt-3 block">
                                                    🎉 ¡Ya estás participando!
                                                </span>
                                            )}
                                            {!specialClaimed && !meetsRequirements && (
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-3 block">
                                                    🔒 Completa los requisitos
                                                </span>
                                            )}
                                            {!specialClaimed && meetsRequirements && !canAfford && (
                                                <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-3 block">
                                                    ❌ Saldo insuficiente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* LISTADO DE RECOMPENSAS NORMALES */}
                        <div className="border-t border-white/15 pt-6 mb-6">
                            <h3 className="text-base font-black text-white text-left mb-4 uppercase tracking-wider">Beneficios del Catálogo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rewards.filter(r => !r.is_special).length === 0 ? (
                                    <p className="text-center text-xs text-gray-500 py-10 col-span-full">No hay otros beneficios activos en la tienda.</p>
                                ) : (
                                    rewards.filter(r => !r.is_special).map((reward) => {
                                        const canAfford = espeCoins >= reward.cost;

                                        // Determinar categoría e ícono
                                        let icon = "🎁";
                                        let category = "General";
                                        if (reward.title.toLowerCase().includes("bar") || reward.title.toLowerCase().includes("almuerzo") || reward.title.toLowerCase().includes("comedor")) {
                                            icon = "🍲";
                                            category = "Alimentación";
                                        } else if (reward.title.toLowerCase().includes("parqueadero")) {
                                            icon = "🚗";
                                            category = "Servicios";
                                        } else if (reward.title.toLowerCase().includes("termo") || reward.title.toLowerCase().includes("cuaderno") || reward.title.toLowerCase().includes("espe")) {
                                            icon = "🥤";
                                            category = "Merchandising";
                                        }

                                        return (
                                            <div
                                                key={reward.id}
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
                                                        {icon}
                                                    </div>
                                                    {/* Info */}
                                                    <div className="min-w-0 pl-1 text-left">
                                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            {category}
                                                        </span>
                                                        <h4 className="font-extrabold text-white text-sm truncate mt-1.5 leading-tight group-hover/ticket:text-amber-400 transition-colors">
                                                            {reward.title}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-400 mt-1 truncate leading-relaxed">
                                                            {reward.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Botón de Canjeo */}
                                                <button
                                                    onClick={() => handleClaimClick(reward)}
                                                    className={`font-black text-xs px-5 py-3 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 flex items-center gap-1.5 border outline-none shadow-md cursor-pointer ${
                                                        canAfford
                                                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white border-amber-400/20 shadow-amber-500/10'
                                                            : 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed'
                                                    }`}
                                                    disabled={!canAfford || claiming}
                                                >
                                                    <span>{reward.cost}</span>
                                                    <span>🪙</span>
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'insignias' && (
                    <div className="bg-slate-900/90 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 backdrop-blur-md animate-fade-in">
                        <div className="border-b border-white/10 pb-5 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                                    <span>🏆</span> Mis Logros
                                </h2>
                                <p className="text-gray-400 text-xs mt-1.5 font-medium">
                                    Insignias y medallas obtenidas en la comunidad estudiantil. (Puedes destacar hasta 4 logros en tu perfil).
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleOpenFeatureModal}
                                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                                >
                                    ✏️ Destacar Logros
                                </button>
                                <span className="text-[10px] font-black text-[#ffcc00] bg-[#ffcc00]/10 border border-[#ffcc00]/20 px-3.5 py-1.5 rounded-xl uppercase tracking-widest">
                                    {userUnlockedBadges.length} desbloqueados
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mappedBadges.map((insignia) => (
                                <div
                                    key={insignia.id}
                                    className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 relative overflow-hidden group/item ${
                                        insignia.unlocked
                                            ? insignia.is_featured
                                                ? 'bg-gradient-to-br from-emerald-950/70 to-amber-950/40 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.25)] hover:border-amber-300 hover:-translate-y-1'
                                                : 'bg-gradient-to-br from-emerald-950/40 to-slate-900/40 border-emerald-500/20 shadow-lg shadow-emerald-950/20 hover:border-emerald-500/40 hover:-translate-y-1'
                                            : 'bg-black/20 border-white/5 opacity-50 filter grayscale hover:opacity-75 transition-opacity'
                                    }`}
                                >
                                    {/* Icono de Insignia */}
                                    <div className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-3xl shrink-0 ${
                                        insignia.unlocked
                                            ? 'bg-emerald-950/80 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover/item:scale-110 transition-transform duration-300'
                                            : 'bg-slate-800 text-gray-500 border border-slate-700/50'
                                    }`}>
                                        {insignia.unlocked ? (
                                            typeof insignia.icon === 'string' && insignia.icon.startsWith('http') && !brokenInsignias[insignia.id] ? (
                                                <img 
                                                    src={insignia.icon} 
                                                    alt={insignia.name} 
                                                    className="w-full h-full object-cover" 
                                                    onError={() => handleInsigniaImageError(insignia.id)}
                                                />
                                            ) : (
                                                getBadgeEmoji(insignia.name)
                                            )
                                        ) : '🔒'}
                                    </div>

                                    {/* Información */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-extrabold text-white text-sm leading-tight truncate group-hover/item:text-amber-400 transition-colors">
                                                {insignia.name}
                                            </h4>
                                            {insignia.is_featured && (
                                                <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                                                    ⭐ Destacado
                                                </span>
                                            )}
                                            {insignia.unlocked && !insignia.is_featured && (
                                                <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                    Ganado
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                                            {insignia.criteriaDescription}
                                        </p>
                                        <div className="flex gap-2.5 mt-2.5">
                                            <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
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
                )}

                {activeTab === 'certificados' && (
                    <div className="bg-slate-900/90 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 backdrop-blur-md animate-fade-in">
                        <div className="border-b border-white/10 pb-5 mb-6">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                                <span>📜</span> Mis Certificados Académicos
                            </h2>
                            <p className="text-gray-400 text-xs mt-1.5 font-medium">
                                Genera y descarga certificados oficiales firmados según tus horas de tutorías completadas.
                            </p>
                        </div>

                        {apprenticeHours.length === 0 && mentorHours.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center justify-center">
                                <span className="text-5xl mb-4">📜</span>
                                <h3 className="text-lg font-black text-white">Sin certificados disponibles</h3>
                                <p className="text-gray-400 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                                    Aún no registras horas de tutorías completadas en la plataforma. 
                                    Completa tutorías como estudiante o regístrate como tutor para impartir tutorías y comenzar a acumular horas académicas.
                                </p>
                            </div>
                        ) : (
                            <div>
                                {/* Sección de Aprendiz */}
                                {apprenticeHours.length > 0 && (
                                    <div className="mb-10">
                                        <h3 className="text-lg font-black text-amber-400 flex items-center gap-2 mb-6">
                                            <span>🎓</span> Tutorías Recibidas (Como Estudiante)
                                        </h3>
                                        <div className="flex flex-col gap-6">
                                            {apprenticeHours.map((subj) => (
                                                <div key={subj.subject_id} className="bg-slate-950/40 border border-white/5 rounded-3xl p-6">
                                                    <div className="flex justify-between items-center mb-4 gap-4">
                                                        <h4 className="font-extrabold text-white text-base truncate uppercase tracking-wider">
                                                            {subj.subject_name}
                                                        </h4>
                                                        <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl font-black shrink-0">
                                                            Total: {subj.total_hours} {subj.total_hours === 1 ? 'hora' : 'horas'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {renderCertificateCard({
                                                            type: 'Certificado de Iniciación / Logro',
                                                            required: 10,
                                                            current: subj.total_hours,
                                                            subject: subj.subject_name,
                                                            role: 'estudiante',
                                                            desc: 'Ideal para validar la superación de una materia corta o taller intensivo. Impulso motivacional inicial.',
                                                            equiv: '~1 mes (2-3h/semana)'
                                                        })}
                                                        {renderCertificateCard({
                                                            type: 'Certificado de Consolidación',
                                                            required: 30,
                                                            current: subj.total_hours,
                                                            subject: subj.subject_name,
                                                            role: 'estudiante',
                                                            desc: 'Demuestra un esfuerzo sostenido a lo largo de un ciclo académico completo.',
                                                            equiv: '~1 trimestre o semestre regular'
                                                        })}
                                                        {renderCertificateCard({
                                                            type: 'Certificado de Excelencia Académica',
                                                            required: 80,
                                                            current: subj.total_hours,
                                                            subject: subj.subject_name,
                                                            role: 'estudiante',
                                                            desc: 'Demuestra un compromiso profundo a largo plazo. Excelente peso curricular de constancia.',
                                                            equiv: '~1 año académico'
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sección de Mentor */}
                                {mentorHours.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-black text-amber-400 flex items-center gap-2 mb-6">
                                            <span>👨‍🏫</span> Tutorías Realizadas (Como Tutor/Mentor)
                                        </h3>
                                        <div className="flex flex-col gap-6">
                                            {mentorHours.map((subj) => (
                                                <div key={subj.subject_id} className="bg-slate-950/40 border border-white/5 rounded-3xl p-6">
                                                    <div className="flex justify-between items-center mb-4 gap-4">
                                                        <h4 className="font-extrabold text-white text-base truncate uppercase tracking-wider">
                                                            {subj.subject_name}
                                                        </h4>
                                                        <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3.5 py-1.5 rounded-xl font-black shrink-0">
                                                            Total: {subj.total_hours} {subj.total_hours === 1 ? 'hora' : 'horas'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {renderCertificateCard({
                                                            type: 'Certificado de Tutor Junior',
                                                            required: 20,
                                                            current: subj.total_hours,
                                                            subject: subj.subject_name,
                                                            role: 'tutor',
                                                            desc: 'Valida que has superado la fase de inducción y has tenido un impacto inicial con tus estudiantes.',
                                                            equiv: '~1 a 2 meses de mentoría'
                                                        })}
                                                        {renderCertificateCard({
                                                            type: 'Certificado de Tutor Avanzado',
                                                            required: 60,
                                                            current: subj.total_hours,
                                                            subject: subj.subject_name,
                                                            role: 'tutor',
                                                            desc: 'Valioso para tu currículum. Demuestra experiencia equivalente a pasantía o voluntariado formal.',
                                                            equiv: '~1 semestre constante'
                                                        })}
                                                        {renderCertificateCard({
                                                            type: 'Certificado de Mentor Experto / Líder',
                                                            required: 120,
                                                            current: subj.total_hours,
                                                            subject: subj.subject_name,
                                                            role: 'tutor',
                                                            desc: 'Avala un dominio total de la enseñanza, mentoría a gran escala e impacto masivo en la comunidad.',
                                                            equiv: '~1 año de trayectoria'
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

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
                                className="bg-white/5 hover:bg-white/10 text-white text-xs font-black py-3.5 rounded-2xl transition-all border border-white/10 cursor-pointer"
                            >
                                Copiar Código
                            </button>
                            <button
                                onClick={() => setShowCouponModal(false)}
                                className="bg-gradient-to-r from-[#0f592f] to-emerald-700 hover:from-[#0a4624] hover:to-emerald-800 text-[#ffcc00] text-xs font-black py-3.5 rounded-2xl transition-all shadow-md shadow-emerald-950/15 cursor-pointer"
                            >
                                Listo
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Plantilla Oculta de Certificado para Captura HTML2Canvas */}
            {certData && (
                <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
                    <div
                        id="certificate-print-template"
                        style={{
                            width: '1123px',
                            height: '794px',
                            padding: '60px',
                            boxSizing: 'border-box',
                            backgroundColor: '#ffffff',
                            color: '#1f2937',
                            fontFamily: "'Outfit', 'Inter', sans-serif",
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '20px solid #0f592f',
                        }}
                    >
                        {/* Gold Filigree Line */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                right: '10px',
                                bottom: '10px',
                                border: '3px solid #ffcc00',
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Certificate Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '28px', fontWeight: '900', color: '#0f592f', letterSpacing: '3px' }}>PILAS!</span>
                            </div>
                            <div style={{ textAlign: 'right', flexGrow: 1 }}>
                                <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#0f592f', margin: '0', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    Universidad de las Fuerzas Armadas ESPE
                                </h4>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#ffcc00', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Departamento de Ciencias Académicas y Vinculación
                                </span>
                            </div>
                        </div>

                        {/* Certificate Body */}
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffcc00', letterSpacing: '4px', textTransform: 'uppercase' }}>
                                Certificado de Reconocimiento
                            </span>
                            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f592f', margin: '15px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {certData.type}
                            </h1>
                            <p style={{ fontSize: '15px', color: '#4b5563', fontStyle: 'italic', margin: '0' }}>
                                Concedido con honor a:
                            </p>
                            <h2 style={{ fontSize: '32px', fontWeight: '950', color: '#111827', margin: '10px auto 25px auto', borderBottom: '2.5px solid #ffcc00', paddingBottom: '10px', display: 'inline-block', minWidth: '450px' }}>
                                {certData.name}
                            </h2>
                            <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#374151', maxWidth: '850px', margin: '0 auto' }}>
                                Por haber {certData.role === 'tutor' ? 'realizado con éxito' : 'recibido con constancia'} un total de{' '}
                                <strong style={{ color: '#0f592f', fontWeight: '900' }}>{certData.hours} horas</strong> de tutoría{' '}
                                {certData.role === 'tutor' ? 'académica impartida' : 'académica recibida'} en la asignatura de{' '}
                                <strong style={{ color: '#0f592f', fontWeight: '900', textTransform: 'uppercase' }}>{certData.subject}</strong>,{' '}
                                demostrando un alto compromiso con el desarrollo educativo, el aprendizaje colaborativo y la excelencia académica en la comunidad Pilas!.
                            </p>
                        </div>

                        {/* Certificate Signatures and Seal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', width: '100%', padding: '0 20px' }}>
                            {/* Left signature */}
                            <div style={{ textAlign: 'center', width: '220px' }}>
                                <div style={{ borderBottom: '1px solid #9ca3af', paddingBottom: '5px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', fontStyle: 'italic', color: '#4b5563', fontFamily: 'serif' }}>Coordinación Académica</span>
                                </div>
                                <span style={{ fontSize: '9px', fontWeight: '850', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Coordinación Pilas!
                                </span>
                            </div>

                            {/* Center Sello */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <svg width="80" height="80" viewBox="0 0 100 100" style={{ fill: '#ffcc00' }}>
                                    <circle cx="50" cy="50" r="42" stroke="#0f592f" strokeWidth="4.5" fill="#ffffff" />
                                    <circle cx="50" cy="50" r="36" stroke="#ffcc00" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
                                    <path d="M 50 18 L 59 36 L 79 38 L 64 51 L 69 71 L 50 60 L 31 71 L 36 51 L 21 38 L 41 36 Z" fill="#ffcc00" stroke="#0f592f" strokeWidth="1" />
                                    <text x="50" y="85" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#0f592f" letterSpacing="0.5px">PILAS! ESPE</text>
                                </svg>
                            </div>

                            {/* Right Date */}
                            <div style={{ textAlign: 'center', width: '220px' }}>
                                <div style={{ borderBottom: '1px solid #9ca3af', paddingBottom: '5px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                        {certData.date}
                                    </span>
                                </div>
                                <span style={{ fontSize: '9px', fontWeight: '850', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Fecha de Emisión
                                </span>
                            </div>
                        </div>

                        {/* Verification code at bottom */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#9ca3af', fontFamily: 'monospace', width: '100%', marginTop: '10px' }}>
                            <span>CÓDIGO DE VERIFICACIÓN: {certData.code}</span>
                            <span>SISTEMA DE GAMIFICACIÓN PILAS!</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Destacar Logros */}
            {showFeatureModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-lg w-full p-8 relative shadow-2xl">
                        <button
                            onClick={() => setShowFeatureModal(false)}
                            className="absolute right-6 top-6 text-gray-400 hover:text-white text-xl outline-none cursor-pointer"
                        >
                            ✕
                        </button>
                        
                        <h3 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                            <span>⭐</span> Destacar Logros
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 font-medium">
                            Selecciona hasta 4 de tus logros desbloqueados para lucirlos con orgullo en tu perfil. ({selectedFeaturedBadgeIds.length} / 4 seleccionados)
                        </p>

                        {/* Listado de logros desbloqueados */}
                        <div className="max-h-60 overflow-y-auto space-y-2.5 pr-2 mb-6 scrollbar-thin">
                            {mappedBadges.filter(b => b.unlocked).length === 0 ? (
                                <p className="text-center text-xs text-gray-500 py-6">Aún no has desbloqueado ninguna insignia.</p>
                            ) : (
                                mappedBadges
                                    .filter(b => b.unlocked)
                                    .map(b => {
                                        const isSelected = selectedFeaturedBadgeIds.includes(b.id);
                                        return (
                                            <div
                                                key={b.id}
                                                onClick={() => handleToggleFeaturedBadge(b.id)}
                                                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 ${
                                                    isSelected 
                                                        ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-400 text-white shadow-md' 
                                                        : 'bg-black/30 border-white/5 hover:border-white/20 text-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl shrink-0">
                                                        {typeof b.icon === 'string' && b.icon.startsWith('http') && !brokenInsignias[b.id] ? (
                                                            <img src={b.icon} alt={b.name} className="w-8 h-8 object-cover rounded-lg" />
                                                        ) : (
                                                            getBadgeEmoji(b.name)
                                                        )}
                                                    </span>
                                                    <div>
                                                        <p className="font-extrabold text-xs leading-tight">{b.name}</p>
                                                        <p className="text-[9px] text-gray-400 mt-1 leading-snug">{b.criteriaDescription}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    isSelected 
                                                        ? 'border-amber-400 bg-amber-400 text-slate-950 font-black text-[10px]' 
                                                        : 'border-white/20'
                                                }`}>
                                                    {isSelected && "✓"}
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFeatureModal(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveFeaturedBadges}
                                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 cursor-pointer"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Reclamar Boleto de Sorteo (Especial) */}
            {showClaimModal && selectedReward && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-md w-full p-8 relative shadow-2xl text-left">
                        <button
                            onClick={() => setShowClaimModal(false)}
                            className="absolute right-6 top-6 text-gray-400 hover:text-white text-xl outline-none cursor-pointer"
                        >
                            ✕
                        </button>
                        
                        <h3 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                            <span>🎫</span> Reclamar Premio del Sorteo
                        </h3>
                        <p className="text-xs text-gray-450 mb-6 font-medium leading-relaxed">
                            Por favor selecciona el premio por el cual deseas participar y proporciona tu número de teléfono de contacto para registrar tu participación.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Premio a elegir:
                                </label>
                                <select
                                    value={selectedOption}
                                    onChange={(e) => setSelectedOption(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#ffcc00] cursor-pointer"
                                >
                                    <option value="Kit Gamer Mouse + Teclado Gamer">Kit Gamer Mouse + Teclado Gamer</option>
                                    <option value="Tarjeta de regalo de $10 en STEAM">Tarjeta de regalo de $10 en STEAM</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Número de Teléfono de Contacto:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. 0999999999"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#ffcc00]"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClaimModal(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer"
                                disabled={claiming}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmSpecialClaim}
                                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                                disabled={claiming}
                            >
                                {claiming ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-slate-950 border-r-transparent"></div>
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirmar Canje</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recompensas;
