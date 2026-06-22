import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

const API_LOGIN_URL = 'https://pilas-backend.onrender.com/api/auth/login';

const Login = ({ setAuth }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = ({ target: { name, value } }) => {
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSuccessfulLogin = (user, token) => {
        if (rememberMe) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
        } else {
            sessionStorage.setItem('user', JSON.stringify(user));
            sessionStorage.setItem('token', token);
        }
        
        if (setAuth) {
            setAuth({ isLogged: true, role: user.role });
        }
        navigate(`/profile/${user.id}`);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await axios.post(API_LOGIN_URL, credentials);
            handleSuccessfulLogin(response.data.user, response.data.token);
        } catch (err) {
            if (err.response?.data?.isNotVerified) {
                navigate('/verify-email', { state: { email: credentials.email } });
                return;
            }
            const errorMessage = err.response?.data?.message || 'Error de conexión. Intente nuevamente.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border-t-4 border-pilas-gold">
                <LoginHeader />
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px relative">
                        <div>
                            <input
                                name="email"
                                type="email"
                                required
                                value={credentials.email}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-pilas-gold focus:border-pilas-gold focus:z-10 sm:text-sm"
                                placeholder="Correo electrónico"
                            />
                        </div>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={credentials.password}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-pilas-gold focus:border-pilas-gold focus:z-10 sm:text-sm pr-10"
                                placeholder="Contraseña"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-slate-700 focus:outline-none z-20 cursor-pointer"
                            >
                                {showPassword ? (
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && <ErrorMessage message={error} />}

                    <LoginActions rememberMe={rememberMe} setRememberMe={setRememberMe} />

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-pilas-blue hover:bg-[#0a4624]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pilas-gold transition-colors`}
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </div>

                    <div className="text-center text-sm text-gray-600 mt-4">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/registro" className="font-bold text-pilas-blue hover:text-pilas-gold transition-colors">
                            Regístrate aquí
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LoginHeader = () => (
    <div>
        <img className="mx-auto h-24 w-auto" src={logo} alt="Pilas! Logo" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-pilas-blue">
            Ponte las pilas....
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
            Accede a tu plataforma de mentoría
        </p>
    </div>
);

const ErrorMessage = ({ message }) => (
    <p className="text-red-500 text-sm text-center font-bold" role="alert">
        {message}
    </p>
);

const LoginActions = ({ rememberMe, setRememberMe }) => (
    <div className="flex items-center justify-between text-sm">
        <label className="flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-pilas-blue border-gray-300 rounded focus:ring-pilas-gold cursor-pointer" 
            />
            <span className="ml-2 block text-gray-900">Recordarme</span>
        </label>
        <Link to="/forgot-password" className="font-medium text-pilas-blue hover:text-pilas-gold focus:outline-none focus:underline">
            ¿Olvidaste tu contraseña?
        </Link>
    </div>
);

export default Login;
