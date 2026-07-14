import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorkspaceLayout from './WorkspaceLayout';
import axios from 'axios';
import { NotificationProvider } from '../../context/NotificationContext';

vi.mock('axios');

// Mock components
vi.mock('./TopBar', () => ({
    default: ({ onToggleLeftSidebar, onCloseMentorship }) => (
        <div data-testid="topbar">
            <button onClick={onToggleLeftSidebar}>Toggle Left</button>
            <button onClick={() => onCloseMentorship(9, 'COMPLETADA')}>Close Mentorship</button>
        </div>
    )
}));

vi.mock('./LeftSidebar', () => ({
    default: ({ onModuleChange, isOpen, onClose }) => (
        <div data-testid="left-sidebar">
            <p>IsOpen: {isOpen ? 'true' : 'false'}</p>
            <button onClick={() => onModuleChange('repositorio')}>Go Repositorio</button>
            <button onClick={() => onModuleChange('tablon')}>Go Tablon</button>
            <button onClick={onClose}>Close Left</button>
        </div>
    )
}));

vi.mock('./RightSidebar', () => ({
    default: ({ isOpen, onToggle }) => (
        <div data-testid="right-sidebar">
            <p>IsOpen: {isOpen ? 'true' : 'false'}</p>
            <button onClick={onToggle}>Toggle Right</button>
        </div>
    )
}));

vi.mock('./ChatView', () => ({
    default: () => <div data-testid="chat-view">ChatView Mock</div>
}));

vi.mock('./RepositoryView', () => ({
    default: () => <div data-testid="repository-view">RepositoryView Mock</div>
}));

vi.mock('./PlaceholderView', () => ({
    default: ({ title }) => <div data-testid="placeholder-view">Placeholder: {title}</div>
}));

const mockUser = {
    id: 111,
    full_name: 'Aprendiz Test'
};

const mockActiveMentorship = {
    id: 9,
    mentor_id: 222,
    apprentice_id: 111,
    subject_name: 'Cálculo',
    status: 'ACEPTADA'
};

const mockCompletedMentorship = {
    id: 9,
    mentor_id: 222,
    apprentice_id: 111,
    subject_name: 'Cálculo',
    status: 'COMPLETADA',
    closed_at: new Date().toISOString(),
    is_rated: 0
};

describe('WorkspaceLayout Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        axios.put.mockResolvedValue({ data: { message: 'Calificación exitosa' } });
    });

    const renderLayout = (mentorship = mockActiveMentorship) => {
        return render(
            <NotificationProvider>
                <WorkspaceLayout
                    mentorship={mentorship}
                    currentUser={mockUser}
                    onCloseMentorship={vi.fn()}
                    onRateMentorship={vi.fn()}
                />
            </NotificationProvider>
        );
    };

    it('se renderiza con el ChatView activo por defecto', () => {
        renderLayout();
        expect(screen.getByTestId('chat-view')).toBeInTheDocument();
        expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('topbar')).toBeInTheDocument();
        expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
    });

    it('permite alternar entre módulos usando LeftSidebar', async () => {
        renderLayout();

        const repoBtn = screen.getByRole('button', { name: 'Go Repositorio' });
        await act(async () => {
            fireEvent.click(repoBtn);
        });

        // Debe renderizar el repositorio
        expect(screen.getByTestId('repository-view')).toBeInTheDocument();
        expect(screen.queryByTestId('chat-view')).not.toBeInTheDocument();

        // Módulo con vista de marcador de posición (placeholder)
        const tablonBtn = screen.getByRole('button', { name: 'Go Tablon' });
        await act(async () => {
            fireEvent.click(tablonBtn);
        });
        expect(screen.getByTestId('placeholder-view')).toHaveTextContent('Placeholder: Tablón de Anuncios');
    });

    it('permite abrir y cerrar sidebars izquierdo y derecho', async () => {
        renderLayout();

        const toggleLeftBtn = screen.getByRole('button', { name: 'Toggle Left' });
        const toggleRightBtn = screen.getByRole('button', { name: 'Toggle Right' });

        // Sidebar izquierdo
        expect(within(screen.getByTestId('left-sidebar')).getByText('IsOpen: false')).toBeInTheDocument();
        await act(async () => {
            fireEvent.click(toggleLeftBtn);
        });
        expect(within(screen.getByTestId('left-sidebar')).getByText('IsOpen: true')).toBeInTheDocument();

        // Sidebar derecho
        await act(async () => {
            fireEvent.click(toggleRightBtn);
        });
    });

    it('muestra el banner de expiración y permite interactuar con el modal de satisfacción', async () => {
        const onRateMock = vi.fn();
        const onCloseMock = vi.fn();

        render(
            <NotificationProvider>
                <WorkspaceLayout
                    mentorship={mockCompletedMentorship}
                    currentUser={mockUser}
                    onCloseMentorship={onCloseMock}
                    onRateMentorship={onRateMock}
                />
            </NotificationProvider>
        );

        // Debe mostrar banner de expiración
        expect(screen.getByText(/ESTA TUTORÍA HA SIDO CERRADA/i)).toBeInTheDocument();

        // El modal de satisfacción debe estar visible (con estrellas)
        expect(screen.getByText('¡Tutoría Finalizada!')).toBeInTheDocument();

        // 1. Intentar enviar calificación sin marcar estrellas
        const submitBtn = screen.getByRole('button', { name: 'Enviar Calificación' });
        expect(submitBtn).toBeDisabled(); // disabled because rating is 0

        // 2. Hacer clic en la tercera estrella
        const stars = screen.getAllByRole('button').filter(btn => btn.querySelector('svg'));
        const star3 = stars[2];
        
        await act(async () => {
            fireEvent.mouseEnter(star3);
            fireEvent.click(star3);
            fireEvent.mouseLeave(star3);
        });

        // 3. Completar comentario y enviar
        const textarea = screen.getByPlaceholderText(/Cuéntanos qué tal fue/i);
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Buen tutor' } });
        });

        // Ahora debe estar habilitado
        expect(submitBtn).not.toBeDisabled();

        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/9/rate'),
            expect.objectContaining({
                rating: 3,
                comment: 'Buen tutor',
                userId: 111
            })
        );

        expect(onRateMock).toHaveBeenCalledWith(9, 3, 'Buen tutor');

        // Modal debe desaparecer
        expect(screen.queryByText('¡Tutoría Finalizada!')).not.toBeInTheDocument();
    });

    it('permite posponer la calificación haciendo clic en Calificar más tarde', async () => {
        renderLayout(mockCompletedMentorship);

        expect(screen.getByText('¡Tutoría Finalizada!')).toBeInTheDocument();

        const laterBtn = screen.getByRole('button', { name: 'Calificar más tarde' });
        await act(async () => {
            fireEvent.click(laterBtn);
        });

        expect(screen.queryByText('¡Tutoría Finalizada!')).not.toBeInTheDocument();

        // Debe mostrar el botón "Calificar Tutoría" en el banner de expiración
        const rateBtnBanner = screen.getByRole('button', { name: /Calificar Tutoría/i });
        await act(async () => {
            fireEvent.click(rateBtnBanner);
        });

        // El modal debe reaparecer
        expect(screen.getByText('¡Tutoría Finalizada!')).toBeInTheDocument();
    });

    it('maneja errores de la API al registrar la calificación', async () => {
        axios.put.mockRejectedValueOnce(new Error('Network failure during rating'));
        renderLayout(mockCompletedMentorship);

        const stars = screen.getAllByRole('button').filter(btn => btn.querySelector('svg'));
        await act(async () => {
            fireEvent.click(stars[4]); // 5 stars
        });

        const submitBtn = screen.getByRole('button', { name: 'Enviar Calificación' });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        // Permanece abierto el modal ante error
        expect(screen.getByText('¡Tutoría Finalizada!')).toBeInTheDocument();
    });
});
