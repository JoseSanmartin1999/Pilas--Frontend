import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import BuscarTutor from './BuscarTutor';
import axios from 'axios';
import { NotificationProvider } from '../context/NotificationContext';

vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

const mockMentors = [
    { id: 1, nombre: 'Ana Gómez', career: 'Ingeniería de Software', current_semester: 4, score: 4.8, materias: ['Cálculo', 'Álgebra'], profile_photo_url: 'http://example.com/ana.png' },
    { id: 2, nombre: 'Carlos Ruiz', career: 'Ingeniería Mecatrónica', current_semester: 6, score: 3.5, materias: ['Física', 'Termodinámica'], profile_photo_url: null },
    { id: 3, nombre: 'Diana Silva', career: 'Ingeniería de Software', current_semester: 5, score: 5.0, materias: ['Cálculo', 'Estructuras de Datos'], profile_photo_url: 'http://example.com/diana.png' },
    { id: 4, nombre: 'Ernesto Paz', career: 'Ingeniería Electrónica', current_semester: 8, score: 4.2, materias: ['Circuitos'], profile_photo_url: null },
    { id: 5, nombre: 'Fabiola Ríos', career: 'Ingeniería de Software', current_semester: 7, score: 4.5, materias: ['Programación Web'], profile_photo_url: null },
    { id: 6, nombre: 'Gabriel Vega', career: 'Ingeniería Mecánica', current_semester: 5, score: 2.8, materias: ['Cálculo', 'Estática'], profile_photo_url: null },
    { id: 7, nombre: 'Hugo Ortiz', career: 'Ingeniería de Software', current_semester: 6, score: 4.9, materias: ['Base de Datos'], profile_photo_url: null }
];

describe('BuscarTutor Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        axios.get.mockResolvedValue({ data: mockMentors });
    });

    const renderBuscarTutor = () => {
        return render(
            <MemoryRouter>
                <NotificationProvider>
                    <BuscarTutor />
                </NotificationProvider>
            </MemoryRouter>
        );
    };

    it('muestra indicador de carga y luego renderiza los tutores', async () => {
        const { container } = renderBuscarTutor();

        // Verificar spinner de carga
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Mentores Disponibles')).toBeInTheDocument();
        });

        // 6 items per page, so mockMentors 0 to 5 should be displayed
        expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
        expect(screen.getByText('Diana Silva')).toBeInTheDocument();
        expect(screen.getByText('Hugo Ortiz')).toBeInTheDocument();
        expect(screen.getByText('Fabiola Ríos')).toBeInTheDocument();
        expect(screen.getByText('Gabriel Vega')).toBeInTheDocument();
        
        // Ernesto Paz should not be on page 1 (since page limit is 6 and semester is 8)
        expect(screen.queryByText('Ernesto Paz')).not.toBeInTheDocument();
    });

    it('maneja el caso de error al cargar los datos', async () => {
        axios.get.mockRejectedValueOnce(new Error('Network error'));
        renderBuscarTutor();

        await waitFor(() => {
            expect(screen.getByText('No se encontraron mentores')).toBeInTheDocument();
        });
    });

    it('excluye al usuario autenticado (actual) de la lista si está en localStorage o sessionStorage', async () => {
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        renderBuscarTutor();

        await waitFor(() => {
            expect(screen.getByText('Mentores Disponibles')).toBeInTheDocument();
        });

        // Ana Gómez (id: 1) should be filtered out
        expect(screen.queryByText('Ana Gómez')).not.toBeInTheDocument();
        // The REST call should have been made with exclude parameter
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('?exclude=1'));
    });

    it('filtra por texto (nombre / materias)', async () => {
        renderBuscarTutor();

        await waitFor(() => {
            expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Nombre o Materia...');
        
        // Filtrar por nombre
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Ruiz' } });
        });
        expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
        expect(screen.queryByText('Ana Gómez')).not.toBeInTheDocument();

        // Filtrar por materia
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Circuitos' } });
        });
        expect(screen.getByText('Ernesto Paz')).toBeInTheDocument();
        expect(screen.queryByText('Carlos Ruiz')).not.toBeInTheDocument();
    });

    it('filtra por semestre', async () => {
        renderBuscarTutor();

        await waitFor(() => {
            expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        });

        // Click on 7° level button
        const btnLevel7 = screen.getByRole('button', { name: '7°' });
        await act(async () => {
            fireEvent.click(btnLevel7);
        });

        // Only Fabiola Ríos (semester 7) should render
        expect(screen.getByText('Fabiola Ríos')).toBeInTheDocument();
        expect(screen.queryByText('Ana Gómez')).not.toBeInTheDocument();

        // Go back to "Todos"
        const btnTodos = screen.getAllByRole('button', { name: 'Todos' })[0];
        await act(async () => {
            fireEvent.click(btnTodos);
        });
        expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
    });

    it('filtra por calificación mínima (estrellas)', async () => {
        renderBuscarTutor();

        await waitFor(() => {
            expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        });

        // Calificación mínima de 5 estrellas
        const starBtns = screen.getAllByRole('button', { name: '★' });
        const starBtn5 = starBtns[4]; // index 4 is 5 star button

        await act(async () => {
            fireEvent.click(starBtn5);
        });

        // Diana Silva has 5.0, so she should be displayed
        expect(screen.getByText('Diana Silva')).toBeInTheDocument();
        // Carlos Ruiz has 3.5, so he should not be displayed
        expect(screen.queryByText('Carlos Ruiz')).not.toBeInTheDocument();

        // Click "Todos" rating filter to clear rating filter
        const btnTodosRating = screen.getAllByRole('button', { name: 'Todos' })[1];
        await act(async () => {
            fireEvent.click(btnTodosRating);
        });
        expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    });

    it('permite limpiar todos los filtros a la vez', async () => {
        renderBuscarTutor();

        await waitFor(() => {
            expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Nombre o Materia...');
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Gómez' } });
        });

        const cleanBtn = screen.getByRole('button', { name: /Limpiar Filtros/i });
        await act(async () => {
            fireEvent.click(cleanBtn);
        });

        expect(searchInput.value).toBe('');
        expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    });

    it('ordena la lista por diferentes criterios', async () => {
        const { container } = renderBuscarTutor();

        await waitFor(() => {
            expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        });

        const sortSelect = container.querySelector('select');

        // Ordenar por Semestre Descendente
        await act(async () => {
            fireEvent.change(sortSelect, { target: { value: 'semester-desc' } });
        });
        // Ernesto Paz is semester 8 (highest on page 1)
        expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Ernesto Paz');

        // Ordenar por Nombre (A - Z)
        await act(async () => {
            fireEvent.change(sortSelect, { target: { value: 'name-asc' } });
        });
        // Ana Gómez is A
        expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Ana Gómez');

        // Ordenar por Mejor Valorados (Puntuación desc)
        await act(async () => {
            fireEvent.change(sortSelect, { target: { value: 'score-desc' } });
        });
        // Diana Silva has 5.0 (highest)
        expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Diana Silva');

        // Trigger default return 0 sorting branch (fallback) by modifying value
        await act(async () => {
            fireEvent.change(sortSelect, { target: { value: 'unknown-sort' } });
        });
    });

    it('maneja la paginación y permite navegar entre páginas', async () => {
        renderBuscarTutor();

        await waitFor(() => {
            expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        });

        const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
        await act(async () => {
            fireEvent.click(nextBtn);
        });

        // Now Ernesto Paz (page 2) should be displayed
        expect(screen.getByText('Ernesto Paz')).toBeInTheDocument();
        expect(screen.queryByText('Ana Gómez')).not.toBeInTheDocument();

        // Click Anterior
        const prevBtn = screen.getByRole('button', { name: /Anterior/i });
        await act(async () => {
            fireEvent.click(prevBtn);
        });
        expect(screen.getByText('Ana Gómez')).toBeInTheDocument();

        // Go to page 2 and click page 1 directly
        await act(async () => {
            fireEvent.click(nextBtn);
        });
        const page1Btn = screen.getByRole('button', { name: '1' });
        await act(async () => {
            fireEvent.click(page1Btn);
        });
        expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
    });

    it('permite hacer clic en Ver Perfil para ir al perfil de un tutor', async () => {
        renderBuscarTutor();

        await waitFor(() => {
            expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        });

        const viewProfileBtns = screen.getAllByRole('button', { name: 'Ver Perfil' });
        await act(async () => {
            fireEvent.click(viewProfileBtns[0]); // First tutor profile (Ana Gómez, id: 1)
        });

        expect(mockNavigate).toHaveBeenCalledWith('/profile/1');
    });
});
