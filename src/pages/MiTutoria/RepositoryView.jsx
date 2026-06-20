import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://pilas-backend.onrender.com';

// Helpers de formato
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
};

const FILE_TYPE_ICONS = {
    image: '🖼️',
    video: '🎬',
    document: '📄',
};

const FILE_TYPE_LABELS = {
    image: 'Imagen',
    video: 'Video',
    document: 'Documento',
};

const FILE_TYPE_COLORS = {
    image: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', accent: '#10b981' },
    video: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', accent: '#8b5cf6' },
    document: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', accent: '#3b82f6' },
};

/**
 * RepositoryView — Repositorio de Materiales de una tutoría
 * Vista dual: Mentor (CRUD completo) / Aprendiz (solo lectura + descarga)
 */
const RepositoryView = ({ mentorship, currentUser }) => {
    const { showNotification } = useNotification();
    const isMentor = currentUser?.id === mentorship?.mentor_id;

    // State
    const [materials, setMaterials] = useState([]);
    const [storageInfo, setStorageInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    // Modals
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showPreview, setShowPreview] = useState(null);
    const [showReplaceModal, setShowReplaceModal] = useState(null);

    // Upload form
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Edit form
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Replace file
    const [replaceFile, setReplaceFile] = useState(null);
    const replaceInputRef = useRef(null);

    // --- Data Fetching ---
    const fetchMaterials = useCallback(async () => {
        try {
            const { data } = await axios.get(
                `${BACKEND_URL}/api/repository/${mentorship.id}?userId=${currentUser.id}`
            );
            setMaterials(data);
        } catch (err) {
            console.error('Error cargando materiales:', err);
        }
    }, [mentorship?.id, currentUser?.id]);

    const fetchStorage = useCallback(async () => {
        try {
            const { data } = await axios.get(
                `${BACKEND_URL}/api/repository/${mentorship.id}/storage?userId=${currentUser.id}`
            );
            setStorageInfo(data);
        } catch (err) {
            console.error('Error cargando almacenamiento:', err);
        }
    }, [mentorship?.id, currentUser?.id]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchMaterials(), fetchStorage()]);
            setLoading(false);
        };
        if (mentorship?.id && currentUser?.id) {
            loadData();
        }
    }, [mentorship?.id, currentUser?.id, fetchMaterials, fetchStorage]);

    const validateRepositoryFile = (file) => {
        return new Promise((resolve) => {
            if (!file) {
                resolve({ isValid: false, error: 'No se seleccionó ningún archivo.' });
                return;
            }

            const isImage = file.type.startsWith('image/') || 
                            ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => file.name.toLowerCase().endsWith(ext));

            if (isImage) {
                // Validación para imágenes
                const maxImageSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxImageSize) {
                    resolve({ isValid: false, error: 'La imagen supera el tamaño máximo permitido de 10 MB.' });
                    return;
                }

                // Validar dimensiones: Min 100x100px, Max 4000x4000px
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(img.src);
                    const minWidth = 100;
                    const minHeight = 100;
                    const maxWidth = 4000;
                    const maxHeight = 4000;

                    if (img.width < minWidth || img.height < minHeight) {
                        resolve({ isValid: false, error: `Las dimensiones de la imagen son muy pequeñas (${img.width}x${img.height}px). El mínimo permitido es ${minWidth}x${minHeight}px.` });
                    } else if (img.width > maxWidth || img.height > maxHeight) {
                        resolve({ isValid: false, error: `Las dimensiones de la imagen son muy grandes (${img.width}x${img.height}px). El máximo permitido es ${maxWidth}x${maxHeight}px.` });
                    } else {
                        resolve({ isValid: true });
                    }
                };
                img.onerror = () => {
                    URL.revokeObjectURL(img.src);
                    resolve({ isValid: false, error: 'El archivo de imagen está dañado o no es válido.' });
                };
                img.src = URL.createObjectURL(file);
            } else {
                // Validación general de archivos
                const maxGenericSize = 50 * 1024 * 1024; // 50MB
                if (file.size > maxGenericSize) {
                    resolve({ isValid: false, error: 'El archivo supera el tamaño máximo permitido de 50 MB.' });
                    return;
                }
                resolve({ isValid: true });
            }
        });
    };

    const handleReplaceFileSelect = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const validation = await validateRepositoryFile(file);
            if (!validation.isValid) {
                showNotification(validation.error, 'warning');
                if (replaceInputRef.current) replaceInputRef.current.value = '';
                setReplaceFile(null);
            } else {
                setReplaceFile(file);
            }
        }
    };

    // --- Upload Handlers ---
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const validation = await validateRepositoryFile(file);
            if (!validation.isValid) {
                showNotification(validation.error, 'warning');
                if (fileInputRef.current) fileInputRef.current.value = '';
                setUploadFile(null);
            } else {
                setUploadFile(file);
            }
        }
    };

    const handleFileSelect = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const validation = await validateRepositoryFile(file);
            if (!validation.isValid) {
                showNotification(validation.error, 'warning');
                if (fileInputRef.current) fileInputRef.current.value = '';
                setUploadFile(null);
            } else {
                setUploadFile(file);
            }
        }
    };

    const resetUploadForm = () => {
        setUploadTitle('');
        setUploadDescription('');
        setUploadFile(null);
        setUploadProgress(0);
        setShowUploadModal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (!uploadFile || !uploadTitle.trim()) return;
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', uploadTitle.trim());
        formData.append('description', uploadDescription.trim());
        formData.append('userId', currentUser.id);

        try {
            await axios.post(
                `${BACKEND_URL}/api/repository/${mentorship.id}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(pct);
                    },
                }
            );
            showNotification('✅ Material subido exitosamente', 'success');
            resetUploadForm();
            await Promise.all([fetchMaterials(), fetchStorage()]);
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al subir el material';
            showNotification(`❌ ${msg}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    // --- Edit Handler ---
    const openEditModal = (material) => {
        setEditTitle(material.title);
        setEditDescription(material.description || '');
        setShowEditModal(material);
    };

    const handleEdit = async () => {
        if (!editTitle.trim() || !showEditModal) return;
        try {
            await axios.put(`${BACKEND_URL}/api/repository/material/${showEditModal.id}`, {
                title: editTitle.trim(),
                description: editDescription.trim(),
                userId: currentUser.id,
            });
            showNotification('✅ Material actualizado', 'success');
            setShowEditModal(null);
            await fetchMaterials();
        } catch {
            showNotification('❌ Error al actualizar', 'error');
        }
    };

    // --- Replace File Handler ---
    const handleReplaceFile = async () => {
        if (!replaceFile || !showReplaceModal) return;
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', replaceFile);
        formData.append('userId', currentUser.id);

        try {
            await axios.put(
                `${BACKEND_URL}/api/repository/material/${showReplaceModal.id}/file`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(pct);
                    },
                }
            );
            showNotification('✅ Archivo reemplazado exitosamente', 'success');
            setShowReplaceModal(null);
            setReplaceFile(null);
            setUploadProgress(0);
            await Promise.all([fetchMaterials(), fetchStorage()]);
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al reemplazar el archivo';
            showNotification(`❌ ${msg}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    // --- Delete Handler ---
    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await axios.delete(
                `${BACKEND_URL}/api/repository/material/${showDeleteConfirm.id}?userId=${currentUser.id}`
            );
            showNotification('🗑️ Material eliminado', 'success');
            setShowDeleteConfirm(null);
            await Promise.all([fetchMaterials(), fetchStorage()]);
        } catch {
            showNotification('❌ Error al eliminar', 'error');
        }
    };

    // --- Filtered & Sorted Materials ---
    const filteredMaterials = materials
        .filter((m) => {
            if (filterType !== 'all' && m.file_type !== filterType) return false;
            if (searchTerm && !m.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'date') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'name') return a.title.localeCompare(b.title);
            if (sortBy === 'size') return b.file_size - a.file_size;
            return 0;
        });

    // --- Storage Bar Color ---
    const getStorageBarColor = () => {
        if (!storageInfo) return 'from-emerald-400 to-emerald-500';
        if (storageInfo.percentage > 80) return 'from-red-400 to-red-500';
        if (storageInfo.percentage > 60) return 'from-amber-400 to-amber-500';
        return 'from-emerald-400 to-emerald-500';
    };

    // === LOADING STATE ===
    if (loading) {
        return (
            <div className="flex-1 h-full overflow-y-auto p-6">
                {/* Skeleton storage bar */}
                <div className="mb-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded-full w-48 mb-2" />
                    <div className="h-3 bg-gray-100 rounded-full w-full" />
                </div>
                {/* Skeleton cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 p-5">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl mb-3" />
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-gray-50/30">
            <div className="max-w-6xl mx-auto px-6 py-6">

                {/* === HEADER === */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-black text-[#0f592f] tracking-tight flex items-center gap-2">
                            📚 Repositorio de Materiales
                        </h2>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {isMentor
                                ? 'Sube y gestiona el material de apoyo para tu aprendiz'
                                : 'Material de apoyo compartido por tu mentor'}
                        </p>
                    </div>

                    {/* Botón subir — solo mentor y cuando esté activa */}
                    {isMentor && mentorship?.status !== 'COMPLETADA' && (
                        <button
                            id="btn-upload-material"
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f592f] text-[#d4af37] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0a4624] hover:shadow-lg hover:shadow-[#0f592f]/20 hover:scale-[1.02] transition-all duration-200 self-start sm:self-auto"
                        >
                            <span className="text-base">+</span> Subir Material
                        </button>
                    )}
                </div>

                {/* === STORAGE BAR === */}
                {storageInfo && (
                    <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">💾</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    Almacenamiento
                                </span>
                            </div>
                            <span className="text-xs font-bold text-gray-600">
                                {formatFileSize(storageInfo.used_bytes)} / {formatFileSize(storageInfo.limit_bytes)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${getStorageBarColor()} transition-all duration-700 ease-out`}
                                style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[9px] text-gray-400 font-medium">
                                {storageInfo.total_files} {storageInfo.total_files === 1 ? 'archivo' : 'archivos'}
                            </span>
                            {storageInfo.percentage > 80 && (
                                <span className="text-[9px] font-bold text-red-500 flex items-center gap-1">
                                    ⚠️ Espacio casi lleno
                                </span>
                            )}
                            <span className="text-[9px] text-gray-400 font-medium">
                                {formatFileSize(storageInfo.remaining_bytes)} disponibles
                            </span>
                        </div>
                    </div>
                )}

                {/* === FILTERS BAR === */}
                {materials.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                        {/* Search */}
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                            <input
                                id="repo-search"
                                type="text"
                                placeholder="Buscar por título..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#d4af37]/50 focus:ring-2 focus:ring-[#d4af37]/10 transition-all"
                            />
                        </div>
                        {/* Filter by type */}
                        <div className="flex gap-1.5">
                            {[
                                { key: 'all', label: 'Todos', icon: '📋' },
                                { key: 'image', label: 'Imágenes', icon: '🖼️' },
                                { key: 'video', label: 'Videos', icon: '🎬' },
                                { key: 'document', label: 'Docs', icon: '📄' },
                            ].map((f) => (
                                <button
                                    key={f.key}
                                    id={`filter-${f.key}`}
                                    onClick={() => setFilterType(f.key)}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1 ${
                                        filterType === f.key
                                            ? 'bg-[#0f592f] text-[#d4af37] shadow-md'
                                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span>{f.icon}</span>
                                    <span className="hidden sm:inline">{f.label}</span>
                                </button>
                            ))}
                        </div>
                        {/* Sort */}
                        <select
                            id="repo-sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 font-medium focus:outline-none focus:border-[#d4af37]/50 cursor-pointer"
                        >
                            <option value="date">Más recientes</option>
                            <option value="name">Nombre A-Z</option>
                            <option value="size">Mayor tamaño</option>
                        </select>
                    </div>
                )}

                {/* === EMPTY STATE === */}
                {materials.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-[#d4af37]/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                            <div className="relative w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center text-5xl shadow-inner border border-gray-200">
                                📚
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-[#0f592f] mb-2">
                            {isMentor ? 'Tu repositorio está vacío' : 'Sin materiales aún'}
                        </h3>
                        <p className="text-sm text-gray-400 font-medium max-w-xs mb-4">
                            {isMentor
                                ? 'Sube PDFs, videos, imágenes o cualquier recurso que ayude a tu aprendiz.'
                                : 'Tu mentor aún no ha subido materiales. Aparecerán aquí cuando lo haga.'}
                        </p>
                        {isMentor && mentorship?.status !== 'COMPLETADA' && (
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-[#0f592f] text-[#d4af37] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0a4624] hover:scale-[1.02] transition-all shadow-lg shadow-[#0f592f]/20"
                            >
                                <span>+</span> Subir primer material
                            </button>
                        )}
                    </div>
                )}

                {/* === MATERIALS GRID === */}
                {filteredMaterials.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMaterials.map((mat, index) => {
                            const typeConfig = FILE_TYPE_COLORS[mat.file_type] || FILE_TYPE_COLORS.document;
                            return (
                                <div
                                    key={mat.id}
                                    className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 overflow-hidden cursor-pointer"
                                    style={{ animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both` }}
                                    onClick={() => setShowPreview(mat)}
                                >
                                    {/* Preview thumbnail area */}
                                    <div className={`h-32 ${typeConfig.bg} flex items-center justify-center relative overflow-hidden`}>
                                        {mat.file_type === 'image' ? (
                                            <img
                                                src={mat.file_url}
                                                alt={mat.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        ) : mat.file_type === 'video' ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-14 h-14 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <span className="text-2xl ml-1">▶</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Video</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-4xl group-hover:scale-110 transition-transform">
                                                    {FILE_TYPE_ICONS[mat.file_type]}
                                                </span>
                                                <span className={`text-[9px] font-bold ${typeConfig.text} uppercase tracking-widest`}>
                                                    {mat.file_name.split('.').pop()?.toUpperCase()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Type badge */}
                                        <div className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg ${typeConfig.bg} ${typeConfig.border} border backdrop-blur-sm`}>
                                            <span className="text-xs">{FILE_TYPE_ICONS[mat.file_type]}</span>
                                            <span className={`text-[8px] font-black uppercase tracking-wider ${typeConfig.text}`}>
                                                {FILE_TYPE_LABELS[mat.file_type]}
                                            </span>
                                        </div>

                                        {/* Mentor actions */}
                                        {isMentor && mentorship?.status !== 'COMPLETADA' && (
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditModal(mat); }}
                                                    className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-xs shadow-sm hover:bg-white hover:scale-110 transition-all"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowReplaceModal(mat); }}
                                                    className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-xs shadow-sm hover:bg-white hover:scale-110 transition-all"
                                                    title="Cambiar archivo"
                                                >
                                                    🔄
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(mat); }}
                                                    className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-xs shadow-sm hover:bg-red-50 hover:scale-110 transition-all"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h4 className="font-bold text-sm text-gray-800 truncate mb-1 group-hover:text-[#0f592f] transition-colors">
                                            {mat.title}
                                        </h4>
                                        {mat.description && (
                                            <p className="text-[11px] text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                                                {mat.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-[9px] text-gray-400 font-medium">
                                            <span>{formatDate(mat.created_at)}</span>
                                            <span className="font-bold">{formatFileSize(mat.file_size)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* No results for filter */}
                {materials.length > 0 && filteredMaterials.length === 0 && (
                    <div className="text-center py-12">
                        <span className="text-4xl mb-3 block">🔍</span>
                        <p className="text-sm text-gray-400 font-medium">
                            No se encontraron materiales con esos filtros.
                        </p>
                    </div>
                )}
            </div>

            {/* ===== MODALS ===== */}

            {/* --- Upload Modal --- */}
            {showUploadModal && (
                <ModalOverlay onClose={() => { if (!uploading) resetUploadForm(); }}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#0f592f] to-[#0a4624] px-6 py-4">
                            <h3 className="text-white font-black text-sm tracking-tight">Subir nuevo material</h3>
                            <p className="text-white/40 text-[10px] font-medium mt-0.5">
                                Archivos generales hasta 50MB · Imágenes hasta 10MB (Mín: 100x100px, Máx: 4000x4000px)
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Requisitos visuales */}
                            <div className="text-[10px] text-gray-400 text-left bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-0.5">
                                <p className="font-bold text-[#0f592f] mb-1">📋 Requisitos de carga:</p>
                                <p>• <strong>Archivos generales:</strong> Máximo 50 MB.</p>
                                <p>• <strong>Imágenes:</strong> Máximo 10 MB (Mín: 100x100px, Máx: 4000x4000px).</p>
                            </div>
                            {/* Drop zone */}
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                                    dragActive
                                        ? 'border-[#d4af37] bg-[#d4af37]/5 scale-[1.02]'
                                        : uploadFile
                                        ? 'border-emerald-300 bg-emerald-50/30'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.py,.java,.js,.cpp,.c,.ts,.html,.css"
                                />
                                {uploadFile ? (
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{FILE_TYPE_ICONS[getFileTypeFromName(uploadFile.name)] || '📎'}</span>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-700 truncate">{uploadFile.name}</p>
                                            <p className="text-[10px] text-gray-400">{formatFileSize(uploadFile.size)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                                            className="text-gray-400 hover:text-red-500 transition-colors text-lg"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <span className="text-4xl block">📤</span>
                                        <p className="text-sm font-bold text-gray-500">
                                            Arrastra tu archivo aquí
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            o haz click para seleccionar
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">
                                    Título *
                                </label>
                                <input
                                    id="upload-title"
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    placeholder="Ej: Guía de ejercicios Semana 3"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#d4af37]/50 focus:ring-2 focus:ring-[#d4af37]/10 transition-all"
                                    maxLength={255}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">
                                    Descripción <span className="text-gray-300 font-normal">(opcional)</span>
                                </label>
                                <textarea
                                    id="upload-description"
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                    placeholder="Breve descripción del material..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#d4af37]/50 focus:ring-2 focus:ring-[#d4af37]/10 transition-all resize-none"
                                    maxLength={500}
                                />
                            </div>

                            {/* Storage info */}
                            {storageInfo && uploadFile && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                                    <span className="text-xs">💾</span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        {formatFileSize(uploadFile.size)} de {formatFileSize(storageInfo.remaining_bytes)} disponibles
                                    </span>
                                    {uploadFile.size > storageInfo.remaining_bytes && (
                                        <span className="text-[9px] font-bold text-red-500 ml-auto">⚠️ Sin espacio</span>
                                    )}
                                </div>
                            )}

                            {/* Upload progress */}
                            {uploading && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                                        <span>Subiendo...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-yellow-400 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={resetUploadForm}
                                    disabled={uploading}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all disabled:opacity-40"
                                >
                                    Cancelar
                                </button>
                                <button
                                    id="btn-confirm-upload"
                                    onClick={handleUpload}
                                    disabled={uploading || !uploadFile || !uploadTitle.trim()}
                                    className="flex-1 px-4 py-2.5 bg-[#0f592f] text-[#d4af37] rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#0a4624] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {uploading ? 'Subiendo...' : 'Subir Material'}
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* --- Edit Modal --- */}
            {showEditModal && (
                <ModalOverlay onClose={() => setShowEditModal(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#0f592f] to-[#0a4624] px-6 py-4">
                            <h3 className="text-white font-black text-sm tracking-tight">Editar material</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#d4af37]/50 focus:ring-2 focus:ring-[#d4af37]/10 transition-all"
                                    maxLength={255}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">
                                    Descripción
                                </label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#d4af37]/50 focus:ring-2 focus:ring-[#d4af37]/10 transition-all resize-none"
                                    maxLength={500}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowEditModal(null)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEdit}
                                    disabled={!editTitle.trim()}
                                    className="flex-1 px-4 py-2.5 bg-[#0f592f] text-[#d4af37] rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#0a4624] transition-all disabled:opacity-40"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* --- Replace File Modal --- */}
            {showReplaceModal && (
                <ModalOverlay onClose={() => { if (!uploading) { setShowReplaceModal(null); setReplaceFile(null); } }}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#0f592f] to-[#0a4624] px-6 py-4">
                            <h3 className="text-white font-black text-sm tracking-tight">Cambiar archivo</h3>
                            <p className="text-white/40 text-[10px] font-medium mt-0.5">
                                Se mantendrá el título y la descripción actuales
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Current file info */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <span className="text-xl">{FILE_TYPE_ICONS[showReplaceModal.file_type]}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-600 truncate">{showReplaceModal.file_name}</p>
                                    <p className="text-[9px] text-gray-400">Archivo actual · {formatFileSize(showReplaceModal.file_size)}</p>
                                </div>
                            </div>

                            {/* Requisitos visuales */}
                            <div className="text-[10px] text-gray-400 text-left bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-0.5">
                                <p className="font-bold text-[#0f592f] mb-1">📋 Requisitos de carga:</p>
                                <p>• <strong>Archivos generales:</strong> Máximo 50 MB.</p>
                                <p>• <strong>Imágenes:</strong> Máximo 10 MB (Mín: 100x100px, Máx: 4000x4000px).</p>
                            </div>

                            {/* New file */}
                            <div
                                onClick={() => replaceInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                    replaceFile ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    ref={replaceInputRef}
                                    type="file"
                                    onChange={handleReplaceFileSelect}
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.py,.java,.js,.cpp,.c,.ts,.html,.css"
                                />
                                {replaceFile ? (
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{FILE_TYPE_ICONS[getFileTypeFromName(replaceFile.name)] || '📎'}</span>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-700 truncate">{replaceFile.name}</p>
                                            <p className="text-[10px] text-emerald-500 font-medium">Nuevo archivo · {formatFileSize(replaceFile.size)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <span className="text-3xl block">🔄</span>
                                        <p className="text-xs font-bold text-gray-500">Selecciona el nuevo archivo</p>
                                    </div>
                                )}
                            </div>

                            {uploading && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                                        <span>Reemplazando...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-yellow-400 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowReplaceModal(null); setReplaceFile(null); }}
                                    disabled={uploading}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all disabled:opacity-40"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReplaceFile}
                                    disabled={uploading || !replaceFile}
                                    className="flex-1 px-4 py-2.5 bg-[#0f592f] text-[#d4af37] rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#0a4624] transition-all disabled:opacity-40"
                                >
                                    {uploading ? 'Subiendo...' : 'Reemplazar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* --- Delete Confirm Modal --- */}
            {showDeleteConfirm && (
                <ModalOverlay onClose={() => setShowDeleteConfirm(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center text-3xl">
                                🗑️
                            </div>
                            <div>
                                <h3 className="font-black text-gray-800 text-base mb-1">¿Eliminar este material?</h3>
                                <p className="text-sm text-gray-400 font-medium">
                                    &quot;{showDeleteConfirm.title}&quot;
                                </p>
                                <p className="text-[10px] text-red-400 font-medium mt-2">
                                    Esta acción no se puede deshacer
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    id="btn-confirm-delete"
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-600 transition-all"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* --- Preview Modal --- */}
            {showPreview && (
                <ModalOverlay onClose={() => setShowPreview(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="text-xl flex-shrink-0">
                                    {FILE_TYPE_ICONS[showPreview.file_type]}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="font-black text-[#0f592f] text-sm truncate">{showPreview.title}</h3>
                                    <p className="text-[9px] text-gray-400 font-medium">
                                        {showPreview.file_name} · {formatFileSize(showPreview.file_size)} · {formatDate(showPreview.created_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPreview(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 text-lg flex-shrink-0"
                            >
                                ×
                            </button>
                        </div>

                        {/* Description */}
                        {showPreview.description && (
                            <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
                                <p className="text-xs text-gray-500 leading-relaxed">{showPreview.description}</p>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center min-h-[200px]">
                            {showPreview.file_type === 'image' && (
                                <img
                                    src={showPreview.file_url}
                                    alt={showPreview.title}
                                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg"
                                />
                            )}
                            {showPreview.file_type === 'video' && (
                                <video
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[60vh] rounded-xl shadow-lg"
                                    src={showPreview.file_url}
                                >
                                    Tu navegador no soporta la reproducción de video.
                                </video>
                            )}
                            {showPreview.file_type === 'document' && (
                                <div className="flex flex-col items-center gap-6 py-8">
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center text-5xl shadow-inner border border-blue-200">
                                        📄
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-700 text-sm mb-1">{showPreview.file_name}</p>
                                        <p className="text-xs text-gray-400">
                                            {showPreview.file_name.split('.').pop()?.toUpperCase()} · {formatFileSize(showPreview.file_size)}
                                        </p>
                                    </div>
                                    <a
                                        href={`${BACKEND_URL}/api/repository/material/${showPreview.id}/download?userId=${currentUser.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 bg-[#0f592f] text-[#d4af37] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0a4624] hover:scale-[1.02] transition-all shadow-lg shadow-[#0f592f]/20"
                                    >
                                        <span className="text-base">⬇️</span> Descargar Archivo
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${FILE_TYPE_COLORS[showPreview.file_type]?.bg} ${FILE_TYPE_COLORS[showPreview.file_type]?.border} border`}>
                                    <span className="text-xs">{FILE_TYPE_ICONS[showPreview.file_type]}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-wider ${FILE_TYPE_COLORS[showPreview.file_type]?.text}`}>
                                        {FILE_TYPE_LABELS[showPreview.file_type]}
                                    </span>
                                </div>
                            </div>
                            {(showPreview.file_type === 'image' || showPreview.file_type === 'video') && (
                                <a
                                    href={`${BACKEND_URL}/api/repository/material/${showPreview.id}/download?userId=${currentUser.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                                >
                                    <span>⬇️</span> Descargar
                                </a>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Keyframe animation */}
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
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

// === Helper Components ===

/**
 * ModalOverlay — Fondo oscuro reutilizable
 */
const ModalOverlay = ({ onClose, children }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
        <div style={{ animation: 'scaleIn 0.2s ease-out' }}>
            {children}
        </div>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}</style>
    </div>
);

/**
 * Obtiene el tipo de archivo a partir del nombre (para UI local)
 */
const getFileTypeFromName = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExts = ['mp4', 'webm', 'mov'];
    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    return 'document';
};

export default RepositoryView;
