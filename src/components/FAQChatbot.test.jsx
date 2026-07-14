import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FAQChatbot from './FAQChatbot';

// Mock scrollTo
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('FAQChatbot Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    const renderChatbot = () => {
        return render(<FAQChatbot />);
    };

    it('se abre al hacer clic en el botón flotante y se cierra al hacer clic en ✕', () => {
        renderChatbot();

        // 1. Debe estar cerrado por defecto y mostrar el botón de la imagen de Pili
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        expect(floatingBtn).toBeInTheDocument();
        expect(screen.queryByText('Pili - Asistente Virtual')).not.toBeInTheDocument();

        // 2. Hacer clic en el botón flotante
        fireEvent.click(floatingBtn);
        expect(screen.getByText('Pili - Asistente Virtual')).toBeInTheDocument();
        expect(screen.getByText(/¡Hola! Soy Pili/i)).toBeInTheDocument();

        // 3. Hacer clic en ✕
        const closeBtn = screen.getByRole('button', { name: '✕' });
        fireEvent.click(closeBtn);
        expect(screen.queryByText('Pili - Asistente Virtual')).not.toBeInTheDocument();
    });

    it('permite reiniciar la conversación al hacer clic en 🔄', () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        // Enviar un mensaje de prueba para llenar el chat
        const input = screen.getByPlaceholderText('Hazme una pregunta sobre Pilas!...');
        const submitBtn = screen.getByRole('button', { name: '' }); // submit button

        fireEvent.change(input, { target: { value: 'registro' } });
        fireEvent.click(submitBtn);

        // Hacer clic en reiniciar
        const resetBtn = screen.getByTitle('Reiniciar chat');
        fireEvent.click(resetBtn);

        expect(screen.getByText('¡Conversación reiniciada! ¿En qué otra cosa te puedo ayudar hoy? 🤖')).toBeInTheDocument();
    });

    it('responde a consultas del usuario que coinciden exactamente con una palabra clave', async () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        const input = screen.getByPlaceholderText('Hazme una pregunta sobre Pilas!...');
        const submitBtn = screen.getByRole('button', { name: '' });

        // Enviar consulta 'zoom'
        fireEvent.change(input, { target: { value: 'zoom' } });
        fireEvent.click(submitBtn);

        expect(screen.getByText('zoom')).toBeInTheDocument();

        // Esperar el timeout del bot
        act(() => {
            vi.runAllTimers();
        });

        // Debe responder con la pregunta de modalidad online / presencial
        expect(screen.getByText(/¿Qué modalidades de tutorías existen y cómo funcionan\?/i)).toBeInTheDocument();
    });

    it('responde con múltiples sugerencias si hay varias coincidencias', () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        const input = screen.getByPlaceholderText('Hazme una pregunta sobre Pilas!...');
        const submitBtn = screen.getByRole('button', { name: '' });

        // Enviar consulta 'tutoria' (debería coincidir con múltiples faqs)
        fireEvent.change(input, { target: { value: 'tutoria' } });
        fireEvent.click(submitBtn);

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText(/Encontré las siguientes preguntas relacionadas con tu búsqueda:/i)).toBeInTheDocument();
    });

    it('responde con mensaje de disculpas cuando no encuentra coincidencias', () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        const input = screen.getByPlaceholderText('Hazme una pregunta sobre Pilas!...');
        const submitBtn = screen.getByRole('button', { name: '' });

        // Enviar consulta que no existe
        fireEvent.change(input, { target: { value: 'palabranoregistradaenlabasededatos' } });
        fireEvent.click(submitBtn);

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText(/Lo siento, no encontré una respuesta exacta a tu pregunta/i)).toBeInTheDocument();
    });

    it('filtra preguntas por categoría al hacer clic en los botones de categorías rápidas', () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        // Clic en la categoría rápida "🔑 Registro y Cuenta"
        const categoryBtn = screen.getByRole('button', { name: /🔑 Registro y Cuenta/i });
        fireEvent.click(categoryBtn);

        expect(screen.getByText(/Quiero saber sobre: 🔑 Registro y Cuenta/i)).toBeInTheDocument();

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText(/Aquí tienes las preguntas frecuentes sobre/i)).toBeInTheDocument();
    });
});
