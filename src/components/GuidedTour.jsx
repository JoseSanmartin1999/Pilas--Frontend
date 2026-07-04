import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const STEPS = [
    {
        title: "¡Bienvenido a Pilas! 👋",
        text: "Pilas! es la plataforma oficial de tutorías de la ESPE. Queremos darte un pequeño recorrido para que conozcas las herramientas principales y consolides tu aprendizaje de forma cooperativa.",
        targetSelector: null,
        redirectPath: "/"
    },
    {
        title: "Encuentra un Tutor 🔍",
        text: "¿Necesitas ayuda con alguna materia? Aquí puedes buscar y filtrar tutores destacados de tu misma carrera, revisar sus calificaciones e iniciar solicitudes de tutoría en segundos.",
        targetSelector: "#tour-busca-tutor",
        redirectPath: "/"
    },
    {
        title: "Gestiona tus Tutorías 📂",
        text: "En esta sección podrás dar seguimiento a tus tutorías activas (creadas o recibidas), acceder a las salas de chat individuales y conectarte a las videollamadas confirmadas.",
        targetSelector: "#tour-mi-tutoria",
        redirectPath: "/"
    },
    {
        title: "Bandeja de Entrada 📬",
        text: "Aquí recibirás las notificaciones de solicitudes aceptadas, propuestas de cambio de horario de tus tutores, enlaces de Zoom/Meet y comunicaciones oficiales de la comunidad.",
        targetSelector: "#tour-mensajes",
        redirectPath: "/"
    },
    {
        title: "Tu Nivel y Logros ⭐",
        text: "Este indicador muestra tu Nivel actual. Al participar en tutorías y realizar actividades acumularás puntos de experiencia (XP) para subir de nivel y obtener insignias de mérito.",
        targetSelector: "#tour-nivel",
        redirectPath: "/"
    },
    {
        title: "ESPE-Coins y Tienda 🪙",
        text: "¡Aquí ves tu saldo de ESPE-Coins! Completa tu perfil, inicia sesión a diario y participa en tutorías para acumular monedas y canjearlas en la sección de Recompensas por sorteos gamer y otros premios.",
        targetSelector: "#tour-monedas",
        redirectPath: "/"
    }
];

const GuidedTour = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const cardRef = useRef(null);

    // Identificar si el usuario tiene sesión activa
    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const isAuthenticated = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));

    // Trigger automático si es primera vez
    useEffect(() => {
        if (isAuthenticated && currentUser.id && currentUser.role !== 'ADMIN') {
            const isCompleted = localStorage.getItem(`pilas_tour_completed_${currentUser.id}`);
            if (!isCompleted) {
                // Pequeño delay para asegurar que el DOM cargue
                const timer = setTimeout(() => {
                    setIsOpen(true);
                    setCurrentStep(0);
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [isAuthenticated, currentUser.id, currentUser.role]);

    // Escuchar el evento manual de reinicio del tour
    useEffect(() => {
        const handleStartTour = () => {
            setIsOpen(true);
            setCurrentStep(0);
            if (location.pathname !== '/') {
                navigate('/');
            }
        };
        window.addEventListener('startGuidedTour', handleStartTour);
        return () => window.removeEventListener('startGuidedTour', handleStartTour);
    }, [location.pathname, navigate]);

    // Recalcular las coordenadas del spotlight cuando cambia el paso o se redimensiona la pantalla
    useEffect(() => {
        if (!isOpen) {
            setTargetRect(null);
            return;
        }

        const step = STEPS[currentStep];
        
        // Si el paso requiere redirección y no estamos ahí, redirigir
        if (step.redirectPath && location.pathname !== step.redirectPath) {
            navigate(step.redirectPath);
            // Dar tiempo para la transición de página
            const timer = setTimeout(() => updateSpotlight(step.targetSelector), 300);
            return () => clearTimeout(timer);
        }

        updateSpotlight(step.targetSelector);

        // Listener de redimensión y scroll
        const handleResize = () => updateSpotlight(step.targetSelector);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize);
        };
    }, [isOpen, currentStep, location.pathname, navigate]);

    const updateSpotlight = (selector) => {
        if (!selector) {
            setTargetRect(null);
            return;
        }

        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Pequeña espera para que termine el scroll
            setTimeout(() => {
                const rect = element.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    bottom: rect.bottom,
                    right: rect.right
                });
            }, 100);
        } else {
            setTargetRect(null);
        }
    };

    if (!isOpen) return null;

    const step = STEPS[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            handleComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        setIsOpen(false);
        if (currentUser.id) {
            localStorage.setItem(`pilas_tour_completed_${currentUser.id}`, 'true');
        }
    };

    // Calcular posición de la tarjeta popover para que nunca se desborde de la pantalla
    const getCardStyle = () => {
        if (!targetRect) {
            // Estilo centrado para la introducción
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10000,
                width: 'calc(100% - 32px)',
                maxWidth: '400px'
            };
        }

        // Posicionamiento adaptativo (arriba o abajo del elemento)
        const cardHeight = 250; // altura aproximada
        const spaceBelow = window.innerHeight - targetRect.bottom;
        const placeBelow = spaceBelow > cardHeight || targetRect.top < cardHeight;

        const top = placeBelow 
            ? targetRect.bottom + 16 
            : targetRect.top - cardHeight - 16;

        // Centrar horizontalmente respecto al elemento
        const elementWidth = targetRect.width;
        const cardWidth = 320; // ancho fijo de la tarjeta
        const elementCenter = targetRect.left + elementWidth / 2;
        
        let left = elementCenter - cardWidth / 2;
        // Prevenir desbordamiento de bordes izquierdo y derecho
        left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));

        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${cardWidth}px`,
            zIndex: 10000,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        };
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none select-none">
            {/* CAPA DE OSCURECIMIENTO (Spotlight MASK) */}
            {targetRect ? (
                <div 
                    className="fixed rounded-2xl border-2 border-pilas-gold transition-all duration-300 pointer-events-auto"
                    style={{
                        top: `${targetRect.top - 8}px`,
                        left: `${targetRect.left - 8}px`,
                        width: `${targetRect.width + 16}px`,
                        height: `${targetRect.height + 16}px`,
                        boxShadow: '0 0 0 9999px rgba(15, 89, 47, 0.7)',
                        zIndex: 9998,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                />
            ) : (
                <div 
                    className="fixed inset-0 bg-[#0f592f]/70 pointer-events-auto"
                    style={{ zIndex: 9998 }}
                />
            )}

            {/* TARJETA DEL TOUR */}
            <div 
                ref={cardRef}
                style={getCardStyle()}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-6 pointer-events-auto select-text animate-in zoom-in duration-300 flex flex-col justify-between"
            >
                <div>
                    {/* Encabezado y Progreso */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="bg-pilas-gold/10 text-pilas-gold text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            Paso {currentStep + 1} de {STEPS.length}
                        </span>
                        <button 
                            onClick={handleSkip}
                            className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer leading-none font-bold"
                            title="Omitir Tour"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Título y Contenido */}
                    <h4 className="text-[#0f592f] text-lg font-black mb-2 flex items-center gap-2">
                        {step.title}
                    </h4>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed mb-6">
                        {step.text}
                    </p>
                </div>

                {/* Acciones */}
                <div className="flex justify-between items-center border-t border-gray-50 pt-4 mt-auto">
                    <button
                        onClick={handleSkip}
                        className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                    >
                        Omitir
                    </button>
                    
                    <div className="flex gap-2">
                        {!isFirstStep && (
                            <button
                                onClick={handlePrev}
                                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                            >
                                Anterior
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-5 py-2.5 bg-[#0f592f] hover:bg-[#0a4624] text-[#ffcc00] rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all shadow-md hover:scale-[1.03]"
                        >
                            {isLastStep ? "Finalizar" : "Siguiente"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuidedTour;
