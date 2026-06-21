import { useState, useEffect, useRef } from 'react';
import chatbotIcon from '../assets/Chatbot.png';

const FAQ_DATABASE = [
  // CATEGORÍA: GENERAL
  {
    keywords: ['registro', 'crear cuenta', 'registrarse', 'cuenta espe', 'correo institucional'],
    question: '¿Quiénes pueden registrarse en Pilas! y qué correo se requiere?',
    answer: 'La plataforma Pilas! es exclusiva para estudiantes de la Universidad de las Fuerzas Armadas ESPE. Para registrarte, debes usar obligatoriamente tu correo institucional con dominio @espe.edu.ec.',
    category: 'general'
  },
  {
    keywords: ['verificar', 'codigo de verificacion', 'activar cuenta', 'activacion', 'no me llega el codigo'],
    question: '¿Cómo verifico mi cuenta y cuánto dura el código?',
    answer: 'Al registrarte, recibirás un código de 6 dígitos en tu correo institucional. Este código expira en 24 horas. Si no te llega, revisa la carpeta de Spam o haz clic en "Reenviar código" en la pantalla de verificación.',
    category: 'general'
  },
  {
    keywords: ['contraseña', 'olvide', 'recuperar contraseña', 'restablecer', 'clave'],
    question: '¿Cómo puedo recuperar mi contraseña si la olvidé?',
    answer: 'En la pantalla de inicio de sesión (Login), haz clic en "¿Olvidaste tu contraseña?". Ingresa tu correo de la ESPE para recibir un código de recuperación temporal de 6 dígitos que expira en 5 minutos, con el cual podrás definir una nueva clave segura.',
    category: 'general'
  },
  // CATEGORÍA: TUTORÍAS
  {
    keywords: ['solicitar', 'pactar', 'pedir tutoria', 'agendar tutoria', 'agendar'],
    question: '¿Cómo puedo solicitar o pactar una tutoría?',
    answer: 'Ve a la sección "Buscar Tutor", filtra por materia o nivel, y entra al perfil del tutor que prefieras. Haz clic en el botón "Pactar Tutoría", selecciona la fecha, hora, duración (de 45 min a 2 horas) y la modalidad.',
    category: 'tutorias'
  },
  {
    keywords: ['aceptar', 'rechazar', 'solicitudes pendientes', 'aprobar tutoria'],
    question: '¿Cómo acepto o rechazo las solicitudes si soy mentor?',
    answer: 'Si tienes el rol de Mentor, verás una pestaña llamada "Solicitudes Pendientes" en la barra de navegación. Allí podrás ver las tutorías solicitadas por aprendices y decidir si las Aceptas (configurando el enlace virtual si es online) o las Rechazas.',
    category: 'tutorias'
  },
  {
    keywords: ['modalidad', 'online', 'presencial', 'zoom', 'meet', 'teams', 'lugar de encuentro'],
    question: '¿Qué modalidades de tutorías existen y cómo funcionan?',
    answer: 'Hay dos modalidades:\n1) **Presencial**: Se acuerda un lugar físico (ej. Biblioteca de la ESPE).\n2) **Online**: Se realiza por videoconferencia. El mentor configura la plataforma (Meet, Zoom, Teams) y provee el enlace y credenciales al aceptar la solicitud.',
    category: 'tutorias'
  },
  {
    keywords: ['reprogramar', 'cambiar fecha', 'cambiar hora', 'cambiar lugar', 'contrapropuesta'],
    question: '¿Cómo puedo reprogramar una tutoría agendada?',
    answer: 'Desde tu bandeja de mensajes o solicitudes, puedes proponer cambios en la fecha, hora o ubicación ingresando el motivo de la reprogramación. Existe un límite de 2 intentos de reprogramación mutuos; un tercer intento cancelará automáticamente la tutoría para evitar bucles.',
    category: 'tutorias'
  },
  // CATEGORÍA: WORKSPACE
  {
    keywords: ['workspace', 'mi tutoria', 'espacio de trabajo', 'slack', 'discord'],
    question: '¿Qué es el Espacio de Trabajo (Mi Tutoría) y qué herramientas tiene?',
    answer: 'Es un entorno interactivo exclusivo creado para cada tutoría aceptada. Incluye un chat bidireccional en tiempo real, un repositorio de archivos compartidos y secciones adicionales de anuncios, hoja de ruta y retos.',
    category: 'workspace'
  },
  {
    keywords: ['chat', 'mensajes en vivo', 'chat en tiempo real', 'escribir'],
    question: '¿Cómo funciona el chat en tiempo real del Workspace?',
    answer: 'Se conecta mediante WebSockets. Guarda un historial completo en MongoDB y permite a mentor y aprendiz escribirse en vivo, agrupando los mensajes continuos y marcando la disponibilidad de conexión del compañero en tiempo real.',
    category: 'workspace'
  },
  {
    keywords: ['repositorio', 'subir archivos', 'pdf', 'videos', 'limite de almacenamiento', 'compartir'],
    question: '¿Cómo funciona el repositorio de materiales y qué límites tiene?',
    answer: 'El mentor puede subir materiales (imágenes, videos, documentos de hasta 50MB c/u) con títulos y descripciones, almacenados en Cloudinary. El aprendiz tiene acceso de solo lectura para visualizar o descargar. Hay un límite de **300MB de espacio total** por tutoría.',
    category: 'workspace'
  },
  // CATEGORÍA: GAMIFICACIÓN y MONEDAS
  {
    keywords: ['espe-coins', 'monedas', 'coins', 'tienda', 'canjear', 'comprar', 'cupones'],
    question: '¿Qué son las ESPE-Coins y cómo puedo ganar y canjear recompensas?',
    answer: 'Son las monedas virtuales de la plataforma. Las ganas al verificar tu cuenta, calificar tutorías y completar mentorías. Puedes usarlas en la pestaña "Recompensas" para canjear cupones y beneficios (como comida o descuentos en la ESPE).',
    category: 'gamificacion'
  },
  {
    keywords: ['xp', 'nivel', 'subir de nivel', 'experiencia'],
    question: '¿Cómo gano puntos de experiencia (XP) y subo de nivel?',
    answer: 'Mentor y aprendiz ganan 100 XP base automáticamente al finalizar y marcar como completada una tutoría. A medida que acumulas XP, tu nivel se actualiza dinámicamente en tu perfil mostrando tu rango académico.',
    category: 'gamificacion'
  },
  {
    keywords: ['insignia', 'medallas', 'logros', 'desbloquear insignia', 'destacar insignias'],
    question: '¿Cómo desbloqueo insignias y elijo cuáles mostrar?',
    answer: 'Las insignias se ganan al cumplir metas (ej. completar tu primer perfil, dictar 5 tutorías, mantener 5 estrellas). Si tienes más de 4 insignias, aparecerá un botón de edición (lápiz) en tu perfil para elegir cuáles 4 destacar.',
    category: 'gamificacion'
  },
  // CATEGORÍA: SER TUTOR
  {
    keywords: ['ser tutor', 'postular', 'hacerse tutor', 'requisitos tutor', 'beneficios tutor'],
    question: '¿Cuáles son los requisitos y cómo me postulo para ser Tutor?',
    answer: 'Si eres aprendiz y quieres enseñar, entra a la sección "Sé Tutor", selecciona las materias que dominas y redacta tu motivación. Tu postulación será enviada al Administrador. Una vez aprobada, tu rol cambiará a Mentor, habilitándote a dictar tutorías.',
    category: 'tutor'
  },
  {
    keywords: ['semestre', 'postular', 'ser tutor', 'postular semestre', 'cuando puedo postular', 'nivel postular', 'ser tutor semestre'],
    question: '¿Desde qué semestre puedo postular para ser tutor?',
    answer: 'A partir de 4to Semestre puedes realizar tu postulación para ser tutor. Un administrador revisará tu solicitud y la aprobará.',
    category: 'tutor'
  },
  // CATEGORÍA: SOPORTE
  {
    keywords: ['soporte', 'ayuda', 'ticket', 'problema', 'error', 'reportar', 'contacto admin'],
    question: '¿Cómo reportar un problema técnico o solicitar ayuda al administrador?',
    answer: 'Si experimentas algún fallo o tienes dudas que no resuelva este bot, puedes ir a la sección "Soporte" (/tickets) en el menú del usuario. Allí puedes redactar un ticket describiendo el problema y el administrador te responderá directamente a la plataforma.',
    category: 'soporte'
  }
];

const CATEGORIES = [
  { id: 'general', label: '🔑 Registro y Cuenta', desc: 'Registro, validación y contraseñas' },
  { id: 'tutorias', label: '📅 Gestión de Tutorías', desc: 'Agendar, aceptar y modalidades' },
  { id: 'workspace', label: '💻 Workspace / Mi Tutoría', desc: 'Chat en vivo y compartir archivos' },
  { id: 'gamificacion', label: '🪙 ESPE-Coins y Logros', desc: 'Monedas, niveles y medallas destacadas' },
  { id: 'tutor', label: '🎓 Postular como Tutor', desc: 'Requisitos y proceso de postulación' },
  { id: 'soporte', label: '🛠️ Reportes y Soporte', desc: 'Crear tickets de soporte técnico' }
];

export default function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'category_list', 'chat'
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Inicializar conversación con saludo del bot
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: '¡Hola! Soy Pili 🤖, tu asistente virtual de Pilas! Tutorías. Estoy aquí para ayudarte a resolver cualquier duda sobre el sistema.',
          time: new Date()
        },
        {
          id: 'guide',
          sender: 'bot',
          text: 'Puedes seleccionar una de las siguientes categorías de ayuda o escribirme tu pregunta directamente en el chat a continuación.',
          time: new Date()
        }
      ]);
    }
  }, []);

  // Hacer scroll automático al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const addMessage = (sender, text) => {
    const newMessage = {
      id: Date.now().toString(),
      sender,
      text,
      time: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    addMessage('user', userText);
    setInputText('');

    // Procesar la pregunta escrita
    setTimeout(() => {
      processUserQuery(userText);
    }, 600);
  };

  const processUserQuery = (query) => {
    const cleanedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remover acentos
    
    const matchesList = [];

    FAQ_DATABASE.forEach(faq => {
      let matches = 0;
      faq.keywords.forEach(keyword => {
        const cleanedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const queryMatchesKeyword = cleanedQuery.includes(cleanedKeyword);
        const keywordMatchesQuery = cleanedQuery.length >= 3 && cleanedKeyword.includes(cleanedQuery);
        
        if (queryMatchesKeyword || keywordMatchesQuery) {
          matches++;
        }
      });

      if (matches > 0) {
        matchesList.push({ faq, score: matches });
      }
    });

    if (matchesList.length > 0) {
      // Sort by score descending
      matchesList.sort((a, b) => b.score - a.score);
      
      if (matchesList.length === 1) {
        const best = matchesList[0].faq;
        addMessage('bot', `**Pregunta:** ${best.question}\n\n${best.answer}`);
      } else {
        const topMatches = matchesList.slice(0, 3);
        let replyText = `Encontré las siguientes preguntas relacionadas con tu búsqueda:\n\n`;
        topMatches.forEach(({ faq }) => {
          replyText += `• **${faq.question}**\n${faq.answer}\n\n`;
        });
        addMessage('bot', replyText.trim());
      }
    } else {
      addMessage('bot', 'Lo siento, no encontré una respuesta exacta a tu pregunta. 😅\n\nPrueba utilizando palabras clave más cortas (como "monedas", "tutor", "zoom", "chat", "workspace") o selecciona una de las categorías temáticas en los botones de arriba.');
    }
  };

  const handleSelectCategory = (categoryId) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    setSelectedCategoryId(categoryId);
    
    // Imprimir mensaje del usuario simulado
    addMessage('user', `Quiero saber sobre: ${category.label}`);

    setTimeout(() => {
      // Filtrar preguntas de la categoría
      const filteredFaqs = FAQ_DATABASE.filter(faq => faq.category === categoryId);
      
      let replyText = `Aquí tienes las preguntas frecuentes sobre **${category.label}**:\n\n`;
      filteredFaqs.forEach((faq, index) => {
        replyText += `• **${faq.question}**\n${faq.answer}\n\n`;
      });

      addMessage('bot', replyText);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'bot',
        text: '¡Conversación reiniciada! ¿En qué otra cosa te puedo ayudar hoy? 🤖',
        time: new Date()
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Botón flotante del chatbot */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 group border-2 border-white/80 bg-white overflow-hidden"
        >
          {/* Anillos de pulso animados */}
          <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-20 animate-ping group-hover:hidden"></span>
          <img 
            src={chatbotIcon} 
            alt="Pili Chatbot" 
            className="w-full h-full object-cover scale-[1.6] group-hover:rotate-6 transition-transform duration-300"
          />
        </button>
      )}

      {/* Ventana de Chat Expandida */}
      {isOpen && (
        <div className="w-[380px] h-[540px] md:w-[400px] md:h-[580px] rounded-2xl bg-white/90 backdrop-blur-lg border border-white/40 shadow-2xl flex flex-col overflow-hidden animate-fade-in transition-all duration-300">
          
          {/* Cabecera del Chatbot */}
          <div className="p-4 bg-gradient-to-r from-[#0f592f] to-[#197540] text-white flex items-center justify-between border-b border-emerald-800">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center border border-white/50 overflow-hidden">
                <img src={chatbotIcon} alt="Avatar Pili" className="w-full h-full object-cover scale-[1.6]" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border border-emerald-900"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Pili - Asistente Virtual</h3>
                <p className="text-[11px] text-emerald-250 flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-300 mr-1.5 animate-pulse"></span>
                  En línea | FAQ Pilas!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleResetChat} 
                title="Reiniciar chat" 
                className="p-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors text-white/80 hover:text-white"
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors font-bold text-white/90 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-2`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                    <img src={chatbotIcon} alt="Bot" className="w-full h-full object-cover scale-[1.6]" />
                  </div>
                )}
                <div 
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-line
                    ${msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-[#0f592f] to-[#156b3b] text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-150 rounded-tl-none'
                    }`}
                >
                  {/* Renderizado básico de Markdown simple para negritas */}
                  {msg.text.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-[#0f592f] dark:text-white">{chunk}</strong> : chunk)}
                  
                  {/* Timestamp discreto */}
                  <span className={`block text-[9px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Botones de Categorías Rápidas */}
          <div className="p-3 border-t border-gray-200 bg-white/65 flex overflow-x-auto space-x-2 scrollbar-none">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => handleSelectCategory(category.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#0f592f] border border-emerald-100 hover:bg-[#0f592f] hover:text-white transition-all duration-300 shadow-sm active:scale-95"
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Input de Texto */}
          <form 
            onSubmit={handleSendMessage} 
            className="p-3 bg-white border-t border-gray-200 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Hazme una pregunta sobre Pilas!..."
              className="flex-grow px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0f592f] focus:border-transparent bg-slate-50 hover:bg-slate-100/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-[#0f592f] disabled:bg-gray-300 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-4 h-4 transform rotate-45 -translate-x-0.5 translate-y-0.5"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
