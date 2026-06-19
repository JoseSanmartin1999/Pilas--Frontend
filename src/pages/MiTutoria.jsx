import { useState, useEffect } from 'react';
import axios from 'axios';
import WorkspaceLayout from './MiTutoria/WorkspaceLayout';

const BACKEND_URL = 'https://pilas-backend.onrender.com';

/**
 * MiTutoria — Página raíz del workspace
 *
 * Flujo:
 * 1. Carga las mentorías del usuario desde la API
 * 2. Filtra las ACEPTADAS (las únicas activas con chat)
 * 3. Si hay solo una → entra directo al workspace
 * 4. Si hay varias → muestra un selector de mentoría
 * 5. Si no hay ninguna → muestra estado vacío
 */
const MiTutoria = () => {
    const [mentorships, setMentorships] = useState([]);
    const [selectedMentorship, setSelectedMentorship] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    const handleCloseMentorship = (closedId, finalStatus) => {
        if (finalStatus === 'CANCELADA') {
            setSelectedMentorship(null);
            setMentorships((prev) => prev.filter((m) => m.id !== closedId));
            return;
        }

        setSelectedMentorship((prev) => {
            if (prev && prev.id === closedId) {
                return { ...prev, status: 'COMPLETADA', closed_at: new Date().toISOString() };
            }
            return prev;
        });
        setMentorships((prev) =>
            prev.map((m) => {
                if (m.id === closedId) {
                    return { ...m, status: 'COMPLETADA', closed_at: new Date().toISOString() };
                }
                return m;
            })
        );
    };

    const handleRateMentorship = (ratedId, rating, comment) => {
        setSelectedMentorship((prev) => {
            if (prev && prev.id === ratedId) {
                return { ...prev, is_rated: 1, rating, rating_comment: comment };
            }
            return prev;
        });
        setMentorships((prev) =>
            prev.map((m) => {
                if (m.id === ratedId) {
                    return { ...m, is_rated: 1, rating, rating_comment: comment };
                }
                return m;
            })
        );
    };

    useEffect(() => {
        if (!currentUser?.id) return;

        const fetchMentorships = async () => {
            try {
                const { data } = await axios.get(`${BACKEND_URL}/api/mentorships/user/${currentUser.id}`);
                // Las tutorías ACEPTADAS y COMPLETADAS son válidas para ingresar al espacio
                const activeOrClosed = data.filter((m) => m.status === 'ACEPTADA' || m.status === 'COMPLETADA');
                setMentorships(activeOrClosed);

                // Si solo hay una, entrar directo
                if (activeOrClosed.length === 1) {
                    setSelectedMentorship(activeOrClosed[0]);
                }
            } catch (err) {
                console.error('Error cargando mentorías:', err);
                setError('No se pudieron cargar tus tutorías activas.');
            } finally {
                setLoading(false);
            }
        };

        fetchMentorships();
    }, [currentUser?.id]);

    // === LOADING ===
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-[#0f592f] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-gray-400 tracking-wide">Cargando tu espacio de trabajo...</p>
                </div>
            </div>
        );
    }

    // === ERROR ===
    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50/30">
                <div className="text-center space-y-4 p-10">
                    <div className="text-5xl">⚠️</div>
                    <p className="font-black text-gray-700">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-[#0f592f] text-pilas-gold rounded-xl font-black text-xs uppercase tracking-widest"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    // === NO HAY TUTORÍAS ACEPTADAS ===
    if (mentorships.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50/30">
                <div className="text-center max-w-sm mx-auto p-10 space-y-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center text-5xl border border-gray-200 shadow-inner">
                        📭
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-[#0f592f] tracking-tight">
                            Sin tutorías activas
                        </h2>
                        <p className="text-sm text-gray-400 font-medium leading-relaxed">
                            MiTutoría estará disponible cuando uno de tus tutores acepte tu solicitud.
                            Podrás ver el chat, materiales y más desde aquí.
                        </p>
                    </div>
                    <a
                        href="/buscar"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f592f] text-pilas-gold rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0a4624] hover:scale-[1.02] transition-all shadow-lg shadow-[#0f592f]/20"
                    >
                        <span>🔍</span> Buscar tutor
                    </a>
                </div>
            </div>
        );
    }

    // === WORKSPACE ACTIVO ===
    if (selectedMentorship) {
        return (
            <div className="h-full flex flex-col">
                {/* Breadcrumb de navegación si hay varias mentorías */}
                {mentorships.length > 1 && (
                    <div className="flex-shrink-0 bg-[#0f1f3d] px-5 py-2 flex items-center gap-3">
                        <button
                            onClick={() => setSelectedMentorship(null)}
                            className="text-white/40 hover:text-white/80 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                        >
                            ‹ Mis tutorías
                        </button>
                        <span className="text-white/20 text-[10px]">/</span>
                        <span className="text-pilas-gold text-[10px] font-black uppercase tracking-widest">
                            {selectedMentorship.subject_name}
                        </span>
                    </div>
                )}
                <div className="flex-1 overflow-hidden">
                    <WorkspaceLayout
                        mentorship={selectedMentorship}
                        currentUser={currentUser}
                        onCloseMentorship={handleCloseMentorship}
                        onRateMentorship={handleRateMentorship}
                    />
                </div>
            </div>
        );
    }

    // === SELECTOR DE MENTORÍA (cuando hay más de una) ===
    return (
        <div className="h-full bg-gray-50/30 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Encabezado */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-[#0f592f] tracking-tight mb-2">
                        MiTutoría
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Tienes <span className="font-black text-[#0f592f]">{mentorships.length}</span> tutorías activas.
                        Selecciona una para entrar al espacio de trabajo.
                    </p>
                </div>

                {/* Grid de tutorías */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentorships.map((m) => {
                        const isMentor = currentUser.id === m.mentor_id;
                        const partnerName = isMentor ? m.apprentice_name : m.mentor_name;
                        const partnerRole = isMentor ? 'Aprendiz' : 'Mentor';

                        return (
                            <button
                                key={m.id}
                                id={`select-tutoria-${m.id}`}
                                onClick={() => setSelectedMentorship(m)}
                                className="group bg-white rounded-[2rem] border-2 border-gray-100 p-6 text-left hover:border-pilas-gold hover:shadow-xl hover:shadow-pilas-gold/10 hover:scale-[1.02] transition-all duration-200 flex flex-col gap-4"
                            >
                                {/* Ícono de materia */}
                                <div className="w-14 h-14 bg-gradient-to-br from-[#0f592f] to-[#0a4624] rounded-2xl flex items-center justify-center text-pilas-gold text-2xl shadow-lg shadow-[#0f592f]/20 group-hover:scale-110 transition-transform">
                                    📖
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-black text-[#0f592f] text-base leading-tight">
                                        {m.subject_name}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">con</span>
                                        <span className="text-xs font-bold text-gray-600">{partnerName}</span>
                                        <span className="text-[8px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-black uppercase">
                                            {partnerRole}
                                        </span>
                                    </div>
                                    {m.status === 'COMPLETADA' ? (
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <span className="w-2 h-2 bg-red-400 rounded-full" />
                                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Cerrada (Lectura)</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Activa</span>
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                        {new Date(m.scheduled_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-[10px] font-black text-[#0f592f] group-hover:text-pilas-gold transition-colors">
                                        Entrar →
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MiTutoria;
