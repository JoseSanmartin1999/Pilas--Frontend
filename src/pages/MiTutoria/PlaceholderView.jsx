import React from 'react';

/**
 * PlaceholderView — Sección en progreso
 * Muestra un estado "próximamente" elegante para las secciones no implementadas.
 */
const PlaceholderView = ({ icon, title, description }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full select-none">
            {/* Patrón de fondo punteado */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, #1e3a8a 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            <div className="relative flex flex-col items-center gap-6 text-center p-10 max-w-md">
                {/* Ícono principal con pulso */}
                <div className="relative">
                    <div className="absolute inset-0 bg-pilas-gold/10 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center text-5xl shadow-inner border border-gray-200">
                        {icon}
                    </div>
                </div>

                {/* Textos */}
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-[#1e3a8a] tracking-tight">{title}</h2>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">
                        {description || 'Esta sección está en construcción. Pronto estará disponible.'}
                    </p>
                </div>

                {/* Badge "En Progreso" */}
                <div className="flex items-center gap-2 px-5 py-2.5 bg-pilas-gold/10 border border-pilas-gold/30 rounded-full">
                    <span className="w-2 h-2 bg-pilas-gold rounded-full animate-pulse" />
                    <span className="text-[11px] font-black text-pilas-gold uppercase tracking-widest">
                        En Progreso
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PlaceholderView;
