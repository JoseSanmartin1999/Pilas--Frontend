import { Link } from 'react-router-dom';

const BADGES = [
    { name: 'Primeros Pasos', icon: '🎯', desc: 'Solicita o imparte tu primera tutoría exitosamente.' },
    { name: 'Cerebro de Oro', icon: '💡', desc: 'Acumula más de 500 Puntos de Experiencia (XP).' },
    { name: 'Siempre Puntual', icon: '⚡', desc: 'Asistencia perfecta a la hora acordada en tus tutorías.' },
    { name: 'Mentor Estrella', icon: '⭐', desc: 'Imparte más de 5 tutorías virtuales como Mentor de confianza.' },
    { name: 'Súper Aprendiz', icon: '🎓', desc: 'Recibe 10 tutorías de tus compañeros para perfeccionar tus materias.' },
    { name: 'Héroe de la ESPE', icon: '🏆', desc: 'Logra calificar con 5 estrellas en 8 tutorías impartidas.' }
];

const REWARDS = [
    { title: '15% Descuento en Bar ESPE', cost: 60, icon: '☕', category: 'Alimentación', desc: 'Aplica en tu próximo consumo de desayunos o snacks en el bar central del campus.' },
    { title: 'Almuerzo Gratis Comedor', cost: 150, icon: '🍲', category: 'Alimentación', desc: 'Canjea este cupón por un almuerzo completo gratuito en el comedor universitario.' },
    { title: 'Parqueadero VIP (1 Día)', cost: 100, icon: '🚗', category: 'Servicios', desc: 'Acceso reservado a la zona de parqueaderos preferencial por un día completo.' },
    { title: 'Termo Oficial ESPE', cost: 200, icon: '🥤', category: 'Merchandising', desc: 'Termo metálico premium con el logo grabado de la ESPE. Retirar en Bienestar Estudiantil.' },
    { title: 'Cuaderno Anillado Pilas!', cost: 80, icon: '📓', category: 'Merchandising', desc: 'Cuaderno exclusivo de apuntes con stickers personalizados de la plataforma.' }
];

const Beneficios = () => {
    return (
        <div className="bg-gray-50/50 min-h-screen py-12">
            {/* === HERO BANNER === */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="bg-gradient-to-br from-pilas-blue to-[#0a4624] text-white rounded-[2.5rem] p-8 sm:p-16 text-center relative overflow-hidden shadow-xl shadow-pilas-blue/15 animate-in fade-in zoom-in duration-500">
                    {/* Background Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.05] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)',
                            backgroundSize: '32px 32px',
                        }}
                    />
                    
                    <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                        <div className="inline-flex items-center gap-2 bg-pilas-gold/25 border border-pilas-gold/40 px-4.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#ffcc00] animate-bounce">
                            ⚡ Comunidad Pilas!
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-white">
                            Aprende, Comparte y <span className="text-[#ffcc00]">Gana Recompensas</span>
                        </h1>
                        <p className="text-sm sm:text-base text-white/80 font-medium leading-relaxed">
                            Pilas! es el espacio de mentoría académica de la ESPE diseñado para potenciar tu rendimiento. 
                            Tanto si buscas resolver tus dudas como si deseas guiar a otros, aquí tu esfuerzo se transforma en beneficios reales para tu vida universitaria.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 pt-2">
                            <Link
                                to="/registro"
                                className="px-8 py-3.5 bg-pilas-gold hover:bg-[#bfa030] text-[#0f592f] rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pilas-gold/15"
                            >
                                Registrarse Ahora
                            </Link>
                            <Link
                                to="/se-tutor"
                                className="px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            >
                                Ser Mentor
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* === USER ROLES SECTION === */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0f592f] tracking-tight">Beneficios por Rol</h2>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium mt-2">
                        Encuentra las ventajas académicas y personales que se adaptan a tu perfil y objetivos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Aprendiz Card */}
                    <div className="bg-white rounded-[2rem] border-2 border-gray-150/60 p-8 shadow-sm hover:shadow-xl hover:border-pilas-blue/30 transition-all duration-300 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm text-emerald-600">
                                🎓
                            </div>
                            <h3 className="text-xl font-black text-[#0f592f]">Como Aprendiz</h3>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Resuelve tus dudas académicas</p>
                            <ul className="space-y-3.5">
                                {[
                                    'Aprende de compañeros destacados que ya dominan las materias difíciles.',
                                    'Accede a salas de tutoría personalizadas con chat en tiempo real y repositorios compartidos.',
                                    'Flexibilidad de horarios para programar mentorías presenciales u online (Meet/Zoom/Teams).',
                                    'Es totalmente gratuito y acumulas ESPE Coins por tu constancia y por calificar tutorías.'
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-600 font-medium leading-relaxed">
                                        <span className="text-[#0f592f] font-bold text-lg select-none">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pt-8 mt-8 border-t border-gray-100">
                            <Link
                                to="/buscar"
                                className="inline-flex items-center gap-2 text-xs font-black text-[#0f592f] hover:text-pilas-gold uppercase tracking-widest transition-colors"
                            >
                                Buscar un Tutor Académico <span>→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Mentor Card */}
                    <div className="bg-white rounded-[2rem] border-2 border-gray-150/60 p-8 shadow-sm hover:shadow-xl hover:border-pilas-gold/40 transition-all duration-300 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm text-amber-500">
                                🏆
                            </div>
                            <h3 className="text-xl font-black text-[#0f592f]">Como Mentor (Tutor)</h3>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Guía a tus compañeros y destaca</p>
                            <ul className="space-y-3.5">
                                {[
                                    'Valida tu récord académico e imparte tutorías para ganar prestigio y experiencia.',
                                    'Refuerza tus propios conocimientos estructurando y explicando temas clave.',
                                    'Posibilidad de convalidar horas de servicio comunitario u obtener certificaciones académicas oficiales.',
                                    'Recibe ESPE Coins y desbloquea insignias que potencian tu reputación en la comunidad.'
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-600 font-medium leading-relaxed">
                                        <span className="text-[#d4af37] font-bold text-lg select-none">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pt-8 mt-8 border-t border-gray-100">
                            <Link
                                to="/se-tutor"
                                className="inline-flex items-center gap-2 text-xs font-black text-[#0f592f] hover:text-pilas-gold uppercase tracking-widest transition-colors"
                            >
                                Aplicar como Tutor Académico <span>→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* === REWARDS SECTION === */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0f592f] tracking-tight">Catálogo de Premios canjeables</h2>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium mt-2">
                        Utiliza tus ESPE Coins ganados en tutorías para canjear cupones y productos exclusivos dentro de la universidad.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {REWARDS.map((reward, i) => (
                        <div
                            key={i}
                            className="group bg-white rounded-2xl border border-gray-150 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-pilas-gold/25 transition-all duration-300"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-4xl">{reward.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                                        {reward.category}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm text-gray-800 truncate group-hover:text-pilas-blue transition-colors">
                                        {reward.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                        {reward.desc}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-[10px] font-black tracking-wide border border-amber-100">
                                    <span>🪙</span> {reward.cost} ESPE Coins
                                </div>
                                <Link
                                    to="/recompensas"
                                    className="text-[10px] font-black text-pilas-blue hover:text-pilas-gold uppercase tracking-widest transition-colors"
                                >
                                    Canjear <span>→</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* === INSIGNIAS SECTION === */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0f592f] tracking-tight">Insignias y Gamificación</h2>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium mt-2">
                        Completa metas y desbloquea insignias que darán a conocer tu reputación académica y nivel de compromiso.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {BADGES.map((badge, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-gray-150 p-5 text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center text-3xl shadow-inner border border-gray-200">
                                {badge.icon}
                            </div>
                            <div>
                                <h5 className="font-bold text-xs text-gray-700 truncate max-w-[120px]" title={badge.name}>
                                    {badge.name}
                                </h5>
                                <p className="text-[9px] text-gray-400 font-medium mt-1 leading-snug line-clamp-2">
                                    {badge.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* === CTA SECTION === */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-8">
                <div className="bg-white rounded-[2rem] border border-gray-200/80 p-8 sm:p-12 shadow-sm max-w-4xl mx-auto space-y-6">
                    <h3 className="text-2xl font-black text-[#0f592f] tracking-tight">¿Listo para ponerte las Pilas!?</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-lg mx-auto">
                        Regístrate hoy mismo de forma gratuita y empieza a programar tutorías, ganar monedas universitarias y convalidar tus horas académicas.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            to="/registro"
                            className="px-6 py-3 bg-[#0f592f] text-pilas-gold hover:bg-[#0a4624] rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-md shadow-[#0f592f]/10"
                        >
                            Registrarme
                        </Link>
                        <Link
                            to="/login"
                            className="px-6 py-3 bg-white border border-gray-300 text-slate-600 hover:bg-gray-50 hover:text-pilas-blue rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default Beneficios;
