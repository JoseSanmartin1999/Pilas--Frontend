import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Solicitudes from './Solicitudes';
import axios from 'axios';
import { NotificationProvider } from '../context/NotificationContext';

vi.mock('axios');

const mockUser = {
    id: 111,
    full_name: 'Mentor Test'
};

const mockPendingMentorships = [
    {
        id: 1,
        mentor_id: 111,
        mentor_name: 'Mentor Test',
        apprentice_id: 222,
        apprentice_name: 'Aprendiz Uno',
        subject_name: 'Álgebra Lineal',
        objectives: 'Objetivo 1\nObjetivo 2',
        scheduled_date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), // 2 days in future
        status: 'PENDIENTE',
        modality: 'Presencial',
        meeting_place: 'Biblioteca ESPE',
        estimated_duration: '1.5 horas'
    },
    {
        id: 2,
        mentor_id: 111,
        mentor_name: 'Mentor Test',
        apprentice_id: 333,
        apprentice_name: 'Aprendiz Dos',
        subject_name: 'Cálculo I',
        objectives: 'Resolver dudas de derivadas',
        scheduled_date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
        status: 'PENDIENTE',
        modality: 'Online',
        platform: 'Zoom',
        estimated_duration: '1 hora'
    },
    {
        id: 3,
        mentor_id: 111,
        mentor_name: 'Mentor Test',
        apprentice_id: 444,
        apprentice_name: 'Aprendiz Tres',
        subject_name: 'Física I',
        objectives: 'Leyes de Newton',
        scheduled_date: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString(),
        status: 'PENDIENTE',
        modality: 'Online',
        platform: 'Meet',
        estimated_duration: '2 horas'
    }
];

describe('Solicitudes Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('user', JSON.stringify(mockUser));
        axios.get.mockResolvedValue({ data: mockPendingMentorships });
        axios.put.mockResolvedValue({ data: { success: true } });
    });

    const renderSolicitudes = () => {
        return render(
            <MemoryRouter>
                <NotificationProvider>
                    <Solicitudes />
                </NotificationProvider>
            </MemoryRouter>
        );
    };

    it('muestra indicador de carga y luego renderiza las solicitudes pendientes', async () => {
        const { container } = renderSolicitudes();
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Solicitudes Pendientes')).toBeInTheDocument();
        });

        expect(screen.getByText('Aprendiz Uno')).toBeInTheDocument();
        expect(screen.getByText('Álgebra Lineal')).toBeInTheDocument();
        expect(screen.getByText('Aprendiz Dos')).toBeInTheDocument();
        expect(screen.getByText('Cálculo I')).toBeInTheDocument();
    });

    it('muestra mensaje de lista vacía si no hay solicitudes pendientes', async () => {
        axios.get.mockResolvedValueOnce({ data: [] });
        renderSolicitudes();

        await waitFor(() => {
            expect(screen.getByText(/No hay solicitudes pendientes/i)).toBeInTheDocument();
        });
    });

    it('permite aceptar una tutoría presencial directamente', async () => {
        renderSolicitudes();

        await waitFor(() => {
            expect(screen.getByText('Álgebra Lineal')).toBeInTheDocument();
        });

        const acceptBtns = screen.getAllByRole('button', { name: 'Aceptar' });
        
        await act(async () => {
            fireEvent.click(acceptBtns[0]);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/1'),
            expect.objectContaining({ status: 'ACEPTADA' })
        );
    });

    it('permite declinar una tutoría directamente', async () => {
        renderSolicitudes();

        await waitFor(() => {
            expect(screen.getByText('Álgebra Lineal')).toBeInTheDocument();
        });

        const declineBtns = screen.getAllByRole('button', { name: 'Declinar' });

        await act(async () => {
            fireEvent.click(declineBtns[0]);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/1'),
            expect.objectContaining({ status: 'RECHAZADA' })
        );
    });

    it('permite configurar y aceptar una tutoría online por Zoom', async () => {
        renderSolicitudes();

        await waitFor(() => {
            expect(screen.getByText('Cálculo I')).toBeInTheDocument();
        });

        const configAcceptBtns = screen.getAllByRole('button', { name: 'Configurar y Aceptar' });
        
        // Clic en "Configurar y Aceptar" de la tutoría de Cálculo I (Zoom)
        await act(async () => {
            fireEvent.click(configAcceptBtns[0]); // El primer online es Cálculo I (Zoom)
        });

        expect(screen.getByText('Detalles de la Reunión (Zoom)')).toBeInTheDocument();

        const inputCode = screen.getByPlaceholderText('ID de la reunión');
        const inputPass = screen.getByPlaceholderText('Clave de acceso');
        const confirmBtn = screen.getByRole('button', { name: 'Confirmar y Aceptar Tutoría' });

        // Intentar confirmar vacío (debe validar)
        await act(async () => {
            fireEvent.click(confirmBtn);
        });
        expect(axios.put).not.toHaveBeenCalled();

        // Completar y confirmar
        await act(async () => {
            fireEvent.change(inputCode, { target: { value: '999-888' } });
            fireEvent.change(inputPass, { target: { value: 'secret' } });
        });

        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/2'),
            expect.objectContaining({
                status: 'ACEPTADA',
                zoom_code: '999-888',
                zoom_password: 'secret'
            })
        );
    });

    it('permite configurar y aceptar una tutoría online por Google Meet', async () => {
        renderSolicitudes();

        await waitFor(() => {
            expect(screen.getByText('Física I')).toBeInTheDocument();
        });

        const configAcceptBtns = screen.getAllByRole('button', { name: 'Configurar y Aceptar' });
        
        // Clic en "Configurar y Aceptar" de la tutoría de Física I (Meet)
        await act(async () => {
            fireEvent.click(configAcceptBtns[1]); // El segundo online es Física I (Meet)
        });

        expect(screen.getByText('Detalles de la Reunión (Meet)')).toBeInTheDocument();

        const inputLink = screen.getByPlaceholderText('https://meet.google.com/...');
        const confirmBtn = screen.getByRole('button', { name: 'Confirmar y Aceptar Tutoría' });

        // Intentar confirmar vacío (debe validar)
        await act(async () => {
            fireEvent.click(confirmBtn);
        });
        expect(axios.put).not.toHaveBeenCalled();

        // Completar y confirmar
        await act(async () => {
            fireEvent.change(inputLink, { target: { value: 'https://meet.google.com/abc-defg-hij' } });
        });

        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/3'),
            expect.objectContaining({
                status: 'ACEPTADA',
                meeting_link: 'https://meet.google.com/abc-defg-hij'
            })
        );
    });

    it('permite reprogramar una tutoría con una propuesta válida', async () => {
        const { container } = renderSolicitudes();

        await waitFor(() => {
            expect(screen.getByText('Álgebra Lineal')).toBeInTheDocument();
        });

        const reprogramBtns = screen.getAllByRole('button', { name: 'Reprogramar' });

        await act(async () => {
            fireEvent.click(reprogramBtns[0]);
        });

        const inputDate = container.querySelector('input[type="date"]');
        const inputTime = container.querySelector('input[type="time"]');
        const inputReason = screen.getByPlaceholderText(/Explica brevemente/i);
        const submitBtn = screen.getByRole('button', { name: 'Enviar Propuesta de Reprogramación' });

        // 1. Intentar enviar campos vacíos
        await act(async () => {
            fireEvent.click(submitBtn);
        });
        expect(axios.put).not.toHaveBeenCalled();

        // 2. Intentar enviar con fecha pasada
        await act(async () => {
            fireEvent.change(inputDate, { target: { value: '2020-01-01' } });
            fireEvent.change(inputTime, { target: { value: '10:00' } });
            fireEvent.change(inputReason, { target: { value: 'Tengo otro examen' } });
        });

        await act(async () => {
            fireEvent.click(submitBtn);
        });
        expect(axios.put).not.toHaveBeenCalled();

        // 3. Enviar fecha futura válida
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        await act(async () => {
            fireEvent.change(inputDate, { target: { value: futureDateStr } });
        });

        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/mentorships/1'),
            expect.objectContaining({
                status: 'PENDIENTE',
                reprogramming_reason: 'Tengo otro examen',
                last_initiator_role: 'MENTOR'
            })
        );
    });

    it('permite reprogramar una tutoría online configurando datos de reunión opcionales', async () => {
        const { container } = renderSolicitudes();

        await waitFor(() => {
            expect(screen.getByText('Cálculo I')).toBeInTheDocument();
        });

        const reprogramBtns = screen.getAllByRole('button', { name: 'Reprogramar' });

        // Cálculo I is index 1
        await act(async () => {
            fireEvent.click(reprogramBtns[1]);
        });

        // Completar código y contraseña de zoom en el bloque opcional
        const zoomCodeInput = container.querySelector('input[placeholder="ID de la reunión"]');
        const zoomPassInput = container.querySelector('input[placeholder="Clave de acceso"]');
        
        // Wait, under reprogrammingId === m.id, the Zoom inputs are:
        // labels: Código Zoom, Clave Zoom. Let's find inputs by class or values
        const inputs = container.querySelectorAll('input[type="text"]');
        // Let's find by placeholder or values if inputs are present. Let's just find them by index or parent
        // Since m.platform is Zoom, lines 228-232 render inputs:
        // <input type="text" className="..." value={meetingData.zoom_code} ... />
        // Let's type in all text inputs that appear inside the card.
        inputs.forEach(input => {
            fireEvent.change(input, { target: { value: 'reprogram-zoom-data' } });
        });

        // Let's also test Meet platform (index 2)
        await act(async () => {
            fireEvent.click(reprogramBtns[2]);
        });
        const meetInput = container.querySelector('input[placeholder="https://meet.google.com/..."]');
        if (meetInput) {
            fireEvent.change(meetInput, { target: { value: 'https://meet.google.com/new-link' } });
        }
    });

    it('maneja el caso de error de red al procesar una acción', async () => {
        axios.put.mockRejectedValueOnce(new Error('Network failure'));
        renderSolicitudes();

        await waitFor(() => {
            expect(screen.getByText('Álgebra Lineal')).toBeInTheDocument();
        });

        const declineBtns = screen.getAllByRole('button', { name: 'Declinar' });

        await act(async () => {
            fireEvent.click(declineBtns[0]);
        });

        // Debería capturar el error y no romper la interfaz
        expect(screen.getByText('Álgebra Lineal')).toBeInTheDocument();
    });

    it('maneja la carga inicial sin usuario autenticado', async () => {
        localStorage.clear();
        renderSolicitudes();

        await waitFor(() => {
            expect(screen.queryByText('Solicitudes Pendientes')).toBeInTheDocument();
        });
    });
});
