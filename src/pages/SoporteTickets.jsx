import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const SoporteTickets = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Estado del formulario
    const [newTicket, setNewTicket] = useState({ title: '', description: '' });
    const [showModal, setShowModal] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!currentUser?.id) {
            navigate('/login');
            return;
        }
        fetchTickets();
    }, [currentUser.id]);

    const fetchTickets = async () => {
        try {
            const res = await axios.get(`https://pilas-backend.onrender.com/api/tickets/user/${currentUser.id}`);
            setTickets(res.data);
        } catch (err) {
            console.error("Error al cargar tickets:", err);
            showNotification("No se pudo cargar el historial de soporte.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!newTicket.title.trim() || !newTicket.description.trim()) {
            showNotification("Por favor completa todos los campos del ticket.", "warning");
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post('https://pilas-backend.onrender.com/api/tickets', {
                user_id: currentUser.id,
                title: newTicket.title,
                description: newTicket.description
            });

            showNotification(res.data.message || "Ticket enviado exitosamente.", "success");
            setShowModal(false);
            setNewTicket({ title: '', description: '' });
            fetchTickets(); // Recargar lista
        } catch (err) {
            console.error("Error al reportar ticket:", err);
            showNotification("No se pudo reportar el ticket de soporte.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'OPEN':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'IN_PROGRESS':
                return 'bg-yellow-50 text-yellow-700 border-yellow-250';
            case 'RESOLVED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'OPEN': return 'Abierto';
            case 'IN_PROGRESS': return 'En Proceso';
            case 'RESOLVED': return 'Solucionado';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3a5a]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-10 bg-gray-50 min-h-screen font-sans">
            
            {/* CABECERA */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div className="text-left space-y-2">
                    <span className="text-[10px] font-black text-pilas-gold bg-yellow-50 px-4 py-1.5 rounded-full border border-yellow-200 uppercase tracking-[0.25em]">
                        Centro de Ayuda
                    </span>
                    <h1 className="text-4xl font-black text-[#1a3a5a] tracking-tight">Soporte y Reclamaciones</h1>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed">
                        Reporta cualquier problema técnico o duda sobre el funcionamiento de la plataforma.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-4 bg-[#1a3a5a] text-[#ffcc00] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border border-transparent hover:border-[#ffcc00]/20 flex items-center gap-2"
                >
                    <span>➕</span> Nuevo Ticket
                </button>
            </header>

            {/* LISTADO DE TICKETS */}
            <div className="space-y-6">
                {tickets.length > 0 ? (
                    tickets.map((ticket) => {
                        const dateFormatted = new Date(ticket.created_at).toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        return (
                            <div key={ticket.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100/50 space-y-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-50 pb-4">
                                    <div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Código: #{ticket.id}</span>
                                        <h3 className="font-extrabold text-lg text-[#1a3a5a] leading-snug mt-1">{ticket.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-400 font-medium">{dateFormatted}</span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(ticket.status)}`}>
                                            {getStatusLabel(ticket.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-left space-y-3">
                                    <p className="text-gray-600 text-sm font-medium leading-relaxed bg-gray-50/50 p-5 rounded-2xl border border-gray-100/30">
                                        {ticket.description}
                                    </p>

                                    {ticket.reply && (
                                        <div className="bg-emerald-50/30 border border-emerald-100 rounded-3xl p-5 md:p-6 space-y-2 mt-4 animate-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">💬</span>
                                                <h5 className="font-black text-xs text-[#1a3a5a] uppercase tracking-wider">Respuesta de Soporte</h5>
                                            </div>
                                            <p className="text-gray-700 text-xs font-semibold leading-relaxed">
                                                {ticket.reply}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200/80 flex flex-col items-center justify-center">
                        <span className="text-6xl mb-4">📨</span>
                        <h3 className="text-lg font-black text-[#1a3a5a] mb-1">Sin Tickets Abiertos</h3>
                        <p className="text-gray-400 text-xs font-medium max-w-sm">
                            ¿Tienes algún problema con las monedas, las videollamadas o la plataforma? Crea un ticket arriba y te responderemos pronto.
                        </p>
                    </div>
                )}
            </div>

            {/* MODAL CREAR TICKET */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a3a5a]/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-2xl font-black text-[#1a3a5a] tracking-tighter">Crear Ticket</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-3xl font-light">&times;</button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Asunto / Título</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Ej: Error al canjear ESPE-Coins"
                                    value={newTicket.title} 
                                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} 
                                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Detalles del problema</label>
                                <textarea 
                                    required
                                    rows="5" 
                                    value={newTicket.description} 
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} 
                                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-medium text-gray-600 text-xs resize-none placeholder-gray-400" 
                                    placeholder="Describe detalladamente el problema para que el administrador pueda ayudarte..." 
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full py-5 bg-[#1a3a5a] text-[#ffcc00] rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:shadow-[#1a3a5a]/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Enviando...' : 'Reportar Ticket'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SoporteTickets;
