import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MiTutoria from './MiTutoria';
import axios from 'axios';

vi.mock('axios');

// Mock WorkspaceLayout component to verify callback calls
vi.mock('./MiTutoria/WorkspaceLayout', () => {
    return {
        default: ({ mentorship, onCloseMentorship, onRateMentorship }) => (
            <div data-testid="workspace-mock">
                <h2>Workspace: {mentorship.subject_name}</h2>
                <p>Status: {mentorship.status}</p>
                <p>Is Rated: {mentorship.is_rated || 'no'}</p>
                <button onClick={() => onCloseMentorship(mentorship.id, 'COMPLETADA')}>Close Completada</button>
                <button onClick={() => onCloseMentorship(mentorship.id, 'CANCELADA')}>Close Cancelada</button>
                <button onClick={() => onRateMentorship(mentorship.id, 5, 'Excelente')}>Rate 5</button>
            </div>
        )
    };
});

const mockUser = {
    id: 111,
    full_name: 'Usuario Test'
};

const mockSingleMentorship = [
    {
        id: 1,
        mentor_id: 111,
        apprentice_id: 222,
        mentor_name: 'Usuario Test',
        apprentice_name: 'Aprendiz Uno',
        subject_name: 'Física I',
        status: 'ACEPTADA',
        scheduled_date: new Date().toISOString()
    }
];

const mockMultipleMentorships = [
    {
        id: 1,
        mentor_id: 111,
        apprentice_id: 222,
        mentor_name: 'Usuario Test',
        apprentice_name: 'Aprendiz Uno',
        subject_name: 'Física I',
        status: 'ACEPTADA',
        scheduled_date: new Date().toISOString()
    },
    {
        id: 2,
        mentor_id: 333,
        apprentice_id: 111,
        mentor_name: 'Mentor Dos',
        apprentice_name: 'Usuario Test',
        subject_name: 'Álgebra Lineal',
        status: 'COMPLETADA',
        scheduled_date: new Date().toISOString()
    }
];

describe('MiTutoria Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('user', JSON.stringify(mockUser));
        axios.get.mockResolvedValue({ data: [] });
    });

    const renderMiTutoria = () => {
        return render(<MiTutoria />);
    };

    it('muestra el spinner de carga por defecto', () => {
        const { container } = renderMiTutoria();
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
        expect(screen.getByText('Cargando tu espacio de trabajo...')).toBeInTheDocument();
    });

    it('redirige si no hay usuario autenticado', () => {
        localStorage.clear();
        renderMiTutoria();
        // Debe salir del useEffect de carga
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('muestra vista vacía si el usuario no tiene tutorías aceptadas ni completadas', async () => {
        renderMiTutoria();

        await waitFor(() => {
            expect(screen.getByText('Sin tutorías activas')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /Buscar tutor/i })).toHaveAttribute('href', '/buscar');
        });
    });

    it('muestra error y reintenta cuando falla la carga de la API', async () => {
        // Redefinir reload de window.location
        const reloadMock = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { reload: reloadMock },
            writable: true
        });

        axios.get.mockRejectedValueOnce(new Error('API Error'));
        renderMiTutoria();

        await waitFor(() => {
            expect(screen.getByText('No se pudieron cargar tus tutorías activas.')).toBeInTheDocument();
        });

        const retryBtn = screen.getByRole('button', { name: 'Reintentar' });
        fireEvent.click(retryBtn);
        expect(reloadMock).toHaveBeenCalled();
    });

    it('entra directo al workspace si solo hay una tutoría', async () => {
        axios.get.mockResolvedValueOnce({ data: mockSingleMentorship });
        renderMiTutoria();

        await waitFor(() => {
            expect(screen.getByTestId('workspace-mock')).toBeInTheDocument();
            expect(screen.getByText('Workspace: Física I')).toBeInTheDocument();
        });
    });

    it('muestra un selector si hay múltiples tutorías y permite entrar y salir del workspace', async () => {
        axios.get.mockResolvedValueOnce({ data: mockMultipleMentorships });
        renderMiTutoria();

        await waitFor(() => {
            expect(screen.getByText(/Tienes.*tutorías activas/i)).toBeInTheDocument();
        });

        // Validar las dos tarjetas
        expect(screen.getByText('Física I')).toBeInTheDocument();
        expect(screen.getByText('Álgebra Lineal')).toBeInTheDocument();

        // Hacer clic en la tarjeta de Física I
        const selectBtn = screen.getByRole('button', { name: /Física I/i });
        await act(async () => {
            fireEvent.click(selectBtn);
        });

        // Debe cargar Workspace y el breadcrumb
        expect(screen.getByTestId('workspace-mock')).toBeInTheDocument();
        expect(screen.getByText('‹ Mis tutorías')).toBeInTheDocument();

        // Hacer clic en breadcrumb para regresar al listado
        const backBtn = screen.getByRole('button', { name: '‹ Mis tutorías' });
        await act(async () => {
            fireEvent.click(backBtn);
        });

        expect(screen.getByText(/Tienes.*tutorías activas/i)).toBeInTheDocument();
    });

    it('maneja los flujos de cerrar tutorías (CANCELADA y COMPLETADA) y calificación', async () => {
        axios.get.mockResolvedValueOnce({ data: mockSingleMentorship });
        renderMiTutoria();

        await waitFor(() => {
            expect(screen.getByTestId('workspace-mock')).toBeInTheDocument();
        });

        // 1. Simular calificar la tutoría
        const rateBtn = screen.getByRole('button', { name: 'Rate 5' });
        await act(async () => {
            fireEvent.click(rateBtn);
        });
        expect(screen.getByText('Is Rated: 1')).toBeInTheDocument();

        // 2. Simular cerrar como COMPLETADA
        const closeCompletadaBtn = screen.getByRole('button', { name: 'Close Completada' });
        await act(async () => {
            fireEvent.click(closeCompletadaBtn);
        });
        expect(screen.getByText('Status: COMPLETADA')).toBeInTheDocument();

        // 3. Simular cerrar como CANCELADA (debe quitar de seleccionada y volver a vacía/selector)
        const closeCanceladaBtn = screen.getByRole('button', { name: 'Close Cancelada' });
        await act(async () => {
            fireEvent.click(closeCanceladaBtn);
        });

        // Al cancelarse, se borra de la lista. Como solo había 1, la lista queda vacía
        await waitFor(() => {
            expect(screen.getByText('Sin tutorías activas')).toBeInTheDocument();
        });
    });
});
