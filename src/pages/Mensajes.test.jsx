import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider } from '../context/NotificationContext';
import Mensajes from '../pages/Mensajes';
import axios from 'axios';

vi.mock('axios');

const mockUser = {
    id: 123,
    full_name: 'Juan Pérez',
    role: 'APRENDIZ'
};

const mockResponses = [
    {
        id: 'msg1',
        apprentice_id: 123,
        mentor_id: 456,
        mentor_name: 'Tutor Especial',
        subject_name: 'Cálculo',
        scheduled_date: '2026-07-20T10:00:00.000Z',
        status: 'PENDIENTE',
        last_initiator_role: 'MENTOR',
        reprogramming_count: 1,
        reprogramming_reason: 'No puedo a esa hora',
        apprentice_notified: 0,
        modality: 'Presencial',
        meeting_place: 'Aula 101',
        objectives: 'Repasar derivadas e integrales'
    },
    {
        id: 'msg2',
        apprentice_id: 123,
        mentor_id: 456,
        mentor_name: 'Tutor Especial',
        subject_name: 'Pilas! Comunidad',
        scheduled_date: '2026-07-15T08:00:00.000Z',
        status: 'ACEPTADA',
        last_initiator_role: 'ADMIN',
        apprentice_notified: 1,
        modality: 'Online',
        platform: 'Zoom',
        zoom_code: 'Z-1234',
        zoom_password: 'pass',
        objectives: 'Bienvenido a la comunidad de Pilas!'
    },
    {
        id: 'msg3',
        apprentice_id: 123,
        mentor_id: 456,
        mentor_name: 'Tutor Especial',
        subject_name: 'Pilas! Comunidad',
        scheduled_date: '2026-07-16T08:00:00.000Z',
        status: 'ACEPTADA',
        last_initiator_role: 'ADMIN',
        apprentice_notified: 1,
        modality: 'Online',
        platform: 'Teams',
        meeting_link: 'https://teams.com/abc',
        objectives: 'Por favor llene esta encuesta forms.gle/1pB1RJS9B9b6ASMD7'
    },
    {
        id: 'msg4',
        apprentice_id: 123,
        mentor_id: 456,
        mentor_name: 'Tutor Especial',
        subject_name: 'Física',
        scheduled_date: '2026-07-21T10:00:00.000Z',
        status: 'ACEPTADA',
        last_initiator_role: 'MENTOR',
        apprentice_notified: 1,
        modality: 'Online',
        platform: 'Zoom',
        zoom_code: 'Z-5678',
        zoom_password: 'pwd',
        objectives: 'Termodinámica'
    }
];

const renderMensajes = () => {
    return render(
        <MemoryRouter>
            <NotificationProvider>
                <Mensajes />
            </NotificationProvider>
        </MemoryRouter>
    );
};

describe('Mensajes Page - Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('user', JSON.stringify(mockUser));
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('muestra spinner de carga inicialmente y luego carga los mensajes', async () => {
        let resolveRequest;
        axios.get.mockReturnValueOnce(new Promise((resolve) => {
            resolveRequest = resolve;
        }));

        renderMensajes();

        expect(screen.getByClassName ? screen.getByClassName('animate-spin') : document.querySelector('.animate-spin')).toBeInTheDocument();

        await act(async () => {
            resolveRequest({ data: mockResponses });
        });

        await waitFor(() => {
            expect(screen.getByText('Bandeja de Entrada')).toBeInTheDocument();
            expect(screen.getAllByText('Tutor Especial').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Pilas! Comunidad').length).toBeGreaterThan(0);
        });
    });

    it('muestra bandeja vacía si no hay mensajes', async () => {
        axios.get.mockResolvedValueOnce({ data: [] });
        renderMensajes();

        await waitFor(() => {
            expect(screen.getByText('No tienes mensajes.')).toBeInTheDocument();
        });
    });

    it('maneja errores al obtener respuestas del servidor', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        axios.get.mockRejectedValueOnce(new Error('Network Error'));

        renderMensajes();

        await waitFor(() => {
            expect(screen.getByText('No tienes mensajes.')).toBeInTheDocument();
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('permite seleccionar un mensaje y marca como leído', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        axios.patch.mockResolvedValueOnce({ data: {} });

        renderMensajes();

        await waitFor(() => {
            expect(screen.getAllByText('Tutor Especial').length).toBeGreaterThan(0);
        });

        const listItems = screen.getAllByRole('button');
        const calculateMsgBtn = listItems.find(b => b.textContent.includes('Cálculo'));
        
        await act(async () => {
            fireEvent.click(calculateMsgBtn);
        });

        // Verifica que se marca como leído
        expect(axios.patch).toHaveBeenCalledWith(expect.stringContaining('/api/mentorships/msg1/read'));

        // Detalles del mensaje (Cálculo)
        expect(screen.getAllByText('Cálculo').length).toBeGreaterThan(0);
        expect(screen.getByText('Aula 101')).toBeInTheDocument();
        expect(screen.getByText('Repasar derivadas e integrales')).toBeInTheDocument();
    });

    it('muestra el contenido del mensaje del sistema de bienvenida', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        renderMensajes();

        await waitFor(() => {
            expect(screen.getAllByText('Pilas! Comunidad').length).toBeGreaterThan(0);
        });

        // msg2 es el primer item de Pilas! Comunidad
        const welcomeMsgBtn = screen.getAllByText('Pilas! Comunidad')[0];
        
        await act(async () => {
            fireEvent.click(welcomeMsgBtn);
        });

        expect(screen.getByText('¡Bienvenido a Pilas!')).toBeInTheDocument();
        expect(screen.getByText('⚙️ Ir a Mi Perfil')).toBeInTheDocument();
        expect(screen.getByText('🔍 Buscar Tutorías')).toBeInTheDocument();
    });

    it('muestra el contenido del mensaje del sistema de encuesta', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        renderMensajes();

        await waitFor(() => {
            expect(screen.getAllByText('Pilas! Comunidad').length).toBeGreaterThan(0);
        });

        // msg3 es el segundo item de Pilas! Comunidad
        const surveyMsgBtn = screen.getAllByText('Pilas! Comunidad')[1];
        
        await act(async () => {
            fireEvent.click(surveyMsgBtn);
        });

        expect(screen.getByText('Encuesta Importante de Tesis')).toBeInTheDocument();
        expect(screen.getByText('📝 Llenar Encuesta de Tesis')).toBeInTheDocument();
        expect(screen.getByText('🎁 Ir a la Tienda de Recompensas')).toBeInTheDocument();
    });

    it('permite realizar acciones: aceptar propuesta', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        axios.put.mockResolvedValueOnce({ data: {} });

        renderMensajes();

        await waitFor(() => {
            expect(screen.getAllByText('Tutor Especial').length).toBeGreaterThan(0);
        });

        const listItems = screen.getAllByRole('button');
        const calculateMsgBtn = listItems.find(b => b.textContent.includes('Cálculo'));
        
        await act(async () => {
            fireEvent.click(calculateMsgBtn);
        });

        const acceptBtn = screen.getByRole('button', { name: /Aceptar Cambio/i });
        await act(async () => {
            fireEvent.click(acceptBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/msg1'),
            expect.objectContaining({ status: 'ACEPTADA' })
        );
    });

    it('permite realizar acciones: rechazar propuesta', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        axios.put.mockResolvedValueOnce({ data: {} });

        renderMensajes();

        await waitFor(() => {
            expect(screen.getAllByText('Tutor Especial').length).toBeGreaterThan(0);
        });

        const listItems = screen.getAllByRole('button');
        const calculateMsgBtn = listItems.find(b => b.textContent.includes('Cálculo'));
        
        await act(async () => {
            fireEvent.click(calculateMsgBtn);
        });

        const rejectBtn = screen.getByRole('button', { name: /Rechazar/i });
        await act(async () => {
            fireEvent.click(rejectBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/msg1'),
            expect.objectContaining({ status: 'RECHAZADA' })
        );
    });

    it('permite realizar acciones: reprogramar (contrapropuesta exitosa)', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        axios.put.mockResolvedValueOnce({ data: {} });

        renderMensajes();

        await waitFor(() => {
            expect(screen.getAllByText('Tutor Especial').length).toBeGreaterThan(0);
        });

        const listItems = screen.getAllByRole('button');
        const calculateMsgBtn = listItems.find(b => b.textContent.includes('Cálculo'));
        
        await act(async () => {
            fireEvent.click(calculateMsgBtn);
        });

        const reprogramBtn = screen.getByRole('button', { name: /Reprogramar/i });
        await act(async () => {
            fireEvent.click(reprogramBtn);
        });

        // Buscar inputs
        const dateInput = document.querySelector('input[type="date"]');
        const timeInput = document.querySelector('input[type="time"]');
        const reasonTextarea = screen.getByPlaceholderText(/Explica por qué propones este cambio/i);

        // Rellenar datos futuros
        fireEvent.change(dateInput, { target: { value: '2026-12-31' } });
        fireEvent.change(timeInput, { target: { value: '14:00' } });
        fireEvent.change(reasonTextarea, { target: { value: 'Cruce de horario' } });

        const sendBtn = screen.getByRole('button', { name: /Enviar Contra-propuesta/i });
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/msg1'),
            expect.objectContaining({
                status: 'PENDIENTE',
                scheduled_date: '2026-12-31T14:00:00',
                reprogramming_reason: 'Cruce de horario',
                last_initiator_role: 'APRENDIZ'
            })
        );
    });

    it('valida campos vacíos en contrapropuesta', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        renderMensajes();

        await waitFor(() => {
            expect(screen.getAllByText('Tutor Especial').length).toBeGreaterThan(0);
        });

        const listItems = screen.getAllByRole('button');
        const calculateMsgBtn = listItems.find(b => b.textContent.includes('Cálculo'));
        
        await act(async () => {
            fireEvent.click(calculateMsgBtn);
        });

        const reprogramBtn = screen.getByRole('button', { name: /Reprogramar/i });
        await act(async () => {
            fireEvent.click(reprogramBtn);
        });

        const sendBtn = screen.getByRole('button', { name: /Enviar Contra-propuesta/i });
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        // Debería mostrar notificación de advertencia
        expect(screen.getByText(/Por favor completa todos los campos/i)).toBeInTheDocument();
    });

    it('valida fecha pasada en contrapropuesta', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        renderMensajes();

        await waitFor(() => {
            expect(screen.getAllByText('Tutor Especial').length).toBeGreaterThan(0);
        });

        const listItems = screen.getAllByRole('button');
        const calculateMsgBtn = listItems.find(b => b.textContent.includes('Cálculo'));
        
        await act(async () => {
            fireEvent.click(calculateMsgBtn);
        });

        const reprogramBtn = screen.getByRole('button', { name: /Reprogramar/i });
        await act(async () => {
            fireEvent.click(reprogramBtn);
        });

        const dateInput = document.querySelector('input[type="date"]');
        const timeInput = document.querySelector('input[type="time"]');
        const reasonTextarea = screen.getByPlaceholderText(/Explica por qué propones este cambio/i);

        // Fecha pasada
        fireEvent.change(dateInput, { target: { value: '2020-01-01' } });
        fireEvent.change(timeInput, { target: { value: '10:00' } });
        fireEvent.change(reasonTextarea, { target: { value: 'Test' } });

        const sendBtn = screen.getByRole('button', { name: /Enviar Contra-propuesta/i });
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        expect(screen.getByText(/La fecha y hora para reprogramar no pueden ser anteriores/i)).toBeInTheDocument();
    });

    it('permite eliminar un mensaje individualmente', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        axios.delete.mockResolvedValueOnce({ data: {} });

        renderMensajes();

        await waitFor(() => {
            expect(screen.getByText(/Cálculo/)).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Eliminar mensaje');
        await act(async () => {
            fireEvent.click(deleteButtons[0]);
        });

        // Modal de confirmación abierto
        expect(screen.getByText('¿Confirmar eliminación?')).toBeInTheDocument();

        const confirmBtn = screen.getByRole('button', { name: /^Eliminar$/ });
        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/api/mentorships/msg1'));
        expect(screen.queryByText(/Cálculo/)).not.toBeInTheDocument();
    });

    it('permite selección masiva y eliminación en lote', async () => {
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        axios.delete.mockResolvedValue({ data: {} }); // Mock para llamadas en lote

        renderMensajes();

        await waitFor(() => {
            expect(screen.getByText(/Cálculo/)).toBeInTheDocument();
        });

        const selectAllBtn = screen.getByRole('button', { name: /Todos/i });
        await act(async () => {
            fireEvent.click(selectAllBtn);
        });

        expect(screen.getByText('4 Seleccionados')).toBeInTheDocument();

        const deleteBulkBtn = screen.getByRole('button', { name: /Borrar/i });
        await act(async () => {
            fireEvent.click(deleteBulkBtn);
        });

        expect(screen.getByText(/¿Estás seguro de que deseas eliminar los 4 mensajes/i)).toBeInTheDocument();

        const confirmBtn = screen.getByRole('button', { name: /^Eliminar$/ });
        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(axios.delete).toHaveBeenCalledTimes(4);
        expect(screen.queryByText(/Cálculo/)).not.toBeInTheDocument();
    });

    it('permite al mentor actualizar el link de reunión de Zoom', async () => {
        const mentorUser = { id: 456, full_name: 'Tutor Especial', role: 'MENTOR' };
        localStorage.setItem('user', JSON.stringify(mentorUser));
        
        axios.get.mockResolvedValueOnce({ data: mockResponses });
        axios.put.mockResolvedValueOnce({ data: {} });

        renderMensajes();

        await waitFor(() => {
            expect(screen.getByText(/Física/)).toBeInTheDocument();
        });

        const listItems = screen.getAllByRole('button');
        const zoomMsgBtn = listItems.find(b => b.textContent.includes('Física'));
        
        await act(async () => {
            fireEvent.click(zoomMsgBtn);
        });

        const editLinkBtn = screen.getByRole('button', { name: /✎ Editar Enlace/i });
        await act(async () => {
            fireEvent.click(editLinkBtn);
        });

        const codeInput = screen.getByPlaceholderText('ID Zoom');
        const passInput = screen.getByPlaceholderText('Clave Zoom');

        fireEvent.change(codeInput, { target: { value: 'Z-9999' } });
        fireEvent.change(passInput, { target: { value: 'secret' } });

        const saveBtn = screen.getByRole('button', { name: /Guardar/i });
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/msg4'),
            expect.objectContaining({
                zoom_code: 'Z-9999',
                zoom_password: 'secret'
            })
        );
    });
});

