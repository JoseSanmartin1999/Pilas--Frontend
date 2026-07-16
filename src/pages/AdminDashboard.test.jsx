import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider } from '../context/NotificationContext';
import AdminDashboard from './AdminDashboard';
import axios from 'axios';

vi.mock('axios');

const mockUserAdmin = {
    id: 123,
    full_name: 'Juan Pérez',
    role: 'ADMIN'
};

const mockUserNonAdmin = {
    id: 456,
    full_name: 'Pedro López',
    role: 'APRENDIZ'
};

const mockStats = {
    users: {
        total: 15,
        roles: {
            MENTOR: 5,
            APRENDIZ: 9,
            ADMIN: 1
        }
    },
    mentorships: {
        total: 10,
        status: {
            COMPLETADA: 4,
            PENDIENTE: 3,
            CANCELADA: 3
        }
    },
    averageRating: 4.8,
    storageUsedMB: 120
};

const mockUsers = [
    { id: 1, full_name: 'Admin User', email: 'admin@espe.edu.ec', role: 'ADMIN', status: 'ACTIVO', current_semester: 5 },
    { id: 2, full_name: 'Mentor User', email: 'mentor@espe.edu.ec', role: 'MENTOR', status: 'ACTIVO', current_semester: 6 },
    { id: 3, full_name: 'Aprendiz User', email: 'aprendiz@espe.edu.ec', role: 'APRENDIZ', status: 'ACTIVO', current_semester: 3 },
    { id: 4, full_name: 'Blocked User', email: 'blocked@espe.edu.ec', role: 'APRENDIZ', status: 'BLOQUEADO', current_semester: 2 }
];

const mockApplications = [
    {
        id: 1,
        applicant_name: 'Aprendiz User',
        applicant_email: 'aprendiz@espe.edu.ec',
        career: 'Ingeniería de Software',
        current_semester: 3,
        motivation: 'Quiero ayudar a mis compañeros.',
        selected_subjects: ['Cálculo', 'Álgebra'],
        academic_record_url: 'http://example.com/record.pdf',
        status: 'PENDING',
        created_at: '2026-07-01T00:00:00.000Z'
    }
];

const mockTickets = [
    {
        id: 1,
        title: 'Error de conexión',
        description: 'No puedo conectarme al servidor.',
        user_name: 'Aprendiz User',
        user_email: 'aprendiz@espe.edu.ec',
        user_role: 'APRENDIZ',
        status: 'OPEN',
        created_at: '2026-07-01T00:00:00.000Z',
        reply: null
    },
    {
        id: 2,
        title: 'Duda con ESPE-Coins',
        description: 'No se sumaron mis ESPE-Coins.',
        user_name: 'Mentor User',
        user_email: 'mentor@espe.edu.ec',
        user_role: 'MENTOR',
        status: 'RESOLVED',
        created_at: '2026-07-02T00:00:00.000Z',
        reply: 'Se solucionó.'
    }
];

const mockBadges = [
    {
        id: 1,
        name: 'Insignia de Oro',
        image_url: 'http://example.com/badge1.png',
        criteria: JSON.stringify({ type: 'xp_earned', value: 100 }),
        xp_reward: 50,
        coins_reward: 20
    },
    {
        id: 2,
        name: 'Insignia Especial',
        image_url: '🏅',
        criteria: JSON.stringify({ type: 'mentorships_given', value: 5 }),
        xp_reward: 100,
        coins_reward: 50
    }
];

const mockCareers = [
    { id: 1, name: 'Ingeniería de Software', description: 'Software engineering', malla_url: 'http://example.com/malla1.pdf' },
    { id: 2, name: 'Ingeniería Mecatrónica', description: 'Mechatronics engineering', malla_url: null }
];

const mockSubjects = [
    { id: 10, name: 'Estructuras de Datos', semester: 3, code: 'SW-03', career_id: 1 },
    { id: 11, name: 'Programación Web', semester: 4, code: 'SW-04', career_id: 1 }
];

const mockRewards = [
    { id: 1, title: 'Termo ESPE', description: 'Un termo institucional.', cost: 150, is_active: 1, is_special: 0 },
    { id: 2, title: 'Sorteo Tablet', description: 'Sorteo de una tablet.', cost: 500, is_active: 1, is_special: 1 }
];

const mockClaims = [
    { id: 1, reward_id: 1, user_name: 'Aprendiz User', user_email: 'aprendiz@espe.edu.ec', selected_option: null, contact_phone: '0999999999', claimed_at: '2026-07-05T00:00:00.000Z' },
    { id: 2, reward_id: 2, user_name: 'Mentor User', user_email: 'mentor@espe.edu.ec', selected_option: 'Opción Azul', contact_phone: '0888888888', claimed_at: '2026-07-06T00:00:00.000Z' }
];

const mockReport = {
    generatedAt: '2026-07-13T12:00:00.000Z',
    users: {
        total: 15,
        roles: {
            MENTOR: 5,
            APRENDIZ: 9,
            ADMIN: 1
        }
    },
    mentorships: {
        total: 10,
        averageRating: 4.8,
        statuses: {
            COMPLETADA: 4,
            PENDIENTE: 3,
            CANCELADA: 3
        }
    },
    storage: {
        usedMB: 120
    },
    topMentors: [
        { full_name: 'Tutor Especial', total_completed: 5 }
    ],
    topSubjects: [
        { name: 'Cálculo', total_requests: 8 }
    ],
    applications: {
        PENDING: 1,
        APPROVED: 2,
        REJECTED: 0
    },
    tickets: {
        OPEN: 1,
        IN_PROGRESS: 0,
        RESOLVED: 1
    }
};

const setupSuccessfulMocks = () => {
    axios.get.mockImplementation((url) => {
        if (url.includes('/api/admin/stats')) return Promise.resolve({ data: mockStats });
        if (url.includes('/api/admin/users')) return Promise.resolve({ data: mockUsers });
        if (url.includes('/api/admin/tutors/applications')) return Promise.resolve({ data: mockApplications });
        if (url.includes('/api/admin/tickets')) return Promise.resolve({ data: mockTickets });
        if (url.includes('/api/admin/badges')) return Promise.resolve({ data: mockBadges });
        if (url.includes('/api/admin/careers') && url.includes('/subjects')) return Promise.resolve({ data: mockSubjects });
        if (url.includes('/api/admin/careers')) return Promise.resolve({ data: mockCareers });
        if (url.includes('/api/admin/rewards/claims')) return Promise.resolve({ data: mockClaims });
        if (url.includes('/api/admin/rewards')) return Promise.resolve({ data: mockRewards });
        if (url.includes('/api/admin/report')) return Promise.resolve({ data: mockReport });
        return Promise.reject(new Error(`Unhandled GET request: ${url}`));
    });

    axios.post.mockResolvedValue({ data: {} });
    axios.put.mockResolvedValue({ data: {} });
    axios.delete.mockResolvedValue({ data: {} });
};

describe('AdminDashboard Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        
        // Setup default DOM / window mocks
        window.confirm = vi.fn().mockReturnValue(true);
        window.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
        window.URL.revokeObjectURL = vi.fn();
        window.open = vi.fn().mockReturnValue({
            addEventListener: vi.fn((event, callback) => {
                if (event === 'load') callback();
            }),
            print: vi.fn()
        });
    });

    const renderDashboard = () => {
        return render(
            <MemoryRouter>
                <NotificationProvider>
                    <AdminDashboard />
                </NotificationProvider>
            </MemoryRouter>
        );
    };

    it('redirige a /login y muestra error si el usuario no es ADMIN', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserNonAdmin));
        
        renderDashboard();

        await waitFor(() => {
            expect(screen.queryByText('Panel de Control')).not.toBeInTheDocument();
        });
    });

    it('se renderiza correctamente y muestra la pestaña de Estadísticas', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Estadísticas Generales')).toBeInTheDocument();
        });

        // Verifica estadísticas generales
        expect(screen.getByText('Total Usuarios')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument(); // total users
        expect(screen.getByText('Tutorías Coordinadas')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // total mentorships
        expect(screen.getByText('4.8')).toBeInTheDocument(); // average rating
        expect(screen.getByText('120 MB')).toBeInTheDocument(); // storageUsedMB
    });

    it('permite descargar el reporte general', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('📥 Descargar Reporte')).toBeInTheDocument();
        });

        const btn = screen.getByText('📥 Descargar Reporte');
        await act(async () => {
            fireEvent.click(btn);
        });

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/admin/report'));
        expect(window.open).toHaveBeenCalledWith('mock-url', '_blank');
    });

    it('maneja errores al cargar los datos iniciales', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        axios.get.mockRejectedValue(new Error('API Error'));

        renderDashboard();

        await waitFor(() => {
            expect(screen.queryByText('Estadísticas Generales')).not.toBeInTheDocument();
        });
    });

    it('gestiona las solicitudes de ascenso a tutor', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        renderDashboard();

        await waitFor(() => {
            expect(screen.getAllByText('Solicitudes').length).toBeGreaterThan(0);
        });

        const tabBtn = screen.getAllByText('Solicitudes')[0];
        await act(async () => {
            fireEvent.click(tabBtn);
        });

        await waitFor(() => {
            expect(screen.getByText('Solicitudes de Ascenso')).toBeInTheDocument();
        });
        
        expect(screen.getByText('Aprendiz User')).toBeInTheDocument();
        expect(screen.getByText(/Quiero ayudar a mis compañeros/)).toBeInTheDocument();

        // Aprobar ascenso
        const approveBtn = screen.getByText('Aprobar Ascenso');
        await act(async () => {
            fireEvent.click(approveBtn);
        });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/tutors/applications/1/approve'));

        // Rechazar
        const rejectBtn = screen.getByText('Rechazar');
        await act(async () => {
            fireEvent.click(rejectBtn);
        });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/tutors/applications/1/reject'));
    });

    it('gestiona los usuarios registrados', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        const { container } = renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Usuarios/i })).toBeInTheDocument();
        });

        const tabBtn = screen.getByRole('button', { name: /Usuarios/i });
        await act(async () => {
            fireEvent.click(tabBtn);
        });

        expect(screen.getByText('Usuarios Registrados')).toBeInTheDocument();
        expect(screen.getByText('Mentor User')).toBeInTheDocument();
        expect(screen.getByText('mentor@espe.edu.ec')).toBeInTheDocument();

        // Filtrado por buscador
        const searchInput = screen.getByPlaceholderText('Buscar por nombre o correo...');
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Blocked' } });
        });
        expect(screen.queryByText('Mentor User')).not.toBeInTheDocument();
        expect(screen.getByText('Blocked User')).toBeInTheDocument();

        // Limpiar buscador
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: '' } });
        });

        // Filtrado por rol
        const selectRole = container.querySelector('select'); // El primer select es el filtro de roles
        await act(async () => {
            fireEvent.change(selectRole, { target: { value: 'MENTOR' } });
        });
        expect(screen.queryByText('Blocked User')).not.toBeInTheDocument();
        expect(screen.getByText('Mentor User')).toBeInTheDocument();

        // Restaurar filtro
        await act(async () => {
            fireEvent.change(selectRole, { target: { value: 'ALL' } });
        });

        const rows = container.querySelectorAll('tbody tr');

        // Simular cambio de rol para Row 1 (Mentor User, id 2)
        const row1RoleSelect = rows[1].querySelectorAll('select')[0];
        await act(async () => {
            fireEvent.change(row1RoleSelect, { target: { value: 'ADMIN' } });
        });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/users/2/role'), { role: 'ADMIN' });

        // Simular cambio de estado para Row 1 (Mentor User, id 2)
        const row1StatusSelect = rows[1].querySelectorAll('select')[1];
        await act(async () => {
            fireEvent.change(row1StatusSelect, { target: { value: 'BLOQUEADO' } });
        });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/users/2/status'), { status: 'BLOQUEADO' });

        // Simular botón Bloquear / Activar rápido
        const toggleBlockBtn = screen.getAllByRole('button', { name: 'Bloquear' })[0];
        await act(async () => {
            fireEvent.click(toggleBlockBtn);
        });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/users/2/status'), { status: 'BLOQUEADO' });

        // Simular eliminación de usuario
        const deleteBtn = screen.getAllByRole('button', { name: 'Eliminar' })[0];
        await act(async () => {
            fireEvent.click(deleteBtn);
        });
        expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('¿Estás seguro de que deseas eliminar permanentemente al usuario'));
        expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/api/admin/users/2'));
    });

    it('gestiona los ajustes del sistema', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        const { container } = renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Administración/i })).toBeInTheDocument();
        });

        const tabBtn = screen.getByRole('button', { name: /Administración/i });
        await act(async () => {
            fireEvent.click(tabBtn);
        });

        expect(screen.getByText('Ajustes del Sistema')).toBeInTheDocument();

        // Modificar inputs
        const numberInputs = container.querySelectorAll('input[type="number"]');
        const storageLimitInput = numberInputs[0];
        const multiplierInput = numberInputs[1];
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const allowRegisterCheckbox = checkboxes[0];
        const emailNotificationsCheckbox = checkboxes[1];

        await act(async () => {
            fireEvent.change(storageLimitInput, { target: { value: '450' } });
            fireEvent.change(multiplierInput, { target: { value: '2.0' } });
            fireEvent.click(allowRegisterCheckbox);
            fireEvent.click(emailNotificationsCheckbox);
        });

        const saveSettingsBtn = screen.getByText('Guardar Configuraciones');
        await act(async () => {
            fireEvent.click(saveSettingsBtn);
        });

        // logs
        expect(screen.getAllByText(/Logs del Servidor/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/\[AJUSTES\] Variables globales actualizadas/i)).toBeInTheDocument();
    });

    it('gestiona los tickets de soporte', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Tickets/i })).toBeInTheDocument();
        });

        const tabBtn = screen.getByRole('button', { name: /Tickets/i });
        await act(async () => {
            fireEvent.click(tabBtn);
        });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Tickets de Soporte', level: 2 })).toBeInTheDocument();
        });

        expect(screen.getByText('Error de conexión')).toBeInTheDocument();
        expect(screen.getByText('No puedo conectarme al servidor.')).toBeInTheDocument();
        expect(screen.getByText('Duda con ESPE-Coins')).toBeInTheDocument();
        expect(screen.getByText('Respuesta Enviada')).toBeInTheDocument();

        // Abrir modal de respuesta
        const responderBtn = screen.getByText('Responder y Cerrar');
        await act(async () => {
            fireEvent.click(responderBtn);
        });

        expect(screen.getByText('Resolver Ticket #1')).toBeInTheDocument();
        const textarea = screen.getByPlaceholderText('Escribe la solución brindada al usuario...');
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Solución aplicada.' } });
        });

        const submitBtn = screen.getByRole('button', { name: 'Resolver y Cerrar Ticket' });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/tickets/1/resolve'), {
            reply: 'Solución aplicada.',
            status: 'RESOLVED'
        });
    });

    it('gestiona las insignias del sistema', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        const { container } = renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Insignias/i })).toBeInTheDocument();
        });

        const tabBtn = screen.getByRole('button', { name: /Insignias/i });
        await act(async () => {
            fireEvent.click(tabBtn);
        });

        expect(screen.getByText('Gestión de Insignias')).toBeInTheDocument();
        expect(screen.getByText('Insignia de Oro')).toBeInTheDocument();

        // 1. Crear Nueva Insignia
        const createBtn = screen.getByText('Crear Nueva Insignia');
        await act(async () => {
            fireEvent.click(createBtn);
        });

        expect(screen.getByText('Formulario de Logro')).toBeInTheDocument();
        
        const nameInput = screen.getByPlaceholderText('Ej: Tutor Comprometido');
        const xpRewardInput = screen.getAllByPlaceholderText('0')[0];
        const coinsRewardInput = screen.getAllByPlaceholderText('0')[1];
        const criteriaSelect = screen.getByRole('combobox');
        const criteriaValueInput = screen.getByPlaceholderText('Cantidad a cumplir');

        await act(async () => {
            fireEvent.change(nameInput, { target: { value: 'Insignia Creada' } });
            fireEvent.change(xpRewardInput, { target: { value: '200' } });
            fireEvent.change(coinsRewardInput, { target: { value: '100' } });
            fireEvent.change(criteriaSelect, { target: { value: 'mentorships_given' } });
            fireEvent.change(criteriaValueInput, { target: { value: '10' } });
        });

        // Archivo
        const fileInput = container.querySelector('input[type="file"]');
        const fileObj = new File(['badge_image_content'], 'badge.png', { type: 'image/png' });
        
        // Mocking Image object creation inside file change validations
        const originalImage = window.Image;
        window.Image = class {
            constructor() {
                setTimeout(() => {
                    this.width = 200;
                    this.height = 200;
                    if (this.onload) this.onload();
                }, 10);
            }
        };

        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [fileObj] } });
        });

        // Submit form
        const saveBtn = screen.getByRole('button', { name: 'Crear Insignia' });
        await act(async () => {
            fireEvent.submit(saveBtn);
        });

        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/admin/badges'), expect.any(FormData), expect.any(Object));

        // Restore Image
        window.Image = originalImage;

        // 2. Editar Insignia
        const editBtn = screen.getAllByRole('button', { name: 'Editar' })[0];
        await act(async () => {
            fireEvent.click(editBtn);
        });

        expect(screen.getByText('Formulario de Logro')).toBeInTheDocument();
        const editSaveBtn = screen.getByRole('button', { name: 'Guardar Cambios' });
        await act(async () => {
            fireEvent.submit(editSaveBtn);
        });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/badges/1'), expect.any(FormData), expect.any(Object));

        // 3. Eliminar Insignia
        const deleteBtn = screen.getAllByRole('button', { name: 'Eliminar' })[0];
        await act(async () => {
            fireEvent.click(deleteBtn);
        });
        expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/api/admin/badges/1'));
    });

    it('gestiona las recompensas y ESPE-Coins', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        const { container } = renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /ESPE-Coins/i })).toBeInTheDocument();
        });

        const tabBtn = screen.getByRole('button', { name: /ESPE-Coins/i });
        await act(async () => {
            fireEvent.click(tabBtn);
        });

        expect(screen.getByText('Gestión de ESPE-Coins')).toBeInTheDocument();
        expect(screen.getByText('Termo ESPE')).toBeInTheDocument();

        // 1. Crear recompensa
        const createBtn = screen.getByText('Crear Recompensa');
        await act(async () => {
            fireEvent.click(createBtn);
        });

        expect(screen.getByText('Formulario de Recompensa')).toBeInTheDocument();
        const titleInput = screen.getByPlaceholderText('Ej: Boleto de Sorteo: Kit Gamer');
        const descriptionInput = screen.getByPlaceholderText('Escribe la descripción de la recompensa y los requisitos...');
        const costInput = container.querySelector('input[type="number"]');

        await act(async () => {
            fireEvent.change(titleInput, { target: { value: 'Gorra ESPE' } });
            fireEvent.change(descriptionInput, { target: { value: 'Gorra oficial' } });
            fireEvent.change(costInput, { target: { value: '80' } });
        });

        const saveBtn = screen.getByRole('button', { name: 'Crear Recompensa' });
        await act(async () => {
            fireEvent.submit(saveBtn);
        });
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/admin/rewards'), expect.objectContaining({
            title: 'Gorra ESPE',
            cost: 80
        }));

        // 2. Editar Recompensa
        const editBtn = screen.getAllByRole('button', { name: 'Editar' })[0];
        await act(async () => {
            fireEvent.click(editBtn);
        });
        expect(screen.getByText('Formulario de Recompensa')).toBeInTheDocument();
        const editSaveBtn = screen.getByRole('button', { name: 'Guardar Cambios' });
        await act(async () => {
            fireEvent.submit(editSaveBtn);
        });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/rewards/1'), expect.any(Object));

        // 3. Eliminar Recompensa
        const deleteBtn = screen.getAllByRole('button', { name: 'Eliminar' })[0];
        await act(async () => {
            fireEvent.click(deleteBtn);
        });
        expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/api/admin/rewards/1'));

        // 4. Ver Reclamaciones Activas
        const reclamacionesTab = screen.getByText('Reclamaciones Activas');
        await act(async () => {
            fireEvent.click(reclamacionesTab);
        });

        expect(screen.getAllByText('Total Canjeados').length).toBeGreaterThan(0);

        // 5. Descargar reporte CSV
        const csvBtn = screen.getAllByText('CSV Excel')[0];
        await act(async () => {
            fireEvent.click(csvBtn);
        });
        expect(window.URL.createObjectURL).toHaveBeenCalled();

        // 6. Ver alumnos canjes
        const verAlumnosBtn = screen.getAllByText('Ver Alumnos')[0];
        await act(async () => {
            fireEvent.click(verAlumnosBtn);
        });
        expect(screen.getByText('Detalle de Reclamaciones: Termo ESPE')).toBeInTheDocument();
        expect(screen.getByText('Aprendiz User')).toBeInTheDocument();

        // Volver al listado
        const volverBtn = screen.getByText('← Volver al Listado');
        await act(async () => {
            fireEvent.click(volverBtn);
        });
        expect(screen.queryByText('Detalle de Reclamaciones: Termo ESPE')).not.toBeInTheDocument();
    });

    it('envía mensajes globales directos (Broadcast)', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Mensaje Global/i })).toBeInTheDocument();
        });

        const tabBtn = screen.getByRole('button', { name: /Mensaje Global/i });
        await act(async () => {
            fireEvent.click(tabBtn);
        });

        expect(screen.getByText('Comunicado Global Directo')).toBeInTheDocument();

        const subjectInput = screen.getByPlaceholderText('Ej: Mantenimiento programado / Comunicado Oficial');
        const textInput = screen.getByPlaceholderText('Escribe el cuerpo del comunicado...');

        await act(async () => {
            fireEvent.change(subjectInput, { target: { value: 'Aviso urgente' } });
            fireEvent.change(textInput, { target: { value: 'Mañana no hay clases por mantenimiento.' } });
        });

        const submitBtn = screen.getByRole('button', { name: /Enviar Comunicado/i });
        await act(async () => {
            fireEvent.submit(submitBtn);
        });

        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/admin/broadcast-message'), {
            subject: 'Aviso urgente',
            message: 'Mañana no hay clases por mantenimiento.'
        });
    });

    it('gestiona las carreras y materias curriculares', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        const { container } = renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Gestionar Carreras/i })).toBeInTheDocument();
        });

        const tabBtn = screen.getByRole('button', { name: /Gestionar Carreras/i });
        await act(async () => {
            fireEvent.click(tabBtn);
        });

        expect(screen.getByText('Gestión de Carreras')).toBeInTheDocument();
        expect(screen.getByText('Ingeniería de Software')).toBeInTheDocument();

        // 1. Crear Carrera
        const newCareerBtn = screen.getByText('🏫 Nueva Carrera');
        await act(async () => {
            fireEvent.click(newCareerBtn);
        });
        expect(screen.getByText('Formulario de Carrera')).toBeInTheDocument();
        const careerNameInput = screen.getByPlaceholderText('Ej: Ingeniería en Software');
        const careerDescInput = screen.getByPlaceholderText('Breve descripción de la carrera, enfoque, etc.');
        await act(async () => {
            fireEvent.change(careerNameInput, { target: { value: 'Ingeniería de Alimentos' } });
            fireEvent.change(careerDescInput, { target: { value: 'Alimentos description.' } });
        });
        const saveBtn = screen.getByRole('button', { name: 'Crear Carrera' });
        await act(async () => {
            fireEvent.submit(saveBtn);
        });
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/admin/careers'), {
            name: 'Ingeniería de Alimentos',
            description: 'Alimentos description.'
        });

        // 2. Editar Carrera
        const editBtn = screen.getAllByRole('button', { name: 'Editar' })[0];
        await act(async () => {
            fireEvent.click(editBtn);
        });
        expect(screen.getByText('Formulario de Carrera')).toBeInTheDocument();
        const editSaveBtn = screen.getByRole('button', { name: 'Guardar Cambios' });
        await act(async () => {
            fireEvent.submit(editSaveBtn);
        });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/careers/1'), expect.any(Object));

        // 3. Eliminar Carrera
        const deleteBtn = screen.getAllByRole('button', { name: 'Eliminar' })[0];
        await act(async () => {
            fireEvent.click(deleteBtn);
        });
        expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/api/admin/careers/2'));

        // 4. Ver Materias
        const verMateriasBtn = screen.getAllByText(/Ver Materias/i)[0];
        await act(async () => {
            fireEvent.click(verMateriasBtn);
        });
        expect(screen.getByText('Estructuras de Datos')).toBeInTheDocument();
        expect(screen.getByText('Programación Web')).toBeInTheDocument();

        // 5. Escanear Malla PDF
        const mallaFileInput = container.querySelector('input[type="file"][accept="application/pdf"]');
        const mallaFileObj = new File(['malla_pdf_content'], 'malla.pdf', { type: 'application/pdf' });
        await act(async () => {
            fireEvent.change(mallaFileInput, { target: { files: [mallaFileObj] } });
        });
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/careers/1/malla'),
            expect.any(FormData),
            expect.any(Object)
        );

        // 6. Agregar Materia
        const newSubjectBtn = screen.getByText('📚 Agregar Materia');
        await act(async () => {
            fireEvent.click(newSubjectBtn);
        });
        expect(screen.getByText('Formulario de Materia')).toBeInTheDocument();
        const subjectNameInput = screen.getByPlaceholderText('Ej: Programación Orientada a Objetos');
        const subjectSemesterSelect = screen.getByRole('combobox');
        const subjectCodeInput = screen.getByPlaceholderText('Ej: EXCTA0301');

        await act(async () => {
            fireEvent.change(subjectNameInput, { target: { value: 'Física Clásica' } });
            fireEvent.change(subjectSemesterSelect, { target: { value: '2' } });
            fireEvent.change(subjectCodeInput, { target: { value: 'PHYS-02' } });
        });

        const saveSubjectBtn = screen.getByRole('button', { name: 'Crear Materia' });
        await act(async () => {
            fireEvent.submit(saveSubjectBtn);
        });
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/admin/subjects'), {
            name: 'Física Clásica',
            semester: 2,
            code: 'PHYS-02',
            career_id: 1
        });

        // 7. Editar Materia
        const editSubjectBtn = screen.getAllByTitle('Editar')[0];
        await act(async () => {
            fireEvent.click(editSubjectBtn);
        });
        const editSaveSubjectBtn = screen.getByRole('button', { name: 'Guardar Cambios' });
        await act(async () => {
            fireEvent.submit(editSaveSubjectBtn);
        });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/subjects/10'), expect.any(Object));

        // 8. Eliminar Materia
        const deleteSubjectBtn = screen.getAllByTitle('Eliminar')[0];
        await act(async () => {
            fireEvent.click(deleteSubjectBtn);
        });
        expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/api/admin/subjects/10'));

        // 9. Volver a Carreras
        const volverCarrerasBtn = screen.getByText('← Volver a Carreras');
        await act(async () => {
            fireEvent.click(volverCarrerasBtn);
        });
        expect(screen.getByText('Gestión de Carreras')).toBeInTheDocument();
    });

    it('maneja el flujo de errores de la API y el cierre de todos los modales', async () => {
        localStorage.setItem('user', JSON.stringify(mockUserAdmin));
        setupSuccessfulMocks();

        const { container } = renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Estadísticas Generales')).toBeInTheDocument();
        });

        // 1. Error en Descarga de Reporte
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/admin/report')) return Promise.reject(new Error('Report Error'));
            return Promise.resolve({ data: {} });
        });
        const reportBtn = screen.getByText('📥 Descargar Reporte');
        await act(async () => {
            fireEvent.click(reportBtn);
        });
        // Restablecer mocks correctos
        setupSuccessfulMocks();

        // 2. Solicitudes: Errores en Aprobación y Rechazo
        const solicitudesTab = screen.getAllByText('Solicitudes')[0];
        await act(async () => {
            fireEvent.click(solicitudesTab);
        });
        await waitFor(() => {
            expect(screen.getByText('Solicitudes de Ascenso')).toBeInTheDocument();
        });

        axios.put.mockRejectedValueOnce(new Error('Approve Fail'));
        const approveBtn = screen.getByText('Aprobar Ascenso');
        await act(async () => {
            fireEvent.click(approveBtn);
        });

        axios.put.mockRejectedValueOnce(new Error('Reject Fail'));
        const rejectBtn = screen.getByText('Rechazar');
        await act(async () => {
            fireEvent.click(rejectBtn);
        });

        // 3. Usuarios: Errores en Rol, Estado y Eliminación
        const usuariosTab = screen.getByRole('button', { name: /Usuarios/i });
        await act(async () => {
            fireEvent.click(usuariosTab);
        });
        await waitFor(() => {
            expect(screen.getByText('Usuarios Registrados')).toBeInTheDocument();
        });

        const rows = container.querySelectorAll('tbody tr');
        axios.put.mockRejectedValueOnce(new Error('Role Fail'));
        const row1RoleSelect = rows[1].querySelectorAll('select')[0];
        await act(async () => {
            fireEvent.change(row1RoleSelect, { target: { value: 'ADMIN' } });
        });

        axios.put.mockRejectedValueOnce(new Error('Status Fail'));
        const row1StatusSelect = rows[1].querySelectorAll('select')[1];
        await act(async () => {
            fireEvent.change(row1StatusSelect, { target: { value: 'BLOQUEADO' } });
        });

        axios.delete.mockRejectedValueOnce(new Error('Delete Fail'));
        const deleteBtn = screen.getAllByRole('button', { name: 'Eliminar' })[0];
        await act(async () => {
            fireEvent.click(deleteBtn);
        });

        // 4. Tickets: Cierre de Modal y Error de Solución
        const ticketsTab = screen.getByRole('button', { name: /Tickets/i });
        await act(async () => {
            fireEvent.click(ticketsTab);
        });
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Tickets de Soporte', level: 2 })).toBeInTheDocument();
        });

        // Abrir y cerrar modal
        const responderBtn = screen.getByText('Responder y Cerrar');
        await act(async () => {
            fireEvent.click(responderBtn);
        });
        expect(screen.getByText('Resolver Ticket #1')).toBeInTheDocument();
        const closeTicketModalBtn = screen.getByText('×');
        await act(async () => {
            fireEvent.click(closeTicketModalBtn);
        });
        expect(screen.queryByText('Resolver Ticket #1')).not.toBeInTheDocument();

        // Abrir de nuevo y fallar envío
        await act(async () => {
            fireEvent.click(responderBtn);
        });
        const textarea = screen.getByPlaceholderText('Escribe la solución brindada al usuario...');
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Solución fail.' } });
        });
        axios.put.mockRejectedValueOnce(new Error('Resolve Fail'));
        const submitTicketBtn = screen.getByRole('button', { name: 'Resolver y Cerrar Ticket' });
        await act(async () => {
            fireEvent.click(submitTicketBtn);
        });

        // Cerrar modal tras fallo
        await act(async () => {
            fireEvent.click(screen.getByText('×'));
        });

        // 5. Insignias: Cierre de Modal y Validación de Imagen Incorrecta
        const insigniasTab = screen.getByRole('button', { name: /Insignias/i });
        await act(async () => {
            fireEvent.click(insigniasTab);
        });
        await waitFor(() => {
            expect(screen.getByText('Gestión de Insignias')).toBeInTheDocument();
        });

        // Abrir y cerrar modal
        const createBadgeBtn = screen.getByText('Crear Nueva Insignia');
        await act(async () => {
            fireEvent.click(createBadgeBtn);
        });
        expect(screen.getByText('Formulario de Logro')).toBeInTheDocument();
        const closeBadgeModalBtn = screen.getByText('×');
        await act(async () => {
            fireEvent.click(closeBadgeModalBtn);
        });
        expect(screen.queryByText('Formulario de Logro')).not.toBeInTheDocument();

        // Archivos dañados o incorrectos
        await act(async () => {
            fireEvent.click(createBadgeBtn);
        });
        const badgeFileInput = container.querySelector('input[type="file"]');
        
        // Simular archivo de texto
        const badFile1 = new File(['bad_content'], 'icon.txt', { type: 'text/plain' });
        await act(async () => {
            fireEvent.change(badgeFileInput, { target: { files: [badFile1] } });
        });

        // Simular imagen gigante (3MB)
        const badFile2 = new File(['b'.repeat(3 * 1024 * 1024)], 'giant.png', { type: 'image/png' });
        await act(async () => {
            fireEvent.change(badgeFileInput, { target: { files: [badFile2] } });
        });

        // Simular error de dimensiones
        const badFile3 = new File(['dimension_fail'], 'small.png', { type: 'image/png' });
        const originalImage = window.Image;
        window.Image = class {
            constructor() {
                setTimeout(() => {
                    this.width = 50; // Menor que el mínimo 100px
                    this.height = 50;
                    if (this.onload) this.onload();
                }, 10);
            }
        };
        await act(async () => {
            fireEvent.change(badgeFileInput, { target: { files: [badFile3] } });
        });
        window.Image = originalImage;

        // Cerrar modal insignia
        await act(async () => {
            fireEvent.click(screen.getByText('×'));
        });

        // 6. ESPE-Coins: Cierre de Modal, Selección de Opciones Extra y Error al Eliminar
        const coinsTab = screen.getByRole('button', { name: /ESPE-Coins/i });
        await act(async () => {
            fireEvent.click(coinsTab);
        });
        await waitFor(() => {
            expect(screen.getByText('Gestión de ESPE-Coins')).toBeInTheDocument();
        });

        // Cierre modal
        const createRewardBtn = screen.getByText('Crear Recompensa');
        await act(async () => {
            fireEvent.click(createRewardBtn);
        });
        expect(screen.getByText('Formulario de Recompensa')).toBeInTheDocument();
        const closeRewardModalBtn = screen.getByText('×');
        await act(async () => {
            fireEvent.click(closeRewardModalBtn);
        });

        // Enviar con opciones de select (is_special y is_active)
        await act(async () => {
            fireEvent.click(createRewardBtn);
        });
        const titleInput = screen.getByPlaceholderText('Ej: Boleto de Sorteo: Kit Gamer');
        const descriptionInput = screen.getByPlaceholderText('Escribe la descripción de la recompensa y los requisitos...');
        const costInput = container.querySelector('input[type="number"]');
        const selects = container.querySelectorAll('select');
        const typeSelect = selects[0]; // is_special
        const statusSelect = selects[1]; // is_active

        await act(async () => {
            fireEvent.change(titleInput, { target: { value: 'Sorteo Nintendo' } });
            fireEvent.change(descriptionInput, { target: { value: 'Nintendo description' } });
            fireEvent.change(costInput, { target: { value: '250' } });
            fireEvent.change(typeSelect, { target: { value: '1' } }); // Sorteo Especial
            fireEvent.change(statusSelect, { target: { value: '0' } }); // Inactivo
        });
        const saveRewardSubmit = screen.getByRole('button', { name: 'Crear Recompensa' });
        await act(async () => {
            fireEvent.submit(saveRewardSubmit);
        });
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/admin/rewards'), expect.objectContaining({
            is_special: 1,
            is_active: 0
        }));

        // Error al guardar recompensa
        await act(async () => {
            fireEvent.click(createRewardBtn);
        });
        axios.post.mockRejectedValueOnce(new Error('Save Reward Fail'));
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: 'Crear Recompensa' }));
        });
        // Cerrar modal
        await act(async () => {
            fireEvent.click(screen.getByText('×'));
        });

        // Error al eliminar recompensa
        axios.delete.mockRejectedValueOnce(new Error('Delete Reward Fail'));
        const deleteRewardBtn = screen.getAllByRole('button', { name: 'Eliminar' })[0];
        await act(async () => {
            fireEvent.click(deleteRewardBtn);
        });

        // 7. Broadcast: Error al Enviar Mensaje Global
        const broadcastTab = screen.getByRole('button', { name: /Mensaje Global/i });
        await act(async () => {
            fireEvent.click(broadcastTab);
        });
        await waitFor(() => {
            expect(screen.getByText('Comunicado Global Directo')).toBeInTheDocument();
        });

        const subjectInput = screen.getByPlaceholderText('Ej: Mantenimiento programado / Comunicado Oficial');
        const textInput = screen.getByPlaceholderText('Escribe el cuerpo del comunicado...');
        await act(async () => {
            fireEvent.change(subjectInput, { target: { value: 'Aviso error' } });
            fireEvent.change(textInput, { target: { value: 'Mensaje' } });
        });
        axios.post.mockRejectedValueOnce(new Error('Broadcast Fail'));
        const submitBroadcastBtn = screen.getByRole('button', { name: /Enviar Comunicado/i });
        await act(async () => {
            fireEvent.submit(submitBroadcastBtn);
        });

        // 8. Carreras: Modales, Fallos en Carga de Malla, Nueva Carrera y Materias
        const carrerasTab = screen.getByRole('button', { name: /Gestionar Carreras/i });
        await act(async () => {
            fireEvent.click(carrerasTab);
        });
        await waitFor(() => {
            expect(screen.getByText('Gestión de Carreras')).toBeInTheDocument();
        });

        // Cierre de modal carrera
        const newCareerBtn = screen.getByText('🏫 Nueva Carrera');
        await act(async () => {
            fireEvent.click(newCareerBtn);
        });
        expect(screen.getByText('Formulario de Carrera')).toBeInTheDocument();
        const closeCareerModalBtn = screen.getByText('×');
        await act(async () => {
            fireEvent.click(closeCareerModalBtn);
        });

        // Error al guardar carrera
        await act(async () => {
            fireEvent.click(newCareerBtn);
        });
        axios.post.mockRejectedValueOnce(new Error('Save Career Fail'));
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: 'Crear Carrera' }));
        });
        // Cerrar modal carrera
        await act(async () => {
            fireEvent.click(screen.getByText('×'));
        });

        // Error al eliminar carrera
        axios.delete.mockRejectedValueOnce(new Error('Delete Career Fail'));
        const deleteCareerBtn = screen.getAllByRole('button', { name: 'Eliminar' })[0];
        await act(async () => {
            fireEvent.click(deleteCareerBtn);
        });

        // Ver materias
        const verMateriasBtn = screen.getAllByText(/Ver Materias/i)[0];
        await act(async () => {
            fireEvent.click(verMateriasBtn);
        });

        // Cierre de modal materia
        const newSubjectBtn = screen.getByText('📚 Agregar Materia');
        await act(async () => {
            fireEvent.click(newSubjectBtn);
        });
        expect(screen.getByText('Formulario de Materia')).toBeInTheDocument();
        const closeSubjectModalBtn = screen.getByText('×');
        await act(async () => {
            fireEvent.click(closeSubjectModalBtn);
        });

        // Error al guardar materia
        await act(async () => {
            fireEvent.click(newSubjectBtn);
        });
        axios.post.mockRejectedValueOnce(new Error('Save Subject Fail'));
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: 'Crear Materia' }));
        });
        // Cerrar modal materia
        await act(async () => {
            fireEvent.click(screen.getByText('×'));
        });

        // Error al eliminar materia
        axios.delete.mockRejectedValueOnce(new Error('Delete Subject Fail'));
        const deleteSubjectBtn = screen.getAllByTitle('Eliminar')[0];
        await act(async () => {
            fireEvent.click(deleteSubjectBtn);
        });

        // Error al subir malla curricular
        const mallaFileInput = container.querySelector('input[type="file"][accept="application/pdf"]');
        const mallaFileObj = new File(['malla_pdf_content'], 'malla.pdf', { type: 'application/pdf' });
        axios.post.mockRejectedValueOnce(new Error('Malla Upload Fail'));
        await act(async () => {
            fireEvent.change(mallaFileInput, { target: { files: [mallaFileObj] } });
        });
    });
});
