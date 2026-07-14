import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider, useNotification } from '../context/NotificationContext';

// Helper: renderiza children dentro del provider
const renderWithProvider = (ui) =>
    render(<NotificationProvider>{ui}</NotificationProvider>);

// ─────────────────────────────────────────────
// Tests del Provider y showNotification
// ─────────────────────────────────────────────
describe('NotificationContext', () => {

    it('renderiza los children sin errores', () => {
        renderWithProvider(<div>Hijo</div>);
        expect(screen.getByText('Hijo')).toBeInTheDocument();
    });

    it('useNotification lanza error fuera del provider', () => {
        const BadComponent = () => {
            useNotification();
            return null;
        };
        expect(() => render(<BadComponent />)).toThrow(
            'useNotification must be used within a NotificationProvider'
        );
    });

    it('showNotification muestra una notificación de tipo info', async () => {
        const Trigger = () => {
            const { showNotification } = useNotification();
            return (
                <button onClick={() => showNotification('Mensaje info', 'info')}>
                    Mostrar
                </button>
            );
        };
        renderWithProvider(<Trigger />);
        fireEvent.click(screen.getByText('Mostrar'));
        await waitFor(() =>
            expect(screen.getByText('Mensaje info')).toBeInTheDocument()
        );
    });

    it('showNotification muestra una notificación de tipo success', async () => {
        const Trigger = () => {
            const { showNotification } = useNotification();
            return (
                <button onClick={() => showNotification('Operación exitosa', 'success')}>
                    OK
                </button>
            );
        };
        renderWithProvider(<Trigger />);
        fireEvent.click(screen.getByText('OK'));
        await waitFor(() =>
            expect(screen.getByText('Operación exitosa')).toBeInTheDocument()
        );
    });

    it('showNotification muestra una notificación de tipo error', async () => {
        const Trigger = () => {
            const { showNotification } = useNotification();
            return (
                <button onClick={() => showNotification('Algo falló', 'error')}>
                    Error
                </button>
            );
        };
        renderWithProvider(<Trigger />);
        fireEvent.click(screen.getByText('Error'));
        await waitFor(() =>
            expect(screen.getByText('Algo falló')).toBeInTheDocument()
        );
    });

    it('showNotification muestra una notificación de tipo warning', async () => {
        const Trigger = () => {
            const { showNotification } = useNotification();
            return (
                <button onClick={() => showNotification('Advertencia!', 'warning')}>
                    Warn
                </button>
            );
        };
        renderWithProvider(<Trigger />);
        fireEvent.click(screen.getByText('Warn'));
        await waitFor(() =>
            expect(screen.getByText('Advertencia!')).toBeInTheDocument()
        );
    });

    it('showNotification muestra una notificación de tipo badge con badgeInfo (URL icon)', async () => {
        const Trigger = () => {
            const { showNotification } = useNotification();
            const badge = { name: 'Primeros Pasos', icon: 'https://cdn.example.com/badge.png' };
            return (
                <button onClick={() => showNotification('¡Insignia desbloqueada!', 'badge', badge)}>
                    Badge URL
                </button>
            );
        };
        renderWithProvider(<Trigger />);
        fireEvent.click(screen.getByText('Badge URL'));
        await waitFor(() =>
            expect(screen.getByText('¡Nueva Insignia Ganada!')).toBeInTheDocument()
        );
        expect(screen.getByAltText('Primeros Pasos')).toBeInTheDocument();
    });

    it('showNotification muestra badge con emoji cuando el icon NO es una URL', async () => {
        const Trigger = () => {
            const { showNotification } = useNotification();
            const badge = { name: 'Cerebro de Oro', icon: null };
            return (
                <button onClick={() => showNotification('Lograste el cerebro!', 'badge', badge)}>
                    Badge Emoji
                </button>
            );
        };
        renderWithProvider(<Trigger />);
        fireEvent.click(screen.getByText('Badge Emoji'));
        await waitFor(() =>
            expect(screen.getByText('Cerebro de Oro')).toBeInTheDocument()
        );
    });

    it('el click en una notificación la cierra (removeNotification)', async () => {
        const Trigger = () => {
            const { showNotification } = useNotification();
            return (
                <button onClick={() => showNotification('Click para cerrar', 'info')}>
                    Show
                </button>
            );
        };
        renderWithProvider(<Trigger />);
        fireEvent.click(screen.getByText('Show'));

        await waitFor(() =>
            expect(screen.getByText('Click para cerrar')).toBeInTheDocument()
        );
        // Click en el contenedor de la notificación para cerrarla
        fireEvent.click(screen.getByText('Click para cerrar'));
        await waitFor(() =>
            expect(screen.queryByText('Click para cerrar')).not.toBeInTheDocument()
        );
    });

    it('muestra múltiples notificaciones a la vez', async () => {
        const Trigger = () => {
            const { showNotification } = useNotification();
            return (
                <>
                    <button onClick={() => showNotification('Primera', 'info')}>N1</button>
                    <button onClick={() => showNotification('Segunda', 'success')}>N2</button>
                </>
            );
        };
        renderWithProvider(<Trigger />);
        fireEvent.click(screen.getByText('N1'));
        fireEvent.click(screen.getByText('N2'));
        await waitFor(() => {
            expect(screen.getByText('Primera')).toBeInTheDocument();
            expect(screen.getByText('Segunda')).toBeInTheDocument();
        });
    });

    it('getBadgeEmoji retorna emoji correcto para cada nombre de insignia conocido', async () => {
        const badges = [
            { name: 'Siempre Puntual', expected: '⚡' },
            { name: 'Mentor Estrella', expected: '⭐' },
            { name: 'Súper Aprendiz', expected: '🎓' },
            { name: 'Héroe de la ESPE', expected: '🏆' },
            { name: 'Maestro ESPE', expected: '🏆' },
            { name: 'Hola Mundo', expected: '🌍' },
            { name: 'Perfil Estelar', expected: '✨' },
            { name: 'Desconocida', expected: '🏅' },
        ];

        for (const badge of badges) {
            const Trigger = () => {
                const { showNotification } = useNotification();
                return (
                    <button onClick={() => showNotification('Test', 'badge', { name: badge.name, icon: null })}>
                        {badge.name}
                    </button>
                );
            };
            const { unmount } = renderWithProvider(<Trigger />);
            fireEvent.click(screen.getByText(badge.name));
            await waitFor(() =>
                expect(screen.getByText(badge.expected)).toBeInTheDocument()
            );
            unmount();
        }
    });
});
