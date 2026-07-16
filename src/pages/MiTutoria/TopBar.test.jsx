import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopBar from './TopBar';
import axios from 'axios';
import { NotificationProvider } from '../../context/NotificationContext';

vi.mock('axios');

const mockMentorship = {
    id: 9,
    mentor_id: 111,
    mentor_name: 'Mentor Juan',
    apprentice_name: 'Aprendiz Test',
    subject_name: 'Cálculo',
    status: 'ACEPTADA'
};

const mockCurrentUser = {
    id: 111,
    full_name: 'Mentor Juan'
};

describe('TopBar Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        axios.put.mockResolvedValue({ data: { message: 'Tutoría cerrada', status: 'COMPLETADA' } });
    });

    const renderTopBar = (mentorship = mockMentorship) => {
        return render(
            <NotificationProvider>
                <TopBar
                    mentorship={mentorship}
                    currentUser={mockCurrentUser}
                    onCloseMentorship={vi.fn()}
                    onToggleLeftSidebar={vi.fn()}
                />
            </NotificationProvider>
        );
    };

    it('se renderiza correctamente con la información básica', () => {
        renderTopBar();
        expect(screen.getByText('Cálculo')).toBeInTheDocument();
        expect(screen.getByText('Aprendiz Test')).toBeInTheDocument();
        expect(screen.getByText('Aprendiz')).toBeInTheDocument();
    });

    it('permite marcar hito', () => {
        renderTopBar();
        const milestoneBtn = screen.getByRole('button', { name: /Marcar Hito/i });
        fireEvent.click(milestoneBtn);
        expect(screen.getByText(/¡Hito marcado!/i)).toBeInTheDocument();
    });

    it('permite abrir el modal de cierre, configurar motivo y cerrar exitosamente', async () => {
        const onCloseMock = vi.fn();
        render(
            <NotificationProvider>
                <TopBar
                    mentorship={mockMentorship}
                    currentUser={mockCurrentUser}
                    onCloseMentorship={onCloseMock}
                    onToggleLeftSidebar={vi.fn()}
                />
            </NotificationProvider>
        );

        const closeBtn = screen.getByRole('button', { name: /Cerrar Tutoría/i });
        fireEvent.click(closeBtn);

        expect(screen.getByText('¿Cerrar esta Tutoría?')).toBeInTheDocument();

        // 1. Seleccionar tipo 'cancelada'
        const cancelRadio = screen.getByLabelText(/Tutoría Cancelada/i);
        await act(async () => {
            fireEvent.click(cancelRadio);
        });

        // Debe mostrar select de motivos
        const reasonSelect = screen.getByRole('combobox');
        expect(reasonSelect).toBeInTheDocument();

        // Cambiar a "Otro" para disparar el textarea
        await act(async () => {
            fireEvent.change(reasonSelect, { target: { value: 'Otro' } });
        });

        const customReasonTextarea = screen.getByPlaceholderText(/Por favor explica el motivo/i);
        expect(customReasonTextarea).toBeInTheDocument();

        // El botón de enviar debe estar deshabilitado hasta que se complete la descripción
        const confirmBtn = screen.getByRole('button', { name: /Cancelar Aula/i });
        expect(confirmBtn).toBeDisabled();

        await act(async () => {
            fireEvent.change(customReasonTextarea, { target: { value: 'Motivo personalizado' } });
        });
        expect(confirmBtn).not.toBeDisabled();

        // Confirmar cierre
        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/9/close'),
            expect.objectContaining({
                userId: 111,
                closeType: 'cancelada',
                cancellationReason: 'Motivo personalizado'
            })
        );

        expect(onCloseMock).toHaveBeenCalledWith(9, 'COMPLETADA');
    });

    it('maneja el caso de error de red al cerrar la tutoría', async () => {
        axios.put.mockRejectedValueOnce(new Error('Network error closing'));
        renderTopBar();

        const closeBtn = screen.getByRole('button', { name: /Cerrar Tutoría/i });
        fireEvent.click(closeBtn);

        const confirmBtn = screen.getByRole('button', { name: /Finalizar Aula/i });
        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        // El modal debe permanecer ante un error de la API
        expect(screen.getByText('¿Cerrar esta Tutoría?')).toBeInTheDocument();
    });
});
