import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const SeTutor = ({ setAuth }) => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    
    const [allSubjects, setAllSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [motivation, setMotivation] = useState('');
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [hasPendingApp, setHasPendingApp] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    // Redirigir si no está logueado o ya es Mentor
    useEffect(() => {
        if (!currentUser?.id) {
            navigate('/login');
            return;
        }
        if (currentUser.role === 'MENTOR') {
            navigate('/profile');
            showNotification('Ya tienes el perfil de Tutor/Mentor.', 'info');
        }
    }, [currentUser, navigate, showNotification]);

    // Cargar materias disponibles y verificar postulaciones pendientes
    useEffect(() => {
        if (!currentUser?.id) return;

        const loadData = async () => {
            try {
                // 1. Verificar si hay solicitudes pendientes
                const appsRes = await axios.get('http://localhost:3000/api/admin/tutors/applications').catch(() => ({ data: [] }));
                const pending = appsRes.data.find(app => String(app.user_id) === String(currentUser.id) && app.status === 'PENDING');
                if (pending) {
                    setHasPendingApp(true);
                    setLoadingSubjects(false);
                    return;
                }

                // 2. Obtener el perfil para saber su semestre actual
                const profileRes = await axios.get(`http://localhost:3000/api/users/profile/${currentUser.id}`);
                const userSemester = profileRes.data.current_semester || 1;

                // 3. Cargar materias filtradas hasta ese semestre
                const res = await axios.get(`http://localhost:3000/api/subjects?semester=${userSemester}`);
                setAllSubjects(res.data);
            } catch (err) {
                console.error('Error al inicializar datos de tutor:', err);
                showNotification('No se pudieron cargar las materias correspondientes a tu nivel.', 'error');
            } finally {
                setLoadingSubjects(false);
            }
        };
        loadData();
    }, [currentUser.id, showNotification]);

    const handleSubjectToggle = (subjectId) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedSubjects.length === 0) {
            showNotification('Por favor selecciona al menos una materia que desees impartir.', 'warning');
            return;
        }

        if (!motivation.trim() || motivation.trim().length < 15) {
            showNotification('Por favor explica detalladamente tu motivación (mínimo 15 caracteres).', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post(`http://localhost:3000/api/admin/tutors/applications`, {
                user_id: currentUser.id,
                motivation: motivation,
                selected_subjects: selectedSubjects
            });

            showNotification(res.data.message || 'Tu solicitud ha sido enviada al administrador.', 'success');
            setHasPendingApp(true);
        } catch (err) {
            console.error('Error al solicitar cambio a tutor:', err);
            const errorMsg = err.response?.data?.error || 'No se pudo procesar la solicitud de ascenso.';
            showNotification(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingSubjects) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3a5a]"></div>
            </div>
        );
    }

    if (hasPendingApp) {
        return (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 text-center space-y-6">
                <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto border border-yellow-200 animate-pulse">
                    <span className="text-4xl text-pilas-gold">🛡️</span>
                </div>
                <h2 className="text-2xl font-black text-[#1a3a5a] tracking-tight">Solicitud en Revisión</h2>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                    Tu postulación para convertirte en Tutor de Pilas! ha sido enviada con éxito.
                </p>
                <p className="text-[#1a3a5a]/75 text-xs font-semibold bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    El administrador está revisando tu biografía y materias seleccionadas. Pronto recibirás el veredicto en tu cuenta.
                </p>
                <button
                    onClick={() => navigate(`/profile/${currentUser.id}`)}
                    className="w-full py-4 bg-[#1a3a5a] text-[#ffcc00] rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-md"
                >
                    Ir a Mi Perfil
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 bg-gray-50 min-h-screen font-sans">
            
            {/* CABECERA GORGEOUS */}
            <header className="mb-10 text-center max-w-2xl mx-auto space-y-3">
                <span className="text-[10px] font-black text-pilas-gold bg-yellow-50 px-4 py-1.5 rounded-full border border-yellow-200 uppercase tracking-[0.25em]">
                    Comparte tu Conocimiento
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-[#1a3a5a] tracking-tight">Sé un Tutor Pilas!</h1>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                    Ayuda a otros compañeros a superar sus materias, consolida tus conocimientos y gana reconocimiento en la comunidad.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* COLUMNA IZQUIERDA: BENEFICIOS (5/12) */}
                <aside className="lg:col-span-5 space-y-6">
                    <div className="bg-[#1a3a5a] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col gap-6">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                        <h3 className="font-extrabold text-xl text-[#ffcc00] tracking-tight">Beneficios de ser Mentor</h3>
                        
                        <div className="space-y-5 text-left">
                            <div className="flex gap-4">
                                <span className="text-2xl">🪙</span>
                                <div>
                                    <h5 className="font-bold text-xs uppercase tracking-wide text-yellow-300">Gana Recompensas</h5>
                                    <p className="text-[11px] text-gray-300 font-medium leading-relaxed">Consigue monedas Pilas! por cada hora dictada y canjéalas por beneficios increíbles.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-2xl">🎓</span>
                                <div>
                                    <h5 className="font-bold text-xs uppercase tracking-wide text-yellow-300">Desarrollo Profesional</h5>
                                    <p className="text-[11px] text-gray-300 font-medium leading-relaxed">Enseñar es la mejor forma de aprender. Consolida tu perfil y destaca en tu carrera.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-2xl">🤝</span>
                                <div>
                                    <h5 className="font-bold text-xs uppercase tracking-wide text-yellow-300">Apoyo Comunitario</h5>
                                    <p className="text-[11px] text-gray-300 font-medium leading-relaxed">Forma parte de la red de apoyo estudiantil y ayuda a reducir la tasa de deserción.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-sm text-center">
                        <p className="text-xs font-semibold text-gray-500">¿Tienes dudas sobre el proceso?</p>
                        <a href="/beneficios" className="text-xs font-black text-[#1a3a5a] hover:text-yellow-600 transition-colors uppercase tracking-widest mt-1 block">
                            Leer Reglamento →
                        </a>
                    </div>
                </aside>

                {/* COLUMNA DERECHA: FORMULARIO (7/12) */}
                <main className="lg:col-span-7">
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col gap-6 text-left">
                        
                        {/* SECCIÓN MATERIAS */}
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Materias que dominas y deseas Impartir</label>
                            {allSubjects.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-4 bg-gray-50 rounded-3xl border border-gray-150/50">
                                        {allSubjects.map(sub => {
                                            const isSelected = selectedSubjects.includes(sub.id);
                                            return (
                                                <label 
                                                    key={sub.id} 
                                                    className={`flex items-center space-x-3 p-3 bg-white rounded-2xl border transition-all cursor-pointer ${
                                                        isSelected 
                                                            ? 'border-[#ffcc00] bg-yellow-50/20 shadow-sm ring-1 ring-[#ffcc00]/20' 
                                                            : 'border-gray-100 hover:border-gray-250 hover:shadow-sm'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="rounded text-[#1a3a5a] focus:ring-[#ffcc00] w-4 h-4 cursor-pointer"
                                                        checked={isSelected}
                                                        onChange={() => handleSubjectToggle(sub.id)}
                                                    />
                                                    <span className="text-[10px] font-black text-[#1a3a5a] uppercase truncate" title={sub.name}>{sub.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                            ) : (
                                <p className="text-gray-400 text-xs italic">No hay materias disponibles en el sistema.</p>
                            )}
                            <p className="text-[9px] text-gray-400 mt-2 font-medium">Puedes seleccionar varias materias simultáneamente.</p>
                        </div>

                        {/* MOTIVACIÓN */}
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Cuéntanos sobre ti y tu motivación</label>
                            <textarea
                                required
                                rows="5"
                                value={motivation}
                                onChange={(e) => setMotivation(e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-150 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-medium text-gray-600 text-xs resize-none placeholder-gray-400"
                                placeholder="Ej: He aprobado estas materias con excelentes calificaciones y disfruto compartiendo técnicas de estudio con mis compañeros para resolver problemas complejos..."
                            />
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[8px] text-gray-400 font-bold uppercase">Mínimo 15 caracteres</span>
                                <span className={`text-[9px] font-bold ${motivation.trim().length >= 15 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    {motivation.trim().length} letras
                                </span>
                            </div>
                        </div>

                        {/* BOTÓN ENVIAR */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-5 bg-[#1a3a5a] text-[#ffcc00] rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-[#1a3a5a]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Procesando Ascenso...' : 'Enviar Solicitud y Ascender'}
                        </button>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default SeTutor;
