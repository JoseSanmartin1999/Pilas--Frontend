import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';
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

// Mock URL
window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-url');
window.URL.revokeObjectURL = vi.fn();

// Mock Image class to test dimension loading
global.Image = class {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.onload = null;
        this.onerror = null;
    }
    set src(value) {
        this._src = value;
        setTimeout(() => {
            if (value.includes('error-img')) {
                if (this.onerror) this.onerror();
            } else if (value.includes('small-img')) {
                this.width = 100;
                this.height = 100;
                if (this.onload) this.onload();
            } else if (value.includes('large-img')) {
                this.width = 3000;
                this.height = 3000;
                if (this.onload) this.onload();
            } else {
                this.width = 500;
                this.height = 500;
                if (this.onload) this.onload();
            }
        }, 10);
    }
    get src() {
        return this._src;
    }
};

const mockCareers = [
    { id: 1, name: 'Ingeniería de Software' },
    { id: 2, name: 'Ingeniería Mecatrónica' }
];

const mockSubjects = [
    { id: 10, code: 'SUBJ10', name: 'Estructuras de Datos' },
    { id: 11, code: 'SUBJ11', name: 'Cálculo de Varias Variables' }
];

describe('Register Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/admin/careers')) {
                return Promise.resolve({ data: mockCareers });
            }
            if (url.includes('/api/subjects')) {
                return Promise.resolve({ data: mockSubjects });
            }
            return Promise.reject(new Error('Not found'));
        });
        axios.post.mockResolvedValue({ data: { message: 'Registro exitoso' } });
    });

    const renderRegister = () => {
        return render(
            <MemoryRouter>
                <NotificationProvider>
                    <Register />
                </NotificationProvider>
            </MemoryRouter>
        );
    };

    it('se renderiza correctamente y carga la carrera por defecto', async () => {
        renderRegister();

        await waitFor(() => {
            expect(screen.getByText('Crea tu Perfil Académico')).toBeInTheDocument();
        });

        // Debe cargar las carreras en el select
        expect(screen.getByText('Ingeniería de Software')).toBeInTheDocument();
    });

    it('cambia el rol a APRENDIZ si el semestre es menor o igual a 3 y se elige MENTOR', async () => {
        renderRegister();

        await waitFor(() => {
            expect(screen.getByText('Crea tu Perfil Académico')).toBeInTheDocument();
        });

        // Let's find inputs by placeholders/values
        const selectElements = screen.getAllByRole('combobox');
        const semesterSelectEl = selectElements[1]; // second combobox is current_semester
        const roleSelectEl = selectElements[2]; // third combobox is role

        // Cambiar semestre a 3
        await act(async () => {
            fireEvent.change(semesterSelectEl, { target: { value: '3' } });
        });

        // Cambiar rol a MENTOR (debería deshabilitarse o forzarse a APRENDIZ)
        await act(async () => {
            fireEvent.change(roleSelectEl, { target: { value: 'MENTOR' } });
        });

        // Debería forzar a APRENDIZ
        expect(roleSelectEl.value).toBe('APRENDIZ');
    });

    it('permite abrir y cerrar el modal de Términos y Condiciones', async () => {
        renderRegister();

        await waitFor(() => {
            expect(screen.getByText('términos y condiciones')).toBeInTheDocument();
        });

        const termsBtn = screen.getByRole('button', { name: 'términos y condiciones' });
        fireEvent.click(termsBtn);

        expect(screen.getByText(/Términos y Condiciones de Pilas!/i)).toBeInTheDocument();

        // Cerrar modal
        const closeBtn = screen.getByRole('button', { name: 'Cerrar' });
        fireEvent.click(closeBtn);

        expect(screen.queryByText(/Términos y Condiciones de Pilas!/i)).not.toBeInTheDocument();
    });

    it('valida la imagen de perfil (extensión, tamaño y dimensiones)', async () => {
        const { container } = renderRegister();

        await waitFor(() => {
            expect(screen.getByText('Crea tu Perfil Académico')).toBeInTheDocument();
        });

        const fileInput = container.querySelector('input[type="file"]');

        // 1. Archivo no de imagen
        const textFile = new File(['text-content'], 'test.txt', { type: 'text/plain' });
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [textFile] } });
        });

        // 2. Archivo demasiado grande (>2MB)
        const largeFile = new File(['a'.repeat(3 * 1024 * 1024)], 'large.png', { type: 'image/png' });
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [largeFile] } });
        });

        // 3. Dimensiones pequeñas (small-img)
        const smallImgFile = new File(['small-img'], 'small-img.png', { type: 'image/png' });
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [smallImgFile] } });
        });

        // 4. Dimensiones muy grandes (large-img)
        const largeImgFile = new File(['large-img'], 'large-img.png', { type: 'image/png' });
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [largeImgFile] } });
        });

        // 5. Archivo dañado (error-img)
        const errorImgFile = new File(['error-img'], 'error-img.png', { type: 'image/png' });
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [errorImgFile] } });
        });

        // 6. Archivo válido
        const validImgFile = new File(['valid-img'], 'valid-img.png', { type: 'image/png' });
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [validImgFile] } });
        });
    });

    it('valida y envía el formulario de registro exitosamente', async () => {
        const { container } = renderRegister();

        await waitFor(() => {
            expect(screen.getByText('Crea tu Perfil Académico')).toBeInTheDocument();
        });

        // Llenar datos válidos
        const inputName = screen.getByPlaceholderText('Nombre Completo');
        const inputEmail = screen.getByPlaceholderText('Correo Institucional');
        const inputPassword = screen.getByPlaceholderText('Contraseña');
        const inputConfirmPassword = screen.getByPlaceholderText('Confirmar Contraseña');
        const inputId = screen.getByPlaceholderText(/ID Estudiante/i);
        const submitBtn = screen.getByRole('button', { name: 'Finalizar Registro' });

        // Intentar registrar sin aceptar términos
        await act(async () => {
            fireEvent.click(submitBtn);
        });
        expect(axios.post).not.toHaveBeenCalled();

        // Aceptar términos
        const acceptCheckbox = container.querySelector('#accept-terms');
        await act(async () => {
            fireEvent.click(acceptCheckbox);
        });

        // Llenar datos
        await act(async () => {
            fireEvent.change(inputName, { target: { value: 'Juan Pérez' } });
            fireEvent.change(inputEmail, { target: { value: 'juan.perez@espe.edu.ec' } });
            fireEvent.change(inputPassword, { target: { value: 'Password123!' } });
            fireEvent.change(inputConfirmPassword, { target: { value: 'Password123!' } });
            fireEvent.change(inputId, { target: { value: 'L00123456' } });
        });

        // Enviar
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/register'),
            expect.any(FormData),
            expect.any(Object)
        );

        expect(mockNavigate).toHaveBeenCalledWith('/verify-email', expect.any(Object));
    });

    it('valida contraseñas no coincidentes y contraseñas débiles', async () => {
        const { container } = renderRegister();

        await waitFor(() => {
            expect(screen.getByText('Crea tu Perfil Académico')).toBeInTheDocument();
        });

        // Aceptar términos
        const acceptCheckbox = container.querySelector('#accept-terms');
        await act(async () => {
            fireEvent.click(acceptCheckbox);
        });

        const inputName = screen.getByPlaceholderText('Nombre Completo');
        const inputEmail = screen.getByPlaceholderText('Correo Institucional');
        const inputPassword = screen.getByPlaceholderText('Contraseña');
        const inputConfirmPassword = screen.getByPlaceholderText('Confirmar Contraseña');
        const inputId = screen.getByPlaceholderText(/ID Estudiante/i);
        const submitBtn = screen.getByRole('button', { name: 'Finalizar Registro' });

        // 1. Correo no de la ESPE
        await act(async () => {
            fireEvent.change(inputName, { target: { value: 'Juan Pérez' } });
            fireEvent.change(inputEmail, { target: { value: 'juan@gmail.com' } });
            fireEvent.change(inputPassword, { target: { value: 'Password123!' } });
            fireEvent.change(inputConfirmPassword, { target: { value: 'Password123!' } });
            fireEvent.change(inputId, { target: { value: 'L00123456' } });
            fireEvent.click(submitBtn);
        });
        expect(axios.post).not.toHaveBeenCalled();

        // 2. Contraseña débil
        await act(async () => {
            fireEvent.change(inputEmail, { target: { value: 'juan@espe.edu.ec' } });
            fireEvent.change(inputPassword, { target: { value: 'weak' } });
            fireEvent.change(inputConfirmPassword, { target: { value: 'weak' } });
            fireEvent.click(submitBtn);
        });
        expect(axios.post).not.toHaveBeenCalled();

        // 3. Contraseñas no coincidentes
        await act(async () => {
            fireEvent.change(inputPassword, { target: { value: 'Password123!' } });
            fireEvent.change(inputConfirmPassword, { target: { value: 'Different123!' } });
            fireEvent.click(submitBtn);
        });
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('maneja el caso de error de registro retornado por el servidor', async () => {
        axios.post.mockRejectedValueOnce({
            response: {
                data: {
                    message: 'El correo ya está registrado',
                    detalles: [{ campo: 'email', mensaje: 'Duplicado' }]
                }
            }
        });

        const { container } = renderRegister();

        await waitFor(() => {
            expect(screen.getByText('Crea tu Perfil Académico')).toBeInTheDocument();
        });

        const acceptCheckbox = container.querySelector('#accept-terms');
        await act(async () => {
            fireEvent.click(acceptCheckbox);
        });

        const inputName = screen.getByPlaceholderText('Nombre Completo');
        const inputEmail = screen.getByPlaceholderText('Correo Institucional');
        const inputPassword = screen.getByPlaceholderText('Contraseña');
        const inputConfirmPassword = screen.getByPlaceholderText('Confirmar Contraseña');
        const inputId = screen.getByPlaceholderText(/ID Estudiante/i);
        const submitBtn = screen.getByRole('button', { name: 'Finalizar Registro' });

        await act(async () => {
            fireEvent.change(inputName, { target: { value: 'Juan Pérez' } });
            fireEvent.change(inputEmail, { target: { value: 'juan@espe.edu.ec' } });
            fireEvent.change(inputPassword, { target: { value: 'Password123!' } });
            fireEvent.change(inputConfirmPassword, { target: { value: 'Password123!' } });
            fireEvent.change(inputId, { target: { value: 'L00123456' } });
            fireEvent.click(submitBtn);
        });

        expect(axios.post).toHaveBeenCalled();
    });

    it('alterna la visibilidad de la contraseña al hacer clic en 👁️/🙈', async () => {
        renderRegister();

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
        });

        const toggleBtn = screen.getByRole('button', { name: '👁️' });
        const inputPassword = screen.getByPlaceholderText('Contraseña');

        expect(inputPassword.type).toBe('password');

        fireEvent.click(toggleBtn);
        expect(inputPassword.type).toBe('text');

        const toggleBtnHide = screen.getByRole('button', { name: '🙈' });
        fireEvent.click(toggleBtnHide);
        expect(inputPassword.type).toBe('password');
    });

    it('permite seleccionar materias si el rol es MENTOR', async () => {
        renderRegister();

        await waitFor(() => {
            expect(screen.getByText('Crea tu Perfil Académico')).toBeInTheDocument();
        });

        const selectElements = screen.getAllByRole('combobox');
        const semesterSelectEl = selectElements[1];
        const roleSelectEl = selectElements[2];

        // Cambiar a semestre 4 y rol MENTOR
        await act(async () => {
            fireEvent.change(semesterSelectEl, { target: { value: '4' } });
        });

        await act(async () => {
            fireEvent.change(roleSelectEl, { target: { value: 'MENTOR' } });
        });

        // Esperar a que cargue materias desbloqueadas
        await waitFor(() => {
            expect(screen.getByText(/Materias Desbloqueadas/i)).toBeInTheDocument();
        });

        expect(screen.getByText('Estructuras de Datos')).toBeInTheDocument();

        // Hacer clic en una materia para seleccionarla y luego deseleccionarla
        const subjectCard = screen.getByText('Estructuras de Datos');
        await act(async () => {
            fireEvent.click(subjectCard);
        });
        await act(async () => {
            fireEvent.click(subjectCard);
        });
    });
});
