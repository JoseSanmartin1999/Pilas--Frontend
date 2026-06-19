import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const Solicitudes = () => {
    const { showNotification } = useNotification();
    const [mentorships, setMentorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reprogrammingId, setReprogrammingId] = useState(null);
    const [acceptingId, setAcceptingId] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [reprogramReason, setReprogramReason] = useState('');
    const [meetingData, setMeetingData] = useState({ meeting_link: '', zoom_code: '', zoom_password: '' });

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    const fetchMentorships = useCallback(async () => {
        try {
            // Fetching requests where current user is mentor
            const res = await axios.get(`https://pilas-backend.onrender.com/api/mentorships/user/${currentUser.id}`);
            // For this page, we only show ones where they are mentors AND status is PENDING
            const pendingRecieved = res.data.filter(m => m.mentor_id === currentUser.id && m.status === 'PENDIENTE');
            setMentorships(pendingRecieved);
        } catch (err) {
            console.error("Error fetching mentorships:", err);
        } finally {
            setLoading(false);
        }
    }, [currentUser.id]);

    useEffect(() => {
        if (currentUser.id) {
            fetchMentorships();
        } else {
            setLoading(false);
        }
    }, [currentUser.id, fetchMentorships]);

    const handleAction = async (id, status, extraData = {}) => {
        try {
            const payload = { status, ...extraData };
            
            await axios.put(`https://pilas-backend.onrender.com/api/mentorships/${id}`, payload);
            showNotification(`Tutoría ${status === 'ACEPTADA' ? 'aceptada' : status === 'RECHAZADA' ? 'declinada' : 'reprogramada'} con éxito`, "success");
            setReprogrammingId(null);
            setAcceptingId(null);
            setMeetingData({ meeting_link: '', zoom_code: '', zoom_password: '' });
            fetchMentorships();
        } catch {
            showNotification("Error al procesar la acción", "error");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3a5a]"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-10 min-h-screen bg-gray-50 font-sans">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-black text-[#1a3a5a] tracking-tight mb-2">Solicitudes Pendientes</h1>
                <p className="text-gray-500 font-medium">Gestiona las tutorías que te han solicitado los alumnos</p>
            </header>

            <div className="space-y-8">
                {mentorships.length > 0 ? (
                    mentorships.map((m) => {
                        const date = new Date(m.scheduled_date);
                        
                        return (
                            <div key={m.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10 transition-all hover:shadow-2xl hover:scale-[1.01] relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#ffcc00]"></div>
                                
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-[#1a3a5a] text-lg leading-relaxed">
                                                Hola Estimado Tutor <span className="font-black">({m.mentor_name})</span>
                                            </p>
                                            <p className="text-gray-600 text-lg leading-relaxed">
                                                Permíteme saludarte, soy <span className="font-black text-[#1a3a5a]">{m.apprentice_name}</span> y quisiera solicitarte una tutoría en la materia de <span className="text-[#ffcc00] font-black uppercase tracking-wider">{m.subject_name}</span> para tratar los siguientes temas:
                                            </p>
                                        </div>

                                        <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-100 shadow-inner">
                                            <ul className="space-y-2">
                                                {m.objectives.split('\n').map((line, i) => (
                                                    <li key={i} className="flex items-start text-gray-700 font-medium">
                                                        <span className="text-[#ffcc00] mr-3 font-bold">•</span>
                                                        {line}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-gray-600 italic">
                                            <p>
                                                Propuesto para el: <span className="font-bold text-[#1a3a5a]">{date.toLocaleDateString()}</span> a las <span className="font-bold text-[#1a3a5a]">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </p>
                                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg not-italic">
                                                <span className="text-xs font-black uppercase text-[#1a3a5a] tracking-tighter">Modalidad:</span>
                                                <span className="text-xs font-bold text-gray-700">
                                                    {m.modality === 'Presencial' ? `📍 Presencial (${m.meeting_place || 'TBD'})` : `💻 Online (${m.platform || 'TBD'})`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg not-italic">
                                                <span className="text-xs font-black uppercase text-[#1a3a5a] tracking-tighter">Duración:</span>
                                                <span className="text-xs font-bold text-gray-700">
                                                    ⏱️ {m.estimated_duration || '1 hora'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full md:w-56">
                                        <button 
                                            onClick={() => {
                                                if (m.modality === 'Presencial') {
                                                    handleAction(m.id, 'ACEPTADA');
                                                } else {
                                                    setAcceptingId(acceptingId === m.id ? null : m.id);
                                                    setReprogrammingId(null);
                                                }
                                            }}
                                            className="w-full py-4 bg-[#1a3a5a] text-[#ffcc00] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-[#1a3a5a]/20 hover:bg-[#112740] transition-all"
                                        >
                                            {m.modality === 'Presencial' ? 'Aceptar' : 'Configurar y Aceptar'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => setReprogrammingId(reprogrammingId === m.id ? null : m.id)}
                                            className="w-full py-4 bg-white border-2 border-[#ffcc00] text-[#1a3a5a] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#ffcc00] hover:text-white transition-all"
                                        >
                                            Reprogramar
                                        </button>

                                        <button 
                                            onClick={() => handleAction(m.id, 'RECHAZADA')}
                                            className="w-full py-4 bg-gray-50 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all"
                                        >
                                            Declinar
                                        </button>
                                    </div>
                                </div>

                                {reprogrammingId === m.id && (
                                    <div className="mt-8 pt-8 border-t border-dashed border-gray-200 animate-in slide-in-from-top duration-300 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nueva Fecha</label>
                                                <input 
                                                    type="date" 
                                                    min={new Date().toLocaleDateString('sv-SE')}
                                                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] border border-gray-100"
                                                    onChange={(e) => setNewDate(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nueva Hora</label>
                                                <input 
                                                    type="time" 
                                                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] border border-gray-100"
                                                    onChange={(e) => setNewTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Motivo de la Reprogramación</label>
                                            <textarea 
                                                className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-medium text-gray-600 text-sm border border-gray-100 resize-none"
                                                rows="3"
                                                placeholder="Explica brevemente por qué necesitas cambiar la fecha..."
                                                onChange={(e) => setReprogramReason(e.target.value)}
                                            ></textarea>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                if (!newDate || !newTime || !reprogramReason.trim()) return showNotification("Por favor completa todos los campos (fecha, hora y motivo)", "warning");
                                                
                                                const now = new Date();
                                                const [year, month, day] = newDate.split('-').map(Number);
                                                const [hour, minute] = newTime.split(':').map(Number);
                                                const selectedDateTime = new Date(year, month - 1, day, hour, minute);
                                                if (selectedDateTime < now) {
                                                    return showNotification("La fecha y hora para reprogramar no pueden ser anteriores a la actual", "warning");
                                                }

                                                handleAction(m.id, 'PENDIENTE', { 
                                                    scheduled_date: `${newDate}T${newTime}:00`,
                                                    reprogramming_reason: reprogramReason,
                                                    last_initiator_role: 'MENTOR',
                                                    ...(m.modality === 'Online' ? meetingData : {})
                                                });
                                            }}
                                            className="w-full bg-[#ffcc00] text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-yellow-500 transition-all shadow-md"
                                        >
                                            Enviar Propuesta de Reprogramación
                                        </button>

                                        {m.modality === 'Online' && (
                                            <div className="bg-white p-6 rounded-3xl border border-pilas-gold/20 space-y-4 animate-in fade-in duration-300">
                                                <h4 className="text-[10px] font-black text-pilas-gold uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-pilas-gold rounded-full"></span>
                                                    Datos de Reunión (Opcional en este paso)
                                                </h4>
                                                {(m.platform === 'Meet' || m.platform === 'Teams') && (
                                                    <div>
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Link de la Tutoría</label>
                                                        <input 
                                                            type="url" 
                                                            placeholder="https://meet.google.com/..."
                                                            className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] border border-gray-100"
                                                            value={meetingData.meeting_link}
                                                            onChange={(e) => setMeetingData({ ...meetingData, meeting_link: e.target.value })}
                                                        />
                                                    </div>
                                                )}
                                                {m.platform === 'Zoom' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Código Zoom</label>
                                                            <input 
                                                                type="text" 
                                                                className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] border border-gray-100"
                                                                value={meetingData.zoom_code}
                                                                onChange={(e) => setMeetingData({ ...meetingData, zoom_code: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Clave Zoom</label>
                                                            <input 
                                                                type="text" 
                                                                className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] border border-gray-100"
                                                                value={meetingData.zoom_password}
                                                                onChange={(e) => setMeetingData({ ...meetingData, zoom_password: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {acceptingId === m.id && (
                                    <div className="mt-8 pt-8 border-t border-dashed border-gray-200 animate-in slide-in-from-top duration-300">
                                        <h4 className="text-[10px] font-black text-[#1a3a5a] uppercase tracking-widest mb-4">Detalles de la Reunión ({m.platform})</h4>
                                        <div className="space-y-4">
                                            {(m.platform === 'Meet' || m.platform === 'Teams') && (
                                                <div>
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Link de la Tutoría</label>
                                                    <input 
                                                        type="url" 
                                                        placeholder="https://meet.google.com/..."
                                                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] border border-gray-100"
                                                        value={meetingData.meeting_link}
                                                        onChange={(e) => setMeetingData({ ...meetingData, meeting_link: e.target.value })}
                                                    />
                                                </div>
                                            )}

                                            {m.platform === 'Zoom' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Código de la Reunión</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="ID de la reunión"
                                                            className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] border border-gray-100"
                                                            value={meetingData.zoom_code}
                                                            onChange={(e) => setMeetingData({ ...meetingData, zoom_code: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Contraseña (Opcional)</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Clave de acceso"
                                                            className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] border border-gray-100"
                                                            value={meetingData.zoom_password}
                                                            onChange={(e) => setMeetingData({ ...meetingData, zoom_password: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <button 
                                                onClick={() => {
                                                    if (m.platform === 'Zoom' && !meetingData.zoom_code) return showNotification("Por favor ingresa el código de reunión", "warning");
                                                    if ((m.platform === 'Meet' || m.platform === 'Teams') && !meetingData.meeting_link) return showNotification("Por favor ingresa el link de la reunión", "warning");
                                                    handleAction(m.id, 'ACEPTADA', meetingData);
                                                }}
                                                className="w-full bg-[#1a3a5a] text-[#ffcc00] font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-[#112740] transition-all shadow-lg"
                                            >
                                                Confirmar y Aceptar Tutoría
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-6">📑</div>
                        <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">No hay solicitudes pendientes por el momento</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Solicitudes;
