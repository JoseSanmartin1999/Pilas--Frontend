import { useState } from 'react';

const SECTIONS = [
    {
        id: 'introduccion',
        title: '1. Introducción y Aceptación',
        content: `Bienvenido a Pilas!, la plataforma oficial de tutoría académica y aprendizaje colaborativo de la Universidad de las Fuerzas Armadas ESPE. Al acceder o utilizar nuestro sitio web, servicios y aplicaciones, aceptas cumplir y estar sujeto a estos Términos y Condiciones de Uso. Estos términos rigen la relación entre los usuarios (estudiantes de la ESPE) y la administración de la plataforma. Si no estás de acuerdo con alguna cláusula, debes abstenerte de utilizar el sistema.`,
        bullets: [
            'Pilas! es una red exclusiva para la comunidad estudiantil de la ESPE.',
            'El acceso está restringido a estudiantes legalmente matriculados.',
            'La aceptación de estos términos se realiza al momento de completar el registro.'
        ]
    },
    {
        id: 'registro',
        title: '2. Registro de Cuentas y Seguridad',
        content: `Para acceder a las funcionalidades del sistema (solicitar tutorías, postularse como tutor, chatear o descargar materiales), los usuarios deben registrarse y verificar su cuenta institucional. La seguridad es una prioridad compartida.`,
        bullets: [
            'El correo de registro debe ser estrictamente institucional (@espe.edu.ec).',
            'Eres responsable de proteger tu contraseña y los accesos a tu cuenta.',
            'Queda estrictamente prohibido compartir credenciales de acceso o suplantar la identidad de otros estudiantes.',
            'Cualquier brecha de seguridad identificada debe reportarse inmediatamente al canal de Soporte Técnico.'
        ]
    },
    {
        id: 'tutoress',
        title: '3. Responsabilidades del Tutor (Mentor)',
        content: `Los tutores o mentores son estudiantes destacados que guían a sus compañeros de semestres inferiores. El rol de tutor exige compromiso ético, puntualidad y altos estándares académicos.`,
        bullets: [
            'Postulación: Debes estar cursando al menos el 4to semestre y contar con un récord académico destacado.',
            'Puntualidad: Es obligatorio presentarse en las fechas y horas acordadas para las tutorías presenciales u online.',
            'Respeto: Brindar un trato profesional, paciente e inclusivo a todos los aprendices asignados.',
            'Material Académico: Todo el material subido al repositorio compartido debe ser de tu autoría o contar con los derechos académicos necesarios, respetando el derecho de autor de la ESPE.'
        ]
    },
    {
        id: 'aprendices',
        title: '4. Responsabilidades del Aprendiz',
        content: `Los aprendices son estudiantes que buscan reforzar sus conocimientos en materias específicas. Como aprendiz, tu comportamiento influye directamente en el ecosistema colaborativo de Pilas!.`,
        bullets: [
            'Compromiso: Asistir puntualmente a las sesiones acordadas y preparar previamente los temas de consulta.',
            'Honestidad Académica: Utilizar las tutorías para el aprendizaje y no para la resolución no autorizada de exámenes o tareas evaluadas.',
            'Evaluación Justa: Calificar el desempeño del tutor de forma objetiva, veraz y respetuosa al finalizar cada mentoría.',
            'Uso del Material: Los materiales descargados del repositorio son para exclusivo uso educativo personal.'
        ]
    },
    {
        id: 'gamificacion',
        title: '5. Políticas de ESPE Coins y Gamificación',
        content: `Pilas! incorpora un sistema de gamificación basado en ESPE Coins y Puntos de Experiencia (XP) para incentivar la participación. La manipulación de este sistema conlleva sanciones severas.`,
        bullets: [
            'Acumulación: Se ganan ESPE Coins por impartir tutorías (35 coins), asistir a tutorías (15 coins) y recibir calificaciones sobresalientes (50 coins de bono).',
            'Canje: Las monedas se pueden canjear en la sección de Recompensas por beneficios del campus (descuentos en bar, comedor, parqueadero VIP o merchandising).',
            'Fraude: Queda prohibida la creación de cuentas falsas, tutorías simuladas o anillos de calificación para acumular de forma fraudulenta ESPE Coins. La detección de fraudes anulará los saldos de forma inmediata.'
        ]
    },
    {
        id: 'propiedad',
        title: '6. Propiedad Intelectual y Conducta',
        content: `Todos los derechos de propiedad intelectual del software de Pilas! pertenecen a la Universidad de las Fuerzas Armadas ESPE y los desarrolladores del proyecto. Los materiales educativos compartidos se rigen bajo licencias de uso educativo libre.`,
        bullets: [
            'Prohibido el uso comercial de cualquier material descargado de la plataforma.',
            'Prohibido subir contenidos de carácter pornográfico, racista, difamatorio o que atente contra la normativa interna de la ESPE.',
            'El acoso académico, sexual o de cualquier tipo durante tutorías online o presenciales será causal de expulsión inmediata y reporte al Consejo Politécnico.'
        ]
    },
    {
        id: 'privacidad',
        title: '7. Privacidad y Protección de Datos',
        content: `En concordancia con la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador, Pilas! protege tu información.`,
        bullets: [
            'Los datos recolectados (nombres, récord, calificaciones) se utilizan únicamente para la gestión de tutorías y gamificación.',
            'No compartimos tu información personal con entidades externas fuera de la universidad.',
            'Tienes el derecho de solicitar el acceso, rectificación o eliminación de tus datos a través de Bienestar Estudiantil y Soporte.'
        ]
    }
];

const Terminos = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter sections based on query
    const filteredSections = SECTIONS.filter(sec => 
        sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.bullets.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleScrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="bg-slate-900 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-0 right-1/4 w-[30rem] h-[30rem] bg-pilas-blue/20 rounded-full blur-[120px] -z-10 animate-pulse duration-[8s]" />
            <div className="absolute bottom-20 left-1/4 w-[25rem] h-[25rem] bg-pilas-gold/10 rounded-full blur-[100px] -z-10 animate-pulse duration-[6s]" />

            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* === TITLE & SEARCH HEADER === */}
                <div className="text-center max-w-3xl mx-auto space-y-6">
                    <span className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-black bg-pilas-gold/10 text-pilas-gold border border-pilas-gold/20 uppercase tracking-widest">
                        Documento Oficial
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                        Términos y Condiciones de Uso
                    </h1>
                    <p className="text-sm text-slate-400 font-medium">
                        Por favor lee atentamente las reglas y políticas que garantizan el correcto funcionamiento y la seguridad de la comunidad académica Pilas!.
                    </p>

                    {/* Interactive Search Box */}
                    <div className="relative max-w-md mx-auto mt-6">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-slate-400 text-sm">🔍</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar en los términos (ej. ESPE Coins, tutor...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl focus:ring-2 focus:ring-pilas-gold focus:border-pilas-gold outline-none text-sm text-white placeholder-slate-500 font-bold transition-all backdrop-blur-sm"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white text-xs font-bold"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* === MAIN CONTENT GRID WITH SIDEBAR === */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Sidebar Menu */}
                    <aside className="lg:col-span-4 bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 space-y-4 lg:sticky lg:top-8 max-h-[calc(100vh-120px)] overflow-y-auto">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Índice del Documento</h3>
                        <nav className="space-y-1">
                            {filteredSections.map((sec) => (
                                <button
                                    key={sec.id}
                                    onClick={() => handleScrollToSection(sec.id)}
                                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-350 hover:bg-white/[0.04] hover:text-pilas-gold transition-all duration-150 block truncate border-l-2 border-transparent hover:border-pilas-gold/50"
                                >
                                    {sec.title}
                                </button>
                            ))}
                            {filteredSections.length === 0 && (
                                <p className="text-xs text-slate-500 italic px-3 py-2">Ninguna sección coincide</p>
                            )}
                        </nav>

                        <div className="pt-4 border-t border-white/5 space-y-2">
                            <p className="text-[10px] text-slate-500 font-medium">Última actualización: 22 de Junio, 2026</p>
                            <p className="text-[10px] text-slate-500 font-medium">Versión de la plataforma: v2.4.0 (Hardened)</p>
                        </div>
                    </aside>

                    {/* Right Clauses Section */}
                    <section className="lg:col-span-8 space-y-8">
                        {filteredSections.map((sec) => (
                            <div
                                key={sec.id}
                                id={sec.id}
                                className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-[2rem] p-8 space-y-6 shadow-md transition-all duration-300 relative scroll-mt-6"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-pilas-gold/5 rounded-full blur-2xl pointer-events-none" />
                                
                                <h2 className="text-xl sm:text-2xl font-black text-white border-b border-white/5 pb-4">
                                    {sec.title}
                                </h2>
                                
                                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                                    {sec.content}
                                </p>

                                <ul className="space-y-3 pl-2">
                                    {sec.bullets.map((b, idx) => (
                                        <li key={idx} className="flex gap-3 text-xs text-slate-450 leading-relaxed">
                                            <span className="text-pilas-gold font-bold select-none">•</span>
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {filteredSections.length === 0 && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 text-center space-y-4">
                                <span className="text-4xl">⚠️</span>
                                <h3 className="text-lg font-black text-white">No se encontraron resultados</h3>
                                <p className="text-sm text-slate-400 max-w-md mx-auto font-medium">
                                    No hay términos ni cláusulas que coincidan con tu búsqueda "{searchQuery}". Intenta con palabras clave como "ESPE Coins", "tutor", "conducta" o "privacidad".
                                </p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-5 py-2.5 bg-pilas-gold hover:bg-[#ffdf66] text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Mostrar Todo
                                </button>
                            </div>
                        )}
                    </section>

                </div>

            </div>
        </div>
    );
};

export default Terminos;
