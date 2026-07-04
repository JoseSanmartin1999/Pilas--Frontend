import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const Mensajes = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [responses, setResponses] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isReprogramming, setIsReprogramming] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [reprogramReason, setReprogramReason] = useState('');
    const [isUpdatingLink, setIsUpdatingLink] = useState(false);
    const [linkData, setLinkData] = useState({ meeting_link: '', zoom_code: '', zoom_password: '' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, targetId: null, isBulk: false });

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const isSystemMessage = selectedMessage && selectedMessage.subject_name === 'Pilas! Comunidad';
    const isWelcome = selectedMessage && selectedMessage.objectives.includes('Bienvenido');

    const fetchResponses = useCallback(async () => {
        try {
            const res = await axios.get(`https://pilas-backend.onrender.com/api/mentorships/user/${currentUser.id}`);
            // Show all mentorships where user is involved. 
            // - Apprentice shows everything (notifications)
            // - Mentor shows processed ones (history)
            const myResponses = res.data.filter(m => 
                (m.apprentice_id === currentUser.id) || 
                (m.mentor_id === currentUser.id && m.status !== 'PENDIENTE')
            );
            setResponses(myResponses);
        } catch (err) {
            console.error("Error fetching responses:", err);
        } finally {
            setLoading(false);
        }
    }, [currentUser.id]);

    useEffect(() => {
        if (currentUser.id) {
            fetchResponses();
        } else {
            setLoading(false);
        }
    }, [currentUser.id, fetchResponses]);

    const handleAction = async (id, status, extraData = {}) => {
        try {
            const payload = { status, ...extraData };
            await axios.put(`https://pilas-backend.onrender.com/api/mentorships/${id}`, payload);
            showNotification(`Tutoría ${status === 'ACEPTADA' ? 'aceptada' : status === 'RECHAZADA' ? 'declinada' : 'reprogramada'} con éxito`, "success");
            setSelectedMessage(null);
            setIsReprogramming(false);
            fetchResponses();
        } catch {
            showNotification("Error al procesar la acción", "error");
        }
    };

    const handleUpdateLink = async () => {
        try {
            await axios.put(`https://pilas-backend.onrender.com/api/mentorships/${selectedMessage.id}`, linkData);
            showNotification("Link de reunión actualizado con éxito", "success");
            setIsUpdatingLink(false);
            fetchResponses();
            // Notificar al Navbar por si acaso
            window.dispatchEvent(new CustomEvent('updateNotificationCounts'));
        } catch {
            showNotification("Error al actualizar el enlace", "error");
        }
    };

    const handleSelectMessage = async (msg) => {
        setSelectedMessage(msg);
        setIsReprogramming(false);
        setIsUpdatingLink(false);
        setLinkData({ 
            meeting_link: msg.meeting_link || '', 
            zoom_code: msg.zoom_code || '', 
            zoom_password: msg.zoom_password || '' 
        });
        if (msg.apprentice_notified === 0) {
            try {
                await axios.patch(`https://pilas-backend.onrender.com/api/mentorships/${msg.id}/read`);
                setResponses(responses.map(r => r.id === msg.id ? { ...r, apprentice_notified: 1 } : r));
                // Disparar evento para actualizar el contador en el Navbar al instante
                window.dispatchEvent(new CustomEvent('updateNotificationCounts'));
            } catch (err) {
                console.error("Error marking as read:", err);
            }
        }
    };
 
    const handleDeleteMessage = (e, id) => {
        e.stopPropagation(); // Evitar seleccionar el mensaje al borrar
        setConfirmDeleteModal({ isOpen: true, targetId: id, isBulk: false });
    };

    const handleConfirmDelete = async () => {
        try {
            if (confirmDeleteModal.isBulk) {
                // Eliminación en masa
                await Promise.all(
                    selectedIds.map(id => axios.delete(`https://pilas-backend.onrender.com/api/mentorships/${id}`))
                );
                showNotification(`Se eliminaron ${selectedIds.length} mensajes con éxito`, "success");
                setResponses(responses.filter(r => !selectedIds.includes(r.id)));
                if (selectedMessage && selectedIds.includes(selectedMessage.id)) {
                    setSelectedMessage(null);
                }
                setSelectedIds([]);
            } else {
                // Eliminación individual
                const id = confirmDeleteModal.targetId;
                await axios.delete(`https://pilas-backend.onrender.com/api/mentorships/${id}`);
                showNotification("Mensaje eliminado con éxito", "success");
                setResponses(responses.filter(r => r.id !== id));
                if (selectedMessage?.id === id) {
                    setSelectedMessage(null);
                }
                setSelectedIds(selectedIds.filter(x => x !== id));
            }
            setConfirmDeleteModal({ isOpen: false, targetId: null, isBulk: false });
            // Actualizar contadores globales en el Navbar
            window.dispatchEvent(new CustomEvent('updateNotificationCounts'));
        } catch (err) {
            console.error("Error al eliminar:", err);
            showNotification("No se pudieron eliminar los mensajes", "error");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACEPTADA': return 'bg-green-100 text-green-700 border-green-200';
            case 'RECHAZADA': return 'bg-red-100 text-red-700 border-red-200';
            case 'PENDIENTE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0f592f]"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50 font-sans">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-[#0f592f] tracking-tight">Bandeja de Entrada</h1>
                <p className="text-gray-500 font-medium">Respuestas y actualizaciones de tus tutores</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-[2.5rem] shadow-xl overflow-hidden min-h-[600px] border border-gray-100 text-left">
                
                {/* LISTA DE EMAILS (4/12) */}
                <div className={`lg:col-span-4 border-r border-gray-50 overflow-y-auto max-h-[600px] ${selectedMessage ? 'hidden lg:block' : 'block'}`}>
                    <div className="p-4 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
                        <span className="uppercase text-[9px] font-black tracking-widest text-gray-400">
                            {selectedIds.length > 0 ? `${selectedIds.length} Seleccionados` : 'Recientes'}
                        </span>
                        {responses.length > 0 && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        if (selectedIds.length === responses.length) {
                                            setSelectedIds([]);
                                        } else {
                                            setSelectedIds(responses.map(r => r.id));
                                        }
                                    }}
                                    className="text-[9px] font-black text-[#0f592f] hover:text-[#ffcc00] uppercase tracking-tighter cursor-pointer"
                                >
                                    {selectedIds.length === responses.length ? 'Desmarcar' : 'Todos'}
                                </button>
                                {selectedIds.length > 0 && (
                                    <button 
                                        onClick={() => setConfirmDeleteModal({ isOpen: true, targetId: null, isBulk: true })}
                                        className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-tighter flex items-center gap-0.5 cursor-pointer"
                                    >
                                        <span>🗑️</span> Borrar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    {responses.length > 0 ? (
                        responses.map((r) => (
                            <div 
                                key={r.id}
                                onClick={() => handleSelectMessage(r)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectMessage(r); }}
                                role="button"
                                tabIndex={0}
                                className={`w-full text-left p-6 border-b border-gray-50 transition-all hover:bg-pilas-gold/5 flex flex-col gap-2 cursor-pointer outline-none ${selectedMessage?.id === r.id ? 'bg-pilas-gold/10 border-l-4 border-l-pilas-gold' : 'bg-white'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox"
                                            checked={selectedIds.includes(r.id)}
                                            onClick={(e) => e.stopPropagation()} // Evitar seleccionar el mensaje al marcar el checkbox
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(prev => [...prev, r.id]);
                                                } else {
                                                    setSelectedIds(prev => prev.filter(id => id !== r.id));
                                                }
                                            }}
                                            className="w-4 h-4 rounded text-[#0f592f] focus:ring-[#ffcc00] border-gray-300 cursor-pointer mr-1"
                                        />
                                        <span className="font-bold text-[#0f592f] truncate max-w-[120px]">{r.mentor_name}</span>
                                        {r.apprentice_notified === 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400">{new Date(r.scheduled_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="text-sm font-semibold text-gray-700">Respuesta: {r.subject_name}</div>
                                    <button 
                                        onClick={(e) => handleDeleteMessage(e, r.id)}
                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group-hover:opacity-100"
                                        title="Eliminar mensaje"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className={`text-[9px] font-black px-2 py-0.5 rounded-full border self-start uppercase tracking-tighter ${getStatusStyle(r.status)}`}>
                                    {r.status}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-gray-400 italic text-sm">No tienes mensajes.</div>
                    )}
                </div>

                {/* DETALLE DEL EMAIL (8/12) */}
                <div className={`lg:col-span-8 p-6 md:p-12 flex flex-col ${selectedMessage ? 'block' : 'hidden lg:flex'}`}>
                    {selectedMessage ? (
                        <div className="animate-in fade-in slide-in-from-right duration-300">
                            {/* Botón de Volver a la Lista en Móviles */}
                            <button 
                                onClick={() => setSelectedMessage(null)}
                                className="lg:hidden mb-6 flex items-center gap-2 text-xs font-black text-[#0f592f] hover:text-[#ffcc00] uppercase tracking-widest cursor-pointer"
                            >
                                ← Volver a la lista
                            </button>
                            <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-[#0f592f] rounded-2xl flex items-center justify-center text-white text-xl font-black">
                                        {isSystemMessage ? '📢' : selectedMessage.mentor_name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-[#0f592f]">
                                            {isSystemMessage ? 'Pilas! Comunidad' : selectedMessage.mentor_name}
                                        </h2>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            {isSystemMessage ? 'Mensaje Oficial de la Plataforma' : `Tutor de ${selectedMessage.subject_name}`}
                                        </p>
                                    </div>
                                </div>
                                {!isSystemMessage && (
                                    <div className={`px-4 py-2 rounded-xl text-xs font-black border uppercase tracking-widest shadow-sm ${getStatusStyle(selectedMessage.status)}`}>
                                        {selectedMessage.status}
                                    </div>
                                )}
                            </div>

                            {isSystemMessage ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
                                    {isWelcome ? (
                                        <div className="bg-gradient-to-br from-[#0f592f]/5 to-[#0f592f]/10 rounded-[2.5rem] p-8 border border-[#0f592f]/20 shadow-sm space-y-6">
                                            <div className="flex flex-col items-center text-center space-y-4">
                                                <div className="w-20 h-20 bg-gradient-to-tr from-[#0f592f] to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl shadow-lg shadow-[#0f592f]/10 animate-bounce">
                                                    🎉
                                                </div>
                                                <h3 className="text-2xl font-black text-[#0f592f]">¡Bienvenido a Pilas!</h3>
                                                <p className="text-sm font-semibold text-gray-500 max-w-md">
                                                    Estamos muy contentos de que te unas a nuestra comunidad de aprendizaje cooperativo en la ESPE.
                                                </p>
                                            </div>

                                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm leading-relaxed text-gray-600 text-sm font-medium">
                                                <p className="mb-4">Hola <span className="font-bold text-[#0f592f]">{currentUser.full_name}</span>,</p>
                                                <p className="mb-4">
                                                    Pilas! es un espacio diseñado para ayudar a consolidar tus conocimientos a través de tutorías entre pares o compartiendo tus habilidades como tutor con otros estudiantes.
                                                </p>
                                                <p className="mb-4">
                                                    Para comenzar con el pie derecho, te recomendamos realizar las siguientes actividades:
                                                </p>
                                                <ul className="space-y-2.5 pl-2 mb-4">
                                                    <li className="flex items-center gap-2 text-[#0f592f]">
                                                        <span className="text-emerald-500 font-bold">✓</span> Completar los datos de tu perfil.
                                                    </li>
                                                    <li className="flex items-center gap-2 text-[#0f592f]">
                                                        <span className="text-emerald-500 font-bold">✓</span> Participar o crear tu primera sesión de tutoría.
                                                    </li>
                                                    <li className="flex items-center gap-2 text-[#0f592f]">
                                                        <span className="text-emerald-500 font-bold">✓</span> ¡Revisar la tienda de beneficios para canjear tus ESPE-Coins!
                                                    </li>
                                                </ul>
                                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                                                    💡 <strong>Tip:</strong> Al configurar tu perfil completo y participar en tutorías, recibirás monedas ESPE-Coins automáticas.
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                                <button 
                                                    onClick={() => navigate('/profile')}
                                                    className="flex-1 py-4 bg-[#0f592f] text-[#ffcc00] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#0a4624] transition-all cursor-pointer"
                                                >
                                                    ⚙️ Ir a Mi Perfil
                                                </button>
                                                <button 
                                                    onClick={() => navigate('/buscar')}
                                                    className="flex-1 py-4 bg-white border-2 border-[#0f592f] text-[#0f592f] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0f592f]/5 transition-all shadow-md cursor-pointer"
                                                >
                                                    🔍 Buscar Tutorías
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-[2.5rem] p-8 border border-amber-500/20 shadow-sm space-y-6">
                                            <div className="flex flex-col items-center text-center space-y-4">
                                                <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-white text-4xl shadow-lg shadow-amber-500/10">
                                                    🎓
                                                </div>
                                                <h3 className="text-2xl font-black text-amber-950">Encuesta Importante de Tesis</h3>
                                                <p className="text-sm font-semibold text-amber-800 max-w-md">
                                                    Tu opinión es de vital importancia para recopilar datos estadísticos para mi tesis de grado.
                                                </p>
                                            </div>

                                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm leading-relaxed text-gray-600 text-sm font-medium">
                                                <p className="mb-4">Estimado/a <span className="font-bold text-[#0f592f]">{currentUser.full_name}</span>,</p>
                                                <p className="mb-4">
                                                    Estoy llevando a cabo una investigación científica para evaluar el impacto de las tutorías de pares en el rendimiento académico. Te pido de favor que nos apoyes llenando este breve formulario.
                                                </p>
                                                <p className="mb-4 font-bold text-gray-800">
                                                    ¿Por qué es importante llenar la encuesta?
                                                </p>
                                                <ul className="space-y-2.5 pl-2 mb-4">
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-amber-500 font-bold">📌</span>
                                                        <span><strong>Tesis de Grado:</strong> Los resultados serán publicados y analizados directamente en mi proyecto de tesis final.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-amber-500 font-bold">📌</span>
                                                        <span><strong>Sorteo Especial:</strong> Completar la encuesta es un requisito mandatorio para desbloquear el ticket del Sorteo del Kit Gamer o Tarjeta de Steam.</span>
                                                    </li>
                                                </ul>
                                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs font-semibold">
                                                    ⚠️ Al terminar la encuesta, regresa a la sección de "Recompensas" en el menú superior para poder canjear tu participación en el sorteo.
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4 pt-2">
                                                <a 
                                                    href="https://forms.gle/1pB1RJS9B9b6ASMD7"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-amber-500/20 hover:scale-[1.01] transition-all cursor-pointer text-center"
                                                >
                                                    📝 Llenar Encuesta de Tesis
                                                </a>
                                                <button 
                                                    onClick={() => navigate('/recompensas')}
                                                    className="w-full py-4 bg-white border-2 border-amber-500 text-amber-750 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-50 transition-all shadow-md cursor-pointer"
                                                >
                                                    🎁 Ir a la Tienda de Recompensas
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <h3 className="text-2xl font-black text-[#0f592f] leading-tight">
                                        Actualización sobre tu solicitud de tutoría para <span className="text-pilas-gold">{selectedMessage.subject_name}</span>
                                    </h3>

                                    <div className="bg-gray-50/80 rounded-3xl p-8 border border-gray-100/50 shadow-inner leading-relaxed text-gray-600 font-medium">
                                        <p className="mb-4">Hola <span className="font-bold text-[#0f592f]">{currentUser.full_name}</span>,</p>
                                        {selectedMessage.status === 'PENDIENTE' && (
                                            <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                                                <p className="text-yellow-800 text-sm font-bold flex items-center gap-2">
                                                    <span className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                    Propuesta pendiente de revisión
                                                </p>
                                            </div>
                                        )}
                                        {selectedMessage.status === 'CANCELADA' && (
                                            <div className="mt-4 p-5 bg-red-50 rounded-2xl border border-red-100 text-left space-y-3">
                                                <p className="text-red-800 text-sm font-bold flex items-center gap-2">
                                                    <span>⚠️</span> Tutoría Cancelada
                                                </p>
                                                <div className="bg-white/60 p-4 rounded-xl border border-red-200">
                                                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1.5">
                                                        Motivo de la Cancelación:
                                                    </p>
                                                    <p className="text-xs font-semibold text-gray-700 italic">
                                                        "{selectedMessage.reprogramming_reason || 'Falta de acuerdo tras varios intentos o cancelada por el tutor.'}"
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedMessage.status === 'ACEPTADA' && (
                                            <p className="mt-4 text-green-600 font-bold">
                                                ¡Felicidades! Tu tutoría ha sido confirmada para la fecha y hora seleccionada.
                                            </p>
                                        )}
                                        {selectedMessage.status === 'RECHAZADA' && (
                                            <p className="mt-4 text-red-600 font-bold">
                                                Lo sentimos, en esta ocasión el tutor no podrá atender tu solicitud.
                                            </p>
                                        )}
                                    </div>

                                    {selectedMessage.status === 'PENDIENTE' && selectedMessage.last_initiator_role === 'MENTOR' && (
                                        <div className="animate-in zoom-in duration-300">
                                            <div className="bg-pilas-gold/10 rounded-[2.5rem] p-8 border-2 border-pilas-gold/30 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-pilas-gold rounded-full flex items-center justify-center text-white text-xl">💡</div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-[#0f592f] uppercase tracking-wider">El Mentor propone un cambio</h4>
                                                        <p className="text-xs font-bold text-pilas-gold italic">Intento {selectedMessage.reprogramming_count} de 2</p>
                                                    </div>
                                                </div>

                                                {selectedMessage.reprogramming_reason && (
                                                    <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-pilas-gold/20">
                                                        <p className="text-[10px] font-black text-pilas-gold uppercase tracking-widest mb-2">Motivo indicado:</p>
                                                        <p className="text-sm font-medium text-gray-700 italic">"{selectedMessage.reprogramming_reason}"</p>
                                                    </div>
                                                )}

                                                {!isReprogramming ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                                        <button 
                                                            onClick={() => handleAction(selectedMessage.id, 'ACEPTADA')}
                                                            className="py-4 bg-[#0f592f] text-[#ffcc00] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#0a4624] transition-all"
                                                        >
                                                            Aceptar Cambio
                                                        </button>
                                                        <button 
                                                            onClick={() => setIsReprogramming(true)}
                                                            className="py-4 bg-white border-2 border-pilas-gold text-[#0f592f] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pilas-gold hover:text-white transition-all shadow-md"
                                                        >
                                                            Reprogramar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(selectedMessage.id, 'RECHAZADA')}
                                                            className="py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all font-bold"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4 animate-in slide-in-from-top duration-300">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <input 
                                                                type="date" 
                                                                min={new Date().toLocaleDateString('sv-SE')}
                                                                className="px-5 py-3 bg-white rounded-2xl focus:ring-2 focus:ring-pilas-gold outline-none font-bold text-[#0f592f] border border-pilas-gold/20"
                                                                onChange={(e) => setNewDate(e.target.value)}
                                                            />
                                                            <input 
                                                                type="time" 
                                                                className="px-5 py-3 bg-white rounded-2xl focus:ring-2 focus:ring-pilas-gold outline-none font-bold text-[#0f592f] border border-pilas-gold/20"
                                                                onChange={(e) => setNewTime(e.target.value)}
                                                            />
                                                        </div>
                                                        <textarea 
                                                            className="w-full px-5 py-3 bg-white rounded-2xl focus:ring-2 focus:ring-pilas-gold outline-none font-medium text-gray-600 text-sm border border-pilas-gold/20 resize-none"
                                                            rows="3"
                                                            placeholder="Explica por qué propones este cambio..."
                                                            onChange={(e) => setReprogramReason(e.target.value)}
                                                        ></textarea>
                                                        <div className="flex gap-4">
                                                            <button 
                                                                onClick={() => {
                                                                    if (!newDate || !newTime || !reprogramReason.trim()) {
                                                                        return showNotification("Por favor completa todos los campos", "warning");
                                                                    }
                                                                    
                                                                    const now = new Date();
                                                                    const [year, month, day] = newDate.split('-').map(Number);
                                                                    const [hour, minute] = newTime.split(':').map(Number);
                                                                    const selectedDateTime = new Date(year, month - 1, day, hour, minute);
                                                                    if (selectedDateTime < now) {
                                                                        return showNotification("La fecha y hora para reprogramar no pueden ser anteriores a la actual", "warning");
                                                                    }

                                                                    handleAction(selectedMessage.id, 'PENDIENTE', {
                                                                        scheduled_date: `${newDate}T${newTime}:00`,
                                                                        reprogramming_reason: reprogramReason,
                                                                        last_initiator_role: 'APRENDIZ'
                                                                    });
                                                                }}
                                                                className="flex-1 bg-pilas-gold text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-yellow-600 transition-all"
                                                            >
                                                                Enviar Contra-propuesta
                                                            </button>
                                                            <button 
                                                                onClick={() => setIsReprogramming(false)}
                                                                className="px-6 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">📅</div>
                                            <div className="text-left">
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Fecha de Sesión</div>
                                                <div className="text-base font-black text-[#0f592f]">{new Date(selectedMessage.scheduled_date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">⏰</div>
                                            <div className="text-left">
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Hora de Sesión</div>
                                                <div className="text-base font-black text-[#0f592f]">{new Date(selectedMessage.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* NUEVA SECCIÓN: DETALLES DE MODALIDAD */}
                                    <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <span className="text-6xl">{selectedMessage.modality === 'Presencial' ? '📍' : '💻'}</span>
                                        </div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-pilas-gold rounded-full"></span>
                                            Detalles de la Cita
                                        </h4>
                                        
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modalidad</span>
                                                <span className="bg-gray-50 px-4 py-1.5 rounded-full text-xs font-black text-[#0f592f] border border-gray-100 uppercase tracking-tighter">
                                                    {selectedMessage.modality === 'Presencial' ? '📍 Presencial' : '💻 Online'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duración Estimada</span>
                                                <span className="bg-gray-50 px-4 py-1.5 rounded-full text-xs font-black text-[#0f592f] border border-gray-100 uppercase tracking-tighter">
                                                    ⏱️ {selectedMessage.estimated_duration || '1 hora'}
                                                </span>
                                            </div>

                                            {selectedMessage.modality === 'Presencial' && (
                                                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lugar de Reunión</span>
                                                    <span className="text-sm font-black text-[#0f592f]">{selectedMessage.meeting_place || 'Por confirmar'}</span>
                                                </div>
                                            )}

                                            {selectedMessage.modality === 'Online' && (
                                                <div className="space-y-4 border-t border-gray-50 pt-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Plataforma</span>
                                                        <span className="text-sm font-black text-[#0f592f]">{selectedMessage.platform}</span>
                                                    </div>

                                                    {selectedMessage.status === 'ACEPTADA' ? (
                                                        <div className="pt-4 space-y-4">
                                                            {!isUpdatingLink ? (
                                                                <>
                                                                    {selectedMessage.platform === 'Zoom' ? (
                                                                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                                                                            <div className="flex justify-between items-center text-xs">
                                                                                <span className="font-bold text-gray-400">ID de Reunión:</span>
                                                                                <span className="font-black text-[#0f592f]">{selectedMessage.zoom_code || 'No proporcionado'}</span>
                                                                            </div>
                                                                            {selectedMessage.zoom_password && (
                                                                                <div className="flex justify-between items-center text-xs">
                                                                                    <span className="font-bold text-gray-400">Contraseña:</span>
                                                                                    <span className="font-black text-[#0f592f]">{selectedMessage.zoom_password}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        selectedMessage.meeting_link ? (
                                                                            <a 
                                                                                href={selectedMessage.meeting_link.startsWith('http') ? selectedMessage.meeting_link : `https://${selectedMessage.meeting_link}`}
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center justify-center gap-3 w-full py-4 bg-[#0f592f] text-[#ffcc00] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-[#0f592f]/20 hover:scale-[1.02] transition-all"
                                                                            >
                                                                                <span>🚀 Unirse a la Reunión</span>
                                                                            </a>
                                                                        ) : (
                                                                            <div className="text-center p-4 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-2xl border border-yellow-100">
                                                                                El tutor aún no ha proporcionado el enlace.
                                                                            </div>
                                                                        )
                                                                    )}

                                                                    {currentUser.id === selectedMessage.mentor_id && (
                                                                        <button 
                                                                            onClick={() => setIsUpdatingLink(true)}
                                                                            className="w-full py-2 text-[10px] font-black text-pilas-gold uppercase tracking-widest hover:underline"
                                                                        >
                                                                            {selectedMessage.meeting_link || selectedMessage.zoom_code ? '✎ Editar Enlace' : '+ Agregar Enlace de Reunión'}
                                                                        </button>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="bg-gray-50 p-4 rounded-2xl border border-pilas-gold/20 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                                    {selectedMessage.platform === 'Zoom' ? (
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="ID Zoom"
                                                                                className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-pilas-gold font-bold text-[#0f592f]"
                                                                                value={linkData.zoom_code}
                                                                                onChange={(e) => setLinkData({...linkData, zoom_code: e.target.value})}
                                                                            />
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="Clave Zoom"
                                                                                className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-pilas-gold font-bold text-[#0f592f]"
                                                                                value={linkData.zoom_password}
                                                                                onChange={(e) => setLinkData({...linkData, zoom_password: e.target.value})}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <input 
                                                                            type="url" 
                                                                            placeholder="https://meet.google.com/..."
                                                                            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-pilas-gold font-bold text-[#0f592f]"
                                                                            value={linkData.meeting_link}
                                                                            onChange={(e) => setLinkData({...linkData, meeting_link: e.target.value})}
                                                                        />
                                                                    )}
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={handleUpdateLink}
                                                                            className="flex-1 py-2 bg-pilas-gold text-white text-[10px] font-black rounded-lg uppercase tracking-widest"
                                                                        >
                                                                            Guardar
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setIsUpdatingLink(false)}
                                                                            className="px-4 py-2 bg-gray-200 text-gray-500 text-[10px] font-black rounded-lg uppercase tracking-widest"
                                                                        >
                                                                            X
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center p-4 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-2xl border border-dashed border-gray-200 uppercase tracking-widest">
                                                            Los detalles de acceso aparecerán cuando se acepte la tutoría
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-8 bg-pilas-gold/5 rounded-[2rem] border border-pilas-gold/20">
                                        <h4 className="text-[10px] font-black text-pilas-gold uppercase tracking-widest mb-4">Temas solicitados</h4>
                                        <p className="text-sm font-bold text-gray-600 whitespace-pre-line leading-relaxed">
                                            {selectedMessage.objectives}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                            <div className="text-8-xl mb-6">📬</div>
                            <p className="text-xl font-bold uppercase tracking-widest text-[#0f592f]">Selecciona un mensaje para leerlo</p>
                        </div>
                    )}
                </div>
            </div>

            {/* CUSTOM CONFIRMATION MODAL */}
            {confirmDeleteModal.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0f592f]/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 overflow-hidden animate-in zoom-in duration-200 border border-gray-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 text-3xl mb-6 shadow-sm border border-rose-100/50">
                            🗑️
                        </div>
                        <h3 className="text-lg font-black text-[#0f592f] mb-2">¿Confirmar eliminación?</h3>
                        <p className="text-gray-500 font-medium text-xs leading-relaxed mb-6">
                            {confirmDeleteModal.isBulk
                                ? `¿Estás seguro de que deseas eliminar los ${selectedIds.length} mensajes seleccionados de tu bandeja de entrada? Esta acción no se puede deshacer.`
                                : "¿Estás seguro de que deseas eliminar este mensaje de tu bandeja de entrada? Esta acción no se puede deshacer."}
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setConfirmDeleteModal({ isOpen: false, targetId: null, isBulk: false })}
                                className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-gray-200/50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md hover:shadow-lg cursor-pointer"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mensajes;
