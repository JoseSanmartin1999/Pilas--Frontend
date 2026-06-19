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
    const navigate = useNavigate();

    const handleChange = ({ target: { name, value } }) => {
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSuccessfulLogin = (user) => {
        if (rememberMe) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            sessionStorage.setItem('user', JSON.stringify(user));
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
            handleSuccessfulLogin(response.data.user);
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

    const inputFields = [
        { name: 'email', type: 'email', placeholder: 'Correo electrónico', isTop: true },
        { name: 'password', type: 'password', placeholder: 'Contraseña', isTop: false }
    ];

    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border-t-4 border-pilas-gold">
                <LoginHeader />
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {inputFields.map((field) => (
                            <div key={field.name}>
                                <input
                                    name={field.name}
                                    type={field.type}
                                    required
                                    value={credentials[field.name]}
                                    onChange={handleChange}
                                    className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pilas-gold focus:border-pilas-gold focus:z-10 sm:text-sm ${field.isTop ? 'rounded-t-md' : 'rounded-b-md'}`}
                                    placeholder={field.placeholder}
                                />
                            </div>
                        ))}
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
                </form>
            </div>
        </div>
    );
};

const LoginHeader = () => (
    <div>
        <img className="mx-auto h-40 w-auto" src={logo} alt="Pilas! Logo" />
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
