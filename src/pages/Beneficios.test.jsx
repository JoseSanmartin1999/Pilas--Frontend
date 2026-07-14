import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Beneficios from './Beneficios';

describe('Beneficios Page Tests', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    const renderBeneficios = () => {
        return render(
            <MemoryRouter>
                <Beneficios />
            </MemoryRouter>
        );
    };

    it('se renderiza correctamente con los textos principales, insignias y catálogo de premios', () => {
        renderBeneficios();

        // Verificar encabezados del Hero
        expect(screen.getByText(/Aprende, Comparte y/i)).toBeInTheDocument();
        expect(screen.getByText(/Gana Recompensas/i)).toBeInTheDocument();
        expect(screen.getByText(/Pilas! es el espacio de mentoría académica/i)).toBeInTheDocument();

        // Verificar Beneficios por Rol
        expect(screen.getByText('Beneficios por Rol')).toBeInTheDocument();
        expect(screen.getByText('Como Aprendiz')).toBeInTheDocument();
        expect(screen.getByText('Como Mentor (Tutor)')).toBeInTheDocument();

        // Verificar Catálogo de Premios
        expect(screen.getByText('Catálogo de Premios Canjeables')).toBeInTheDocument();
        expect(screen.getByText('15% Descuento en Bar ESPE')).toBeInTheDocument();
        expect(screen.getByText('Almuerzo Gratis Comedor')).toBeInTheDocument();
        expect(screen.getByText('Parqueadero VIP (1 Día)')).toBeInTheDocument();
        expect(screen.getByText('Termo Oficial ESPE')).toBeInTheDocument();
        expect(screen.getAllByText('Cuaderno Anillado Pilas!').length).toBeGreaterThan(0);

        // Verificar Insignias
        expect(screen.getByText('Insignias y Gamificación')).toBeInTheDocument();
        expect(screen.getByText('Primeros Pasos')).toBeInTheDocument();
        expect(screen.getByText('Cerebro de Oro')).toBeInTheDocument();
        expect(screen.getByText('Siempre Puntual')).toBeInTheDocument();
        expect(screen.getByText('Mentor Estrella')).toBeInTheDocument();
        expect(screen.getByText('Súper Aprendiz')).toBeInTheDocument();
        expect(screen.getByText('Héroe de la ESPE')).toBeInTheDocument();

        // Verificar CTA
        expect(screen.getByText(/¿Listo para ponerte las Pilas!\?/i)).toBeInTheDocument();
    });

    it('muestra enlaces de registro e inicio de sesión cuando el usuario no está autenticado', () => {
        renderBeneficios();

        // Links de no-auth en el Hero
        const registrarseHeroBtn = screen.getByRole('link', { name: 'Registrarse Ahora' });
        expect(registrarseHeroBtn).toHaveAttribute('href', '/registro');

        // Links de no-auth en el CTA
        const registrarmeCtaBtn = screen.getByRole('link', { name: 'Registrarme' });
        expect(registrarmeCtaBtn).toHaveAttribute('href', '/registro');

        const iniciarSesionCtaBtn = screen.getByRole('link', { name: 'Iniciar Sesión' });
        expect(iniciarSesionCtaBtn).toHaveAttribute('href', '/login');
    });

    it('muestra enlaces de buscar tutor y perfil cuando el usuario está autenticado mediante localStorage', () => {
        localStorage.setItem('token', 'mock-token-local');
        renderBeneficios();

        // Hero link
        const buscarTutorHeroBtn = screen.getByRole('link', { name: 'Buscar Tutor' });
        expect(buscarTutorHeroBtn).toHaveAttribute('href', '/buscar');

        // CTA links
        const registrarmeCtaBtn = screen.getByRole('link', { name: 'Registrarme' });
        expect(registrarmeCtaBtn).toHaveAttribute('href', '/buscar');

        const perfilCtaBtn = screen.getByRole('link', { name: 'Ir a mi Perfil' });
        expect(perfilCtaBtn).toHaveAttribute('href', '/profile');
    });

    it('muestra enlaces de buscar tutor y perfil cuando el usuario está autenticado mediante sessionStorage', () => {
        sessionStorage.setItem('token', 'mock-token-session');
        renderBeneficios();

        // Hero link
        const buscarTutorHeroBtn = screen.getByRole('link', { name: 'Buscar Tutor' });
        expect(buscarTutorHeroBtn).toHaveAttribute('href', '/buscar');

        // CTA links
        const registrarmeCtaBtn = screen.getByRole('link', { name: 'Registrarme' });
        expect(registrarmeCtaBtn).toHaveAttribute('href', '/buscar');

        const perfilCtaBtn = screen.getByRole('link', { name: 'Ir a mi Perfil' });
        expect(perfilCtaBtn).toHaveAttribute('href', '/profile');
    });

    it('calcula correctamente las monedas, la experiencia y el nivel en el simulador dinámico', () => {
        const { container } = renderBeneficios();

        // Por defecto: tutoriasDadas = 4, tutoriasRecibidas = 2, calificacionMentor = 4.8.
        // Esperado:
        // bonusCoins = (4.8 >= 4.5 && 4 > 0) ? 50 : 0 => 50
        // totalCoins = (4 * 35) + (2 * 15) + 50 = 140 + 30 + 50 = 220
        // bonusXp = 100
        // totalXp = (4 * 100) + (2 * 50) + 100 = 400 + 100 + 100 = 600
        // level = Math.floor(600 / 500) + 1 = 2
        expect(screen.getByText('220')).toBeInTheDocument(); // Coins
        expect(screen.getByText('600')).toBeInTheDocument(); // XP
        expect(screen.getByText('Nivel 2 alcanzado')).toBeInTheDocument();

        // Probar sliders
        const rangeInputs = container.querySelectorAll('input[type="range"]');
        const sliderDadas = rangeInputs[0];
        const sliderRecibidas = rangeInputs[1];
        const sliderCalificacion = rangeInputs[2];

        // 1. Cambiar tutorías dadas a 0 (debería deshabilitar slider de calificación y remover bonus)
        // Esperado:
        // totalCoins = (0 * 35) + (2 * 15) + 0 = 30
        // totalXp = (0 * 100) + (2 * 50) + 0 = 100
        // level = Math.floor(100 / 500) + 1 = 1
        fireEvent.change(sliderDadas, { target: { value: '0' } });

        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Nivel 1 alcanzado')).toBeInTheDocument();
        expect(screen.getByText('¡Sigue acumulando para canjear tu primer premio!')).toBeInTheDocument();

        // El slider de calificación no debe renderizarse si tutoriasDadas === 0
        const rangeInputsAfterZero = container.querySelectorAll('input[type="range"]');
        expect(rangeInputsAfterZero).toHaveLength(2);

        // 2. Cambiar dadas a 5 y recibidas a 5 con calificación 4.0 (menor a 4.5 para probar sin bonus)
        // Esperado:
        // tutoriasDadas = 5, tutoriasRecibidas = 5, calificacionMentor = 4.0
        // bonusCoins = 0, bonusXp = 0
        // totalCoins = (5 * 35) + (5 * 15) = 175 + 75 = 250
        // totalXp = (5 * 100) + (5 * 50) = 500 + 250 = 750
        // level = Math.floor(750 / 500) + 1 = 2
        fireEvent.change(sliderDadas, { target: { value: '5' } });
        
        // Re-obtener el slider de calificación porque ahora sí se renderiza
        const rangeInputsAfterFive = container.querySelectorAll('input[type="range"]');
        const sliderCalificacionNew = rangeInputsAfterFive[2];

        fireEvent.change(sliderRecibidas, { target: { value: '5' } });
        fireEvent.change(sliderCalificacionNew, { target: { value: '4.0' } });

        expect(screen.getByText('250')).toBeInTheDocument();
        expect(screen.getByText('750')).toBeInTheDocument();
        expect(screen.getByText('Nivel 2 alcanzado')).toBeInTheDocument();

        // El de mayor costo <= 250 es "Termo Oficial ESPE" (cost: 200)
        // Pero en la lista, el último elemento asequible <= 250 es "Cuaderno Anillado Pilas!" (cost: 80)
        expect(screen.getAllByText('Cuaderno Anillado Pilas!').length).toBeGreaterThan(0);
        expect(screen.getByText('Costo: 80 Coins')).toBeInTheDocument();
    });
});
