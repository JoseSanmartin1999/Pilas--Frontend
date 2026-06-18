import React from 'react';

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

const LeftSidebar = ({ activeModule, onModuleChange, mentorship }) => {
    return (
        <aside className="w-64 flex-shrink-0 bg-[#0f1f3d] flex flex-col h-full select-none">
            {/* Cabecera del sidebar */}
            <div className="px-5 py-5 border-b border-white/5">
                <div className="flex items-center gap-3 mb-1">
                    {mentorship?.status === 'COMPLETADA' ? (
                        <div className="w-2 h-2 bg-gray-400 rounded-full border border-white/10" />
                    ) : (
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                    )}
                    <span className="text-white/90 font-black text-sm tracking-tight truncate">
                        {mentorship?.subject_name || 'Tutoría'}
                    </span>
                </div>
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest pl-5">
                    Espacio de trabajo
                </p>
            </div>

            {/* Lista de módulos */}
            <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
                <p className="text-white/20 text-[9px] font-black uppercase tracking-widest px-2 mb-3">
                    Módulos de enfoque
                </p>

                {MODULES.map((mod) => {
                    const isActive = activeModule === mod.id;
                    return (
                        <button
                            key={mod.id}
                            id={`sidebar-module-${mod.id}`}
                            onClick={() => onModuleChange(mod.id)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                                transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-pilas-gold/15 border border-pilas-gold/30 shadow-[inset_0_0_12px_rgba(212,175,55,0.05)]'
                                    : 'hover:bg-white/5 border border-transparent'
                                }
                            `}
                        >
                            {/* Indicador activo */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-pilas-gold rounded-r-full" />
                            )}

                            {/* Ícono */}
                            <span className={`text-xl flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                {mod.icon}
                            </span>

                            {/* Texto */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-pilas-gold' : 'text-white/60 group-hover:text-white/80'}`}>
                                    {mod.label}
                                </p>
                                <p className="text-[9px] text-white/25 truncate font-medium">
                                    {mod.sublabel}
                                </p>
                            </div>

                            {/* Badge "soon" para los no activos */}
                            {!mod.active && (
                                <span className="flex-shrink-0 text-[8px] font-black text-white/20 uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded-full">
                                    Soon
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer del sidebar — info de la mentoría */}
            <div className="px-4 py-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all group">
                    <div className="w-8 h-8 bg-pilas-gold/20 rounded-xl flex items-center justify-center text-sm font-black text-pilas-gold flex-shrink-0">
                        {mentorship?.mentor_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-[10px] font-bold truncate">
                            {mentorship?.mentor_name || 'Mentor'}
                        </p>
                        <p className="text-white/25 text-[9px]">
                            {mentorship?.status === 'COMPLETADA' ? 'Tutor (Archivado)' : 'Tutor activo'}
                        </p>
                    </div>
                    {mentorship?.status === 'COMPLETADA' ? (
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0" />
                    ) : (
                        <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                    )}
                </div>
            </div>
        </aside>
    );
};

export default LeftSidebar;
