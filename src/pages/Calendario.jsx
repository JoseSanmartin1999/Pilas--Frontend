import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import config from '../config/constants.json';

const Calendario = () => {
    const { showNotification } = useNotification();
    const [mentorships, setMentorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    // Nombres de meses y días en español desde archivo de configuración
    const MESES = config.MONTHS;
    const DIAS_SEMANA = config.WEEKDAYS;

    const fetchMentorships = useCallback(async () => {
        try {
            const res = await axios.get(`${config.API_URL}/api/mentorships/user/${currentUser.id}`);
            // Filtrar solo las aceptadas
            const aceptadas = res.data.filter(m => m.status === 'ACEPTADA');
            setMentorships(aceptadas);
        } catch (err) {
            console.error("Error al obtener tutorías:", err);
            showNotification("No se pudieron cargar las tutorías", "error");
        } finally {
            setLoading(false);
        }
    }, [currentUser.id, showNotification]);

    useEffect(() => {
        if (currentUser.id) {
            fetchMentorships();
        } else {
            setLoading(false);
        }
    }, [currentUser.id, fetchMentorships]);

    // Funciones de navegación de meses
    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Lógica para construir la cuadrícula del calendario mensual
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primer día del mes (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
    const firstDayIndexRaw = new Date(year, month, 1).getDay();
    // Ajustar para que Lunes sea el primer día de la semana (Lunes = 0, Domingo = 6)
    const firstDayIndex = firstDayIndexRaw === 0 ? 6 : firstDayIndexRaw - 1;

    // Número total de días en el mes actual
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Días del mes anterior para rellenar el inicio de la cuadrícula
    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    const prevMonthPadding = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        prevMonthPadding.push({
            day: prevMonthDaysCount - i,
            isCurrentMonth: false,
            date: new Date(year, month - 1, prevMonthDaysCount - i)
        });
    }

    // Días del mes actual
    const currentMonthDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
        currentMonthDays.push({
            day: d,
            isCurrentMonth: true,
            date: new Date(year, month, d)
        });
    }

    // Días del mes siguiente para completar la cuadrícula (en bloques de 7 días, total 42 celdas)
    const totalCells = 42;
    const nextMonthPaddingCount = totalCells - (prevMonthPadding.length + currentMonthDays.length);
    const nextMonthPadding = [];
    for (let d = 1; d <= nextMonthPaddingCount; d++) {
        nextMonthPadding.push({
            day: d,
            isCurrentMonth: false,
            date: new Date(year, month + 1, d)
        });
    }

    // Todos los días combinados en la cuadrícula de 6 filas (42 días)
    const allDays = [...prevMonthPadding, ...currentMonthDays, ...nextMonthPadding];

    // Helper para verificar si dos fechas coinciden en año, mes y día
    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    };

    // Helper para obtener tutorías de un día específico
    const getMentorshipsForDay = (date) => {
        return mentorships.filter(m => {
            const mDate = new Date(m.scheduled_date);
            return isSameDay(mDate, date);
        });
    };

    // Formatear hora (de ISO 8601 a hh:mm AM/PM)
    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 debe ser 12
        return `${hours}:${minutes} ${ampm}`;
    };

    // Copiar al portapapeles y notificar
    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        showNotification(`¡${label} copiado al portapapeles!`, "success");
    };

    const selectedDayMentorships = getMentorshipsForDay(selectedDate);
    const today = new Date();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-pilas-blue"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Cargando tu agenda de tutorías...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Superior */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                            <span>📅</span> Calendario de Tutorías
                        </h1>
                        <p className="text-gray-500 mt-2 text-sm md:text-base">
                            Organiza y planifica tus tutorías aceptadas de forma sencilla y eficiente.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 self-stretch md:self-auto justify-between">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2.5 rounded-xl hover:bg-slate-50 text-gray-600 active:scale-95 transition-all"
                            title="Mes Anterior"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <span className="font-bold text-slate-700 px-4 text-base min-w-[140px] text-center">
                            {MESES[month]} {year}
                        </span>

                        <button
                            onClick={handleNextMonth}
                            className="p-2.5 rounded-xl hover:bg-slate-50 text-gray-600 active:scale-95 transition-all"
                            title="Mes Siguiente"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <button
                        onClick={handleToday}
                        className="bg-pilas-blue hover:bg-[#0a4624] text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-md shadow-[#0f592f]/10 active:scale-95 text-sm self-stretch md:self-auto"
                    >
                        Hoy
                    </button>
                </div>

                {/* Grid del Calendario y Detalle */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Sección Calendario */}
                    <div className="lg:col-span-8 bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-100/50 border border-gray-100/80">
                        {/* Cabecera de días de la semana */}
                        <div className="grid grid-cols-7 text-center mb-4">
                            {DIAS_SEMANA.map((dia, idx) => (
                                <span key={idx} className="text-sm font-bold text-gray-400 py-2">
                                    {dia}
                                </span>
                            ))}
                        </div>

                        {/* Cuadrícula de días */}
                        <div className="grid grid-cols-7 gap-2 sm:gap-3">
                            {allDays.map((cell, idx) => {
                                const dayTutorias = getMentorshipsForDay(cell.date);
                                const hasTutorias = dayTutorias.length > 0;
                                const isSelected = isSameDay(cell.date, selectedDate);
                                const isToday = isSameDay(cell.date, today);

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(cell.date)}
                                        className={`relative aspect-square sm:p-2 rounded-2xl flex flex-col justify-between items-center transition-all border outline-none active:scale-95 group ${
                                            !cell.isCurrentMonth
                                                ? 'text-gray-300 border-transparent hover:bg-slate-50/50'
                                                : isSelected
                                                ? 'bg-pilas-blue text-white border-pilas-blue shadow-lg shadow-[#0f592f]/10 font-bold scale-[1.03]'
                                                : isToday
                                                ? 'border-pilas-blue text-pilas-blue bg-[#0f592f]/5 font-bold'
                                                : 'bg-white text-slate-700 border-gray-100 hover:border-gray-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {/* Número del día */}
                                        <span className="text-sm sm:text-base font-semibold mt-1">
                                            {cell.day}
                                        </span>

                                        {/* Indicador de Tutorías Aceptadas */}
                                        {hasTutorias && (
                                            <div className="flex gap-1 mb-1 justify-center items-center">
                                                {dayTutorias.slice(0, 3).map((_, tIdx) => (
                                                    <span
                                                        key={tIdx}
                                                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                                            isSelected ? 'bg-white' : 'bg-pilas-gold'
                                                        } animate-pulse`}
                                                    ></span>
                                                ))}
                                                {dayTutorias.length > 3 && (
                                                    <span className={`text-[8px] font-bold ${
                                                        isSelected ? 'text-white' : 'text-pilas-gold'
                                                    }`}>
                                                        +{dayTutorias.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sección Detalle de Planificación */}
                    <div className="lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-100/50 border border-gray-100/80 min-h-[400px] flex flex-col">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span>📋</span> Detalle de Planificación
                            </h2>
                            <p className="text-gray-400 text-xs mt-1 font-medium">
                                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>

                        {selectedDayMentorships.length === 0 ? (
                            <div className="flex-grow flex flex-col justify-center items-center text-center p-8">
                                <div className="text-5xl mb-4 grayscale opacity-60">🏖️</div>
                                <h3 className="font-bold text-slate-700 text-base">Día Libre</h3>
                                <p className="text-gray-400 text-xs mt-1.5 max-w-[240px]">
                                    No tienes tutorías aceptadas programadas para este día. ¡Buen momento para descansar!
                                </p>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-1">
                                {selectedDayMentorships.map((tutoria) => {
                                    const isMentor = String(currentUser.id) === String(tutoria.mentor_id);
                                    const partnerName = isMentor ? tutoria.apprentice_name : tutoria.mentor_name;
                                    const roleLabel = isMentor ? 'Aprendiz' : 'Mentor';

                                    return (
                                        <div
                                            key={tutoria.id}
                                            className="bg-slate-50/50 rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-all flex flex-col gap-3 relative overflow-hidden"
                                        >
                                            {/* Decoración lateral */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pilas-gold"></div>

                                            {/* Hora y Tema */}
                                            <div className="flex justify-between items-start pl-2">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-base leading-tight">
                                                        {tutoria.subject_name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
                                                        <span>👤</span> {roleLabel}: <span className="text-slate-700 font-semibold">{partnerName}</span>
                                                    </p>
                                                </div>
                                                <span className="bg-pilas-blue/10 text-pilas-blue font-bold text-xs px-2.5 py-1 rounded-xl">
                                                    {formatTime(tutoria.scheduled_date)}
                                                </span>
                                            </div>

                                            {/* Objetivos */}
                                            {tutoria.objectives && (
                                                <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs text-gray-600 pl-2">
                                                    <strong className="text-slate-700 font-bold block mb-1">🎯 Objetivos:</strong>
                                                    {tutoria.objectives}
                                                </div>
                                            )}

                                            {/* Modalidad y Enlaces */}
                                            <div className="pl-2">
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                                                        <span>📍</span> Modalidad:
                                                        <span className={`px-2 py-0.5 rounded-full font-extrabold ${
                                                            tutoria.modality === 'Online' 
                                                                ? 'bg-sky-550/10 text-sky-600 bg-sky-50' 
                                                                : 'bg-emerald-550/10 text-emerald-600 bg-emerald-50'
                                                        }`}>
                                                            {tutoria.modality}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                                                        <span>⏳</span> Duración:
                                                        <span className="px-2 py-0.5 rounded-full font-extrabold bg-amber-50 text-amber-600 border border-amber-200/30">
                                                            {tutoria.estimated_duration || '1 hora'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {tutoria.modality === 'Online' ? (
                                                    <div className="flex flex-col gap-2 bg-sky-50/40 p-2.5 rounded-xl border border-sky-100/50">
                                                        <div className="flex items-center justify-between text-xs text-slate-600">
                                                            <span>Plataforma: <strong className="text-slate-800">{tutoria.platform || 'Virtual'}</strong></span>
                                                        </div>
                                                        {tutoria.meeting_link && (
                                                            <a
                                                                href={tutoria.meeting_link.startsWith('http') ? tutoria.meeting_link : `https://${tutoria.meeting_link}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2 px-3 rounded-lg text-center transition-colors shadow-sm inline-block"
                                                            >
                                                                🚀 Unirse a Reunión
                                                            </a>
                                                        )}
                                                        {tutoria.zoom_code && (
                                                            <div className="flex justify-between items-center text-xs border-t border-sky-100/50 pt-2 mt-1">
                                                                <span className="text-gray-500">ID de Reunión:</span>
                                                                <button
                                                                    onClick={() => copyToClipboard(tutoria.zoom_code, "ID de Zoom")}
                                                                    className="font-bold text-sky-600 hover:text-sky-700 underline flex items-center gap-1"
                                                                >
                                                                    {tutoria.zoom_code} 📋
                                                                </button>
                                                            </div>
                                                        )}
                                                        {tutoria.zoom_password && (
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-500">Código de Acceso:</span>
                                                                <button
                                                                    onClick={() => copyToClipboard(tutoria.zoom_password, "Contraseña")}
                                                                    className="font-bold text-sky-600 hover:text-sky-700 underline flex items-center gap-1"
                                                                >
                                                                    {tutoria.zoom_password} 📋
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/50 text-xs">
                                                        <span className="text-gray-500 block mb-1">Lugar de Encuentro:</span>
                                                        <strong className="text-slate-800 block pl-1 bg-white p-1.5 rounded-lg border border-gray-100">
                                                            {tutoria.meeting_place || "No especificado"}
                                                        </strong>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendario;
