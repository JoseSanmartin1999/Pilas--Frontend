import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TOURS = {
    welcome: [
        {
            title: "¡Bienvenido a Pilas! 👋",
            text: "Pilas! es la plataforma oficial de tutorías de la ESPE. Queremos darte un pequeño recorrido para que conozcas las herramientas principales y consolides tu aprendizaje de forma cooperativa.",
            targetSelector: null
        },
        {
            title: "Encuentra un Tutor 🔍",
            text: "¿Necesitas ayuda con alguna materia? Aquí puedes buscar y filtrar tutores destacados de tu misma carrera, revisar sus calificaciones e iniciar solicitudes de tutoría en segundos.",
            targetSelector: "#tour-busca-tutor"
        },
        {
            title: "Gestiona tus Tutorías 📂",
            text: "En esta sección podrás dar seguimiento a tus tutorías activas (creadas o recibidas), acceder a las salas de chat individuales y conectarte a las videollamadas confirmadas.",
            targetSelector: "#tour-mi-tutoria"
        },
        {
            title: "Bandeja de Entrada 📬",
            text: "Aquí recibirás las notificaciones de solicitudes aceptadas, propuestas de cambio de horario de tus tutores, enlaces de Zoom/Meet y comunicaciones oficiales de la comunidad.",
            targetSelector: "#tour-mensajes"
        },
        {
            title: "Tu Nivel y Logros ⭐",
            text: "Este indicador muestra tu Nivel actual. Al participar en tutorías y realizar actividades acumularás puntos de experiencia (XP) para subir de nivel y obtener insignias de mérito.",
            targetSelector: "#tour-nivel"
        },
        {
            title: "ESPE-Coins y Tienda 🪙",
            text: "¡Aquí ves tu saldo de ESPE-Coins! Completa tu perfil, inicia sesión a diario y participa en tutorías para acumular monedas y canjearlas en la sección de Recompensas por sorteos gamer y otros premios.",
            targetSelector: "#tour-monedas"
        }
    ],
    buscar: [
        {
            title: "Búsqueda Inteligente 🕵️‍♂️",
            text: "Utiliza este panel de control lateral para buscar materias específicas, filtrar por semestres, ordenar de forma alfabética o ver los tutores con mejores calificaciones.",
            targetSelector: "#tour-buscar-filtros"
        },
        {
            title: "Tus Mentores Disponibles 👥",
            text: "Aquí puedes ver a tus compañeros disponibles para dar tutorías. Se muestra su semestre actual, estrellas de reputación y las materias de especialidad.",
            targetSelector: "#tour-buscar-tutores"
        },
        {
            title: "Acceder a Detalles del Mentor 📄",
            text: "Haz clic en 'Ver Perfil' del tutor para revisar su perfil académico completo, insignias destacadas, opiniones de otros alumnos y pactar una cita.",
            targetSelector: "#tour-ver-perfil"
        }
    ],
    solicitar: [
        {
            title: "Información del Tutor 👤",
            text: "Este panel lateral te muestra los datos clave del mentor: semestre actual, carrera universitaria y las materias oficiales que imparte.",
            targetSelector: "#tour-perfil-header"
        },
        {
            title: "Logros y Aportes 🏅",
            text: "Aquí verás las insignias de gamificación y la puntuación promedio del tutor. Te ayuda a conocer la calidad de su labor como tutor.",
            targetSelector: "#tour-perfil-insignias"
        },
        {
            title: "Pactar la Cita 📅",
            text: "Presiona este botón de 'Pactar Tutoría' para abrir el formulario de agendamiento y proponer un encuentro al mentor.",
            targetSelector: "#tour-boton-pactar"
        },
        {
            title: "Formulario de Tutoría 📝",
            text: "Elige la materia que deseas repasar, define la fecha y hora sugerida, selecciona modalidad (presencial u online) y describe tus temas de interés.",
            targetSelector: "#tour-agendar-formulario"
        },
        {
            title: "Enviar Solicitud 🚀",
            text: "¡Presiona 'Enviar Solicitud' para proponer la tutoría! El mentor podrá aceptar tu horario, contraproponer otro cambio o rechazarla.",
            targetSelector: "#tour-boton-enviar"
        }
    ]
};

const GuidedTour = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTour, setActiveTour] = useState(null); // 'welcome', 'buscar', 'solicitar'
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const cardRef = useRef(null);

    // Identificar si el usuario tiene sesión activa
    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const isAuthenticated = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));

    // Trigger automático según la página en la que se encuentre
    useEffect(() => {
        if (!isAuthenticated || !currentUser.id || currentUser.role === 'ADMIN') {
            setActiveTour(null);
            return;
        }

        // 1. Welcome Tour (Página de inicio)
        if (location.pathname === '/') {
            const welcomeCompleted = localStorage.getItem(`pilas_tour_completed_${currentUser.id}`);
            if (!welcomeCompleted) {
                // Delay corto para asegurar carga
                const timer = setTimeout(() => {
                    setActiveTour('welcome');
                    setCurrentStep(0);
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
        // 2. Buscar Tour
        else if (location.pathname === '/buscar') {
            const buscarCompleted = localStorage.getItem(`pilas_buscar_tour_completed_${currentUser.id}`);
            if (!buscarCompleted) {
                const timer = setTimeout(() => {
                    setActiveTour('buscar');
                    setCurrentStep(0);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
        // 3. Solicitar Tour (Perfil de otro mentor)
        else if (location.pathname.startsWith('/profile')) {
            const isOwn = location.pathname === '/profile' || location.pathname === `/profile/${currentUser.id}`;
            if (!isOwn) {
                const solicitarCompleted = localStorage.getItem(`pilas_solicitar_tour_completed_${currentUser.id}`);
                if (!solicitarCompleted) {
                    const timer = setTimeout(() => {
                        setActiveTour('solicitar');
                        setCurrentStep(0);
                    }, 1000);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [location.pathname, isAuthenticated, currentUser.id, currentUser.role]);

    // Escuchar el evento manual de reinicio del tour
    useEffect(() => {
        const handleStartTour = () => {
            if (currentUser.id) {
                localStorage.removeItem(`pilas_tour_completed_${currentUser.id}`);
                localStorage.removeItem(`pilas_buscar_tour_completed_${currentUser.id}`);
                localStorage.removeItem(`pilas_solicitar_tour_completed_${currentUser.id}`);
            }
            setActiveTour('welcome');
            setCurrentStep(0);
            if (location.pathname !== '/') {
                navigate('/');
            }
        };
        window.addEventListener('startGuidedTour', handleStartTour);
        return () => window.removeEventListener('startGuidedTour', handleStartTour);
    }, [location.pathname, navigate, currentUser.id]);

    // Detectar si el modal se abre en el perfil para avanzar al paso del formulario
    useEffect(() => {
        if (activeTour === 'solicitar' && currentStep === 2) {
            const checkModal = setInterval(() => {
                const modal = document.querySelector('#tour-agendar-formulario');
                if (modal) {
                    setCurrentStep(3);
                    clearInterval(checkModal);
                }
            }, 300);
            return () => clearInterval(checkModal);
        }
    }, [activeTour, currentStep]);

    // Recalcular las coordenadas del spotlight cuando cambia el paso o se redimensiona la pantalla
    useEffect(() => {
        if (!activeTour) {
            setTargetRect(null);
            return;
        }

        const steps = TOURS[activeTour];
        const step = steps[currentStep];
        if (!step) return;

        updateSpotlight(step.targetSelector);

        // Listener de redimensión y scroll
        const handleResize = () => updateSpotlight(step.targetSelector);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize);
        };
    }, [activeTour, currentStep]);

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

    if (!activeTour) return null;

    const steps = TOURS[activeTour];
    const step = steps[currentStep];
    if (!step) return null;

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (activeTour === 'solicitar' && currentStep === 2) {
            // Clic programático en el botón "Pactar Tutoría" para abrir modal y gatillar avance
            const pactarBtn = document.querySelector('#tour-boton-pactar');
            if (pactarBtn) {
                pactarBtn.click();
            }
            return;
        }

        if (isLastStep) {
            handleComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            // Prevenir regreso antes del formulario si ya está el modal abierto
            if (activeTour === 'solicitar' && currentStep === 3) {
                // Cerrar modal programáticamente si vuelve a step 2
                const closeBtn = document.querySelector('#tour-agendar-formulario')?.parentElement?.querySelector('button');
                if (closeBtn) closeBtn.click();
            }
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        if (currentUser.id && activeTour) {
            const key = activeTour === 'welcome' 
                ? `pilas_tour_completed_${currentUser.id}` 
                : `pilas_${activeTour}_tour_completed_${currentUser.id}`;
            localStorage.setItem(key, 'true');
        }
        setActiveTour(null);
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
        const cardHeight = 260; // altura aproximada
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
                style={getCardStyle()}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-6 pointer-events-auto select-text animate-in zoom-in duration-300 flex flex-col justify-between"
            >
                <div>
                    {/* Encabezado y Progreso */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="bg-pilas-gold/10 text-pilas-gold text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            Paso {currentStep + 1} de {steps.length}
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
                            {isLastStep ? "Finalizar" : activeTour === 'solicitar' && currentStep === 2 ? "Abrir Formulario" : "Siguiente"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuidedTour;
