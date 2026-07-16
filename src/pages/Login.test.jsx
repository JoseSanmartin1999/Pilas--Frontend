import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import axios from 'axios';

vi.mock('axios');

const mockNavigate = vi.fn();
const mockLocation = { search: '' };
vi.mock('react-router-dom', async () => {
    const original = await vi.importActual('react-router-dom');
    return {
        ...original,
        useNavigate: () => mockNavigate,
        useLocation: () => mockLocation
    };
});

describe('Login Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        mockLocation.search = '';
    });

    const renderLogin = (setAuth = vi.fn()) => {
        return render(
            <MemoryRouter>
                <Login setAuth={setAuth} />
            </MemoryRouter>
        );
    };

    it('se renderiza correctamente', () => {
        renderLogin();
        expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    });

    it('muestra un banner si la sesión expira', () => {
        mockLocation.search = '?expired=true';
        renderLogin();
        expect(screen.getByText(/Su sesión de administrador ha caducado/i)).toBeInTheDocument();
    });

    it('maneja el flujo de login exitoso sin recordar credenciales', async () => {
        const mockUser = { id: 111, role: 'APPRENTICE', full_name: 'Juan Pérez' };
        axios.post.mockResolvedValueOnce({ data: { user: mockUser, token: 'fake-token' } });

        const setAuthMock = vi.fn();
        renderLogin(setAuthMock);

        const emailInput = screen.getByPlaceholderText('Correo electrónico');
        const passwordInput = screen.getByPlaceholderText('Contraseña');
        const submitBtn = screen.getByRole('button', { name: 'Iniciar Sesión' });

        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'juan@espe.edu.ec' } });
            fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
            fireEvent.click(submitBtn);
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/login'),
            { email: 'juan@espe.edu.ec', password: 'Password123!' }
        );

        // Debe guardarse en sessionStorage si rememberMe no está tildado
        expect(sessionStorage.getItem('token')).toBe('fake-token');
        expect(sessionStorage.getItem('user')).toContain('Juan Pérez');
        expect(localStorage.getItem('token')).toBeNull();

        expect(setAuthMock).toHaveBeenCalledWith({ isLogged: true, role: 'APPRENTICE' });
        expect(mockNavigate).toHaveBeenCalledWith('/profile/111');
    });

    it('maneja el flujo de login exitoso recordando credenciales', async () => {
        const mockUser = { id: 111, role: 'MENTOR', full_name: 'Mentor Juan' };
        axios.post.mockResolvedValueOnce({ data: { user: mockUser, token: 'fake-token' } });

        const { container } = renderLogin();

        const emailInput = screen.getByPlaceholderText('Correo electrónico');
        const passwordInput = screen.getByPlaceholderText('Contraseña');
        const rememberCheckbox = container.querySelector('input[type="checkbox"]');
        const submitBtn = screen.getByRole('button', { name: 'Iniciar Sesión' });

        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'mentor@espe.edu.ec' } });
            fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
            fireEvent.click(rememberCheckbox);
            fireEvent.click(submitBtn);
        });

        // Debe guardarse en localStorage si rememberMe está tildado
        expect(localStorage.getItem('token')).toBe('fake-token');
        expect(localStorage.getItem('user')).toContain('Mentor Juan');
    });

    it('maneja errores de credenciales inválidas', async () => {
        axios.post.mockRejectedValueOnce({
            response: {
                data: { message: 'Credenciales inválidas' }
            }
        });

        renderLogin();

        await act(async () => {
            fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'error@espe.edu.ec' } });
            fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'wrong' } });
            fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
        });

        await waitFor(() => {
            expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
        });
    });

    it('redirige a verificación si el correo no está verificado', async () => {
        axios.post.mockRejectedValueOnce({
            response: {
                data: { isNotVerified: true }
            }
        });

        renderLogin();

        await act(async () => {
            fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'unverified@espe.edu.ec' } });
            fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password' } });
            fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
        });

        expect(mockNavigate).toHaveBeenCalledWith('/verify-email', expect.any(Object));
    });
});
