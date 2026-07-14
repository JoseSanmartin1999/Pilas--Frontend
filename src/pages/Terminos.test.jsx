import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Terminos from '../pages/Terminos';

// jsdom no implementa scrollIntoView — se mockea globalmente
beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const renderTerminos = () =>
    render(
        <MemoryRouter>
            <Terminos />
        </MemoryRouter>
    );

describe('Terminos - Renderizado inicial', () => {
    it('muestra el título Términos y Condiciones de Uso', () => {
        renderTerminos();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/términos y condiciones de uso/i);
    });

    it('muestra la etiqueta Documento Oficial', () => {
        renderTerminos();
        expect(screen.getByText(/documento oficial/i)).toBeInTheDocument();
    });

    it('muestra el buscador', () => {
        renderTerminos();
        expect(screen.getByPlaceholderText(/buscar en los términos/i)).toBeInTheDocument();
    });

    it('muestra el encabezado Índice del Documento', () => {
        renderTerminos();
        expect(screen.getByText(/índice del documento/i)).toBeInTheDocument();
    });

    it('muestra las 7 secciones de términos', () => {
        renderTerminos();
        // Verificar por los botones del índice sidebar (texto único)
        const allButtons = screen.getAllByRole('button');
        const buttonTexts = allButtons.map(b => b.textContent);
        expect(buttonTexts.some(t => /introducción y aceptación/i.test(t))).toBe(true);
        expect(buttonTexts.some(t => /registro de cuentas/i.test(t))).toBe(true);
        expect(buttonTexts.some(t => /responsabilidades del tutor/i.test(t))).toBe(true);
        expect(buttonTexts.some(t => /responsabilidades del aprendiz/i.test(t))).toBe(true);
        expect(buttonTexts.some(t => /espe coins/i.test(t))).toBe(true);
        expect(buttonTexts.some(t => /propiedad intelectual/i.test(t))).toBe(true);
        expect(buttonTexts.some(t => /privacidad/i.test(t))).toBe(true);
    });

    it('muestra la información de última actualización', () => {
        renderTerminos();
        expect(screen.getByText(/última actualización/i)).toBeInTheDocument();
    });
});

describe('Terminos - Buscador interactivo', () => {
    it('filtra secciones al escribir en el buscador', () => {
        renderTerminos();
        const input = screen.getByPlaceholderText(/buscar en los términos/i);
        fireEvent.change(input, { target: { value: 'tutor' } });
        // El índice sidebar debe mostrar al menos un item
        const buttons = screen.getAllByRole('button');
        expect(buttons.some(b => /tutor/i.test(b.textContent))).toBe(true);
    });

    it('muestra "Ninguna sección coincide" cuando la búsqueda no tiene resultados', () => {
        renderTerminos();
        const input = screen.getByPlaceholderText(/buscar en los términos/i);
        fireEvent.change(input, { target: { value: 'XYZABCNOTFOUND12345' } });

        expect(screen.getByText(/ninguna sección coincide/i)).toBeInTheDocument();
    });

    it('muestra el mensaje de no resultados con el query en el texto de sugerencia', () => {
        renderTerminos();
        const input = screen.getByPlaceholderText(/buscar en los términos/i);
        fireEvent.change(input, { target: { value: 'noresults999' } });

        expect(screen.getByText(/noresults999/)).toBeInTheDocument();
    });

    it('muestra el botón Limpiar cuando hay texto en el buscador', () => {
        renderTerminos();
        const input = screen.getByPlaceholderText(/buscar en los términos/i);
        fireEvent.change(input, { target: { value: 'algo' } });

        expect(screen.getByText('Limpiar')).toBeInTheDocument();
    });

    it('el botón Limpiar (en el input) borra la búsqueda y muestra todas las secciones', () => {
        renderTerminos();
        const input = screen.getByPlaceholderText(/buscar en los términos/i);
        fireEvent.change(input, { target: { value: 'XYZABCNOTFOUND12345' } });
        expect(screen.getByText(/ninguna sección coincide/i)).toBeInTheDocument();

        // Click en el botón Limpiar dentro del input
        fireEvent.click(screen.getByText('Limpiar'));
        expect(input.value).toBe('');
        // Volvemos a ver el índice completo con todos los botones
        const buttons = screen.getAllByRole('button');
        expect(buttons.some(b => /introducción/i.test(b.textContent))).toBe(true);
    });

    it('el botón Mostrar Todo (en el estado vacío) restaura las secciones', () => {
        renderTerminos();
        const input = screen.getByPlaceholderText(/buscar en los términos/i);
        fireEvent.change(input, { target: { value: 'XYZABCNOTFOUND12345' } });

        const mostrarTodoBtn = screen.getByRole('button', { name: /mostrar todo/i });
        fireEvent.click(mostrarTodoBtn);
        expect(input.value).toBe('');
        const buttons = screen.getAllByRole('button');
        expect(buttons.some(b => /introducción/i.test(b.textContent))).toBe(true);
    });

    it('la búsqueda por "privacidad" muestra la sección de privacidad', () => {
        renderTerminos();
        const input = screen.getByPlaceholderText(/buscar en los términos/i);
        fireEvent.change(input, { target: { value: 'privacidad' } });
        expect(screen.getAllByText(/privacidad/i).length).toBeGreaterThan(0);
    });

    it('la búsqueda por "ESPE Coins" filtra correctamente', () => {
        renderTerminos();
        const input = screen.getByPlaceholderText(/buscar en los términos/i);
        fireEvent.change(input, { target: { value: 'ESPE Coins' } });
        // Debería mostrar la sección de gamificación que menciona ESPE Coins
        expect(screen.getAllByText(/espe coins/i).length).toBeGreaterThan(0);
    });
});

describe('Terminos - Navegación del índice', () => {
    it('los botones del índice son clicables', () => {
        renderTerminos();
        // Todos los botones en el aside son los del índice
        const indexButtons = screen.getAllByRole('button');
        // Primer botón del índice (introduce primer section title)
        expect(indexButtons.length).toBeGreaterThan(0);
        // No lanza error al hacer click
        expect(() => fireEvent.click(indexButtons[0])).not.toThrow();
    });
});
