import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';
import { useNotification } from '../context/NotificationContext';

const VerifyEmail = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!email) {
            showNotification("Por favor ingresa tu correo electrónico.", "warning");
            return;
        }
        if (code.length !== 6) {
            showNotification("El código debe ser de 6 dígitos.", "warning");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post('https://pilas-backend.onrender.com/api/auth/verify-email', { email, code });
            showNotification(res.data.message || "Cuenta verificada con éxito", "success");
            navigate('/login');
        } catch (err) {
            console.error("Error al verificar código:", err);
            showNotification(err.response?.data?.message || "Código incorrecto o expirado.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            showNotification("Por favor ingresa tu correo electrónico para reenviar el código.", "warning");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post('https://pilas-backend.onrender.com/api/auth/resend-verification', { email });
            showNotification(res.data.message || "Código reenviado con éxito", "success");
            setResendCooldown(60); // 1 minuto de cooldown
        } catch (err) {
            console.error("Error al reenviar código:", err);
            showNotification(err.response?.data?.message || "Error al reenviar el código.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border-t-4 border-pilas-gold">
                <div>
                    <img className="mx-auto h-24 w-auto" src={logo} alt="Pilas! Logo" />
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-pilas-blue">
                        Verifica tu Cuenta
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Ingresa el código de 6 dígitos enviado a tu correo institucional de la ESPE.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleVerify}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Correo institucional</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pilas-gold focus:border-pilas-gold sm:text-sm"
                                placeholder="Correo institucional (@espe.edu.ec)"
                                disabled={!!location.state?.email}
                            />
                        </div>
                        <div>
                            <label htmlFor="verification-code" className="sr-only">Código de Verificación</label>
                            <input
                                id="verification-code"
                                name="code"
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pilas-gold focus:border-pilas-gold text-center text-2xl tracking-widest sm:text-sm font-bold"
                                placeholder="000000"
                                maxLength="6"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-pilas-blue hover:bg-[#0a4624]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pilas-gold transition-colors`}
                        >
                            {isLoading ? 'Verificando...' : 'Verificar Cuenta'}
                        </button>
                    </div>
                </form>

                <div className="flex flex-col items-center justify-center space-y-4">
                    <button
                        onClick={handleResend}
                        disabled={isLoading || resendCooldown > 0}
                        className={`text-sm font-medium ${resendCooldown > 0 || isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-pilas-blue hover:text-pilas-gold hover:underline'}`}
                    >
                        {resendCooldown > 0 ? `Reenviar código en ${resendCooldown}s` : '¿No recibiste el código? Reenviar código'}
                    </button>

                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
                    >
                        Volver al inicio de sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
