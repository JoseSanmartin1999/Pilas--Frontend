import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png'; // Ruta corregida a tus assets
import { useNotification } from '../context/NotificationContext';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://pilas-backend.onrender.com';

const Register = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '', email: '', password: '', confirmPassword: '', role: 'APRENDIZ',
        institution: 'ESPE', career: '', student_id: '', current_semester: 1, bio: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [image, setImage] = useState(null);
    const [careers, setCareers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    // Cargar carreras en el montaje del componente
    useEffect(() => {
        const fetchCareers = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/api/admin/careers`);
                setCareers(res.data);
                if (res.data.length > 0) {
                    // Buscar "Ingeniería de Software" o pre-seleccionar la primera
                    const defaultCareer = res.data.find(c => c.name.toLowerCase().includes('software')) || res.data[0];
                    setFormData(prev => ({ ...prev, career: defaultCareer.name }));
                }
            } catch (err) {
                console.error("Error cargando carreras:", err);
            }
        };
        fetchCareers();
    }, []);

    // Cargar materias según el semestre y la carrera seleccionada
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!formData.career) return;
            try {
                const res = await axios.get(`${BACKEND_URL}/api/subjects?semester=${formData.current_semester}&career_name=${encodeURIComponent(formData.career)}`);
                setSubjects(res.data);
            } catch { console.error("Error cargando materias"); }
        };
        fetchSubjects();
    }, [formData.current_semester, formData.career]);

    // Si cambia el semestre o el rol y el semestre es <= 3, forzar rol a APRENDIZ
    useEffect(() => {
        const sem = parseInt(formData.current_semester, 10);
        if (sem <= 3 && formData.role === 'MENTOR') {
            setFormData(prev => ({ ...prev, role: 'APRENDIZ' }));
            showNotification("Los estudiantes de primer a tercer semestre solo pueden registrarse como Aprendices.", "info");
        }
    }, [formData.current_semester, formData.role, showNotification]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleSubject = (id) => {
        setSelectedSubjects(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const validatePassword = (password) => {
        // Al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;
        return regex.test(password);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo (debe ser imagen)
        if (!file.type.startsWith('image/')) {
            showNotification("El archivo seleccionado debe ser una imagen.", "warning");
            e.target.value = '';
            setImage(null);
            return;
        }

        // Validar tamaño máximo: 2 MB
        const maxSizeBytes = 2 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            showNotification("La imagen supera el tamaño máximo permitido de 2 MB.", "warning");
            e.target.value = '';
            setImage(null);
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
                setImage(null);
            } else if (img.width > maxWidth || img.height > maxHeight) {
                showNotification(`Las dimensiones de la imagen son muy grandes (${img.width}x${img.height}px). El máximo permitido es ${maxWidth}x${maxHeight}px.`, "warning");
                e.target.value = '';
                setImage(null);
            } else {
                setImage(file);
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            showNotification("El archivo de imagen está dañado o no es válido.", "error");
            e.target.value = '';
            setImage(null);
        };
        img.src = URL.createObjectURL(file);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (parseInt(formData.current_semester, 10) <= 3 && formData.role === 'MENTOR') {
            showNotification("Los estudiantes de primer a tercer semestre solo pueden registrarse como Aprendices.", "warning");
            return;
        }

        if (!formData.email.toLowerCase().endsWith('@espe.edu.ec')) {
            showNotification("El correo debe ser institucional de la ESPE (debe terminar en @espe.edu.ec).", "warning");
            return;
        }

        if (!validatePassword(formData.password)) {
            showNotification("La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&.#).", "warning");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            showNotification("Las contraseñas no coinciden", "warning");
            return;
        }

        try {
            const formDataPayload = new FormData();

            // Adjuntar datos de texto
            Object.keys(formData).forEach(key => {
                formDataPayload.append(key, formData[key]);
            });

            // Adjuntar materias seleccionadas como JSON string
            formDataPayload.append('selectedSubjects', JSON.stringify(selectedSubjects));

            // Adjuntar archivo (foto de perfil) si existe
            if (image) {
                formDataPayload.append('profile_photo', image);
            }

            // Enviar todo directo al backend (multipart/form-data)
            await axios.post(`${BACKEND_URL}/api/auth/register`, formDataPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showNotification("Registro exitoso. Se ha enviado un código a tu correo.", "success");
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (err) {
            console.error("Error en registro", err.response?.data || err.message);
            const serverMsg = err.response?.data?.message || err.response?.data?.error?.message || err.message;
            showNotification("Error en registro: " + serverMsg, "error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border-t-8 border-pilas-blue">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <img src={logo} alt="Pilas!" className="h-16 mx-auto mb-4" />
                        <h2 className="text-3xl font-extrabold text-pilas-blue">Crea tu Perfil Académico</h2>
                    </div>

                    <form className="space-y-6" onSubmit={handleRegister}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input name="full_name" onChange={handleInputChange} type="text" placeholder="Nombre Completo" className="input-style" required />
                            <input name="email" onChange={handleInputChange} type="email" placeholder="Correo Institucional" className="input-style" required />

                            {/* Contraseña con Visualización */}
                            <div className="relative">
                                <input
                                    name="password"
                                    onChange={handleInputChange}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Contraseña"
                                    className="input-style w-full"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-500"
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>

                            <input
                                name="confirmPassword"
                                onChange={handleInputChange}
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirmar Contraseña"
                                className="input-style"
                                required
                            />

                            <input name="student_id" onChange={handleInputChange} type="text" placeholder="ID Estudiante (L00...)" className="input-style" required />

                            <select name="career" value={formData.career} onChange={handleInputChange} className="input-style" required>
                                <option value="">Selecciona tu Carrera</option>
                                {careers.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>

                            <select name="current_semester" value={formData.current_semester} onChange={handleInputChange} className="input-style">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}° Semestre</option>)}
                            </select>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil (Cloudinary)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageChange} 
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-pilas-blue hover:file:bg-blue-100" 
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Tamaño máximo: <strong>2 MB</strong>. Dimensiones permitidas: Mínimo <strong>200x200 px</strong>, Máximo <strong>2000x2000 px</strong>.
                                </p>
                            </div>

                            <textarea name="bio" onChange={handleInputChange} placeholder="Cuéntanos un poco sobre ti (Bio)" className="input-style md:col-span-2 h-24"></textarea>

                            <select name="role" value={formData.role} onChange={handleInputChange} className="input-style font-bold text-pilas-blue md:col-span-2">
                                <option value="APRENDIZ">Soy Aprendiz</option>
                                <option value="MENTOR" disabled={parseInt(formData.current_semester, 10) <= 3}>
                                    Soy Mentor {parseInt(formData.current_semester, 10) <= 3 && " (Disponible desde 4° Semestre)"}
                                </option>
                            </select>
                        </div>

                        {/* Panel de Desbloqueo para Mentores [cite: 162] */}
                        {formData.role === 'MENTOR' && (
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-pilas-blue mb-2 flex items-center">
                                    <span className="mr-2">🔓</span> Materias Desbloqueadas (Hasta nivel {formData.current_semester})
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                                    {subjects.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => toggleSubject(s.id)}
                                            className={`cursor-pointer p-3 rounded-lg border-2 transition ${selectedSubjects.includes(s.id) ? 'border-pilas-gold bg-white' : 'border-transparent bg-gray-200/50'}`}
                                        >
                                            <p className="text-xs font-bold text-pilas-blue">{s.code}</p>
                                            <p className="text-sm">{s.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-pilas-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0a4624] transform transition-all shadow-lg">
                            Finalizar Registro
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
