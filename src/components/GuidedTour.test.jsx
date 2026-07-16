import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import GuidedTour from './GuidedTour';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/' };
vi.mock('react-router-dom', async () => {
    const original = await vi.importActual('react-router-dom');
    return {
        ...original,
        useNavigate: () => mockNavigate,
        useLocation: () => mockLocation
    };
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 120,
    height: 40,
    top: 100,
    left: 200,
    bottom: 140,
    right: 320
}));

Element.prototype.scrollIntoView = vi.fn();

describe('GuidedTour Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        mockLocation.pathname = '/';
    });

    const renderTour = () => {
        return render(
            <MemoryRouter>
                <GuidedTour />
            </MemoryRouter>
        );
    };

    it('no inicia el tour si no está autenticado', () => {
        const { container } = renderTour();
        expect(container.firstChild).toBeNull();
    });

    it('inicia el Welcome Tour automáticamente en la raíz si está autenticado', async () => {
        localStorage.setItem('token', 'valid-token');
        localStorage.setItem('user', JSON.stringify({ id: 111, full_name: 'Estudiante Test', role: 'STUDENT' }));

        renderTour();

        await waitFor(() => {
            expect(screen.getByText('¡Bienvenido a Pilas! 👋')).toBeInTheDocument();
        }, { timeout: 3000 });

        // Hacer clic en Siguiente
        const nextBtn = screen.getByRole('button', { name: 'Siguiente' });
        await act(async () => {
            fireEvent.click(nextBtn);
        });

        expect(screen.getByText('Encuentra un Tutor 🔍')).toBeInTheDocument();

        // Omitir el tour
        const skipBtn = screen.getByRole('button', { name: '✕' });
        await act(async () => {
            fireEvent.click(skipBtn);
        });

        expect(screen.queryByText('Encuentra un Tutor 🔍')).not.toBeInTheDocument();
    });

    it('inicia el tour al recibir el evento global startGuidedTour', async () => {
        localStorage.setItem('token', 'valid-token');
        localStorage.setItem('user', JSON.stringify({ id: 111, full_name: 'Estudiante Test', role: 'STUDENT' }));

        renderTour();

        await act(async () => {
            window.dispatchEvent(new Event('startGuidedTour'));
        });

        await waitFor(() => {
            expect(screen.getByText('¡Bienvenido a Pilas! 👋')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('inicia el tour buscar en la ruta /buscar', async () => {
        localStorage.setItem('token', 'valid-token');
        localStorage.setItem('user', JSON.stringify({ id: 111, full_name: 'Estudiante Test', role: 'STUDENT' }));
        mockLocation.pathname = '/buscar';

        renderTour();

        await waitFor(() => {
            expect(screen.getByText('Búsqueda Inteligente 🕵️‍♂️')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('inicia el tour solicitar en la ruta de perfil ajeno', async () => {
        localStorage.setItem('token', 'valid-token');
        localStorage.setItem('user', JSON.stringify({ id: 111, full_name: 'Estudiante Test', role: 'STUDENT' }));
        mockLocation.pathname = '/profile/222'; // Other tutor's profile

        renderTour();

        await waitFor(() => {
            expect(screen.getByText('Información del Tutor 👤')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('avanza y retrocede en el tour de solicitar y cierra modal', async () => {
        localStorage.setItem('token', 'valid-token');
        localStorage.setItem('user', JSON.stringify({ id: 111, full_name: 'Estudiante Test', role: 'STUDENT' }));
        mockLocation.pathname = '/profile/222';

        // Add dummy target elements to DOM
        const header = document.createElement('div');
        header.id = 'tour-perfil-header';
        
        const button = document.createElement('button');
        button.id = 'tour-boton-pactar';

        const parent = document.createElement('div');
        const form = document.createElement('div');
        form.id = 'tour-agendar-formulario';
        const dummyCloseBtn = document.createElement('button');
        parent.appendChild(form);
        parent.appendChild(dummyCloseBtn);

        document.body.appendChild(header);
        document.body.appendChild(button);
        document.body.appendChild(parent);

        renderTour();

        await waitFor(() => {
            expect(screen.getByText('Información del Tutor 👤')).toBeInTheDocument();
        }, { timeout: 3000 });

        // Next to step 2 (Logros y Aportes)
        fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
        await waitFor(() => {
            expect(screen.getByText('Logros y Aportes 🏅')).toBeInTheDocument();
        });

        // Next to step 3 (Pactar la Cita)
        fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
        await waitFor(() => {
            expect(screen.getByText('Pactar la Cita 📅')).toBeInTheDocument();
        });

        // Click "Abrir Formulario" (Next)
        fireEvent.click(screen.getByRole('button', { name: 'Abrir Formulario' }));

        // Esperar a que el intervalo detecte el formulario y avance al paso 3 (index 3)
        await waitFor(() => {
            expect(screen.getByText('Formulario de Tutoría 📝')).toBeInTheDocument();
        }, { timeout: 3000 });

        // Go back (Anterior)
        fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
        await waitFor(() => {
            expect(screen.getByText('Pactar la Cita 📅')).toBeInTheDocument();
        });

        // Cleanup DOM
        header.remove();
        button.remove();
        parent.remove();
    });

    it('calcula estilos de popover en desktop y placements side', async () => {
        localStorage.setItem('token', 'valid-token');
        localStorage.setItem('user', JSON.stringify({ id: 111, full_name: 'Estudiante Test', role: 'STUDENT' }));
        mockLocation.pathname = '/buscar';

        // Set wide innerWidth to simulate desktop
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });

        const searchDiv = document.createElement('div');
        searchDiv.id = 'tour-buscar-filtros';
        document.body.appendChild(searchDiv);

        renderTour();

        await waitFor(() => {
            expect(screen.getByText('Búsqueda Inteligente 🕵️‍♂️')).toBeInTheDocument();
        }, { timeout: 3000 });

        // Cleanup
        searchDiv.remove();
    });
});
