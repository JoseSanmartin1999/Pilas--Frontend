import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatView from './ChatView';
import axios from 'axios';
import { io } from 'socket.io-client';

vi.mock('axios');

const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true
};

vi.mock('socket.io-client', () => {
    return {
        io: vi.fn(() => mockSocket)
    };
});

const mockCurrentUser = {
    id: 111,
    full_name: 'Aprendiz Test'
};

const mockMentorship = {
    id: 12,
    mentor_id: 222,
    mentor_name: 'Mentor Juan',
    apprentice_id: 111,
    apprentice_name: 'Aprendiz Test',
    subject_name: 'Cálculo Vectorial',
    status: 'ACEPTADA'
};

const mockChatHistory = [
    {
        _id: 'msg-1',
        mentorshipId: 12,
        sender_id: 222,
        message: 'Hola, ¿cómo estás?',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString() // 2 days ago
    },
    {
        _id: 'msg-2',
        mentorshipId: 12,
        sender_id: 111,
        message: 'Hola! Todo bien, listo para la tutoría.',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() // Yesterday
    },
    {
        _id: 'msg-3',
        mentorshipId: 12,
        sender_id: 222,
        message: 'Excelente. Recuerda traer el cuaderno.',
        createdAt: new Date().toISOString() // Today
    },
    {
        _id: 'msg-4',
        mentorshipId: 12,
        sender_id: 222,
        message: 'Y las hojas para los ejercicios.', // Same sender, <5 min gap (grouped)
        createdAt: new Date(new Date().getTime() + 1000).toISOString()
    }
];

describe('ChatView Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        axios.get.mockResolvedValue({ data: mockChatHistory });
        
        // Mock scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    const renderChat = (mentorship = mockMentorship) => {
        return render(<ChatView mentorship={mentorship} currentUser={mockCurrentUser} />);
    };

    it('se conecta a socket.io y carga el historial del chat', async () => {
        // Interceptar eventos de conexión del socket
        let connectCallback;
        mockSocket.on.mockImplementation((event, callback) => {
            if (event === 'connect') connectCallback = callback;
        });

        renderChat();

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/chat/12'));
        expect(io).toHaveBeenCalled();

        // Simular conexión establecida
        await act(async () => {
            if (connectCallback) connectCallback();
        });

        await waitFor(() => {
            expect(screen.getByText('Canal Directo')).toBeInTheDocument();
            expect(screen.getByText(/Chat en Tiempo Real · Cálculo Vectorial/i)).toBeInTheDocument();
        });

        // Verificar que el indicador de conexión cambie a "En Línea"
        expect(screen.getByText('En Línea')).toBeInTheDocument();

        // Verificar que los mensajes del historial se rendericen
        expect(screen.getByText('Hola, ¿cómo estás?')).toBeInTheDocument();
        expect(screen.getByText('Hola! Todo bien, listo para la tutoría.')).toBeInTheDocument();
        expect(screen.getByText('Excelente. Recuerda traer el cuaderno.')).toBeInTheDocument();
        expect(screen.getByText('Y las hojas para los ejercicios.')).toBeInTheDocument();

        // Verificar nombres de remitentes
        expect(screen.getAllByText('Mentor Juan').length).toBeGreaterThan(0);
    });

    it('permite enviar un mensaje mediante click o Enter', async () => {
        // Simular socket conectado por defecto
        mockSocket.connected = true;
        let connectCallback;
        mockSocket.on.mockImplementation((event, callback) => {
            if (event === 'connect') connectCallback = callback;
        });

        renderChat();

        await act(async () => {
            if (connectCallback) connectCallback();
        });

        await waitFor(() => {
            expect(screen.getByText('En Línea')).toBeInTheDocument();
        });

        const textarea = screen.getByPlaceholderText('Escribe un mensaje...');
        
        // Escribir mensaje
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Mensaje de prueba' } });
        });

        // Enviar con botón
        const sendBtn = screen.getByTitle('Enviar (Enter)');
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('send_message', {
            mentorshipId: 12,
            senderId: 111,
            message: 'Mensaje de prueba'
        });

        // Escribir mensaje y enviar con Enter
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Mensaje con Enter' } });
        });

        await act(async () => {
            fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('send_message', {
            mentorshipId: 12,
            senderId: 111,
            message: 'Mensaje con Enter'
        });

        // Shift+Enter no debe enviar el mensaje
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Mensaje multilínea' } });
        });

        await act(async () => {
            fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
        });

        // No se debe haber emitido "Mensaje multilínea"
        expect(mockSocket.emit).not.toHaveBeenCalledWith('send_message', {
            mentorshipId: 12,
            senderId: 111,
            message: 'Mensaje multilínea'
        });
    });

    it('recibe nuevos mensajes del socket y actualiza el chat', async () => {
        let receiveMessageCallback;
        mockSocket.on.mockImplementation((event, callback) => {
            if (event === 'receive_message') receiveMessageCallback = callback;
        });

        renderChat();

        await waitFor(() => {
            expect(screen.getByText('Hola, ¿cómo estás?')).toBeInTheDocument();
        });

        // Simular recibir un nuevo mensaje del socket
        const incomingMsg = {
            _id: 'msg-incoming-1',
            mentorshipId: 12,
            sender_id: 222,
            message: 'Mensaje recibido en vivo',
            createdAt: new Date().toISOString()
        };

        await act(async () => {
            if (receiveMessageCallback) receiveMessageCallback(incomingMsg);
        });

        expect(screen.getByText('Mensaje recibido en vivo')).toBeInTheDocument();
    });

    it('renderiza en modo de solo lectura si la tutoría está COMPLETADA', async () => {
        const completedMentorship = {
            ...mockMentorship,
            status: 'COMPLETADA'
        };

        renderChat(completedMentorship);

        await waitFor(() => {
            expect(screen.getByText(/El chat se encuentra en modo de solo lectura/i)).toBeInTheDocument();
        });

        // El textarea debe estar deshabilitado
        const textarea = screen.getByPlaceholderText(/La tutoría está cerrada/i);
        expect(textarea).toBeDisabled();
    });
});
