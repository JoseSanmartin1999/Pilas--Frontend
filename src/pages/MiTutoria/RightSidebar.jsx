import React, { useState } from 'react';

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
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-gray-100 hover:bg-pilas-gold/20 border border-gray-200 rounded-l-lg flex items-center justify-center transition-all duration-200 group"
                title={isOpen ? 'Cerrar panel' : 'Abrir panel de estatus'}
            >
                <span className={`text-gray-400 group-hover:text-pilas-gold transition-all duration-200 text-[10px] ${isOpen ? '' : 'rotate-180'}`}>›</span>
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
                    <div className="flex flex-col h-full p-5 gap-6 min-w-[16rem]">

                        {/* === MINI PERFIL === */}
                        <div className="flex flex-col items-center gap-3 pt-2">
                            <div className="relative">
                                {/* Avatar del usuario actual */}
                                <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a8a] to-[#1a3270] rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-[#1e3a8a]/20">
                                    {currentUser?.full_name?.[0] || '?'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-[#1e3a8a] text-sm">{currentUser?.full_name}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                    {isMentor ? 'Mentor' : 'Aprendiz'} · Nivel 1
                                </p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-100" />

                        {/* === COMPAÑERO === */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-[#1e3a8a] font-black text-sm flex-shrink-0">
                                {partnerName?.[0] || '?'}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-700">{partnerName}</p>
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">
                                    {isMentor ? 'Tu aprendiz' : 'Tu mentor'}
                                </p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-100" />

                        {/* === RACHA (STREAK) === */}
                        <div className="flex flex-col gap-3">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                Racha activa
                            </p>
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                                <span className="text-3xl">🔋</span>
                                <div>
                                    <p className="text-2xl font-black text-orange-500 leading-none">
                                        {streakWeeks}
                                    </p>
                                    <p className="text-[10px] text-orange-400 font-bold">
                                        {streakWeeks === 1 ? 'semana' : 'semanas'} seguidas
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-100" />

                        {/* === INSIGNIAS BLOQUEADAS === */}
                        <div className="flex flex-col gap-3">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                Insignias en juego
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {BADGES.map((badge) => (
                                    <div
                                        key={badge.id}
                                        title={badge.label}
                                        className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-xl border border-gray-100 cursor-default group relative"
                                    >
                                        <span className="text-xl grayscale opacity-30 group-hover:opacity-50 transition-opacity">
                                            {badge.icon}
                                        </span>
                                        {/* Tooltip */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            {badge.label}
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-[6px] text-gray-400 font-black">🔒</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[8px] text-gray-300 text-center font-medium">
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
