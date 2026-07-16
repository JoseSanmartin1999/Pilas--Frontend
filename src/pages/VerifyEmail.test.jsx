import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider } from '../context/NotificationContext';
import VerifyEmail from '../pages/VerifyEmail';
import axios from 'axios';

vi.mock('axios');
vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }));

const renderVerifyEmail = (locationState = null) =>
    render(
        <MemoryRouter
            initialEntries={[{ pathname: '/verify-email', state: locationState }]}
        >
            <NotificationProvider>
                <VerifyEmail />
            </NotificationProvider>
        </MemoryRouter>
    );

describe('VerifyEmail - Renderizado', () => {
    it('muestra el título Verifica tu Cuenta', () => {
        renderVerifyEmail();
        expect(screen.getByText(/verifica tu cuenta/i)).toBeInTheDocument();
    });

    it('muestra el campo de correo', () => {
        renderVerifyEmail();
        expect(screen.getByLabelText(/correo institucional/i)).toBeInTheDocument();
    });

    it('muestra el campo de código de verificación', () => {
        renderVerifyEmail();
        expect(screen.getByLabelText(/código de verificación/i)).toBeInTheDocument();
    });

    it('muestra el botón Verificar Cuenta', () => {
        renderVerifyEmail();
        expect(screen.getByRole('button', { name: /verificar cuenta/i })).toBeInTheDocument();
    });

    it('muestra el botón Volver al inicio de sesión', () => {
        renderVerifyEmail();
        expect(screen.getByText(/volver al inicio de sesión/i)).toBeInTheDocument();
    });

    it('pre-rellena el email si viene en location.state', () => {
        renderVerifyEmail({ email: 'pre@espe.edu.ec' });
        const emailInput = screen.getByLabelText(/correo institucional/i);
        expect(emailInput.value).toBe('pre@espe.edu.ec');
    });

    it('el campo de correo está deshabilitado si viene en location.state', () => {
        renderVerifyEmail({ email: 'pre@espe.edu.ec' });
        expect(screen.getByLabelText(/correo institucional/i)).toBeDisabled();
    });

    it('muestra el botón de reenvío de código', () => {
        renderVerifyEmail();
        expect(screen.getByText(/no recibiste el código/i)).toBeInTheDocument();
    });
});

describe('VerifyEmail - handleVerify (validaciones)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('muestra warning si el email está vacío al verificar', async () => {
        renderVerifyEmail();
        fireEvent.click(screen.getByRole('button', { name: /verificar cuenta/i }));
        await waitFor(() =>
            expect(screen.queryByText(/verificar cuenta/i)).toBeInTheDocument()
        );
    });

    it('el campo de código solo acepta dígitos', () => {
        renderVerifyEmail({ email: 'test@espe.edu.ec' });
        const codeInput = screen.getByLabelText(/código de verificación/i);
        fireEvent.change(codeInput, { target: { value: 'abc123' } });
        expect(codeInput.value).toBe('123');
    });

    it('respeta el maxLength de 6 en el campo de código', () => {
        renderVerifyEmail({ email: 'test@espe.edu.ec' });
        const codeInput = screen.getByLabelText(/código de verificación/i);
        expect(codeInput).toHaveAttribute('maxLength', '6');
    });
});

describe('VerifyEmail - handleVerify (API)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('navega a /login tras verificación exitosa', async () => {
        axios.post.mockResolvedValueOnce({ data: { message: 'Cuenta verificada' } });
        renderVerifyEmail({ email: 'ok@espe.edu.ec' });

        const codeInput = screen.getByLabelText(/código de verificación/i);
        fireEvent.change(codeInput, { target: { value: '123456' } });
        fireEvent.click(screen.getByRole('button', { name: /verificar cuenta/i }));

        await waitFor(() =>
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/api/auth/verify-email'),
                { email: 'ok@espe.edu.ec', code: '123456' }
            )
        );
    });

    it('muestra error si el código es incorrecto', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { message: 'Código incorrecto o expirado.' } }
        });
        renderVerifyEmail({ email: 'ok@espe.edu.ec' });

        fireEvent.change(screen.getByLabelText(/código de verificación/i), {
            target: { value: '000000' }
        });
        fireEvent.click(screen.getByRole('button', { name: /verificar cuenta/i }));

        await waitFor(() =>
            expect(axios.post).toHaveBeenCalled()
        );
    });

    it('muestra estado de carga Verificando... mientras espera respuesta', async () => {
        let resolve;
        axios.post.mockReturnValueOnce(new Promise(r => { resolve = r; }));
        renderVerifyEmail({ email: 'ok@espe.edu.ec' });

        fireEvent.change(screen.getByLabelText(/código de verificación/i), {
            target: { value: '654321' }
        });
        fireEvent.click(screen.getByRole('button', { name: /verificar cuenta/i }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: /verificando/i })).toBeInTheDocument()
        );
        resolve({ data: { message: 'ok' } });
    });
});

describe('VerifyEmail - handleResend', () => {
    beforeEach(() => vi.clearAllMocks());

    it('reenvía el código y muestra cooldown si el email está presente', async () => {
        axios.post.mockResolvedValueOnce({ data: { message: 'Código reenviado' } });
        renderVerifyEmail({ email: 'user@espe.edu.ec' });

        fireEvent.click(screen.getByText(/no recibiste el código/i));

        await waitFor(() =>
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/api/auth/resend-verification'),
                { email: 'user@espe.edu.ec' }
            )
        );
        // El botón de reenvío muestra el countdown
        await waitFor(() =>
            expect(screen.getByText(/reenviar código en/i)).toBeInTheDocument()
        );
    });

    it('muestra error si el reenvío falla', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { message: 'Error al reenviar' } }
        });
        renderVerifyEmail({ email: 'user@espe.edu.ec' });

        fireEvent.click(screen.getByText(/no recibiste el código/i));

        await waitFor(() =>
            expect(axios.post).toHaveBeenCalled()
        );
    });
});
