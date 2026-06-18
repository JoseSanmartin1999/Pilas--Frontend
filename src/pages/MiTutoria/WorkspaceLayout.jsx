import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import ChatView from './ChatView';
import RightSidebar from './RightSidebar';
import PlaceholderView from './PlaceholderView';
import RepositoryView from './RepositoryView';

/**
 * WorkspaceLayout — Contenedor principal del espacio de trabajo
 * Estructura: [LeftSidebar] | [TopBar + MainCanvas] | [RightSidebar?]
 */

const PLACEHOLDER_CONFIGS = {
    repositorio: {
        icon: '📚',
        title: 'Repositorio de Materiales',
        description: 'Aquí encontrarás PDFs, enlaces de GitHub y grabaciones de sesiones compartidas por tu tutor.',
    },
    tablon: {
        icon: '📢',
        title: 'Tablón de Anuncios',
        description: 'Tu mentor publicará notas importantes aquí. "Mañana no hay sesión", fechas de examen, y más.',
    },
    'hoja-de-ruta': {
        icon: '🗓️',
        title: 'Hoja de Ruta',
        description: 'Visualiza el cronograma completo de tus 16 semanas de mentoría con los objetivos de cada sesión.',
    },
    retos: {
        icon: '⚡',
        title: 'Retos y Gamificación',
        description: 'Completa tareas y gana puntos. Las insignias y niveles se desbloquearán aquí pronto.',
    },
};

const WorkspaceLayout = ({ mentorship, currentUser, onCloseMentorship, onRateMentorship }) => {
    const { showNotification } = useNotification();
    const [activeModule, setActiveModule] = useState('chat');
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    // Estados para la encuesta de satisfacción
    const [showSurveyModal, setShowSurveyModal] = useState(true);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const calculateTimeLeft = useCallback(() => {
        if (!mentorship?.closed_at) return '';
        const closedDate = new Date(mentorship.closed_at);
        const expirationDate = new Date(closedDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = expirationDate - now;

        if (diffMs <= 0) return 'Expirado';

        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHrs >= 24) {
            const days = Math.floor(diffHrs / 24);
            const remainingHrs = diffHrs % 24;
            return `${days} ${days === 1 ? 'día' : 'días'}, ${remainingHrs} ${remainingHrs === 1 ? 'hora' : 'horas'} y ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
        }
        return `${diffHrs} ${diffHrs === 1 ? 'hora' : 'horas'} y ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    }, [mentorship?.closed_at]);

    useEffect(() => {
        if (mentorship?.status !== 'COMPLETADA' || !mentorship?.closed_at) return;

        const updateCountdown = () => {
            setTimeLeft(calculateTimeLeft());
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);

        return () => clearInterval(interval);
    }, [mentorship?.status, mentorship?.closed_at, calculateTimeLeft]);

    const handleSubmitSurvey = async () => {
        if (rating === 0) {
            showNotification('Por favor selecciona al menos 1 estrella', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.put(`https://pilas-backend.onrender.com/api/mentorships/${mentorship.id}/rate`, {
                rating,
                comment: ratingComment,
                userId: currentUser.id
            });
            showNotification(res.data.message || '¡Calificación registrada con éxito!', 'success');
            if (onRateMentorship) {
                onRateMentorship(mentorship.id, rating, ratingComment);
            }
            setShowSurveyModal(false);
        } catch (err) {
            console.error('Error al calificar tutoría:', err);
            const errorMsg = err.response?.data?.error || 'No se pudo guardar la calificación.';
            showNotification(errorMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderMainContent = () => {
        if (activeModule === 'chat') {
            return <ChatView mentorship={mentorship} currentUser={currentUser} />;
        }

        if (activeModule === 'repositorio') {
            return <RepositoryView mentorship={mentorship} currentUser={currentUser} />;
        }

        const config = PLACEHOLDER_CONFIGS[activeModule] || {
            icon: '🔧',
            title: 'Sección en construcción',
        };

        return <PlaceholderView icon={config.icon} title={config.title} description={config.description} />;
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* ===== SIDEBAR IZQUIERDO ===== */}
            <LeftSidebar
                activeModule={activeModule}
                onModuleChange={setActiveModule}
                mentorship={mentorship}
            />

            {/* ===== CONTENIDO PRINCIPAL ===== */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Cabecera dinámica */}
                <TopBar mentorship={mentorship} currentUser={currentUser} onCloseMentorship={onCloseMentorship} />

                {/* Banner de Expiración (Solo si la tutoría está COMPLETADA) */}
                {mentorship?.status === 'COMPLETADA' && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between gap-4 backdrop-blur-md animate-fade-in z-20">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base flex-shrink-0 animate-bounce">⚠️</span>
                            <p className="text-[11px] font-black text-amber-800 tracking-tight leading-snug truncate">
                                ESTA TUTORÍA HA SIDO CERRADA (SÓLO LECTURA)
                            </p>
                            <span className="hidden md:inline text-[10px] text-amber-700/60 font-semibold">|</span>
                            <p className="hidden md:inline text-[10px] text-amber-700 font-medium truncate">
                                Ya no se admiten nuevos mensajes de chat ni cargas de material.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {currentUser.id === mentorship.apprentice_id && !mentorship.is_rated && !showSurveyModal && (
                                <button
                                    onClick={() => setShowSurveyModal(true)}
                                    className="bg-[#ffcc00] hover:bg-[#e6b800] text-[#1a3a5a] px-3.5 py-1.5 rounded-full font-black text-[9px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5"
                                >
                                    <span>⭐</span> Calificar Tutoría
                                </button>
                            )}
                            <div className="flex items-center gap-2 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/20 shadow-sm shadow-amber-500/5">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest">
                                    Expira en: {timeLeft || 'Calculando...'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Canvas principal — animación al cambiar de módulo */}
                <div
                    key={activeModule}
                    className="flex-1 overflow-hidden relative"
                    style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
                >
                    {renderMainContent()}
                </div>
            </div>

            {/* ===== SIDEBAR DERECHO (colapsable) ===== */}
            <div className="relative flex flex-shrink-0">
                <RightSidebar
                    mentorship={mentorship}
                    currentUser={currentUser}
                    isOpen={isRightSidebarOpen}
                    onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                />
            </div>

            {/* ===== MODAL DE ENCUESTA (SÓLO SI EL ROL ES APRENDIZ, ESTÁ COMPLETADA Y NO CALIFICADA Y EL MODAL ESTÁ ACTIVO) ===== */}
            {mentorship?.status === 'COMPLETADA' && !mentorship.is_rated && currentUser.id === mentorship.apprentice_id && showSurveyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a3a5a]/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-gray-150 animate-in zoom-in duration-200 p-8 flex flex-col items-center">
                        <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner mb-4 border border-yellow-100">
                            🎓
                        </div>
                        <h2 className="text-xl font-black text-[#1a3a5a] text-center tracking-tight mb-2">¡Tutoría Finalizada!</h2>
                        <p className="text-xs text-gray-500 text-center font-medium leading-relaxed mb-6">
                            Tu tutor ha cerrado esta sesión de aprendizaje. Por favor, califica la ayuda recibida para seguir mejorando la comunidad.
                        </p>
                        
                        {/* ESTRELLAS DE CALIFICACIÓN */}
                        <div className="flex gap-2.5 mb-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setRating(i)}
                                    onMouseEnter={() => setHoveredRating(i)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="focus:outline-none"
                                >
                                    <svg 
                                        className={`w-10 h-10 transition-all transform duration-150 ${
                                            i <= (hoveredRating || rating) 
                                                ? 'text-[#ffcc00] scale-110 drop-shadow-sm' 
                                                : 'text-gray-200 hover:scale-105'
                                        }`}
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                            ))}
                        </div>

                        {/* COMENTARIO */}
                        <div className="w-full mb-6 text-left">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Comentario / Opinión (Opcional)</label>
                            <textarea
                                rows="3"
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-medium text-gray-600 text-xs resize-none placeholder-gray-400"
                                placeholder="Cuéntanos qué tal fue la sesión..."
                            />
                        </div>

                        {/* ACCIONES */}
                        <div className="w-full flex flex-col gap-3">
                            <button
                                type="button"
                                disabled={isSubmitting || rating === 0}
                                onClick={handleSubmitSurvey}
                                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                    rating > 0 
                                        ? 'bg-[#1a3a5a] text-[#ffcc00] hover:bg-[#112740] hover:scale-[1.02] shadow-md shadow-[#1a3a5a]/10' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isSubmitting ? 'Guardando...' : 'Enviar Calificación'}
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setShowSurveyModal(false)}
                                className="w-full py-3.5 bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all text-center"
                            >
                                Calificar más tarde
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyframe de animación para el canvas */}
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default WorkspaceLayout;
