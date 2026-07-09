import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://pilas-backend.onrender.com';

/**
 * ChatView — Chat en tiempo real con Socket.IO
 *
 * Protocolo del backend (chatSocket.js del compañero):
 *  - Emit: 'join_mentorship_room'  payload: mentorshipId
 *  - Emit: 'send_message'          payload: { mentorshipId, senderId, message }
 *  - On:   'receive_message'       payload: ChatMessage document (Mongoose)
 *
 * REST:
 *  - GET /api/chat/:mentorshipId   → historial ordenado por createdAt asc
 */
const ChatView = ({ mentorship, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [typingUsers, setTypingUsers] = useState({});

    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Resolver el nombre del remitente a partir del sender_id
    const getSenderName = useCallback((senderId) => {
        if (senderId === currentUser?.id) return currentUser?.full_name || 'Tú';
        // El compañero es el otro participante de la mentoría
        const isMentor = currentUser?.id === mentorship?.mentor_id;
        return isMentor ? mentorship?.apprentice_name : mentorship?.mentor_name;
    }, [currentUser, mentorship]);

    // --- Cargar historial via REST ---
    useEffect(() => {
        if (!mentorship?.id) return;

        const loadHistory = async () => {
            try {
                setIsLoadingHistory(true);
                const { data } = await axios.get(`${BACKEND_URL}/api/chat/${mentorship.id}`);
                setMessages(data);
            } catch (err) {
                console.error('Error cargando historial del chat:', err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadHistory();
    }, [mentorship?.id]);

    // --- Conectar Socket.IO ---
    useEffect(() => {
        if (!mentorship?.id) return;

        const socket = io(BACKEND_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            // Unirse a la sala de esta mentoría
            socket.emit('join_mentorship_room', mentorship.id);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Recibir nuevo mensaje
        socket.on('receive_message', (newMsg) => {
            setMessages((prev) => [...prev, newMsg]);
            // Limpiar indicador de escritura del remitente
            setTypingUsers((prev) => {
                const next = { ...prev };
                delete next[newMsg.sender_id];
                return next;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [mentorship?.id]);

    // --- Auto-scroll al último mensaje ---
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    // --- Enviar mensaje ---
    const sendMessage = () => {
        const text = inputText.trim();
        if (!text || !socketRef.current?.connected) return;

        socketRef.current.emit('send_message', {
            mentorshipId: mentorship.id,
            senderId: currentUser.id,
            message: text,
        });

        setInputText('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // --- Agrupar mensajes consecutivos del mismo sender ---
    const groupedMessages = messages.reduce((groups, msg, index) => {
        const prev = messages[index - 1];
        const isSameSender = prev && prev.sender_id === msg.sender_id;
        const timeDiff = prev
            ? new Date(msg.createdAt) - new Date(prev.createdAt)
            : Infinity;
        const isGrouped = isSameSender && timeDiff < 5 * 60 * 1000; // 5 min

        groups.push({ ...msg, isGrouped });
        return groups;
    }, []);

    // --- Formatear timestamp ---
    const formatTime = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        const date = new Date(ts);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hoy';
        if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
        return date.toLocaleDateString('es', { day: 'numeric', month: 'long' });
    };

    // Determinar si necesitamos mostrar separador de fecha
    const needsDateSeparator = (msg, index) => {
        if (index === 0) return true;
        const prev = messages[index - 1];
        return new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
    };

    return (
        <div className="flex flex-col h-full bg-[#f8faf9]/70">

            {/* === CABECERA DEL CHAT === */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 bg-white border-b border-gray-100/70 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl flex-shrink-0">💬</span>
                    <div className="min-w-0">
                        <p className="font-extrabold text-[#0f592f] text-xs sm:text-sm tracking-tight">Canal Directo</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            Chat en Tiempo Real · {mentorship?.subject_name}
                        </p>
                    </div>
                </div>

                {/* Indicador de conexión */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50/80 rounded-full border border-gray-150 flex-shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-wider ${isConnected ? 'text-emerald-700' : 'text-red-500'} hidden sm:inline`}>
                        {isConnected ? 'En Línea' : 'Sin Conexión'}
                    </span>
                </div>
            </div>

            {/* === ÁREA DE MENSAJES === */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-1">
                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                        <div className="w-6 h-6 border-2 border-[#0f592f] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Cargando Chat...</p>
                    </div>
                ) : groupedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40 select-none">
                        <div className="text-5xl animate-bounce">👋</div>
                        <div className="text-center space-y-1 max-w-xs">
                            <p className="font-black text-[#0f592f] text-sm">¡Saluda a tu compañero!</p>
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                Este es el canal directo con {mentorship?.mentor_name || mentorship?.apprentice_name}.
                            </p>
                        </div>
                    </div>
                ) : (
                    groupedMessages.map((msg, index) => {
                        const isOwn = msg.sender_id === currentUser?.id;
                        const senderName = getSenderName(msg.sender_id);
                        const showDate = needsDateSeparator(msg, index);
                        const isNextGrouped = messages[index + 1] && messages[index + 1].sender_id === msg.sender_id;

                        // Determinar los bordes redondeados según emisor y si está agrupado
                        const bubbleRadius = isOwn
                            ? `rounded-[1.25rem] rounded-tr-sm ${msg.isGrouped ? 'rounded-tr-[1.25rem]' : ''} ${isNextGrouped ? 'rounded-br-sm' : ''}`
                            : `rounded-[1.25rem] rounded-tl-sm ${msg.isGrouped ? 'rounded-tl-[1.25rem]' : ''} ${isNextGrouped ? 'rounded-bl-sm' : ''}`;

                        return (
                            <Fragment key={msg._id || `msg-${index}`}>
                                {/* Separador de fecha */}
                                {showDate && (
                                    <div className="flex items-center gap-3 py-4 select-none">
                                        <div className="flex-1 h-px bg-gray-150/70" />
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-3 py-1 bg-white rounded-full border border-gray-150 shadow-sm flex-shrink-0">
                                            {formatDate(msg.createdAt)}
                                        </span>
                                        <div className="flex-1 h-px bg-gray-150/70" />
                                    </div>
                                )}

                                {/* Burbuja de mensaje */}
                                <div
                                    className={`
                                        flex items-end gap-2.5
                                        ${isOwn ? 'flex-row-reverse' : 'flex-row'}
                                        ${msg.isGrouped ? 'mt-0.5' : 'mt-3.5'}
                                    `}
                                >
                                    {/* Avatar — solo si no está agrupado y no es propio */}
                                    {!isOwn && (
                                        <div className={`flex-shrink-0 ${msg.isGrouped ? 'w-8 opacity-0 pointer-events-none' : 'w-8'}`}>
                                            <div className="w-8 h-8 bg-emerald-550/10 border border-emerald-500/25 rounded-xl flex items-center justify-center text-[#0f592f] text-xs font-black shadow-sm">
                                                {senderName?.[0] || '?'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contenido */}
                                    <div className={`flex flex-col gap-0.5 max-w-[80%] sm:max-w-[70%] md:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                        {/* Nombre — solo si no está agrupado */}
                                        {!msg.isGrouped && !isOwn && (
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1.5 mb-0.5">
                                                {senderName}
                                            </span>
                                        )}

                                        {/* Burbuja */}
                                        <div
                                            className={`
                                                px-4 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all duration-150
                                                ${isOwn
                                                    ? 'bg-[#0f592f] text-white'
                                                    : 'bg-white text-gray-800 border border-gray-150'
                                                }
                                                ${bubbleRadius}
                                            `}
                                        >
                                            <p className="text-xs leading-relaxed break-words whitespace-pre-wrap font-medium">
                                                {msg.message}
                                            </p>
                                        </div>

                                        {/* Timestamp */}
                                        {!isNextGrouped && (
                                            <span className={`text-[7px] text-gray-350 px-1.5 font-bold uppercase tracking-wide mt-1 block ${isOwn ? 'text-right' : 'text-left'}`}>
                                                {formatTime(msg.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Fragment>
                        );
                    })
                )}

                {/* Indicador de "está escribiendo" */}
                {Object.keys(typingUsers).length > 0 && (
                    <div className="flex items-end gap-2.5 mt-3.5">
                        <div className="w-8 h-8 bg-emerald-550/10 border border-emerald-500/25 rounded-xl flex items-center justify-center text-[#0f592f] text-xs font-black flex-shrink-0 shadow-sm animate-pulse">
                            {Object.values(typingUsers)[0]?.[0] || '?'}
                        </div>
                        <div className="bg-white border border-gray-150 px-3.5 py-2.5 rounded-[1.25rem] rounded-bl-sm shadow-sm flex items-center">
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-[#0f592f]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-[#0f592f]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-[#0f592f]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Anchor para auto-scroll */}
                <div ref={bottomRef} />
            </div>

            {/* === INPUT DE MENSAJE === */}
            <div className="flex-shrink-0 p-4 bg-white/70 backdrop-blur-md border-t border-gray-100/60">
                <div className="flex items-end gap-2.5 bg-gray-50/80 border border-gray-200 focus-within:border-[#0f592f] focus-within:bg-white focus-within:shadow-[0_4px_16px_rgba(15,89,47,0.04)] transition-all duration-200 p-1.5 pl-4 rounded-[1.6rem]">
                    <textarea
                        ref={inputRef}
                        id="chat-input"
                        rows={1}
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            // Auto-resize
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={mentorship?.status === 'COMPLETADA' ? 'La tutoría está cerrada. No se pueden enviar más mensajes.' : isConnected ? 'Escribe un mensaje...' : 'Conectando...'}
                        disabled={!isConnected || isLoadingHistory || mentorship?.status === 'COMPLETADA'}
                        className="flex-1 bg-transparent text-xs text-gray-850 placeholder-gray-400 focus:outline-none resize-none py-2 min-h-[36px] max-h-[120px] font-medium leading-relaxed disabled:opacity-40"
                        style={{ height: '36px' }}
                    />

                    {/* Botón enviar */}
                    <button
                        id="btn-send-message"
                        onClick={sendMessage}
                        disabled={!inputText.trim() || !isConnected || mentorship?.status === 'COMPLETADA'}
                        className="flex-shrink-0 w-9 h-9 bg-[#0f592f] text-pilas-gold rounded-xl flex items-center justify-center hover:bg-[#0a4624] hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 shadow-md shadow-[#0f592f]/10 m-0.5"
                        title="Enviar (Enter)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                </div>

                {/* Ayuda del teclado o aviso de solo lectura */}
                {mentorship?.status === 'COMPLETADA' ? (
                    <p className="text-[7px] text-red-500 text-center mt-2 font-black uppercase tracking-widest animate-pulse">
                        El chat se encuentra en modo de solo lectura.
                    </p>
                ) : (
                    <p className="text-[7px] text-gray-350 text-center mt-2 font-bold uppercase tracking-wider">
                        Enter para enviar · Shift+Enter para nueva línea
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatView;
