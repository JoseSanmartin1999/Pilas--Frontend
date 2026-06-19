import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendCode = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsLoading(true);

        try {
            await axios.post('https://pilas-backend.onrender.com/api/auth/forgot-password', { email });
            setMessage('Código enviado al correo. Revisa tu bandeja de entrada o spam.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al enviar el código. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsLoading(true);

        try {
            await axios.post('https://pilas-backend.onrender.com/api/auth/verify-reset-code', { email, code });
            setMessage('Código verificado. Puedes ingresar tu nueva contraseña.');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Código incorrecto o expirado.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);

        try {
            await axios.post('https://pilas-backend.onrender.com/api/auth/reset-password', { email, code, newPassword });
            setMessage('Contraseña actualizada con éxito.');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cambiar la contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border-t-4 border-pilas-gold">
                <div>
                    <img className="mx-auto h-40 w-auto" src={logo} alt="Pilas! Logo" />
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-pilas-blue">
                        Recuperar Contraseña
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 1 && "Ingresa tu correo para recibir un código."}
                        {step === 2 && "Ingresa el código de 6 dígitos enviado a tu correo."}
                        {step === 3 && "Crea tu nueva contraseña."}
                    </p>
                </div>

                {error && <p className="text-red-500 text-sm text-center font-bold bg-red-100 p-2 rounded">{error}</p>}
                {message && <p className="text-green-600 text-sm text-center font-bold bg-green-100 p-2 rounded">{message}</p>}

                {step === 1 && (
                    <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pilas-gold focus:border-pilas-gold sm:text-sm"
                                placeholder="Correo electrónico"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading ? 'bg-gray-400' : 'bg-pilas-blue hover:bg-[#0a4624]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pilas-gold transition-colors`}
                        >
                            {isLoading ? 'Enviando...' : 'Enviar Código'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
                        <div>
                            <input
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pilas-gold focus:border-pilas-gold text-center text-2xl tracking-widest sm:text-sm"
                                placeholder="000000"
                                maxLength="6"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading ? 'bg-gray-400' : 'bg-pilas-gold hover:bg-yellow-600'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pilas-gold transition-colors`}
                        >
                            {isLoading ? 'Verificando...' : 'Verificar Código'}
                        </button>
                        <div className="text-center mt-2">
                            <button 
                                type="button" 
                                onClick={handleSendCode} 
                                disabled={isLoading}
                                className="text-sm text-pilas-blue hover:underline"
                            >
                                Reenviar código
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                        <div className="space-y-4">
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pilas-gold focus:border-pilas-gold sm:text-sm"
                                placeholder="Nueva contraseña"
                            />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pilas-gold focus:border-pilas-gold sm:text-sm"
                                placeholder="Confirmar nueva contraseña"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors`}
                        >
                            {isLoading ? 'Guardando...' : 'Cambiar Contraseña'}
                        </button>
                    </form>
                )}
                
                <div className="text-center mt-4">
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        Volver al inicio de sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
