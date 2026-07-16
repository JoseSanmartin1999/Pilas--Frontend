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
        const submitBtn = screen.getByRole('button', { name: /Enviar/i }); // submit button

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
        const submitBtn = screen.getByRole('button', { name: /Enviar/i });

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
        const submitBtn = screen.getByRole('button', { name: /Enviar/i });

        // Enviar consulta 'tutoria' (debería coincidir con múltiples faqs)
        fireEvent.change(input, { target: { value: 'tutoria' } });
        fireEvent.click(submitBtn);

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText(/Encontré las siguientes preguntas relacionadas con tu búsqueda/i)).toBeInTheDocument();
    });

    it('responde con mensaje de disculpas cuando no encuentra coincidencias', () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        const input = screen.getByPlaceholderText('Hazme una pregunta sobre Pilas!...');
        const submitBtn = screen.getByRole('button', { name: /Enviar/i });

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
        const categoryBtn = screen.getAllByRole('button', { name: /🔑 Registro y Cuenta/i })[0];
        fireEvent.click(categoryBtn);

        expect(screen.getByText(/Quiero saber sobre: 🔑 Registro y Cuenta/i)).toBeInTheDocument();

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText(/Aquí tienes las preguntas frecuentes sobre/i)).toBeInTheDocument();
    });

    it('responde amigablemente ante saludos', () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        const input = screen.getByPlaceholderText('Hazme una pregunta sobre Pilas!...');
        const submitBtn = screen.getByRole('button', { name: /Enviar/i });

        fireEvent.change(input, { target: { value: 'Hola bot' } });
        fireEvent.click(submitBtn);

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText(/¡Hola! 😊 ¿Cómo estás\? Soy Pili 🤖/i)).toBeInTheDocument();
    });

    it('responde sobre agendar mentorias', () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        const input = screen.getByPlaceholderText('Hazme una pregunta sobre Pilas!...');
        const submitBtn = screen.getByRole('button', { name: /Enviar/i });

        fireEvent.change(input, { target: { value: 'como agendo una mentoria' } });
        fireEvent.click(submitBtn);

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText(/¿Cómo agendo o pacto una tutoría\/mentoría\?/i)).toBeInTheDocument();
        expect(screen.getByText(/Ve a la sección "Buscar Tutor"/i)).toBeInTheDocument();
    });

    it('responde sobre ganancias de ESPE-Coins y XP por tutoria', () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        const input = screen.getByPlaceholderText('Hazme una pregunta sobre Pilas!...');
        const submitBtn = screen.getByRole('button', { name: /Enviar/i });

        fireEvent.change(input, { target: { value: 'cuantos espe coins y exp gano por completar una tutoria' } });
        fireEvent.click(submitBtn);

        act(() => {
            vi.runAllTimers();
        });

        // Debe encontrar múltiples sugerencias porque coincide con "espe-coins" general y con el específico
        expect(screen.getByText(/Encontré las siguientes preguntas relacionadas con tu búsqueda/i)).toBeInTheDocument();

        // Clic en la opción específica
        const optionBtn = screen.getByRole('button', { name: /¿Cuántos ESPE-Coins y puntos de experiencia \(XP\) gano por completar una tutoría\?/i });
        fireEvent.click(optionBtn);

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText(/Aprendiz \(Estudiante\)/i)).toBeInTheDocument();
        expect(screen.getByText(/15 ESPE-Coins/i)).toBeInTheDocument();
        expect(screen.getByText(/Tutor \(Mentor\)/i)).toBeInTheDocument();
        expect(screen.getByText(/35 ESPE-Coins/i)).toBeInTheDocument();
    });

    it('responde sobre actualizacion de Leaderboards', () => {
        renderChatbot();
        const floatingBtn = screen.getByRole('button', { name: /Pili Chatbot/i });
        fireEvent.click(floatingBtn);

        const input = screen.getByPlaceholderText('Hazme una pregunta sobre Pilas!...');
        const submitBtn = screen.getByRole('button', { name: /Enviar/i });

        fireEvent.change(input, { target: { value: 'cada cuanto se actualizan lo leaderboars' } });
        fireEvent.click(submitBtn);

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText(/¿Cada cuánto se actualiza la tabla de posiciones o Leaderboard\?/i)).toBeInTheDocument();
        expect(screen.getByText(/se calcula y actualiza/i)).toBeInTheDocument();
        expect(screen.getByText(/en tiempo real/i)).toBeInTheDocument();
    });
});
