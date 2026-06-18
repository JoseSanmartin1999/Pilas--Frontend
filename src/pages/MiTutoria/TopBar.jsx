import React, { useState } from 'react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';

const BACKEND_URL = 'https://pilas-backend.onrender.com';

/**
 * TopBar — Cabecera dinámica del workspace
 * Muestra: materia + compañero | progress bar | botón de hito
 */
const TopBar = ({ mentorship, currentUser, onCloseMentorship }) => {
    const { showNotification } = useNotification();
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [closeType, setCloseType] = useState('finalizada'); // 'finalizada' o 'cancelada'
    
    // Opciones del motivo de cancelación
    const [cancelReasonOpt, setCancelReasonOpt] = useState('Nunca se presentó a la tutoría');
    const [customCancelReason, setCustomCancelReason] = useState('');

    // Determinar quién es el compañero (el otro participante)
    const isMentor = currentUser?.id === mentorship?.mentor_id;
    const partnerName = isMentor ? mentorship?.apprentice_name : mentorship?.mentor_name;
    const partnerRole = isMentor ? 'Aprendiz' : 'Mentor';

    // Progreso simulado — en una versión futura vendría de la DB
    const progress = 15;

    const handleHito = () => {
        showNotification('🏆 ¡Hito marcado! Esta funcionalidad se conectará con el sistema de gamificación próximamente.', 'info');
    };

    const handleCloseTutoria = async () => {
        setIsClosing(true);
        const reasonToSend = closeType === 'cancelada'
            ? (cancelReasonOpt === 'Otro' ? customCancelReason.trim() : cancelReasonOpt)
            : null;

        try {
            const { data } = await axios.put(`${BACKEND_URL}/api/mentorships/${mentorship.id}/close`, {
                userId: currentUser?.id,
                closeType,
                cancellationReason: reasonToSend
            });
            showNotification(`🔒 ${data.message}`, 'success');
            if (onCloseMentorship) {
                onCloseMentorship(mentorship.id, data.status);
            }
            setShowConfirmClose(false);
        } catch (err) {
            console.error('Error al cerrar la tutoría:', err);
            const errMsg = err.response?.data?.error || 'No se pudo cerrar la tutoría.';
            showNotification(`❌ ${errMsg}`, 'error');
        } finally {
            setIsClosing(false);
        }
    };

    // Validar si el botón de confirmar está deshabilitado
    const isConfirmDisabled = isClosing || (
        closeType === 'cancelada' && 
        cancelReasonOpt === 'Otro' && 
        !customCancelReason.trim()
    );

    return (
        <div className="flex-shrink-0 h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-6 shadow-sm z-10 relative">
            {/* IZQUIERDA — Materia y compañero */}
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex flex-col">
                    <span className="text-[#1e3a8a] font-black text-sm leading-tight tracking-tight flex items-center gap-1.5">
                        {mentorship?.subject_name || 'Tutoría'}
                        {mentorship?.status === 'COMPLETADA' && (
                            <span className="text-[8px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-red-200 animate-pulse">
                                Cerrada
                            </span>
                        )}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">
                            con
                        </span>
                        <span className="text-[10px] text-gray-600 font-bold">
                            {partnerName}
                        </span>
                        <span className="text-[8px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">
                            {partnerRole}
                        </span>
                    </div>
                </div>

                {/* Separador */}
                <div className="w-px h-8 bg-gray-100" />
            </div>

            {/* CENTRO — Progress Bar */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex-shrink-0 hidden md:block">
                    Progreso
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden max-w-xs">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-pilas-gold to-yellow-400 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="text-[10px] font-black text-pilas-gold flex-shrink-0">
                    {progress}%
                </span>
                <span className="text-[9px] text-gray-300 font-medium hidden lg:block flex-shrink-0">
                    Semana 1 de 16
                </span>
            </div>

            {/* DERECHA — Botones de acción */}
            <div className="flex items-center gap-3 flex-shrink-0">
                {mentorship?.status === 'ACEPTADA' && (
                    <button
                        id="btn-marcar-hito"
                        onClick={handleHito}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-pilas-gold rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1a3270] hover:shadow-lg hover:shadow-[#1e3a8a]/20 hover:scale-[1.02] transition-all duration-200"
                    >
                        <span>🏆</span>
                        <span className="hidden sm:block">Marcar Hito</span>
                    </button>
                )}
                {mentorship?.status === 'ACEPTADA' && isMentor && (
                    <button
                        id="btn-cerrar-tutoria"
                        onClick={() => {
                            setCloseType('finalizada');
                            setCancelReasonOpt('Nunca se presentó a la tutoría');
                            setCustomCancelReason('');
                            setShowConfirmClose(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 border border-red-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 shadow-sm"
                    >
                        <span>🔒</span>
                        <span className="hidden sm:block">Cerrar Tutoría</span>
                    </button>
                )}
            </div>

            {/* ===== MODAL DE CONFIRMACIÓN DE CIERRE CON RAZÓN ===== */}
            {showConfirmClose && (
                <div className="fixed inset-0 bg-[#0f1f3d]/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in animate-duration-200" style={{ margin: 0 }}>
                    <div className="bg-white rounded-[2.2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full mx-4 space-y-5 transform scale-95 transition-all duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner border border-red-100 flex-shrink-0">
                            🔒
                        </div>
                        
                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-[#1e3a8a] tracking-tight">
                                ¿Cerrar esta Tutoría?
                            </h3>
                            <p className="text-[11px] text-gray-400 font-medium">
                                Por favor selecciona la razón del cierre de esta tutoría.
                            </p>
                        </div>

                        {/* Opciones tipo Tarjeta */}
                        <div className="space-y-2.5">
                            <label className={`flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${closeType === 'finalizada' ? 'border-[#1e3a8a] bg-blue-50/10' : 'border-gray-100 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="closeReason"
                                    value="finalizada"
                                    checked={closeType === 'finalizada'}
                                    onChange={() => setCloseType('finalizada')}
                                    className="mt-1 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                                />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black text-[#1e3a8a] uppercase tracking-wide">Tutoría Finalizada</p>
                                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                        El aula pasará a estado inactivo (solo lectura) durante **2 días** para consulta y luego se eliminará.
                                    </p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${closeType === 'cancelada' ? 'border-red-500 bg-red-50/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="closeReason"
                                    value="cancelada"
                                    checked={closeType === 'cancelada'}
                                    onChange={() => setCloseType('cancelada')}
                                    className="mt-1 text-red-500 focus:ring-red-500"
                                />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black text-red-600 uppercase tracking-wide">Tutoría Cancelada</p>
                                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                        La tutoría ha sido interrumpida. El aula y sus accesos se **eliminarán de forma inmediata**.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* MOTIVO DE CANCELACIÓN (Solo si selecciona cancelada) */}
                        {closeType === 'cancelada' && (
                            <div className="space-y-2.5 text-left border-t border-gray-100 pt-4 animate-in slide-in-from-top-2 duration-200">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                                    Motivo de Cancelación *
                                </label>
                                <select
                                    value={cancelReasonOpt}
                                    onChange={(e) => setCancelReasonOpt(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-[#1e3a8a] font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 cursor-pointer"
                                >
                                    <option value="Nunca se presentó a la tutoría">Nunca se presentó a la tutoría</option>
                                    <option value="No pudimos reprogramar">No pudimos reprogramar</option>
                                    <option value="Problemas de logística">Problemas de logística</option>
                                    <option value="Otro">Otro (Especificar motivo)</option>
                                </select>

                                {cancelReasonOpt === 'Otro' && (
                                    <textarea
                                        value={customCancelReason}
                                        onChange={(e) => setCustomCancelReason(e.target.value)}
                                        placeholder="Por favor explica el motivo detallado de la cancelación..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none animate-in slide-in-from-top-1 duration-150"
                                        maxLength={250}
                                        required
                                    />
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirmClose(false)}
                                disabled={isClosing}
                                className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-2xl font-bold text-[10px] uppercase tracking-wider hover:bg-gray-50 transition-all disabled:opacity-40"
                            >
                                Cancelar
                            </button>
                            <button
                                id="btn-confirmar-cierre-tutoria"
                                onClick={handleCloseTutoria}
                                disabled={isConfirmDisabled}
                                className={`flex-1 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 active:scale-95 hover:shadow-lg ${closeType === 'cancelada' ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-600/20' : 'bg-[#1e3a8a] hover:bg-[#1a3270] hover:shadow-[#1e3a8a]/20'}`}
                            >
                                {isClosing ? 'Procesando...' : closeType === 'cancelada' ? 'Cancelar Aula' : 'Finalizar Aula'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopBar;
