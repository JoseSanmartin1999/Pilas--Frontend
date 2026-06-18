import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const Profile = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para Pactar Tutoría
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [mentorshipData, setMentorshipData] = useState({ 
    subject_id: '', 
    date: '', 
    time: '', 
    objectives: '', 
    modality: 'Presencial', 
    meeting_place: '', 
    platform: '',
    estimated_duration: '1 hora'
  });

  // Estados para la edición (RF#003)
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState({ bio: '', current_semester: '', materias: [] });
  const [nuevaFoto, setNuevaFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);

  // Control de accesos
  const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const profileId = id || currentUser.id;
  const isOwnProfile = String(currentUser.id) === String(profileId);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`https://pilas-backend.onrender.com/api/users/profile/${profileId}`);
        setUser(res.data);
        // Inicializamos los datos de edición con el formato correcto
        setEditData({
          bio: res.data.bio || '',
          current_semester: res.data.current_semester || 1,
          materias: res.data.materias ? res.data.materias.map(m => m.id) : []
        });
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profileId]);

  // Cargamos todas las materias disponibles reactivamente según el semestre actual (RF#007)
  useEffect(() => {
    const sem = parseInt(editData.current_semester, 10);
    if (isNaN(sem) || sem < 1) return;

    const fetchSubjects = async () => {
      try {
        const subjRes = await axios.get(`https://pilas-backend.onrender.com/api/subjects?semester=${sem}`);
        setAllSubjects(subjRes.data);
      } catch (err) {
        console.error("Error al cargar materias para el semestre:", err);
      }
    };
    fetchSubjects();
  }, [editData.current_semester]);

  const handlePactarTutoria = async (e) => {
    e.preventDefault();
    if (!mentorshipData.subject_id || !mentorshipData.date || !mentorshipData.time || !mentorshipData.objectives.trim()) {
      showNotification("Por favor completa todos los campos obligatorios", "warning");
      return;
    }

    // Validación de fecha y hora futura (RF: no menor a la actual, hora mayor si es el mismo día)
    const now = new Date();
    const selectedDateTime = new Date(`${mentorshipData.date}T${mentorshipData.time}:00`);
    if (selectedDateTime < now) {
      showNotification("La fecha y hora de la tutoría no pueden ser anteriores a la fecha y hora actual", "warning");
      return;
    }

    const scheduled_date = `${mentorshipData.date}T${mentorshipData.time}:00`;

    try {
      const payload = {
        mentor_id: user.id,
        apprentice_id: currentUser.id,
        subject_id: mentorshipData.subject_id,
        scheduled_date,
        objectives: mentorshipData.objectives,
        modality: mentorshipData.modality,
        meeting_place: mentorshipData.modality === 'Presencial' ? mentorshipData.meeting_place : null,
        platform: mentorshipData.modality === 'Online' ? mentorshipData.platform : null,
        estimated_duration: mentorshipData.estimated_duration
      };

      await axios.post('https://pilas-backend.onrender.com/api/mentorships', payload);
      showNotification("¡Tutoría solicitada exitosamente!", "success");
      setShowMentorshipModal(false);
      setMentorshipData({ 
        subject_id: '', 
        date: '', 
        time: '', 
        objectives: '', 
        modality: 'Presencial', 
        meeting_place: '', 
        platform: '',
        estimated_duration: '1 hora'
      });
    } catch (err) {
      console.error(err);
      showNotification("Hubo un error al solicitar la tutoría", "error");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo (debe ser imagen)
    if (!file.type.startsWith('image/')) {
      showNotification("El archivo seleccionado debe ser una imagen.", "warning");
      e.target.value = '';
      setNuevaFoto(null);
      setPreviewFoto(null);
      return;
    }

    // Validar tamaño máximo: 2 MB
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showNotification("La imagen supera el tamaño máximo permitido de 2 MB.", "warning");
      e.target.value = '';
      setNuevaFoto(null);
      setPreviewFoto(null);
      return;
    }

    // Validar dimensiones: Min 200x200px, Max 2000x2000px
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const minWidth = 200;
      const minHeight = 200;
      const maxWidth = 2000;
      const maxHeight = 2000;

      if (img.width < minWidth || img.height < minHeight) {
        showNotification(`Las dimensiones de la imagen son muy pequeñas (${img.width}x${img.height}px). El mínimo permitido es ${minWidth}x${minHeight}px.`, "warning");
        e.target.value = '';
        setNuevaFoto(null);
        setPreviewFoto(null);
      } else if (img.width > maxWidth || img.height > maxHeight) {
        showNotification(`Las dimensiones de la imagen son muy grandes (${img.width}x${img.height}px). El máximo permitido es ${maxWidth}x${maxHeight}px.`, "warning");
        e.target.value = '';
        setNuevaFoto(null);
        setPreviewFoto(null);
      } else {
        setNuevaFoto(file);
        setPreviewFoto(URL.createObjectURL(file));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      showNotification("El archivo de imagen está dañado o no es válido.", "error");
      e.target.value = '';
      setNuevaFoto(null);
      setPreviewFoto(null);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Filtramos las materias para que solo se envíen las que pertenecen al semestre actual o inferiores
    const targetSemester = parseInt(editData.current_semester, 10);
    const validSubjectIds = allSubjects
      .filter(sub => sub.semester <= targetSemester)
      .map(sub => sub.id);
    const filteredMaterias = editData.materias.filter(id => validSubjectIds.includes(id));

    const data = new FormData();
    data.append('bio', editData.bio);
    data.append('current_semester', editData.current_semester);
    data.append('materias', JSON.stringify(filteredMaterias));
    data.append('profile_photo_url', user.profile_photo_url || '');
    if (nuevaFoto) data.append('foto_perfil', nuevaFoto);

    try {
      const res = await axios.put(`https://pilas-backend.onrender.com/api/users/profile/${profileId}`, data);

      const updatedMaterias = res.data.materias || [];

      // Actualizamos el estado global con la respuesta del servidor (RF#003)
      setUser({
        ...user,
        bio: editData.bio,
        current_semester: editData.current_semester,
        profile_photo_url: res.data.fotoUrl || user.profile_photo_url,
        materias: updatedMaterias
      });

      // Sincronizamos con el almacenamiento local/sesión si es el propio perfil
      if (isOwnProfile) {
        const savedStorage = localStorage.getItem('user') ? localStorage : sessionStorage;
        const userObj = JSON.parse(savedStorage.getItem('user') || '{}');
        userObj.bio = editData.bio;
        userObj.current_semester = editData.current_semester;
        userObj.materias = updatedMaterias;
        if (res.data.fotoUrl) {
          userObj.profile_photo_url = res.data.fotoUrl;
        }
        savedStorage.setItem('user', JSON.stringify(userObj));
      }

      setEditData(prev => ({
        ...prev,
        materias: updatedMaterias.map(m => m.id)
      }));

      setShowModal(false);
      showNotification("¡Perfil actualizado con éxito!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Error al actualizar el perfil", "error");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3a5a]"></div>
    </div>
  );

  if (!user) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 text-center p-8">
      <div>
        <div className="text-6xl mb-4">🔌</div>
        <h2 className="text-2xl font-black text-[#1a3a5a] mb-2">Error de conexión</h2>
        <p className="text-gray-500 font-medium">No se pudo cargar el perfil del usuario. Por favor verifica que el servidor esté activo.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* COLUMNA IZQUIERDA: Identidad e Info (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm ring-1 ring-gray-900/5 text-center relative group">
            {isOwnProfile && (
              <button
                onClick={() => setShowModal(true)}
                className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-[#ffcc00] hover:text-[#1a3a5a] transition-all opacity-0 group-hover:opacity-100"
                title="Editar Perfil"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10z" /></svg>
              </button>
            )}
            <img
              src={user.profile_photo_url || '/default-avatar.png'}
              className="w-40 h-40 rounded-[2rem] mx-auto object-cover shadow-md mb-6 ring-4 ring-gray-50"
              alt="Perfil"
            />
            <h2 className="mt-4 font-extrabold text-[#1a3a5a] text-2xl leading-tight">
              {user.full_name || `${user.nombre} ${user.apellidos}`}
            </h2>

            <div className="mt-8 space-y-3 text-sm font-medium text-gray-600 text-left bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50">
              <div className="flex justify-between items-center"><span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Semestre</span> <span className="font-bold text-[#1a3a5a] bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{user.current_semester || '1'}°</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Carrera</span> <span className="truncate max-w-[120px] text-right font-medium" title={user.career || user.carrera}>{user.career || user.carrera || '-'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Institución</span> <span className="font-medium text-gray-800">{user.institution || 'ESPE'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Rol</span> <span className="bg-[#1a3a5a]/10 text-[#1a3a5a] font-bold px-3 py-1 rounded-lg text-xs tracking-wide">{user.role}</span></div>
            </div>
          </div>

          {/* Tarjeta de Nivel y XP (Sólo si no es ADMIN) */}
          {user.role !== 'ADMIN' && (
            <div className="bg-[#1a3a5a] p-6 rounded-[2rem] text-white shadow-sm ring-1 ring-gray-900/5 text-left relative overflow-hidden group">
              <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#ffcc00] flex items-center gap-1">
                  <span>⭐</span> Nivel {user.level || 1}
                </span>
                <span className="text-xs font-black text-indigo-200">{(user.xp || 0) % 500} / 500 XP</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-[#ffcc00] rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(((user.xp || 0) % 500) / 500 * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Acumulado</span>
                <span className="text-xs font-black text-white">{user.xp || 0} XP</span>
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-[2rem] shadow-sm ring-1 ring-gray-900/5 group">
            <h4 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest flex items-center mb-5">
              <span className="w-2 h-4 bg-gradient-to-b from-[#ffcc00] to-yellow-600 rounded-full mr-3"></span> Materias Impartidas
              {isOwnProfile && (
                <button
                  onClick={() => setShowModal(true)}
                  className="ml-auto text-gray-300 hover:text-[#ffcc00] transition-colors opacity-0 group-hover:opacity-100"
                  title="Editar Materias"
                >
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10z" /></svg>
                </button>
              )}
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.materias?.length > 0 ? user.materias.map((m, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gray-50 border border-gray-200 text-gray-700 hover:border-[#ffcc00] hover:bg-yellow-50/30 transition-colors uppercase">
                  {m.name || m}
                </span>
              )) : <p className="text-gray-400 text-xs italic">Sin materias registradas</p>}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm ring-1 ring-gray-900/5">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center mb-5">
              <span className="w-2 h-4 bg-gradient-to-b from-[#4ade80] to-green-600 rounded-full mr-3"></span> Próximas Tutorías
            </h4>
            <div className="space-y-4">
              {user.tutorias?.length > 0 ? (
                user.tutorias.map((t, idx) => {
                  const dateObj = new Date(t.scheduled_date);
                  const fecha = dateObj.toLocaleDateString();
                  const hora = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={idx} className="p-5 border-l-4 border-pilas-gold bg-gray-50 rounded-2xl flex flex-col space-y-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-black text-[#1a3a5a]">{fecha}</p>
                        <p className="text-[10px] font-black text-gray-800 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100">{hora}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-[#1a3a5a] uppercase truncate mb-1">{t.materia}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {t.modality === 'Presencial' ? '📍 ' + (t.meeting_place || 'Lugar por definir') : '💻 ' + (t.platform || 'Online')}
                          </span>
                        </div>
                        {t.modality === 'Online' && (t.meeting_link || t.zoom_code) && (
                          <div className="mt-2 pt-2 border-t border-gray-200/50">
                            <a 
                              href={t.meeting_link?.startsWith('http') ? t.meeting_link : `https://${t.meeting_link}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[9px] font-black text-pilas-gold hover:text-yellow-600 uppercase tracking-widest flex items-center gap-1"
                            >
                              🚀 Unirse a sesión
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] font-bold text-gray-400 text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 uppercase tracking-widest">Sin sesiones</p>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Puntuación, Logros y Comentarios (8/12) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">

          {/* BARRA SUPERIOR: SCORE */}
          <div className="bg-gradient-to-r from-[#1a3a5a] to-[#2a4a7a] p-8 rounded-[2rem] shadow-lg flex items-center justify-between overflow-hidden relative">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="flex flex-col relative z-10">
              <span className="text-lg font-bold text-white/80 uppercase tracking-widest">Puntuación</span>
              {user.role === 'MENTOR' && (
                <span className="text-xs font-semibold text-yellow-300 tracking-wider mt-0.5">
                  Calificación Promedio: {parseFloat(Number(user.score || 5.0).toFixed(1))} / 5.0
                </span>
              )}
            </div>
            <div className="flex space-x-2 text-[#ffcc00] text-4xl drop-shadow-md relative z-10">
              {[1, 2, 3, 4, 5].map((s) => <span key={s}>{s <= Math.round(user.score || 0) ? '★' : '☆'}</span>)}
            </div>
          </div>

          {/* SECCIÓN LOGROS PROFESIONALES */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm ring-1 ring-gray-900/5">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="text-[#1a3a5a] font-extrabold text-xl tracking-tight">Mis Logros e Insignias</h4>
                <p className="text-gray-400 text-xs mt-1">Recompensas desbloqueadas por su participación y aportes.</p>
              </div>
              <span className="text-[10px] font-bold text-[#1a3a5a] bg-gray-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">{user.badges?.length || 0} Insignias</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {user.badges?.length > 0 ? user.badges.map((badge, idx) => {
                const dateEarned = badge.earned_at 
                  ? new Date(badge.earned_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                  : null;

                return (
                  <div key={idx} className="flex flex-col items-center justify-center p-5 rounded-3xl border border-gray-100 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-gray-50/30 group relative">
                    <div className="w-16 h-16 mb-3 bg-white rounded-2xl overflow-hidden flex items-center justify-center text-3xl shadow-sm border border-gray-100/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      {typeof badge.icon === 'string' && badge.icon.startsWith('http') ? (
                        <img src={badge.icon} alt={badge.name} className="w-full h-full object-cover" />
                      ) : (
                        badge.icon || '🏅'
                      )}
                    </div>
                    <p className="text-xs font-black text-slate-800 text-center leading-tight truncate w-full" title={badge.name}>
                      {badge.name}
                    </p>
                    
                    {/* Recompensas de la insignia */}
                    <div className="flex gap-1.5 mt-2">
                      {badge.xp_reward > 0 && (
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          +{badge.xp_reward} XP
                        </span>
                      )}
                      {badge.coins_reward > 0 && (
                        <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          +{badge.coins_reward}🪙
                        </span>
                      )}
                    </div>

                    {dateEarned && (
                      <span className="text-[9px] text-gray-400 font-medium mt-2.5">
                        {dateEarned}
                      </span>
                    )}
                  </div>
                );
              }) : (
                <div className="col-span-full text-center py-10 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <span className="text-4xl mb-2 block">🔒</span>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Aún no has desbloqueado insignias</p>
                </div>
              )}
            </div>
          </div>

          {/* COMENTARIOS / SOBRE MÍ */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm ring-1 ring-gray-900/5 flex flex-col">
            <h4 className="text-[#1a3a5a] font-extrabold text-xl tracking-tight mb-5">Sobre Mí</h4>
            <div className="bg-gray-50/80 rounded-3xl p-8 border border-gray-100/80 shadow-inner">
              <p className="text-gray-600 leading-relaxed text-sm font-medium">
                {user.bio ? `"${user.bio}"` : <span className="italic px-2">Este usuario no ha agregado comentarios aún.</span>}
              </p>
            </div>
          </div>

          {/* SECCIÓN OPINIONES DE ALUMNOS (SÓLO SI EL USUARIO ES MENTOR) */}
          {user.role === 'MENTOR' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm ring-1 ring-gray-900/5 flex flex-col space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[#1a3a5a] font-extrabold text-xl tracking-tight">Opiniones de Alumnos</h4>
                <span className="text-[10px] font-bold text-[#1a3a5a] bg-gray-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                  {user.comments?.length || 0} opiniones
                </span>
              </div>

              <div className="space-y-4">
                {user.comments && user.comments.length > 0 ? (
                  user.comments.map((comment, idx) => {
                    const initials = comment.apprentice_name
                      ? comment.apprentice_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'A';
                    
                    const dateFormatted = new Date(comment.closed_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });

                    // Lista de colores para los avatars de estudiantes
                    const avatarBgColors = [
                      'bg-indigo-100 text-indigo-700',
                      'bg-emerald-100 text-emerald-700',
                      'bg-purple-100 text-purple-700',
                      'bg-sky-100 text-sky-700',
                      'bg-pink-100 text-pink-700'
                    ];
                    const avatarColor = avatarBgColors[idx % avatarBgColors.length];

                    return (
                      <div 
                        key={idx} 
                        className="p-6 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-3xl flex flex-col md:flex-row gap-4 transition-all duration-300 hover:shadow-sm"
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 flex items-center md:items-start justify-center md:justify-start">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm tracking-wider shadow-sm ${avatarColor}`}>
                            {initials}
                          </div>
                        </div>

                        {/* Contenido de la opinión */}
                        <div className="flex-grow space-y-2 text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h5 className="font-extrabold text-[#1a3a5a] text-sm">{comment.apprentice_name}</h5>
                            <span className="text-[10px] font-bold text-gray-400">{dateFormatted}</span>
                          </div>

                          {/* Estrellas otorgadas */}
                          <div className="flex text-amber-400 text-xs">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{i < comment.rating ? '★' : '☆'}</span>
                            ))}
                          </div>

                          {/* Comentario en sí */}
                          <p className="text-gray-600 leading-relaxed text-xs font-medium italic bg-white/60 p-4 rounded-2xl border border-gray-100 shadow-inner">
                            "{comment.rating_comment}"
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-gray-50/50 rounded-3xl border border-dashed border-gray-250 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-3">⭐</span>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                      Este tutor aún no tiene opiniones de alumnos
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-all flex-1 text-center shadow-sm"
            >
              Regresar
            </button>
            {!isOwnProfile && user.role === 'MENTOR' && (
              <button 
                onClick={() => setShowMentorshipModal(true)}
                className="px-8 py-4 bg-[#1a3a5a] text-[#ffcc00] rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-[#112740] transition-all flex-[2] text-center border border-transparent hover:border-[#ffcc00]/30"
              >
                Pactar Tutoría
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PARA PACTAR TUTORÍA */}
      {showMentorshipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a3a5a]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-black text-[#1a3a5a] tracking-tighter">Pactar Tutoría</h2>
              <button onClick={() => setShowMentorshipModal(false)} className="text-gray-400 hover:text-red-500 text-3xl font-light">&times;</button>
            </div>

            <form onSubmit={handlePactarTutoria} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Materia Deseada</label>
                <select 
                  required
                  value={mentorshipData.subject_id} 
                  onChange={(e) => setMentorshipData({ ...mentorshipData, subject_id: e.target.value })} 
                  className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a]"
                >
                  <option value="" disabled>Selecciona una materia...</option>
                  {(user.materias || []).map((m, idx) => {
                    const mId = m.id || idx;
                    const mName = m.name || m;
                    return <option key={mId} value={mId}>{mName}</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Fecha</label>
                  <input type="date" required min={new Date().toISOString().split('T')[0]} value={mentorshipData.date} onChange={(e) => setMentorshipData({ ...mentorshipData, date: e.target.value })} className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a]" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Hora</label>
                  <input type="time" required value={mentorshipData.time} onChange={(e) => setMentorshipData({ ...mentorshipData, time: e.target.value })} className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a]" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Temas a Tratar (Línea por Línea)</label>
                <textarea 
                  required
                  rows="4" 
                  value={mentorshipData.objectives} 
                  onChange={(e) => setMentorshipData({ ...mentorshipData, objectives: e.target.value })} 
                  className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-medium text-gray-600 text-sm resize-none" 
                  placeholder="- Ecuaciones de Newton&#10;- Dinámica y cinemática" 
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">¿Modalidad de Tutoría?</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer font-bold text-xs ${mentorshipData.modality === 'Presencial' ? 'border-[#ffcc00] bg-yellow-50 text-[#1a3a5a]' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                    <input type="radio" name="modality" value="Presencial" checked={mentorshipData.modality === 'Presencial'} onChange={(e) => setMentorshipData({ ...mentorshipData, modality: e.target.value })} className="hidden" />
                    <span>📍 Presencial</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer font-bold text-xs ${mentorshipData.modality === 'Online' ? 'border-[#ffcc00] bg-yellow-50 text-[#1a3a5a]' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                    <input type="radio" name="modality" value="Online" checked={mentorshipData.modality === 'Online'} onChange={(e) => setMentorshipData({ ...mentorshipData, modality: e.target.value })} className="hidden" />
                    <span>💻 Online</span>
                  </label>
                </div>

                {mentorshipData.modality === 'Presencial' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Lugar de Reunión</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Biblioteca central, Cubículo 5..."
                      value={mentorshipData.meeting_place} 
                      onChange={(e) => setMentorshipData({ ...mentorshipData, meeting_place: e.target.value })} 
                      className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a]" 
                    />
                  </div>
                )}

                {mentorshipData.modality === 'Online' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Plataforma</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Meet', 'Zoom', 'Teams'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setMentorshipData({ ...mentorshipData, platform: p })}
                          className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${mentorshipData.platform === p ? 'bg-[#1a3a5a] text-[#ffcc00] shadow-lg scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rango de Tiempo Estimado (45 min a 2h) */}
              <div className="space-y-4">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Tiempo estimado de Tutoría</label>
                <div className="grid grid-cols-4 gap-2">
                  {['45 min', '1 hora', '1.5 horas', '2 horas'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMentorshipData({ ...mentorshipData, estimated_duration: t })}
                      className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${mentorshipData.estimated_duration === t ? 'bg-[#1a3a5a] text-[#ffcc00] shadow-lg scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-[#1a3a5a] text-[#ffcc00] rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:shadow-[#1a3a5a]/20 hover:scale-[1.02] transition-all">
                Enviar Solicitud
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN NATIVO (Tailwind) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a3a5a]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-black text-[#1a3a5a] tracking-tighter">Ajustes de Perfil</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-3xl font-light">&times;</button>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center space-x-6 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <img
                  src={previewFoto || user.profile_photo_url || '/default-avatar.png'}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                  alt="Previa"
                />
                <div className="flex-1">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Foto de Perfil</label>
                  <input type="file" onChange={handleImageChange} className="text-[10px] file:bg-[#1a3a5a] file:text-white file:border-0 file:px-4 file:py-2 file:rounded-xl file:mr-3 file:font-bold cursor-pointer" accept="image/*" />
                  <p className="text-[9px] text-gray-400 mt-1.5 leading-normal">
                    Tamaño máx: <strong>2 MB</strong> · Mín: <strong>200x200 px</strong>, Máx: <strong>2000x2000 px</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Semestre</label>
                  <input type="number" value={editData.current_semester} onChange={(e) => setEditData({ ...editData, current_semester: e.target.value })} className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#1a3a5a]" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Estado Académico</label>
                  <div className="px-5 py-3 bg-gray-100 rounded-2xl font-bold text-gray-400 text-xs">ACTIVO</div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Biografía</label>
                <textarea rows="3" value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-medium text-gray-600 text-sm resize-none" placeholder="Describe tu experiencia..." />
              </div>

              {/* SECCIÓN MATERIAS DINÁMICAS (RF#007) */}
              {user.role === 'MENTOR' && (
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Materias que Impartes</label>
                  {allSubjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-gray-50 rounded-3xl border border-gray-100">
                      {allSubjects.map(sub => {
                        const isSelected = editData.materias.includes(sub.id);
                        return (
                          <label 
                            key={sub.id} 
                            className={`flex items-center space-x-3 p-3 bg-white rounded-2xl border transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-[#ffcc00] bg-yellow-50/20 shadow-sm ring-1 ring-[#ffcc00]/20' 
                                : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="rounded text-[#1a3a5a] focus:ring-[#ffcc00] w-4 h-4 cursor-pointer"
                              checked={isSelected}
                              onChange={(e) => {
                                const list = e.target.checked
                                  ? [...editData.materias, sub.id]
                                  : editData.materias.filter(mid => mid !== sub.id);
                                setEditData({ ...editData, materias: list });
                              }}
                            />
                            <span className="text-[10px] font-black text-[#1a3a5a] uppercase truncate" title={sub.name}>{sub.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs italic bg-gray-50 p-4 rounded-3xl text-center border border-dashed border-gray-200">
                      No hay materias disponibles para el semestre seleccionado.
                    </p>
                  )}
                  <p className="text-[9px] text-gray-400 mt-2 font-medium">Puedes seleccionar varias materias simultáneamente.</p>
                </div>
              )}

              <button type="submit" className="w-full py-5 bg-[#1a3a5a] text-[#ffcc00] rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:shadow-[#1a3a5a]/20 hover:scale-[1.02] transition-all">
                Actualizar Perfil
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default Profile;
