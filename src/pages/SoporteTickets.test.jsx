import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import SoporteTickets from './SoporteTickets';
import axios from 'axios';
import { NotificationProvider } from '../context/NotificationContext';

vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const original = await vi.importActual('react-router-dom');
    return {
        ...original,
        useNavigate: () => mockNavigate
    };
});

const mockUser = {
    id: 111,
    full_name: 'Usuario Test'
};

const mockTickets = [
    {
        id: 1,
        user_id: 111,
        title: 'Error de ESPE-Coins',
        description: 'Tengo un problema al comprar cupones.',
        status: 'OPEN',
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        user_id: 111,
        title: 'Fallo de Zoom',
        description: 'El link no conecta.',
        status: 'IN_PROGRESS',
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        user_id: 111,
        title: 'Duda de registro',
        description: '¿Puedo cambiar mi contraseña?',
        status: 'RESOLVED',
        reply: 'Hola, sí, puedes hacerlo en tu perfil.',
        created_at: new Date().toISOString()
    },
    {
        id: 4,
        user_id: 111,
        title: 'Otro problema',
        description: 'Problema desconocido.',
        status: 'UNKNOWN_STATUS',
        created_at: new Date().toISOString()
    }
];

describe('SoporteTickets Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('user', JSON.stringify(mockUser));
        axios.get.mockResolvedValue({ data: mockTickets });
        axios.post.mockResolvedValue({ data: { message: 'Ticket creado con éxito' } });
    });

    const renderSoporteTickets = () => {
        return render(
            <MemoryRouter>
                <NotificationProvider>
                    <SoporteTickets />
                </NotificationProvider>
            </MemoryRouter>
        );
    };

    it('redirecciona a login si no hay un usuario en localStorage/sessionStorage', async () => {
        localStorage.clear();
        renderSoporteTickets();
        
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('se renderiza correctamente en estado de carga y muestra el historial de tickets', async () => {
        const { container } = renderSoporteTickets();
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Soporte y Reclamaciones')).toBeInTheDocument();
        });

        // Validar títulos de tickets
        expect(screen.getByText('Error de ESPE-Coins')).toBeInTheDocument();
        expect(screen.getByText('Fallo de Zoom')).toBeInTheDocument();
        expect(screen.getByText('Duda de registro')).toBeInTheDocument();

        // Validar respuestas
        expect(screen.getByText('Respuesta de Soporte')).toBeInTheDocument();
        expect(screen.getByText('Hola, sí, puedes hacerlo en tu perfil.')).toBeInTheDocument();

        // Validar estados
        expect(screen.getByText('Abierto')).toBeInTheDocument();
        expect(screen.getByText('En Proceso')).toBeInTheDocument();
        expect(screen.getByText('Solucionado')).toBeInTheDocument();
    });

    it('muestra el contenedor vacío si no hay tickets reportados', async () => {
        axios.get.mockResolvedValueOnce({ data: [] });
        renderSoporteTickets();

        await waitFor(() => {
            expect(screen.getByText('Sin Tickets Abiertos')).toBeInTheDocument();
        });
    });

    it('maneja el caso de error de red al cargar el listado de tickets', async () => {
        axios.get.mockRejectedValueOnce(new Error('Network failure'));
        renderSoporteTickets();

        await waitFor(() => {
            expect(screen.getByText('Soporte y Reclamaciones')).toBeInTheDocument();
        });
    });

    it('permite abrir el modal, completar el formulario y enviar un nuevo ticket exitosamente', async () => {
        renderSoporteTickets();

        await waitFor(() => {
            expect(screen.getByText('Soporte y Reclamaciones')).toBeInTheDocument();
        });

        const newTicketBtn = screen.getByRole('button', { name: /Nuevo Ticket/i });
        fireEvent.click(newTicketBtn);

        // El modal debe estar en pantalla
        expect(screen.getByRole('heading', { name: 'Crear Ticket' })).toBeInTheDocument();

        const inputTitle = screen.getByPlaceholderText(/Ej: Error al canjear/i);
        const inputDesc = screen.getByPlaceholderText(/Describe detalladamente/i);
        const submitBtn = screen.getByRole('button', { name: /Reportar Ticket/i });

        // Intentar enviar campos vacíos (se controla con inputs required, pero simulemos cambio)
        await act(async () => {
            fireEvent.change(inputTitle, { target: { value: '  ' } });
            fireEvent.change(inputDesc, { target: { value: '  ' } });
            fireEvent.click(submitBtn);
        });

        // No se debe enviar a la API
        expect(axios.post).not.toHaveBeenCalled();

        // Completar correctamente
        await act(async () => {
            fireEvent.change(inputTitle, { target: { value: 'Asunto de prueba' } });
            fireEvent.change(inputDesc, { target: { value: 'Detalle de prueba' } });
        });

        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/tickets'),
            expect.objectContaining({
                user_id: 111,
                title: 'Asunto de prueba',
                description: 'Detalle de prueba'
            })
        );

        // El modal debe cerrarse
        expect(screen.queryByRole('heading', { name: 'Crear Ticket' })).not.toBeInTheDocument();
    });

    it('maneja el caso de error al crear un ticket de soporte', async () => {
        axios.post.mockRejectedValueOnce(new Error('Post error'));
        renderSoporteTickets();

        await waitFor(() => {
            expect(screen.getByText('Soporte y Reclamaciones')).toBeInTheDocument();
        });

        const newTicketBtn = screen.getByRole('button', { name: /Nuevo Ticket/i });
        fireEvent.click(newTicketBtn);

        const inputTitle = screen.getByPlaceholderText(/Ej: Error al canjear/i);
        const inputDesc = screen.getByPlaceholderText(/Describe detalladamente/i);
        const submitBtn = screen.getByRole('button', { name: /Reportar Ticket/i });

        await act(async () => {
            fireEvent.change(inputTitle, { target: { value: 'Título error' } });
            fireEvent.change(inputDesc, { target: { value: 'Detalles error' } });
        });

        await act(async () => {
            fireEvent.click(submitBtn);
        });

        // El modal permanece abierto en caso de error
        expect(screen.getByRole('heading', { name: 'Crear Ticket' })).toBeInTheDocument();
    });

    it('permite cerrar el modal haciendo clic en &times; (botón de cierre)', async () => {
        renderSoporteTickets();

        await waitFor(() => {
            expect(screen.getByText('Soporte y Reclamaciones')).toBeInTheDocument();
        });

        const newTicketBtn = screen.getByRole('button', { name: /Nuevo Ticket/i });
        fireEvent.click(newTicketBtn);

        const closeBtn = screen.getByRole('button', { name: '×' });
        fireEvent.click(closeBtn);

        expect(screen.queryByRole('heading', { name: 'Crear Ticket' })).not.toBeInTheDocument();
    });
});
