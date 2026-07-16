import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Calendario from './Calendario';
import axios from 'axios';
import { NotificationProvider } from '../context/NotificationContext';

vi.mock('axios');

// Mock navigator.clipboard
const writeTextMock = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: writeTextMock
    },
    writable: true
});

const mockUser = {
    id: 111,
    full_name: 'Aprendiz Test'
};

const mockMentorships = [
    {
        id: 1,
        mentor_id: 222,
        mentor_name: 'Mentor Juan',
        apprentice_id: 111,
        apprentice_name: 'Aprendiz Test',
        subject_name: 'Cálculo Vectorial',
        scheduled_date: new Date().toISOString(), // Today
        status: 'ACEPTADA',
        modality: 'Online',
        estimated_duration: '1.5 horas',
        platform: 'Zoom',
        meeting_link: 'http://zoom.us/j/12345',
        zoom_code: '123-456',
        zoom_password: 'pass'
    },
    {
        id: 2,
        mentor_id: 111,
        mentor_name: 'Aprendiz Test',
        apprentice_id: 333,
        apprentice_name: 'Aprendiz Otro',
        subject_name: 'Álgebra Lineal',
        scheduled_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Tomorrow
        status: 'ACEPTADA',
        modality: 'Presencial',
        estimated_duration: '1 hora',
        meeting_place: 'Biblioteca Central ESPE'
    },
    {
        id: 3,
        mentor_id: 222,
        mentor_name: 'Mentor Juan',
        apprentice_id: 111,
        apprentice_name: 'Aprendiz Test',
        subject_name: 'Física I',
        scheduled_date: new Date().toISOString(),
        status: 'PENDIENTE', // Should be filtered out because status is not ACEPTADA
        modality: 'Online'
    },
    {
        id: 4,
        mentor_id: 222,
        mentor_name: 'Mentor Juan',
        apprentice_id: 111,
        apprentice_name: 'Aprendiz Test',
        subject_name: 'Pilas! Comunidad', // Should be filtered out because of name
        scheduled_date: new Date().toISOString(),
        status: 'ACEPTADA',
        modality: 'Online'
    }
];

describe('Calendario Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('user', JSON.stringify(mockUser));
        axios.get.mockResolvedValue({ data: mockMentorships });
    });

    const renderCalendario = () => {
        return render(
            <MemoryRouter>
                <NotificationProvider>
                    <Calendario />
                </NotificationProvider>
            </MemoryRouter>
        );
    };

    it('se renderiza correctamente en estado de carga y luego muestra el calendario con los datos del mes actual', async () => {
        const { container } = renderCalendario();

        // Verificar spinner de carga
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
        expect(screen.getByText('Cargando tu agenda de tutorías...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Calendario de Tutorías')).toBeInTheDocument();
        });

        // Debe renderizar el mes actual
        const today = new Date();
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const expectedMonthYear = `${months[today.getMonth()]} ${today.getFullYear()}`;
        expect(screen.getByText(expectedMonthYear)).toBeInTheDocument();

        // Debe renderizar días de la semana
        expect(screen.getByText('Lun')).toBeInTheDocument();
        expect(screen.getByText('Dom')).toBeInTheDocument();

        // Debe renderizar el detalle del día actual por defecto
        expect(screen.getByText('Detalle de Planificación')).toBeInTheDocument();
        expect(screen.getByText('Cálculo Vectorial')).toBeInTheDocument();
        expect(screen.getByText('Mentor Juan')).toBeInTheDocument();
        expect(screen.getByText('1.5 horas')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Unirse a Reunión/i })).toHaveAttribute('href', 'http://zoom.us/j/12345');
    });

    it('maneja el caso de error de la API cargando tutorías', async () => {
        axios.get.mockRejectedValueOnce(new Error('Network failure'));
        renderCalendario();

        await waitFor(() => {
            expect(screen.getByText('Calendario de Tutorías')).toBeInTheDocument();
        });
    });

    it('maneja el caso de usuario sin ID', async () => {
        localStorage.clear();
        renderCalendario();

        await waitFor(() => {
            expect(screen.getByText('Calendario de Tutorías')).toBeInTheDocument();
        });
    });

    it('permite navegar entre meses anterior, siguiente y volver a hoy', async () => {
        renderCalendario();

        await waitFor(() => {
            expect(screen.getByText('Calendario de Tutorías')).toBeInTheDocument();
        });

        const nextMonthBtn = screen.getByTitle('Mes Siguiente');
        const prevMonthBtn = screen.getByTitle('Mes Anterior');
        const todayBtn = screen.getByRole('button', { name: 'Hoy' });

        const today = new Date();
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        // 1. Navegar al mes siguiente
        await act(async () => {
            fireEvent.click(nextMonthBtn);
        });
        const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const expectedNextMonthText = `${months[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`;
        expect(screen.getByText(expectedNextMonthText)).toBeInTheDocument();

        // 2. Navegar al mes anterior
        await act(async () => {
            fireEvent.click(prevMonthBtn);
        });
        const currentMonthText = `${months[today.getMonth()]} ${today.getFullYear()}`;
        expect(screen.getByText(currentMonthText)).toBeInTheDocument();

        // 3. Ir más atrás y hacer clic en Hoy
        await act(async () => {
            fireEvent.click(prevMonthBtn);
            fireEvent.click(todayBtn);
        });
        expect(screen.getByText(currentMonthText)).toBeInTheDocument();
    });

    it('permite seleccionar un día y ver los detalles de las tutorías de ese día', async () => {
        const { container } = renderCalendario();

        await waitFor(() => {
            expect(screen.getByText('Calendario de Tutorías')).toBeInTheDocument();
        });

        // Encontrar los días del calendario
        const dayButtons = container.querySelectorAll('button.relative.aspect-square');
        
        // Encontrar el botón del día de mañana
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.getDate();

        // Encontrar el botón del día de mañana que corresponda al mes actual
        let tomorrowBtn;
        for (const btn of Array.from(dayButtons)) {
            // Verificar que no sea de clase gris (mes anterior/siguiente)
            if (!btn.className.includes('text-gray-300') && btn.textContent.trim().startsWith(String(tomorrowDay))) {
                tomorrowBtn = btn;
                break;
            }
        }

        if (tomorrowBtn) {
            await act(async () => {
                fireEvent.click(tomorrowBtn);
            });

            // Debería mostrar la tutoría presencial de mañana
            expect(screen.getByText('Álgebra Lineal')).toBeInTheDocument();
            expect(screen.getByText('Aprendiz Otro')).toBeInTheDocument();
            expect(screen.getByText('Lugar de Encuentro:')).toBeInTheDocument();
            expect(screen.getByText('Biblioteca Central ESPE')).toBeInTheDocument();
        }
    });

    it('permite copiar las credenciales de Zoom al portapapeles', async () => {
        renderCalendario();

        await waitFor(() => {
            expect(screen.getByText('Cálculo Vectorial')).toBeInTheDocument();
        });

        const copyZoomIdBtn = screen.getByRole('button', { name: /123-456/i });
        const copyZoomPassBtn = screen.getByRole('button', { name: /pass/i });

        await act(async () => {
            fireEvent.click(copyZoomIdBtn);
        });
        expect(writeTextMock).toHaveBeenCalledWith('123-456');

        await act(async () => {
            fireEvent.click(copyZoomPassBtn);
        });
        expect(writeTextMock).toHaveBeenCalledWith('pass');
    });
});
