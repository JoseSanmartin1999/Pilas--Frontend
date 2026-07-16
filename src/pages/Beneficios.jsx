import { useState } from 'react';
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
    // Simulator states
    const [tutoriasDadas, setTutoriasDadas] = useState(4);
    const [tutoriasRecibidas, setTutoriasRecibidas] = useState(2);
    const [calificacionMentor, setCalificacionMentor] = useState(4.8);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const isAuthenticated = !!token;

    // Simulation Calculations
    const coinsPorDada = 35;
    const coinsPorRecibida = 15;
    const bonusCoins = (calificacionMentor >= 4.5 && tutoriasDadas > 0) ? 50 : 0;
    const totalCoins = (tutoriasDadas * coinsPorDada) + (tutoriasRecibidas * coinsPorRecibida) + bonusCoins;

    const xpPorDada = 100;
    const xpPorRecibida = 50;
    const bonusXp = (calificacionMentor >= 4.5 && tutoriasDadas > 0) ? 100 : 0;
    const totalXp = (tutoriasDadas * xpPorDada) + (tutoriasRecibidas * xpPorRecibida) + bonusXp;

    const level = Math.floor(totalXp / 500) + 1;

    // Find affordable rewards
    const affordableRewards = REWARDS.filter(r => r.cost <= totalCoins);

    return (
        <div className="bg-slate-900 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/4 w-[35rem] h-[35rem] bg-pilas-blue/20 rounded-full blur-[120px] -z-10 animate-pulse duration-[8s]" />
            <div className="absolute bottom-20 right-1/4 w-[30rem] h-[30rem] bg-pilas-gold/10 rounded-full blur-[100px] -z-10 animate-pulse duration-[6s]" />
            <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px] -z-10" />

            <div className="max-w-7xl mx-auto space-y-20">
                
                {/* === HERO BANNER === */}
                <div className="relative rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-md p-8 sm:p-16 text-center overflow-hidden shadow-2xl">
                    <div className="absolute -top-12 -left-12 w-40 h-40 bg-pilas-gold/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-pilas-blue/20 rounded-full blur-2xl" />
                    
                    <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                        <span className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-black bg-pilas-gold/10 text-pilas-gold border border-pilas-gold/20 uppercase tracking-widest animate-pulse">
                            ⚡ Comunidad Pilas!
                        </span>
                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
                            Aprende, Comparte y <span className="bg-gradient-to-r from-pilas-gold to-yellow-300 bg-clip-text text-transparent">Gana Recompensas</span>
                        </h1>
                        <p className="text-sm sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
                            Pilas! es el espacio de mentoría académica de la ESPE diseñado para potenciar tu rendimiento. 
                            Tanto si buscas resolver tus dudas como si deseas guiar a otros, aquí tu esfuerzo se transforma en beneficios reales para tu vida universitaria.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                            <Link
                                to={isAuthenticated ? "/buscar" : "/registro"}
                                className="px-8 py-4 bg-pilas-gold hover:bg-[#ffdf66] text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pilas-gold/25"
                            >
                                {isAuthenticated ? "Buscar Tutor" : "Registrarse Ahora"}
                            </Link>
                            <Link
                                to="/se-tutor"
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            >
                                Ser Mentor
                            </Link>
                        </div>
                    </div>
                </div>

                {/* === USER ROLES SECTION === */}
                <div>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Beneficios por Rol
                        </h2>
                        <p className="text-sm text-slate-400 font-medium max-w-lg mx-auto">
                            Encuentra las ventajas académicas y personales que se adaptan a tu perfil y objetivos.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Aprendiz Card */}
                        <div className="bg-white/[0.02] backdrop-blur-md rounded-[2rem] border border-white/5 hover:border-pilas-blue/50 p-8 sm:p-10 shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between group">
                            <div className="space-y-6">
                                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner text-emerald-400 group-hover:scale-110 transition-transform">
                                    🎓
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">Como Aprendiz</h3>
                                    <p className="text-xs text-pilas-gold font-bold uppercase tracking-widest">Resuelve tus dudas académicas</p>
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        'Aprende de compañeros destacados que ya dominan las materias difíciles.',
                                        'Accede a salas de tutoría personalizadas con chat en tiempo real y repositorios compartidos.',
                                        'Flexibilidad de horarios para programar mentorías presenciales u online (Meet/Zoom/Teams).',
                                        'Es totalmente gratuito y acumulas ESPE Coins por tu constancia y por calificar tutorías.'
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-3.5 text-sm text-slate-300 leading-relaxed font-normal">
                                            <span className="text-emerald-400 font-black text-lg select-none">✓</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-8 mt-8 border-t border-white/5">
                                <Link
                                    to="/buscar"
                                    className="inline-flex items-center gap-2 text-xs font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest transition-colors group-hover:translate-x-1 duration-200"
                                >
                                    Buscar un Tutor Académico <span>→</span>
                                </Link>
                            </div>
                        </div>

                        {/* Mentor Card */}
                        <div className="bg-white/[0.02] backdrop-blur-md rounded-[2rem] border border-white/5 hover:border-pilas-gold/50 p-8 sm:p-10 shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between group">
                            <div className="space-y-6">
                                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner text-amber-400 group-hover:scale-110 transition-transform">
                                    🏆
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">Como Mentor (Tutor)</h3>
                                    <p className="text-xs text-pilas-gold font-bold uppercase tracking-widest">Guía a tus compañeros y destaca</p>
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        'Valida tu récord académico e imparte tutorías para ganar prestigio y experiencia.',
                                        'Refuerza tus propios conocimientos estructurando y explicando temas clave.',
                                        'Posibilidad de convalidar horas de servicio comunitario u obtener certificaciones académicas oficiales.',
                                        'Recibe ESPE Coins y desbloquea insignias que potencian tu reputación en la comunidad.'
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-3.5 text-sm text-slate-300 leading-relaxed font-normal">
                                            <span className="text-amber-400 font-black text-lg select-none">✓</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-8 mt-8 border-t border-white/5">
                                <Link
                                    to="/se-tutor"
                                    className="inline-flex items-center gap-2 text-xs font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest transition-colors group-hover:translate-x-1 duration-200"
                                >
                                    Aplicar como Tutor Académico <span>→</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === INTERACTIVE SIMULATOR SECTION === */}
                <div className="relative rounded-[2.5rem] border border-white/10 bg-slate-950/60 p-8 sm:p-12 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pilas-gold/5 rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-pilas-blue/10 rounded-full blur-3xl -z-10" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Simulator controls */}
                        <div className="lg:col-span-7 space-y-6">
                            <div>
                                <span className="inline-block py-1 px-3 rounded-full text-[10px] font-black bg-pilas-blue/20 text-[#2ecc71] border border-emerald-500/20 mb-3 uppercase tracking-wider">
                                    Simulador Dinámico
                                </span>
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Calcula tus ESPE Coins y Nivel</h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
                                    Ajusta los controles para ver el impacto académico y las monedas universitarias que ganarías estimando tu actividad mensual.
                                </p>
                            </div>

                            <div className="space-y-5 pt-2">
                                {/* Sliders 1 */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-200">
                                        <span>Tutorías impartidas como Mentor:</span>
                                        <span className="text-pilas-gold">{tutoriasDadas} clases / mes</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="20" 
                                        value={tutoriasDadas}
                                        onChange={(e) => setTutoriasDadas(Number.parseInt(e.target.value, 10))}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pilas-gold" 
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>0</span>
                                        <span>20</span>
                                    </div>
                                </div>

                                {/* Sliders 2 */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-200">
                                        <span>Tutorías recibidas como Aprendiz:</span>
                                        <span className="text-emerald-400">{tutoriasRecibidas} clases / mes</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="20" 
                                        value={tutoriasRecibidas}
                                        onChange={(e) => setTutoriasRecibidas(Number.parseInt(e.target.value, 10))}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#2ecc71]" 
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>0</span>
                                        <span>20</span>
                                    </div>
                                </div>

                                {/* Sliders 3 */}
                                {tutoriasDadas > 0 && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex justify-between text-xs font-bold text-slate-200">
                                            <span>Calificación promedio del Mentor:</span>
                                            <span className="text-[#f1c40f]">⭐ {calificacionMentor.toFixed(1)} / 5.0</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="3.0" 
                                            max="5.0" 
                                            step="0.1"
                                            value={calificacionMentor}
                                            onChange={(e) => setCalificacionMentor(Number.parseFloat(e.target.value))}
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400" 
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>3.0</span>
                                            <span>5.0</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Simulator results dashboard representation */}
                        <div className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 relative">
                            <div className="absolute top-4 right-4 w-12 h-12 bg-pilas-blue/20 rounded-full blur-xl" />
                            
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Tu Recompensa Estimada</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monedas</span>
                                    <div className="text-2xl font-black text-pilas-gold flex items-center gap-1.5 mt-2">
                                        <span>🪙</span> {totalCoins}
                                    </div>
                                    <span className="text-[9px] text-slate-500 mt-1 font-medium">ESPE Coins</span>
                                </div>
                                <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Experiencia</span>
                                    <div className="text-2xl font-black text-emerald-400 flex items-center gap-1.5 mt-2">
                                        <span>💡</span> {totalXp}
                                    </div>
                                    <span className="text-[9px] text-slate-500 mt-1 font-medium">Nivel {level} alcanzado</span>
                                </div>
                            </div>

                            {/* Level visual progress bar representation */}
                            <div className="space-y-1.5 bg-slate-900/80 border border-white/5 rounded-2xl p-4">
                                <div className="flex justify-between text-[10px] font-bold text-slate-300">
                                    <span>Progreso de Nivel</span>
                                    <span>{totalXp % 500} / 500 XP</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-emerald-400 to-[#2ecc71] h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${((totalXp % 500) / 500) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Prize recommendation */}
                            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 space-y-2">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Premio Recomendado:</span>
                                {affordableRewards.length > 0 ? (
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{affordableRewards.at(-1).icon}</span>
                                        <div>
                                            <p className="text-xs font-black text-white">{affordableRewards.at(-1).title}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Costo: {affordableRewards.at(-1).cost} Coins</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 font-semibold italic">¡Sigue acumulando para canjear tu primer premio!</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* === REWARDS SECTION === */}
                <div>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Catálogo de Premios Canjeables</h2>
                        <p className="text-sm text-slate-400 font-medium max-w-lg mx-auto">
                            Utiliza tus ESPE Coins ganados en tutorías para canjear cupones y productos exclusivos dentro de la universidad.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {REWARDS.map((reward) => (
                            <div
                                key={reward.title}
                                className="group bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-pilas-gold/30 transition-all duration-300"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{reward.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
                                            {reward.category}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-white truncate group-hover:text-pilas-gold transition-colors">
                                            {reward.title}
                                        </h4>
                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {reward.desc}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-pilas-gold bg-pilas-gold/10 px-3 py-1 rounded-full text-[10px] font-black tracking-wide border border-pilas-gold/25">
                                        <span>🪙</span> {reward.cost} ESPE Coins
                                    </div>
                                    <Link
                                        to="/recompensas"
                                        className="text-[10px] font-black text-[#ffcc00] hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1"
                                    >
                                        Canjear <span>→</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === INSIGNIAS SECTION === */}
                <div>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Insignias y Gamificación</h2>
                        <p className="text-sm text-slate-400 font-medium max-w-lg mx-auto">
                            Completa metas y desbloquea insignias que darán a conocer tu reputación académica y nivel de compromiso.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {BADGES.map((badge) => (
                            <div
                                key={badge.name}
                                className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-pilas-gold/20 transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center text-3xl shadow-inner border border-white/10">
                                    {badge.icon}
                                </div>
                                <div className="space-y-1">
                                    <h5 className="font-bold text-xs text-white truncate max-w-[120px]" title={badge.name}>
                                        {badge.name}
                                    </h5>
                                    <p className="text-[9px] text-slate-400 font-medium leading-snug line-clamp-2">
                                        {badge.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === CTA SECTION === */}
                <div className="text-center pb-8">
                    <div className="bg-white/[0.02] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto space-y-6 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pilas-blue/20 rounded-full blur-2xl -z-10" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pilas-gold/10 rounded-full blur-2xl -z-10" />
                        
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">¿Listo para ponerte las Pilas!?</h3>
                        <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-lg mx-auto">
                            Regístrate hoy mismo de forma gratuita y empieza a programar tutorías, ganar monedas universitarias y convalidar tus horas académicas.
                        </p>
                        <div className="flex justify-center gap-4 pt-2">
                            <Link
                                to={isAuthenticated ? "/buscar" : "/registro"}
                                className="px-6 py-3.5 bg-pilas-gold hover:bg-[#ffdf66] text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-md shadow-pilas-gold/15"
                            >
                                Registrarme
                            </Link>
                            <Link
                                to={isAuthenticated ? "/profile" : "/login"}
                                className="px-6 py-3.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            >
                                {isAuthenticated ? "Ir a mi Perfil" : "Iniciar Sesión"}
                            </Link>
                        </div>
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
