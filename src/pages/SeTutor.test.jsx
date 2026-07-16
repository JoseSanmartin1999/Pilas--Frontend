import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import SeTutor from './SeTutor';
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

const mockStudentUser = {
    id: 111,
    full_name: 'Estudiante Test',
    role: 'APPRENTICE'
};

const mockMentorUser = {
    id: 222,
    full_name: 'Mentor Test',
    role: 'MENTOR'
};

const mockProfileRes = {
    current_semester: 5,
    career: 'Software',
    career_id: 10
};

const mockSubjects = [
    { id: 1, name: 'Cálculo Diferencial' },
    { id: 2, name: 'Física Clásica' }
];

describe('SeTutor Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('user', JSON.stringify(mockStudentUser));
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/admin/tutors/applications')) {
                return Promise.resolve({ data: [] });
            }
            if (url.includes('/api/users/profile/')) {
                return Promise.resolve({ data: mockProfileRes });
            }
            if (url.includes('/api/subjects')) {
                return Promise.resolve({ data: mockSubjects });
            }
            return Promise.reject(new Error('Not found'));
        });
        axios.post.mockResolvedValue({ data: { message: 'Postulación enviada' } });
    });

    const renderSeTutor = () => {
        return render(
            <MemoryRouter>
                <NotificationProvider>
                    <SeTutor />
                </NotificationProvider>
            </MemoryRouter>
        );
    };

    it('redirige a login si no hay un usuario autenticado', async () => {
        localStorage.clear();
        renderSeTutor();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('redirige a profile si el usuario ya es Mentor', async () => {
        localStorage.setItem('user', JSON.stringify(mockMentorUser));
        renderSeTutor();
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('bloquea la postulación si el alumno cursa un semestre menor a 4', async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/admin/tutors/applications')) {
                return Promise.resolve({ data: [] });
            }
            if (url.includes('/api/users/profile/')) {
                return Promise.resolve({ data: { current_semester: 3 } }); // Semestre 3 (menor a 4)
            }
            return Promise.reject(new Error('Not found'));
        });

        renderSeTutor();

        await waitFor(() => {
            expect(screen.getByText('Requisito de Semestre')).toBeInTheDocument();
            expect(screen.getByText(/3° semestre/i)).toBeInTheDocument();
        });

        const profileBtn = screen.getByRole('button', { name: 'Ir a Mi Perfil' });
        fireEvent.click(profileBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/profile/111');
    });

    it('muestra pantalla de revisión si el alumno ya tiene una solicitud PENDING', async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/admin/tutors/applications')) {
                return Promise.resolve({ data: [{ user_id: 111, status: 'PENDING' }] });
            }
            return Promise.resolve({ data: [] });
        });

        renderSeTutor();

        await waitFor(() => {
            expect(screen.getByText('Solicitud en Revisión')).toBeInTheDocument();
        });

        const profileBtn = screen.getByRole('button', { name: 'Ir a Mi Perfil' });
        fireEvent.click(profileBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/profile/111');
    });

    it('carga las materias y permite realizar la postulación exitosamente', async () => {
        const { container } = renderSeTutor();

        await waitFor(() => {
            expect(screen.getByText('Cálculo Diferencial')).toBeInTheDocument();
        });

        // 1. Alternar materias checkboxes
        const firstCheckbox = screen.getAllByRole('checkbox')[0];
        await act(async () => {
            fireEvent.click(firstCheckbox);
        });

        // 2. Completar motivación
        const motivationTextarea = screen.getByPlaceholderText(/He aprobado estas materias/i);
        await act(async () => {
            fireEvent.change(motivationTextarea, { target: { value: 'Esta es una motivación de prueba de longitud correcta' } });
        });

        // 3. Subir archivo inválido y luego válido
        const fileInput = container.querySelector('#academic-record-input');
        const invalidFile = new File(['text'], 'record.txt', { type: 'text/plain' });
        const validFile = new File(['pdf-blob'], 'record.pdf', { type: 'application/pdf' });
        const largeFile = new File(['a'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' }); // 11MB

        // Invalid file extension
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [invalidFile] } });
        });

        // Too large file size
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [largeFile] } });
        });

        // Valid file
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [validFile] } });
        });

        // Enviar formulario
        const submitBtn = screen.getByRole('button', { name: 'Enviar Solicitud y Ascender' });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/tutors/applications'),
            expect.any(FormData),
            expect.any(Object)
        );

        // Debería cambiar la vista a Solicitud en Revisión
        expect(screen.getByText('Solicitud en Revisión')).toBeInTheDocument();
    });

    it('valida campos vacíos en submit del formulario', async () => {
        renderSeTutor();

        await waitFor(() => {
            expect(screen.getByText('Cálculo Diferencial')).toBeInTheDocument();
        });

        const submitBtn = screen.getByRole('button', { name: 'Enviar Solicitud y Ascender' });

        // 1. Submit sin seleccionar materias
        await act(async () => {
            fireEvent.click(submitBtn);
        });
        expect(axios.post).not.toHaveBeenCalled();

        // Seleccionar una materia
        const firstCheckbox = screen.getAllByRole('checkbox')[0];
        await act(async () => {
            fireEvent.click(firstCheckbox);
        });

        // 2. Submit con motivación corta
        const motivationTextarea = screen.getByPlaceholderText(/He aprobado estas materias/i);
        await act(async () => {
            fireEvent.change(motivationTextarea, { target: { value: 'corta' } });
            fireEvent.click(submitBtn);
        });
        expect(axios.post).not.toHaveBeenCalled();

        // Cambiar motivación a una larga
        await act(async () => {
            fireEvent.change(motivationTextarea, { target: { value: 'Esta es una motivación válida de más de 15 caracteres' } });
        });

        // 3. Submit sin subir archivo PDF
        await act(async () => {
            fireEvent.click(submitBtn);
        });
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('maneja el caso de error al procesar el ascenso en la API', async () => {
        axios.post.mockRejectedValueOnce({ response: { data: { error: 'Error del servidor' } } });
        const { container } = renderSeTutor();

        await waitFor(() => {
            expect(screen.getByText('Cálculo Diferencial')).toBeInTheDocument();
        });

        // Completar formulario válido
        const firstCheckbox = screen.getAllByRole('checkbox')[0];
        await act(async () => {
            fireEvent.click(firstCheckbox);
        });

        const motivationTextarea = screen.getByPlaceholderText(/He aprobado estas materias/i);
        await act(async () => {
            fireEvent.change(motivationTextarea, { target: { value: 'Esta es una motivación válida de más de 15 caracteres' } });
        });

        const fileInput = container.querySelector('#academic-record-input');
        const validFile = new File(['pdf-blob'], 'record.pdf', { type: 'application/pdf' });
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [validFile] } });
        });

        const submitBtn = screen.getByRole('button', { name: 'Enviar Solicitud y Ascender' });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        // Debería capturar el error y permanecer en la vista de carga de materias
        expect(screen.getByText('Cálculo Diferencial')).toBeInTheDocument();
    });

    it('maneja el caso de error de red al inicializar materias', async () => {
        axios.get.mockRejectedValue(new Error('Network failure loading profile'));
        renderSeTutor();
        await act(async () => {
            // Esperar a que pase el loading
        });
        expect(screen.queryByText('Cálculo Diferencial')).not.toBeInTheDocument();
    });
});
