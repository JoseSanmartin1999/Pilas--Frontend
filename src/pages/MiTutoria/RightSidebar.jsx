
/**
 * RightSidebar — Panel de estatus colapsable
 * Muestra mini-perfil, racha y logros bloqueados
 */

// Insignias en juego (bloqueadas por ahora)
const BADGES = [
    { id: 1, icon: '🏅', label: 'Primera sesión' },
    { id: 2, icon: '🔥', label: 'Racha de 4 semanas' },
    { id: 3, icon: '⭐', label: 'Módulo completado' },
    { id: 4, icon: '🚀', label: 'Mentoría al 100%' },
    { id: 5, icon: '💎', label: 'Top Aprendiz' },
    { id: 6, icon: '🎓', label: 'Graduado Pilas' },
];

const RightSidebar = ({ mentorship, currentUser, isOpen, onToggle }) => {
    const isMentor = currentUser?.id === mentorship?.mentor_id;
    const partnerName = isMentor ? mentorship?.apprentice_name : mentorship?.mentor_name;
    const streakWeeks = 1; // Demo — en futuro vendría de DB

    return (
        <>
            {/* Botón toggle visible siempre */}
            <button
                id="btn-toggle-right-sidebar"
                onClick={onToggle}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-4 h-11 bg-white hover:bg-gray-50 border border-gray-200 border-r-0 rounded-l-xl flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer group"
                title={isOpen ? 'Cerrar panel' : 'Abrir panel de estatus'}
            >
                <span className={`text-gray-400 group-hover:text-[#0f592f] transition-all duration-200 text-[10px] font-bold ${isOpen ? '' : 'rotate-180'}`}>›</span>
            </button>

            {/* Panel lateral */}
            <aside
                className={`
                    flex-shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-y-auto
                    transition-all duration-300 ease-in-out
                    ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}
                `}
            >
                {isOpen && (
                    <div className="flex flex-col h-full p-5 gap-5 min-w-[16rem] select-none">

                        {/* === MINI PERFIL === */}
                        <div className="flex flex-col items-center gap-2.5 pt-2">
                            <div className="relative">
                                {/* Avatar del usuario actual */}
                                <div className="w-14 h-14 bg-gradient-to-br from-[#0f592f] to-[#0a4624] rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md shadow-[#0f592f]/10">
                                    {currentUser?.full_name?.[0] || '?'}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
                            </div>
                            <div className="text-center">
                                <p className="font-extrabold text-[#0f592f] text-xs sm:text-sm">{currentUser?.full_name}</p>
                                <p className="text-[8px] text-gray-450 font-bold uppercase tracking-wider mt-0.5">
                                    {isMentor ? 'Mentor' : 'Aprendiz'} · Nivel 1
                                </p>
                            </div>
                        </div>

                        {/* === COMPAÑERO === */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100/70 rounded-2xl">
                            <div className="w-9 h-9 bg-white border border-gray-150 rounded-xl flex items-center justify-center text-[#0f592f] font-extrabold text-xs flex-shrink-0 shadow-sm">
                                {partnerName?.[0] || '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-700 truncate">{partnerName}</p>
                                <p className="text-[8px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">
                                    {isMentor ? 'Tu aprendiz' : 'Tu mentor'}
                                </p>
                            </div>
                        </div>

                        {/* === RACHA (STREAK) === */}
                        <div className="flex flex-col gap-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                Racha Activa
                            </p>
                            <div className="flex items-center gap-3 p-3.5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-2xl border border-orange-500/10 shadow-sm">
                                <span className="text-2xl animate-pulse">🔥</span>
                                <div>
                                    <p className="text-xl font-extrabold text-orange-600 leading-none">
                                        {streakWeeks}
                                    </p>
                                    <p className="text-[9px] text-orange-500/80 font-bold mt-1">
                                        {streakWeeks === 1 ? 'semana' : 'semanas'} seguidas
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* === INSIGNIAS BLOQUEADAS === */}
                        <div className="flex flex-col gap-2.5">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                Insignias en Juego
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {BADGES.map((badge) => (
                                    <div
                                        key={badge.id}
                                        title={badge.label}
                                        className="flex flex-col items-center gap-1.5 p-2 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl cursor-default group relative transition-all duration-150"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-150 flex items-center justify-center relative shadow-sm group-hover:scale-105 transition-transform">
                                            <span className="text-lg grayscale opacity-25">
                                                {badge.icon}
                                            </span>
                                            <span className="absolute -bottom-1 -right-1 text-[7px] bg-gray-100 border border-gray-250 w-4 h-4 rounded-full flex items-center justify-center font-black">
                                                🔒
                                            </span>
                                        </div>
                                        {/* Tooltip */}
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-md">
                                            {badge.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[8px] text-gray-400 text-center font-medium mt-1">
                                Completa la mentoría para desbloquearlas
                            </p>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default RightSidebar;
