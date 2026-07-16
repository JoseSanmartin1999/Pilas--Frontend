import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RightSidebar from './RightSidebar';

const mockMentorship = {
    id: 1,
    mentor_id: 111,
    mentor_name: 'Mentor Juan',
    apprentice_name: 'Aprendiz Test',
    status: 'ACEPTADA'
};

const mockCurrentUser = {
    id: 111, // Current user is the mentor
    full_name: 'Mentor Juan'
};

describe('RightSidebar Component Tests', () => {
    it('se abre/cierra al hacer clic en el botón de alternancia', () => {
        const onToggleMock = vi.fn();
        render(
            <RightSidebar
                mentorship={mockMentorship}
                currentUser={mockCurrentUser}
                isOpen={true}
                onToggle={onToggleMock}
            />
        );

        expect(screen.getByText('Mentor Juan')).toBeInTheDocument();
        expect(screen.getByText('Aprendiz Test')).toBeInTheDocument();
        expect(screen.getByText('Tu aprendiz')).toBeInTheDocument();

        const toggleBtn = screen.getByRole('button', { name: '›' });
        fireEvent.click(toggleBtn);
        expect(onToggleMock).toHaveBeenCalled();
    });

    it('renderiza como aprendiz si el id del usuario actual difiere del mentor_id', () => {
        const apprenticeUser = { id: 222, full_name: 'Aprendiz Test' };
        render(
            <RightSidebar
                mentorship={mockMentorship}
                currentUser={apprenticeUser}
                isOpen={true}
                onToggle={vi.fn()}
            />
        );

        expect(screen.getByText('Tu mentor')).toBeInTheDocument();
    });
});
