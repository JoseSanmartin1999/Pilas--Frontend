import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    
    // Estados principales
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados de insignias (Gamificación)
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [badgeData, setBadgeData] = useState({ id: null, name: '', image_url: '', type: 'xp_earned', value: 100, xp_reward: 0, coins_reward: 0 });
    const [savingBadge, setSavingBadge] = useState(false);
    const [badgeFile, setBadgeFile] = useState(null);

    // Estados de filtros y búsquedas
    const [userSearch, setUserSearch] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

    // Estados de edición del sistema
    const [sysSettings, setSysSettings] = useState({
        storageLimit: 300,
        coinMultiplier: 1.5,
        allowRegister: true,
        emailNotifications: true
    });
    const [sysLogs, setSysLogs] = useState([
        `[${new Date().toLocaleTimeString()}] [SISTEMA] Servidor Express activo en puerto 3000`,
        `[${new Date().toLocaleTimeString()}] [DB] Pool de conexiones a TiDB inicializado correctamente (10 max)`,
        `[${new Date().toLocaleTimeString()}] [SERVICIOS] Nodemailer conectado con servidor SMTP (Gmail)`,
        `[${new Date().toLocaleTimeString()}] [IO] Socket.IO registrado y escuchando salas /room_*`,
        `[${new Date().toLocaleTimeString()}] [CLOUDINARY] Conexión establecida con servicio Cloudinary API`
    ]);

    // Estados para responder tickets
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [resolving, setResolving] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    // Verificar accesos de administrador
    useEffect(() => {
        if (!currentUser?.id || currentUser.role !== 'ADMIN') {
            navigate('/login');
            showNotification("No tienes permisos para acceder al Panel de Control.", "error");
            return;
        }
        loadAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser.id]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchUsers(),
                fetchApplications(),
                fetchTickets(),
                fetchBadges()
            ]);
        } catch (err) {
            console.error("Error cargando panel de control:", err);
            showNotification("Error de conexión al cargar datos del panel.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const res = await axios.get('https://pilas-backend.onrender.com/api/admin/stats');
        setStats(res.data);
    };

    const fetchUsers = async () => {
        const res = await axios.get('https://pilas-backend.onrender.com/api/admin/users');
        setUsers(res.data);
    };

    const fetchApplications = async () => {
        const res = await axios.get('https://pilas-backend.onrender.com/api/admin/tutors/applications');
        setApplications(res.data);
    };

    const fetchTickets = async () => {
        const res = await axios.get('https://pilas-backend.onrender.com/api/admin/tickets');
        setTickets(res.data);
    };

    const fetchBadges = async () => {
        const res = await axios.get('https://pilas-backend.onrender.com/api/admin/badges');
        setBadges(res.data);
    };

    const handleBadgeFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo (debe ser imagen)
        if (!file.type.startsWith('image/')) {
            showNotification("El archivo seleccionado debe ser una imagen.", "warning");
            e.target.value = '';
            setBadgeFile(null);
            return;
        }

        // Validar tamaño máximo: 2 MB
        const maxSizeBytes = 2 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            showNotification("La imagen supera el tamaño máximo permitido de 2 MB.", "warning");
            e.target.value = '';
            setBadgeFile(null);
            return;
        }

        // Validar dimensiones: Min 100x100px, Max 2000x2000px
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const minWidth = 100;
            const minHeight = 100;
            const maxWidth = 2000;
            const maxHeight = 2000;

            if (img.width < minWidth || img.height < minHeight) {
                showNotification(`Las dimensiones de la imagen son muy pequeñas (${img.width}x${img.height}px). El mínimo permitido es ${minWidth}x${minHeight}px.`, "warning");
                e.target.value = '';
                setBadgeFile(null);
            } else if (img.width > maxWidth || img.height > maxHeight) {
                showNotification(`Las dimensiones de la imagen son muy grandes (${img.width}x${img.height}px). El máximo permitido es ${maxWidth}x${maxHeight}px.`, "warning");
                e.target.value = '';
                setBadgeFile(null);
            } else {
                setBadgeFile(file);
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            showNotification("El archivo de imagen está dañado o no es válido.", "error");
            e.target.value = '';
            setBadgeFile(null);
        };
        img.src = URL.createObjectURL(file);
    };

    const handleSaveBadge = async (e) => {
        e.preventDefault();
        setSavingBadge(true);
        try {
            const criteria = { type: badgeData.type, value: parseInt(badgeData.value, 10) };
            
            const formData = new FormData();
            formData.append('name', badgeData.name);
            formData.append('image_url', badgeData.image_url);
            formData.append('criteria', JSON.stringify(criteria));
            formData.append('xp_reward', parseInt(badgeData.xp_reward, 10) || 0);
            formData.append('coins_reward', parseInt(badgeData.coins_reward, 10) || 0);
            
            if (badgeFile) {
                formData.append('badge_image', badgeFile);
            }

            if (badgeData.id) {
                // Editar
                await axios.put('https://pilas-backend.onrender.com/api/admin/badges/' + badgeData.id, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showNotification("Insignia actualizada con éxito.", "success");
            } else {
                // Crear
                await axios.post('https://pilas-backend.onrender.com/api/admin/badges', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showNotification("Insignia creada con éxito.", "success");
            }

            setShowBadgeModal(false);
            setBadgeData({ id: null, name: '', image_url: '', type: 'xp_earned', value: 100, xp_reward: 0, coins_reward: 0 });
            setBadgeFile(null);
            fetchBadges();
        } catch (err) {
            console.error("Error al guardar insignia:", err);
            const errMsg = err.response?.data?.details || err.response?.data?.error || err.message;
            showNotification(`No se pudo guardar la insignia: ${errMsg}`, "error");
        } finally {
            setSavingBadge(false);
        }
    };

    const handleDeleteBadge = async (badgeId, badgeName) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar la insignia "${badgeName}"?`)) return;
        try {
            await axios.delete(`https://pilas-backend.onrender.com/api/admin/badges/${badgeId}`);
            showNotification("Insignia eliminada correctamente.", "success");
            fetchBadges();
        } catch (err) {
            console.error("Error al eliminar insignia:", err);
            showNotification("No se pudo eliminar la insignia.", "error");
        }
    };

    const handleOpenEditBadge = (badge) => {
        let critType = 'xp_earned';
        let critVal = 100;
        if (badge.criteria) {
            try {
                const criteriaObj = typeof badge.criteria === 'string' ? JSON.parse(badge.criteria) : badge.criteria;
                critType = criteriaObj.type || 'xp_earned';
                critVal = criteriaObj.value || 100;
            } catch (e) {
                console.error("Error parseando criterio para editar:", e);
            }
        }
        setBadgeData({
            id: badge.id,
            name: badge.name,
            image_url: badge.image_url || '',
            type: critType,
            value: critVal,
            xp_reward: badge.xp_reward || 0,
            coins_reward: badge.coins_reward || 0
        });
        setShowBadgeModal(true);
    };

    // Acciones de usuarios
    const handleToggleUserStatus = async (userId, currentStatus) => {
        const nextStatus = currentStatus === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO';
        try {
            await axios.put(`https://pilas-backend.onrender.com/api/admin/users/${userId}/status`, { status: nextStatus });
            showNotification(`Usuario ${nextStatus === 'BLOQUEADO' ? 'bloqueado' : 'activado'} correctamente.`, "success");
            
            // Agregar log
            logAction(`[INFO] Usuario ID ${userId} cambiado a estado ${nextStatus}`);
            fetchUsers();
        } catch {
            showNotification("No se pudo cambiar el estado del usuario.", "error");
        }
    };

    const handleDeleteUser = async (userId, name) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${name}? Esta acción es irreversible.`)) return;

        try {
            await axios.delete(`https://pilas-backend.onrender.com/api/admin/users/${userId}`);
            showNotification("Usuario eliminado correctamente.", "success");
            logAction(`[ALERTA] Usuario ${name} (ID ${userId}) eliminado físicamente.`);
            fetchUsers();
            fetchStats();
        } catch {
            showNotification("No se pudo eliminar el usuario.", "error");
        }
    };

    // Acciones de solicitudes de tutores
    const handleApproveApplication = async (appId, applicantName) => {
        try {
            await axios.put(`https://pilas-backend.onrender.com/api/admin/tutors/applications/${appId}/approve`);
            showNotification(`¡Solicitud aprobada! ${applicantName} ha sido ascendido a Mentor.`, "success");
            logAction(`[APROBACIÓN] Solicitud ID ${appId} aprobada. Ascendido ${applicantName} a MENTOR.`);
            fetchApplications();
            fetchUsers();
            fetchStats();
        } catch {
            showNotification("No se pudo aprobar la solicitud.", "error");
        }
    };

    const handleRejectApplication = async (appId, applicantName) => {
        try {
            await axios.put(`https://pilas-backend.onrender.com/api/admin/tutors/applications/${appId}/reject`);
            showNotification(`Solicitud de ${applicantName} rechazada correctamente.`, "info");
            logAction(`[RECHAZO] Solicitud ID ${appId} de ${applicantName} rechazada.`);
            fetchApplications();
            fetchStats();
        } catch {
            showNotification("No se pudo rechazar la solicitud.", "error");
        }
    };

    // Acciones de tickets
    const handleResolveTicketSubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setResolving(true);
        try {
            await axios.put(`https://pilas-backend.onrender.com/api/admin/tickets/${selectedTicket.id}/resolve`, {
                reply: replyText,
                status: 'RESOLVED'
            });

            showNotification("Ticket resuelto y cerrado con éxito.", "success");
            logAction(`[TICKET] Ticket #${selectedTicket.id} resuelto por administrador.`);
            setSelectedTicket(null);
            setReplyText('');
            fetchTickets();
        } catch {
            showNotification("No se pudo resolver el ticket.", "error");
        } finally {
            setResolving(false);
        }
    };

    const logAction = (msg) => {
        const time = new Date().toLocaleTimeString();
        setSysLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
    };

    // Generador de reporte PDF del dashboard
    const handleDownloadReport = async () => {
        try {
            showNotification('Generando reporte...', 'info');
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://pilas-backend.onrender.com';
            const res = await axios.get(`${baseUrl}/api/admin/report`);
            const data = res.data;
            const date = new Date(data.generatedAt).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guayaquil' });

            const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Dashboard - Pilas! Tutorías</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a3a5a; padding: 40px; background: #fff; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #ffcc00; padding-bottom: 20px; }
        .header h1 { font-size: 28px; color: #1a3a5a; margin-bottom: 5px; }
        .header p { font-size: 12px; color: #666; }
        .section { margin-bottom: 30px; }
        .section h2 { font-size: 18px; color: #1a3a5a; border-left: 4px solid #ffcc00; padding-left: 12px; margin-bottom: 15px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
        .card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 20px; text-align: center; }
        .card .value { font-size: 32px; font-weight: 900; color: #1a3a5a; }
        .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #1a3a5a; color: #ffcc00; padding: 10px 15px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 10px 15px; border-bottom: 1px solid #eee; font-size: 13px; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; font-size: 11px; color: #999; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Reporte del Dashboard — Pilas! Tutorías</h1>
        <p>Generado el: ${date}</p>
    </div>

    <div class="section">
        <h2>Resumen General</h2>
        <div class="grid">
            <div class="card"><div class="value">${data.users.total}</div><div class="label">Total Usuarios</div></div>
            <div class="card"><div class="value">${data.mentorships.total}</div><div class="label">Total Tutorías</div></div>
            <div class="card"><div class="value">${data.mentorships.averageRating}/5.0</div><div class="label">Calificación Promedio</div></div>
        </div>
        <div class="grid">
            <div class="card"><div class="value">${data.users.roles.MENTOR}</div><div class="label">Mentores</div></div>
            <div class="card"><div class="value">${data.users.roles.APRENDIZ}</div><div class="label">Aprendices</div></div>
            <div class="card"><div class="value">${data.storage.usedMB} MB</div><div class="label">Almacenamiento Usado</div></div>
        </div>
    </div>

    <div class="section">
        <h2>Tutorías por Estado</h2>
        <table>
            <thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
            <tbody>
                ${Object.entries(data.mentorships.statuses).map(([k, v]) => `<tr><td>${k}</td><td><strong>${v}</strong></td></tr>`).join('')}
            </tbody>
        </table>
    </div>

    <div class="two-col">
        <div class="section">
            <h2>Top 5 Mentores</h2>
            <table>
                <thead><tr><th>Mentor</th><th>Tutorías</th></tr></thead>
                <tbody>
                    ${data.topMentors.length > 0 ? data.topMentors.map(m => `<tr><td>${m.full_name}</td><td><strong>${m.total_completed}</strong></td></tr>`).join('') : '<tr><td colspan="2">Sin datos</td></tr>'}
                </tbody>
            </table>
        </div>
        <div class="section">
            <h2>Top 5 Materias</h2>
            <table>
                <thead><tr><th>Materia</th><th>Solicitudes</th></tr></thead>
                <tbody>
                    ${data.topSubjects.length > 0 ? data.topSubjects.map(s => `<tr><td>${s.name}</td><td><strong>${s.total_requests}</strong></td></tr>`).join('') : '<tr><td colspan="2">Sin datos</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>

    <div class="two-col">
        <div class="section">
            <h2>Solicitudes de Mentores</h2>
            <table>
                <thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
                <tbody>
                    <tr><td>Pendientes</td><td><strong>${data.applications.PENDING}</strong></td></tr>
                    <tr><td>Aprobadas</td><td><strong>${data.applications.APPROVED}</strong></td></tr>
                    <tr><td>Rechazadas</td><td><strong>${data.applications.REJECTED}</strong></td></tr>
                </tbody>
            </table>
        </div>
        <div class="section">
            <h2>Tickets de Soporte</h2>
            <table>
                <thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
                <tbody>
                    <tr><td>Abiertos</td><td><strong>${data.tickets.OPEN}</strong></td></tr>
                    <tr><td>En Progreso</td><td><strong>${data.tickets.IN_PROGRESS}</strong></td></tr>
                    <tr><td>Resueltos</td><td><strong>${data.tickets.RESOLVED}</strong></td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="footer">
        <p>Pilas! Tutorías &copy; ${new Date().getFullYear()} — Reporte generado automáticamente desde el Panel de Administración</p>
    </div>
</body>
</html>`;

            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.addEventListener('load', () => {
                    printWindow.print();
                });
            }
            showNotification('Reporte generado. Usa Ctrl+P o el diálogo de impresión para guardar como PDF.', 'success');
            logAction('[REPORTE] Reporte del dashboard generado y descargado.');
        } catch (err) {
            console.error('Error generando reporte:', err);
            showNotification('No se pudo generar el reporte.', 'error');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                              user.email?.toLowerCase().includes(userSearch.toLowerCase());
        const matchesRole = selectedRoleFilter === 'ALL' || user.role === selectedRoleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0f592f]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* SIDEBAR DE OPCIONES (3/12) */}
                <aside className="lg:col-span-3 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-150/50 flex flex-col gap-2">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4">
                        Panel de Control
                    </h3>
                    
                    {[
                        { id: 'stats', label: 'Estadísticas', icon: '📊' },
                        { id: 'applications', label: 'Solicitudes a Tutores', icon: '🎓', badge: applications.filter(a => a.status === 'PENDING').length },
                        { id: 'users', label: 'Usuarios Registrados', icon: '👥' },
                        { id: 'badges', label: 'Gestionar Insignias', icon: '🏆' },
                        { id: 'system', label: 'Administración', icon: '⚙️' },
                        { id: 'tickets', label: 'Tickets de Soporte', icon: '📨', badge: tickets.filter(t => t.status === 'OPEN').length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                activeTab === tab.id
                                    ? 'bg-[#0f592f] text-[#ffcc00] shadow-md scale-105'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#0f592f]'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </span>
                            {tab.badge > 0 && (
                                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </aside>

                {/* CONTENIDO CENTRAL (9/12) */}
                <main className="lg:col-span-9 space-y-6">

                    {/* SECCIÓN 1: ESTADÍSTICAS */}
                    {activeTab === 'stats' && stats && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <header className="text-left space-y-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-black text-[#0f592f] tracking-tight">Estadísticas Generales</h2>
                                    <p className="text-gray-500 font-medium text-xs">Monitorea el crecimiento académico y actividad del sistema.</p>
                                </div>
                                <button
                                    onClick={handleDownloadReport}
                                    className="px-6 py-3.5 bg-[#0f592f] text-[#ffcc00] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0a4624] transition-all shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap"
                                >
                                    📥 Descargar Reporte
                                </button>
                            </header>

                            {/* GRID DE ESTADÍSTICAS */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="bg-[#0f592f] text-white p-8 rounded-[2rem] shadow-lg relative overflow-hidden flex flex-col justify-between h-40">
                                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                                    <span className="text-[10px] font-black text-yellow-300 uppercase tracking-widest">Total Usuarios</span>
                                    <h3 className="text-5xl font-black">{stats.users.total}</h3>
                                    <p className="text-[10px] text-gray-300 font-medium">Tutos: {stats.users.roles.MENTOR} | Aprendices: {stats.users.roles.APRENDIZ}</p>
                                </div>

                                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-150/40 flex flex-col justify-between h-40">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tutorías Coordinadas</span>
                                    <h3 className="text-5xl font-black text-[#0f592f]">{stats.mentorships.total}</h3>
                                    <p className="text-[10px] text-gray-500 font-medium">Completadas: {stats.mentorships.status.COMPLETADA} | Pendientes: {stats.mentorships.status.PENDIENTE}</p>
                                </div>

                                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-150/40 flex flex-col justify-between h-40">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Puntaje Global</span>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-5xl font-black text-pilas-gold">{stats.averageRating}</h3>
                                        <span className="text-gray-400 font-bold text-lg">/ 5.0</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-semibold">Calificación promedio de mentorías</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-150/40 text-left space-y-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Uso del Repositorio</span>
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-3xl font-black text-[#0f592f]">{stats.storageUsedMB} MB</h3>
                                        <span className="text-gray-400 text-xs font-semibold">Consumo Global Cloudinary</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full" 
                                            style={{ width: `${Math.min((stats.storageUsedMB / 1000) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-semibold">Total cargado por mentores en workspaces.</p>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-150/40 text-left flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Seguridad del Sistema</span>
                                    <div className="flex items-center gap-4 py-2">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">✓</div>
                                        <div>
                                            <h4 className="font-extrabold text-[#0f592f] text-sm uppercase tracking-tight">Esquema Protegido</h4>
                                            <p className="text-[10px] text-gray-400 font-medium">Bases de datos TiDB encriptadas y con respaldo automático.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN 2: SOLICITUDES A TUTORES */}
                    {activeTab === 'applications' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <header className="text-left space-y-1">
                                <h2 className="text-3xl font-black text-[#0f592f] tracking-tight">Solicitudes de Ascenso</h2>
                                <p className="text-gray-500 font-medium text-xs">Revisa y aprueba solicitudes de aprendices a mentores.</p>
                            </header>

                            <div className="space-y-4">
                                {applications.filter(a => a.status === 'PENDING').length > 0 ? (
                                    applications.filter(a => a.status === 'PENDING').map(app => (
                                        <div key={app.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 text-left space-y-6">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 pb-4">
                                                <div>
                                                    <h3 className="font-extrabold text-lg text-[#0f592f]">{app.applicant_name}</h3>
                                                    <p className="text-xs text-gray-400 font-medium">{app.applicant_email} &bull; {app.career} &bull; <strong className="text-[#0f592f]">{app.current_semester}° Semestre</strong></p>
                                                </div>
                                                <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 uppercase tracking-widest">
                                                    Postulado el: {new Date(app.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Carta de Motivación</h4>
                                                    <blockquote className="bg-gray-50 p-5 rounded-2xl border border-gray-150/50 text-gray-600 text-xs font-medium italic leading-relaxed">
                                                        "{app.motivation}"
                                                    </blockquote>
                                                </div>

                                                <div>
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Materias que desea Impartir</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {app.selected_subjects?.map((sub, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-yellow-50 border border-yellow-250/50 text-yellow-700 uppercase">
                                                                📚 Materia #{sub}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* RÉCORD ACADÉMICO */}
                                                {app.academic_record_url && (
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Récord Académico</h4>
                                                        <a
                                                            href={app.academic_record_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                                                        >
                                                            📄 Descargar Récord Académico (PDF)
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-4 pt-2 border-t border-gray-50">
                                                <button
                                                    onClick={() => handleRejectApplication(app.id, app.applicant_name)}
                                                    className="px-6 py-3.5 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-colors flex-1"
                                                >
                                                    Rechazar
                                                </button>
                                                <button
                                                    onClick={() => handleApproveApplication(app.id, app.applicant_name)}
                                                    className="px-6 py-3.5 bg-[#0f592f] text-[#ffcc00] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#0a4624] transition-colors flex-2 shadow-md hover:shadow-lg"
                                                >
                                                    Aprobar Ascenso
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-250 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">🎓</span>
                                        <h4 className="text-[#0f592f] font-black text-sm uppercase tracking-wider">Sin solicitudes pendientes</h4>
                                        <p className="text-gray-400 text-xs font-semibold max-w-sm mt-1">
                                            No hay aprendices postulándose a mentores en este momento.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN 3: USUARIOS REGISTRADOS */}
                    {activeTab === 'users' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <header className="text-left space-y-1">
                                <h2 className="text-3xl font-black text-[#0f592f] tracking-tight">Usuarios Registrados</h2>
                                <p className="text-gray-500 font-medium text-xs">Administra las cuentas, bloquea o remueve accesos.</p>
                            </header>

                            {/* FILTROS */}
                            <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o correo..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="flex-grow px-5 py-3.5 bg-gray-50 border border-transparent focus:border-gray-200 rounded-2xl outline-none font-medium text-gray-600 text-xs"
                                />
                                <select
                                    value={selectedRoleFilter}
                                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                                    className="px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-[#0f592f] text-xs cursor-pointer"
                                >
                                    <option value="ALL">Todos los roles</option>
                                    <option value="MENTOR">Tutores (Mentores)</option>
                                    <option value="APRENDIZ">Aprendices</option>
                                    <option value="ADMIN">Administradores</option>
                                </select>
                            </div>

                            {/* TABLA DE USUARIOS */}
                            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-150/50 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <th className="px-6 py-4">Usuario</th>
                                                <th className="px-6 py-4">Rol</th>
                                                <th className="px-6 py-4">Nivel</th>
                                                <th className="px-6 py-4">Estado</th>
                                                <th className="px-6 py-4 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredUsers.map(user => {
                                                const initials = user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
                                                
                                                // Estilos badges roles
                                                const getRoleBadge = (role) => {
                                                    switch(role) {
                                                        case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
                                                        case 'MENTOR': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                                                        default: return 'bg-blue-50 text-blue-700 border-blue-150';
                                                    }
                                                };

                                                return (
                                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-5 flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs text-[#0f592f] shadow-inner border border-gray-200">
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-extrabold text-sm text-[#0f592f] leading-tight">{user.full_name}</h5>
                                                                <span className="text-[10px] text-gray-400 font-semibold">{user.email}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-xs font-bold text-gray-700">
                                                            {user.current_semester ? `${user.current_semester}°` : '-'}
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${user.status === 'BLOQUEADO' ? 'bg-red-50 text-red-600 border border-red-150' : 'bg-green-50 text-green-600 border border-green-150'}`}>
                                                                {user.status || 'ACTIVO'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex justify-center gap-2">
                                                                {user.role !== 'ADMIN' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleToggleUserStatus(user.id, user.status || 'ACTIVO')}
                                                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${user.status === 'BLOQUEADO' ? 'bg-white border-green-200 text-green-600 hover:bg-green-50' : 'bg-white border-yellow-250 text-yellow-600 hover:bg-yellow-50'}`}
                                                                        >
                                                                            {user.status === 'BLOQUEADO' ? 'Activar' : 'Bloquear'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                                                                            className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-red-50 border border-transparent text-red-600 hover:bg-red-100"
                                                                        >
                                                                            Eliminar
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN 4: ADMINISTRACIÓN DEL SISTEMA */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <header className="text-left space-y-1">
                                <h2 className="text-3xl font-black text-[#0f592f] tracking-tight">Ajustes del Sistema</h2>
                                <p className="text-gray-500 font-medium text-xs">Configura parámetros y monitoriza los logs del servidor.</p>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* FORMULARIO DE AJUSTES */}
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-150/40 text-left space-y-6">
                                    <h4 className="text-sm font-black text-[#0f592f] uppercase tracking-wider">Parámetros Globales</h4>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Límite repositorio por Mentoria (MB)</label>
                                            <input 
                                                type="number"
                                                value={sysSettings.storageLimit}
                                                onChange={(e) => setSysSettings({...sysSettings, storageLimit: e.target.value})}
                                                className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#0f592f]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Multiplicador ESPE-Coins por Hora</label>
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                value={sysSettings.coinMultiplier}
                                                onChange={(e) => setSysSettings({...sysSettings, coinMultiplier: e.target.value})}
                                                className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#0f592f]"
                                            />
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={sysSettings.allowRegister}
                                                    onChange={(e) => setSysSettings({...sysSettings, allowRegister: e.target.checked})}
                                                    className="w-4 h-4 rounded text-[#0f592f] focus:ring-[#ffcc00] cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-gray-700">Permitir Registro de Nuevos Alumnos</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={sysSettings.emailNotifications}
                                                    onChange={(e) => setSysSettings({...sysSettings, emailNotifications: e.target.checked})}
                                                    className="w-4 h-4 rounded text-[#0f592f] focus:ring-[#ffcc00] cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-gray-700">Habilitar Alertas de Correo (Nodemailer)</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            showNotification("Configuraciones del sistema actualizadas (simulado).", "success");
                                            logAction("[AJUSTES] Variables globales actualizadas.");
                                        }}
                                        className="w-full py-4 bg-[#0f592f] text-[#ffcc00] rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-md"
                                    >
                                        Guardar Configuraciones
                                    </button>
                                </div>

                                {/* TERMINAL DE LOGS */}
                                <div className="bg-gray-950 text-emerald-400 p-6 rounded-[2.5rem] shadow-xl text-left flex flex-col h-[400px] border border-gray-800">
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-3">
                                        <div className="flex gap-1.5">
                                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Logs del Servidor</span>
                                    </div>
                                    <div className="flex-grow overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar pr-2">
                                        {sysLogs.map((log, idx) => (
                                            <div key={idx} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN 5: TICKETS */}
                    {activeTab === 'tickets' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <header className="text-left space-y-1">
                                <h2 className="text-3xl font-black text-[#0f592f] tracking-tight">Tickets de Soporte</h2>
                                <p className="text-gray-500 font-medium text-xs">Gestiona y responde reclamaciones o inquietudes de usuarios.</p>
                            </header>

                            <div className="space-y-4">
                                {tickets.length > 0 ? (
                                    tickets.map(ticket => (
                                        <div key={ticket.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-150/40 text-left space-y-4 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-50 pb-4">
                                                <div>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ticket #{ticket.id}</span>
                                                    <h4 className="font-extrabold text-base text-[#0f592f] mt-1">{ticket.title}</h4>
                                                    <p className="text-[10px] text-gray-400 font-semibold">{ticket.user_name} ({ticket.user_email}) &bull; Rol: {ticket.user_role}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-gray-400 font-medium">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                                                        ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {ticket.status === 'RESOLVED' ? 'Resuelto' : 'Abierto'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <p className="text-gray-600 text-xs font-semibold leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                    {ticket.description}
                                                </p>

                                                {ticket.reply ? (
                                                    <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-2xl p-4 space-y-1">
                                                        <h5 className="font-black text-[9px] text-[#0f592f] uppercase tracking-wider">Respuesta Enviada</h5>
                                                        <p className="text-gray-700 text-xs font-medium">{ticket.reply}</p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedTicket(ticket)}
                                                        className="px-5 py-3 bg-[#0f592f] text-[#ffcc00] rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-[#0a4624] transition-colors"
                                                    >
                                                        Responder y Cerrar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-250 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">📨</span>
                                        <h4 className="text-[#0f592f] font-black text-sm uppercase tracking-wider">Sin tickets registrados</h4>
                                        <p className="text-gray-400 text-xs font-semibold max-w-sm mt-1">
                                            No hay reportes de soporte creados por los estudiantes.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN 6: GESTIÓN DE INSIGNIAS (GAMIFICACIÓN) */}
                    {activeTab === 'badges' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <header className="text-left space-y-1">
                                    <h2 className="text-3xl font-black text-[#0f592f] tracking-tight">Gestión de Insignias</h2>
                                    <p className="text-gray-500 font-medium text-xs">Crea, edita o elimina los logros del sistema de gamificación.</p>
                                </header>
                                <button
                                    onClick={() => {
                                        setBadgeData({ id: null, name: '', image_url: '', type: 'xp_earned', value: 100, xp_reward: 0, coins_reward: 0 });
                                        setShowBadgeModal(true);
                                    }}
                                    className="px-6 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <span>🏆</span> Crear Nueva Insignia
                                </button>
                            </div>

                            {/* GRID DE INSIGNIAS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {badges.length > 0 ? (
                                    badges.map(badge => {
                                        let criteriaText = "Criterio personalizado";
                                        if (badge.criteria) {
                                            try {
                                                const crit = typeof badge.criteria === 'string' ? JSON.parse(badge.criteria) : badge.criteria;
                                                switch(crit.type) {
                                                    case 'xp_earned':
                                                        criteriaText = `Acumular ${crit.value} XP`;
                                                        break;
                                                    case 'mentorships_given':
                                                        criteriaText = `Dar ${crit.value} tutorías`;
                                                        break;
                                                    case 'mentorships_received':
                                                        criteriaText = `Recibir ${crit.value} tutorías`;
                                                        break;
                                                    case 'mentorships_any':
                                                        criteriaText = `Completar ${crit.value} tutorías`;
                                                        break;
                                                    case 'perfect_ratings':
                                                        criteriaText = `Obtener ${crit.value} calificaciones de 5★`;
                                                        break;
                                                    case 'first_login':
                                                        criteriaText = "Creaste tu Cuenta en pilas!";
                                                        break;
                                                    case 'profile_configured':
                                                        criteriaText = "Configuraste tu perfil de usuario";
                                                        break;
                                                }
                                            } catch { // Intencionalmente vacío
                                            }
                                        }

                                        return (
                                            <div key={badge.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-150/40 hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-[4rem]"></div>
                                                
                                                <div>
                                                    <div className="w-16 h-16 bg-amber-50 rounded-2xl overflow-hidden flex items-center justify-center text-3xl shadow-inner border border-amber-100/50 mb-4 group-hover:scale-110 transition-transform">
                                                        {badge.image_url && badge.image_url.startsWith('http') ? (
                                                            <img src={badge.image_url} alt={badge.name} className="w-full h-full object-cover animate-pulse" />
                                                        ) : (
                                                            badge.image_url || "🏅"
                                                        )}
                                                    </div>
                                                    <h3 className="font-extrabold text-base text-[#0f592f] truncate" title={badge.name}>
                                                        {badge.name}
                                                    </h3>
                                                    <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider mt-1">
                                                        🎯 {criteriaText}
                                                    </p>
                                                    <div className="flex gap-4 mt-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                        <div className="flex-1 text-center">
                                                            <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider block">XP Regalo</span>
                                                            <span className="text-xs font-black text-slate-700">+{badge.xp_reward}</span>
                                                        </div>
                                                        <div className="w-px bg-gray-200"></div>
                                                        <div className="flex-1 text-center">
                                                            <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider block">Coins Regalo</span>
                                                            <span className="text-xs font-black text-slate-700">+{badge.coins_reward}🪙</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-50 relative z-10">
                                                    <button
                                                        onClick={() => handleOpenEditBadge(badge)}
                                                        className="px-4 py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-[10px] uppercase tracking-wider flex-1 transition-colors"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBadge(badge.id, badge.name)}
                                                        className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-[10px] uppercase tracking-wider flex-1 transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-250 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">🏆</span>
                                        <h4 className="text-[#0f592f] font-black text-sm uppercase tracking-wider">No hay insignias creadas</h4>
                                        <p className="text-gray-400 text-xs font-semibold max-w-sm mt-1">
                                            Crea insignias iniciales para incentivar el progreso de tus alumnos.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {/* MODAL RESPONDER TICKET */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f592f]/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resolver Ticket #{selectedTicket.id}</span>
                                <h3 className="text-lg font-black text-[#0f592f] tracking-tight">{selectedTicket.title}</h3>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-red-500 text-3xl font-light">&times;</button>
                        </div>

                        <form onSubmit={handleResolveTicketSubmit} className="p-8 space-y-6">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150/40 text-left space-y-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reporte del alumno:</span>
                                <p className="text-gray-600 text-xs font-semibold leading-relaxed">{selectedTicket.description}</p>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Respuesta formal de Soporte</label>
                                <textarea 
                                    required
                                    rows="5" 
                                    value={replyText} 
                                    onChange={(e) => setReplyText(e.target.value)} 
                                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-medium text-gray-600 text-xs resize-none placeholder-gray-400" 
                                    placeholder="Escribe la solución brindada al usuario..." 
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={resolving}
                                className="w-full py-5 bg-[#0f592f] text-[#ffcc00] rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:shadow-[#0f592f]/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                                {resolving ? 'Enviando...' : 'Resolver y Cerrar Ticket'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CREAR / EDITAR INSIGNIA */}
            {showBadgeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f592f]/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-gray-100 text-left">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    {badgeData.id ? 'Editar Insignia' : 'Crear Nueva Insignia'}
                                </span>
                                <h3 className="text-lg font-black text-[#0f592f] tracking-tight">Formulario de Logro</h3>
                            </div>
                            <button onClick={() => { setShowBadgeModal(false); setBadgeFile(null); }} className="text-gray-400 hover:text-red-500 text-3xl font-light">&times;</button>
                        </div>

                        <form onSubmit={handleSaveBadge} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre de Insignia</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={badgeData.name} 
                                    onChange={(e) => setBadgeData({ ...badgeData, name: e.target.value })} 
                                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#0f592f] text-xs" 
                                    placeholder="Ej: Tutor Comprometido"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">URL del Ícono (Opcional si subes un archivo)</label>
                                <input 
                                    type="text" 
                                    value={badgeData.image_url} 
                                    onChange={(e) => setBadgeData({ ...badgeData, image_url: e.target.value })} 
                                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#0f592f] text-xs" 
                                    placeholder="Ej: https://cdn-icons-png.flaticon.com/..."
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Subir Ícono Personalizado (Opcional - Firebase Storage)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleBadgeFileChange}
                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0f592f] hover:file:bg-blue-100 cursor-pointer"
                                />
                                <p className="text-[9px] text-gray-400 mt-1">
                                    Tamaño máx: <strong>2 MB</strong> · Mín: <strong>100x100 px</strong>, Máx: <strong>2000x2000 px</strong>.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Recompensa XP</label>
                                    <input 
                                        type="number" 
                                        value={badgeData.xp_reward} 
                                        onChange={(e) => setBadgeData({ ...badgeData, xp_reward: e.target.value })} 
                                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#0f592f] text-xs" 
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Recompensa Coins 🪙</label>
                                    <input 
                                        type="number" 
                                        value={badgeData.coins_reward} 
                                        onChange={(e) => setBadgeData({ ...badgeData, coins_reward: e.target.value })} 
                                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#0f592f] text-xs" 
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-150/40 space-y-4 text-left">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Regla de Criterio de Logro</span>
                                
                                <div>
                                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tipo de Evento</label>
                                    <select
                                        value={badgeData.type}
                                        onChange={(e) => setBadgeData({ ...badgeData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-150/60 rounded-xl outline-none font-bold text-[#0f592f] text-xs cursor-pointer"
                                    >
                                        <option value="xp_earned">Acumular total de Puntos de Experiencia (XP)</option>
                                        <option value="mentorships_given">Completar tutorías como Mentor/Tutor</option>
                                        <option value="mentorships_received">Completar tutorías como Aprendiz</option>
                                        <option value="mentorships_any">Completar tutorías en total (cualquier rol)</option>
                                        <option value="perfect_ratings">Tutorías calificadas con 5★ estrellas</option>
                                        <option value="first_login">Crear tu cuenta en Pilas!</option>
                                        <option value="profile_configured">Configurar tu perfil (Biografía)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Cantidad Requerida (Meta)</label>
                                    <input 
                                        type="number" 
                                        required
                                        value={badgeData.value} 
                                        onChange={(e) => setBadgeData({ ...badgeData, value: e.target.value })} 
                                        className="w-full px-4 py-2.5 bg-white border border-gray-150/60 rounded-xl focus:ring-2 focus:ring-[#ffcc00] outline-none font-bold text-[#0f592f] text-xs" 
                                        placeholder="Cantidad a cumplir"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={savingBadge}
                                className="w-full py-5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:shadow-amber-500/10 hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                                {savingBadge ? 'Guardando...' : (badgeData.id ? 'Guardar Cambios' : 'Crear Insignia')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;
