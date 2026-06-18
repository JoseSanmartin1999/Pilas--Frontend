import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const BuscarTutor = () => {
    const [mentors, setMentors] = useState([]);
    const [filter, setFilter] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [sortBy, setSortBy] = useState('semester-asc');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                const excludeParam = currentUser?.id ? `?exclude=${currentUser.id}` : '';
                const res = await axios.get(`https://pilas-backend.onrender.com/api/users/mentors${excludeParam}`);
                setMentors(res.data);
            } catch (err) {
                console.error("Error cargando mentores:", err);
                showNotification("No se pudieron cargar los mentores. Verifica tu conexión.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchMentors();
    }, [showNotification]);

    // Lógica de filtrado y ordenación
    const filteredAndSortedMentors = mentors
        .filter(m => {
            const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
            if (currentUser?.id && String(m.id) === String(currentUser.id)) {
                return false;
            }

            // Filtrado por texto (nombre o materias)
            const nombreCompleto = m.nombre || '';
            const matchesText = 
                nombreCompleto.toLowerCase().includes(filter.toLowerCase()) ||
                (m.materias && m.materias.some(mat => mat.toLowerCase().includes(filter.toLowerCase())));

            // Filtrado por semestre
            const matchesSemester = selectedSemester === 'all' || String(m.current_semester) === selectedSemester;

            return matchesText && matchesSemester;
        })
        .sort((a, b) => {
            if (sortBy === 'semester-asc') {
                return (a.current_semester || 1) - (b.current_semester || 1);
            }
            if (sortBy === 'semester-desc') {
                return (b.current_semester || 1) - (a.current_semester || 1);
            }
            if (sortBy === 'name-asc') {
                const nameA = a.nombre || '';
                const nameB = b.nombre || '';
                return nameA.localeCompare(nameB);
            }
            if (sortBy === 'score-desc') {
                return (b.score || 0) - (a.score || 0);
            }
            return 0;
        });

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3a5a]"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 bg-gray-50 min-h-screen font-sans">
            
            {/* CABECERA GORGEOUS */}
            <header className="mb-12 text-center max-w-2xl mx-auto space-y-3">
                <span className="text-[10px] font-black text-pilas-gold uppercase tracking-[0.3em] bg-yellow-50 px-4 py-1.5 rounded-full border border-yellow-250/20">Encuentra a tu guía</span>
                <h1 className="text-4xl md:text-5xl font-black text-[#1a3a5a] tracking-tight">Mentores Disponibles</h1>
                <p className="text-gray-500 font-medium text-sm md:text-base leading-relaxed">
                    Aprende de estudiantes destacados que ya dominan y superaron las materias que estás cursando.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* BARRA LATERAL: PANEL DE CONTROL DE FILTROS & ORDENACIÓN (4/12) */}
                <aside className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col gap-6 sticky top-6">
                        <div>
                            <h4 className="text-[#1a3a5a] font-extrabold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                🔍 Buscar Tutor
                            </h4>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Nombre o Materia..."
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200/70 rounded-2xl text-xs focus:ring-2 focus:ring-[#ffcc00] outline-none font-medium text-gray-700 transition-all shadow-inner"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                />
                                <span className="absolute left-4 top-3 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[#1a3a5a] font-extrabold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                📶 Ordenar por Semestre / Nombre
                            </h4>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-2xl text-xs focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a] cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="semester-asc">Semestre (Menor a Mayor)</option>
                                <option value="semester-desc">Semestre (Mayor a Menor)</option>
                                <option value="name-asc">Nombre (A - Z)</option>
                                <option value="score-desc">Mejor Valorados (Puntuación)</option>
                            </select>
                        </div>

                        <div>
                            <h4 className="text-[#1a3a5a] font-extrabold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                🎓 Filtrar por Semestre
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedSemester('all')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedSemester === 'all' ? 'bg-[#1a3a5a] text-[#ffcc00] border-transparent shadow-md' : 'bg-gray-50 text-gray-500 border-gray-200/50 hover:bg-gray-100'}`}
                                >
                                    Todos
                                </button>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                    <button
                                        key={sem}
                                        onClick={() => setSelectedSemester(String(sem))}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${selectedSemester === String(sem) ? 'bg-[#1a3a5a] text-[#ffcc00] border-transparent shadow-md' : 'bg-gray-50 text-gray-500 border-gray-200/50 hover:bg-gray-100'}`}
                                    >
                                        {sem}°
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Botón para Limpiar Filtros */}
                        {(filter !== '' || selectedSemester !== 'all' || sortBy !== 'semester-asc') && (
                            <button
                                onClick={() => {
                                    setFilter('');
                                    setSelectedSemester('all');
                                    setSortBy('semester-asc');
                                    showNotification("Filtros restablecidos", "info");
                                }}
                                className="w-full mt-2 py-3 bg-gray-50 text-gray-400 border border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                </aside>

                {/* CUADRÍCULA DE TUTORES (8/12) */}
                <main className="lg:col-span-8">
                    {filteredAndSortedMentors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAndSortedMentors.map(mentor => (
                                <div 
                                    key={mentor.id} 
                                    className="bg-white p-6 rounded-[2.5rem] shadow-md border border-gray-100 flex flex-col items-center hover:shadow-2xl hover:shadow-[#1a3a5a]/5 hover:border-[#ffcc00]/40 transition-all duration-300 transform hover:-translate-y-1 relative group"
                                >
                                    {/* Semestre Badge Flotante */}
                                    <span className="absolute top-4 right-4 bg-amber-50 text-amber-700 border border-amber-200/40 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                                        🎓 {mentor.current_semester || 1}° Nivel
                                    </span>

                                    {/* Contenedor Foto de Perfil */}
                                    <div className="relative mb-4 mt-2">
                                        <img
                                            src={mentor.profile_photo_url || '/default-avatar.png'}
                                            className="w-28 h-28 rounded-3xl object-cover border-4 border-gray-50 shadow-md group-hover:scale-105 transition-transform duration-300"
                                            alt={mentor.nombre}
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center" title="Disponible"></div>
                                    </div>

                                    {/* Nombre y Puntuación */}
                                    <h3 className="font-extrabold text-[#1a3a5a] text-center text-base group-hover:text-yellow-600 transition-colors">
                                        {mentor.nombre}
                                    </h3>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 mb-2">
                                        {mentor.career || 'Ingeniería'}
                                    </p>

                                    {/* Estrellas de Puntuación */}
                                    <div className="flex text-amber-400 text-xs mb-4 gap-0.5" title={`${mentor.score || 4.5} estrellas`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i}>{i < Math.round(mentor.score || 4.5) ? '★' : '☆'}</span>
                                        ))}
                                    </div>

                                    {/* Materias */}
                                    <div className="flex flex-wrap justify-center gap-1.5 mb-6 flex-grow">
                                        {mentor.materias && mentor.materias.length > 0 ? (
                                            mentor.materias.slice(0, 3).map((mat, i) => (
                                                <span 
                                                    key={i} 
                                                    className="px-2.5 py-1 bg-gray-50 border border-gray-150 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-tight"
                                                    title={mat}
                                                >
                                                    {mat}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-gray-400 italic">Sin materias</span>
                                        )}
                                    </div>

                                    {/* Botón Ver Más */}
                                    <button
                                        onClick={() => navigate(`/profile/${mentor.id}`)}
                                        className="w-full py-3 bg-white text-[#1a3a5a] border-2 border-[#1a3a5a] rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#1a3a5a] hover:text-[#ffcc00] hover:border-transparent transition-all shadow-sm"
                                    >
                                        Ver Perfil
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-sm">
                            <div className="text-6xl mb-6">🕵️‍♂️</div>
                            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-2">No se encontraron mentores</h3>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto">Prueba cambiando los términos de búsqueda o seleccionando otro semestre.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BuscarTutor;
