/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

const getBadgeEmoji = (badgeName) => {
    switch (badgeName) {
      case 'Primeros Pasos':
        return '🎯';
      case 'Cerebro de Oro':
        return '💡';
      case 'Siempre Puntual':
        return '⚡';
      case 'Mentor Estrella':
        return '⭐';
      case 'Súper Aprendiz':
        return '🎓';
      case 'Héroe de la ESPE':
      case 'Maestro ESPE':
        return '🏆';
      case 'Hola Mundo':
        return '🌍';
      case 'Perfil Estelar':
        return '✨';
      default:
        return '🏅';
    }
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info', badgeInfo = null) => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => [...prev, { id, message, type, badgeInfo }]);
        
        // Auto-remove after 6 seconds for badge notifications, 4 seconds for others
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, type === 'badge' ? 6000 : 4000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {/* Notification Container */}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {notifications.map((n) => {
                    if (n.type === 'badge' && n.badgeInfo) {
                        return (
                            <div
                                key={n.id}
                                onClick={() => removeNotification(n.id)}
                                className="pointer-events-auto flex items-start gap-4 p-5 rounded-[2rem] border border-amber-400 bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-slate-950/95 text-white shadow-[0_0_25px_rgba(245,158,11,0.35)] backdrop-blur-md transition-all duration-300 transform translate-y-0 scale-100 animate-slide-in cursor-pointer hover:scale-102 flex-row"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-[#ffcc00]/20 to-amber-500/10 rounded-2xl flex items-center justify-center text-4xl shadow-md border border-[#ffcc00]/30 shrink-0 animate-bounce">
                                    {n.badgeInfo.icon && n.badgeInfo.icon.startsWith('http') ? (
                                        <img src={n.badgeInfo.icon} alt={n.badgeInfo.name} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        getBadgeEmoji(n.badgeInfo.name)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <span className="text-[9px] bg-[#ffcc00]/20 text-[#ffcc00] border border-[#ffcc00]/30 font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                        ¡Nueva Insignia Ganada!
                                    </span>
                                    <h4 className="font-black text-white text-sm mt-1.5 leading-tight">
                                        {n.badgeInfo.name}
                                    </h4>
                                    <p className="text-[10px] text-gray-300 mt-1 leading-normal">
                                        {n.message}
                                    </p>
                                </div>
                                <button className="text-amber-400/60 hover:text-amber-400 transition-colors shrink-0 self-start mt-0.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={n.id}
                            onClick={() => removeNotification(n.id)}
                            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 scale-100 animate-slide-in cursor-pointer hover:scale-102 ${
                                n.type === 'success'
                                    ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                                    : n.type === 'error'
                                    ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
                                    : n.type === 'warning'
                                    ? 'bg-amber-950/80 border-amber-500/30 text-amber-200'
                                    : 'bg-blue-950/80 border-blue-500/30 text-blue-200'
                            }`}
                        >
                            {/* Icon */}
                            <div className="mt-0.5 shrink-0">
                                {n.type === 'success' && (
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {n.type === 'error' && (
                                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {n.type === 'warning' && (
                                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                                {n.type === 'info' && (
                                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">{n.message}</p>
                            </div>

                            {/* Close button */}
                            <button className="text-slate-400 hover:text-slate-200 transition-colors shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </NotificationContext.Provider>
    );
};
