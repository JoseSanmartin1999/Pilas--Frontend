import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import axios from 'axios';

vi.mock('axios');

describe('Home Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        axios.get.mockResolvedValue({ data: [] });
    });

    const renderHome = () => {
        return render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
    };

    it('se renderiza en la vista no autenticada por defecto', () => {
        renderHome();
        expect(screen.getByText(/Aprende de tus compañeros/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ser Mentor / Tutor' })).toHaveAttribute('href', '/registro');
    });

    it('interactúa con el panel interactivo simulado en la vista no autenticada', async () => {
        vi.useFakeTimers();
        renderHome();

        // 1. Simular login diario
        const loginBtn = screen.getByRole('button', { name: /Loguearse/i });
        await act(async () => {
            fireEvent.click(loginBtn);
        });

        // Debe saltar el Toast
        expect(screen.getByText('🔥 ¡Racha de Login de 1 Día Más!')).toBeInTheDocument();

        // 2. Simular calificar tutoría (xp starts at 1850. adding 150 raises to 2000, triggering level up toast instead)
        const ratingBtn = screen.getByRole('button', { name: /Terminar Tutoría/i });
        await act(async () => {
            fireEvent.click(ratingBtn);
        });

        expect(screen.getByText(/¡Subiste de Nivel!/i)).toBeInTheDocument();

        // Esperar a que pase el toast
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        expect(screen.queryByText(/¡Subiste de Nivel!/i)).not.toBeInTheDocument();
        vi.useRealTimers();
    });

    it('se renderiza en la vista autenticada y carga la información de la API', async () => {
        localStorage.setItem('token', 'fake-token');
        localStorage.setItem('user', JSON.stringify({ id: 111, full_name: 'Juan Pérez' }));

        const mockLeaderboard = [
            { id: 2, full_name: 'Tutor Uno', career: 'Software', favorite_subject: 'Física I', xp: 5000 }
        ];
        const mockProfile = { id: 111, full_name: 'Juan Pérez', level: 3, espe_coins: 100, xp: 6000 };

        axios.get.mockImplementation((url) => {
            if (url.includes('/api/users/leaderboard')) {
                return Promise.resolve({ data: mockLeaderboard });
            }
            if (url.includes('/api/users/profile/111')) {
                return Promise.resolve({ data: mockProfile });
            }
            return Promise.reject(new Error('Not found'));
        });

        renderHome();

        // Espera a que cargue la información
        await waitFor(() => {
            expect(screen.getByText('¡Hola de nuevo, Juan!')).toBeInTheDocument();
            expect(screen.getByText('🪙 100')).toBeInTheDocument();
            expect(screen.getByText('6000 XP')).toBeInTheDocument();
            expect(screen.getByText('Tutor Uno')).toBeInTheDocument();
        });
    });
});
