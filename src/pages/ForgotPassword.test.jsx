import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import axios from 'axios';

vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const original = await vi.importActual('react-router-dom');
    return {
        ...original,
        useNavigate: () => mockNavigate
    };
});

describe('ForgotPassword Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderForgotPassword = () => {
        return render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );
    };

    it('se renderiza en el paso 1 pidiendo el correo electrónico', () => {
        renderForgotPassword();
        expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
        expect(screen.getByText('Ingresa tu correo para recibir un código.')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    });

    it('maneja el flujo de envío de código exitoso y paso al paso 2', async () => {
        axios.post.mockResolvedValueOnce({ data: {} });
        renderForgotPassword();

        const emailInput = screen.getByPlaceholderText('Correo electrónico');
        const submitBtn = screen.getByRole('button', { name: 'Enviar Código' });

        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'test@espe.edu.ec' } });
            fireEvent.click(submitBtn);
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/forgot-password'),
            { email: 'test@espe.edu.ec' }
        );

        // Debería pasar al paso 2
        await waitFor(() => {
            expect(screen.getByText('Ingresa el código de 6 dígitos enviado a tu correo.')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
        });
    });

    it('maneja el caso de error en el envío del código', async () => {
        axios.post.mockRejectedValueOnce({
            response: {
                data: { message: 'El correo no está registrado.' }
            }
        });
        renderForgotPassword();

        const emailInput = screen.getByPlaceholderText('Correo electrónico');
        const submitBtn = screen.getByRole('button', { name: 'Enviar Código' });

        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'nonexistent@espe.edu.ec' } });
            fireEvent.click(submitBtn);
        });

        await waitFor(() => {
            expect(screen.getByText('El correo no está registrado.')).toBeInTheDocument();
        });
    });

    it('maneja el flujo de verificación de código exitoso y paso al paso 3', async () => {
        // Mock Step 1 submission
        axios.post.mockResolvedValueOnce({ data: {} }); // for forgot-password
        renderForgotPassword();

        const emailInput = screen.getByPlaceholderText('Correo electrónico');
        const submitBtn1 = screen.getByRole('button', { name: 'Enviar Código' });

        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'test@espe.edu.ec' } });
            fireEvent.click(submitBtn1);
        });

        // Mock Step 2 verification success
        axios.post.mockResolvedValueOnce({ data: {} }); // for verify-reset-code
        const codeInput = screen.getByPlaceholderText('000000');
        const submitBtn2 = screen.getByRole('button', { name: 'Verificar Código' });

        await act(async () => {
            fireEvent.change(codeInput, { target: { value: '123456' } });
            fireEvent.click(submitBtn2);
        });

        expect(axios.post).toHaveBeenLastCalledWith(
            expect.stringContaining('/api/auth/verify-reset-code'),
            { email: 'test@espe.edu.ec', code: '123456' }
        );

        // Debería pasar al paso 3
        await waitFor(() => {
            expect(screen.getByText('Crea tu nueva contraseña.')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Nueva contraseña')).toBeInTheDocument();
        });
    });

    it('maneja el caso de código incorrecto en el paso 2', async () => {
        axios.post.mockResolvedValueOnce({ data: {} });
        renderForgotPassword();

        // Ir a paso 2
        await act(async () => {
            fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@espe.edu.ec' } });
            fireEvent.click(screen.getByRole('button', { name: 'Enviar Código' }));
        });

        // Error en código
        axios.post.mockRejectedValueOnce({
            response: {
                data: { message: 'Código incorrecto.' }
            }
        });

        await act(async () => {
            fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '000000' } });
            fireEvent.click(screen.getByRole('button', { name: 'Verificar Código' }));
        });

        await waitFor(() => {
            expect(screen.getByText('Código incorrecto.')).toBeInTheDocument();
        });
    });

    it('valida coincidencia de contraseñas y resetea contraseña exitosamente', async () => {
        vi.useFakeTimers();
        axios.post.mockResolvedValueOnce({ data: {} }); // Step 1
        renderForgotPassword();

        await act(async () => {
            fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@espe.edu.ec' } });
            fireEvent.click(screen.getByRole('button', { name: 'Enviar Código' }));
        });

        axios.post.mockResolvedValueOnce({ data: {} }); // Step 2
        await act(async () => {
            fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
            fireEvent.click(screen.getByRole('button', { name: 'Verificar Código' }));
        });

        // Paso 3
        const newPasswordInput = screen.getByPlaceholderText('Nueva contraseña');
        const confirmPasswordInput = screen.getByPlaceholderText('Confirmar nueva contraseña');
        const submitBtn3 = screen.getByRole('button', { name: 'Cambiar Contraseña' });

        // 1. Contraseñas no coinciden
        await act(async () => {
            fireEvent.change(newPasswordInput, { target: { value: 'Clave123!' } });
            fireEvent.change(confirmPasswordInput, { target: { value: 'Diferente123!' } });
            fireEvent.click(submitBtn3);
        });

        expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();

        // 2. Contraseñas coinciden (exitoso)
        axios.post.mockResolvedValueOnce({ data: {} }); // for reset-password
        await act(async () => {
            fireEvent.change(confirmPasswordInput, { target: { value: 'Clave123!' } });
            fireEvent.click(submitBtn3);
        });

        expect(axios.post).toHaveBeenLastCalledWith(
            expect.stringContaining('/api/auth/reset-password'),
            { email: 'test@espe.edu.ec', code: '123456', newPassword: 'Clave123!' }
        );

        expect(screen.getByText('Contraseña actualizada con éxito.')).toBeInTheDocument();

        // Avanzar temporizador para verificar la navegación
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/login');
        vi.useRealTimers();
    });

    it('permite volver al inicio de sesión', () => {
        renderForgotPassword();
        const backBtn = screen.getByRole('button', { name: 'Volver al inicio de sesión' });
        fireEvent.click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});
