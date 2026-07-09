
/**
 * LeftSidebar — Barra lateral izquierda de navegación del workspace
 * Módulos de Enfoque al estilo Slack/Discord
 */

const MODULES = [
    {
        id: 'chat',
        icon: '💬',
        label: 'Canal Directo',
        sublabel: 'Chat en tiempo real',
        active: true,
    },
    {
        id: 'repositorio',
        icon: '📚',
        label: 'Repositorio',
        sublabel: 'Materiales y PDFs',
        active: true,
    },
    {
        id: 'tablon',
        icon: '📢',
        label: 'Tablón de Anuncios',
        sublabel: 'Notas del mentor',
        active: false,
    },
    {
        id: 'hoja-de-ruta',
        icon: '🗓️',
        label: 'Hoja de Ruta',
        sublabel: 'Cronograma 16 semanas',
        active: false,
    },
    {
        id: 'retos',
        icon: '⚡',
        label: 'Retos',
        sublabel: 'Gamificación y puntos',
        active: false,
    },
];

const LeftSidebar = ({ activeModule, onModuleChange, mentorship, isOpen, onClose }) => {
    return (
        <aside 
            className={`
                w-64 flex-shrink-0 bg-[#0c1811] flex flex-col h-full select-none
                fixed md:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
                border-r border-emerald-950/20
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}
        >
            {/* Cabecera del sidebar */}
            <div className="px-6 py-5 border-b border-white/5 flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                    {mentorship?.status === 'COMPLETADA' ? (
                        <div className="w-2 h-2 bg-gray-500 rounded-full border border-white/10" />
                    ) : (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                    )}
                    <span className="text-white/95 font-extrabold text-sm tracking-tight truncate">
                        {mentorship?.subject_name || 'Tutoría'}
                    </span>
                </div>
                <p className="text-white/30 text-[9px] font-black uppercase tracking-widest pl-4">
                    Espacio de Trabajo
                </p>
            </div>

            {/* Lista de módulos */}
            <nav className="flex-1 overflow-y-auto py-5 space-y-1.5 px-3.5">
                <p className="text-white/20 text-[9px] font-black uppercase tracking-widest px-2 mb-3">
                    Módulos de Enfoque
                </p>

                {MODULES.map((mod) => {
                    const isActive = activeModule === mod.id;
                    return (
                        <button
                            key={mod.id}
                            id={`sidebar-module-${mod.id}`}
                            onClick={() => onModuleChange(mod.id)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                                transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-[#0f592f]/45 border border-emerald-500/25 shadow-[inset_0_0_12px_rgba(212,175,55,0.02)] text-pilas-gold'
                                    : 'hover:bg-white/5 border border-transparent text-white/60 hover:text-white/90'
                                }
                                ${!mod.active ? 'opacity-35 hover:opacity-65' : ''}
                            `}
                        >
                            {/* Indicador activo */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-pilas-gold rounded-r-full" />
                            )}

                            {/* Ícono */}
                            <span className={`text-lg flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                {mod.icon}
                            </span>

                            {/* Texto */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-pilas-gold' : 'text-white/70 group-hover:text-white/90'}`}>
                                    {mod.label}
                                </p>
                                <p className="text-[9px] text-white/25 truncate font-semibold mt-0.5">
                                    {mod.sublabel}
                                </p>
                            </div>

                            {/* Badge "Próximamente" para los no activos */}
                            {!mod.active && (
                                <span className="flex-shrink-0 text-[7px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded-md">
                                    Próximamente
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer del sidebar — info de la mentoría */}
            <div className="px-4 py-4 border-t border-white/5 bg-[#08110b]/40">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all group">
                    <div className="w-8 h-8 bg-pilas-gold/10 border border-pilas-gold/20 rounded-xl flex items-center justify-center text-xs font-black text-pilas-gold flex-shrink-0 group-hover:scale-105 transition-transform">
                        {mentorship?.mentor_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-[10px] font-extrabold truncate">
                            {mentorship?.mentor_name || 'Mentor'}
                        </p>
                        <p className="text-white/25 text-[8px] font-semibold uppercase tracking-wider mt-0.5">
                            {mentorship?.status === 'COMPLETADA' ? 'Tutor (Archivado)' : 'Tutor Activo'}
                        </p>
                    </div>
                    <div className="relative flex items-center justify-center flex-shrink-0">
                        {mentorship?.status === 'COMPLETADA' ? (
                            <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        ) : (
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default LeftSidebar;
