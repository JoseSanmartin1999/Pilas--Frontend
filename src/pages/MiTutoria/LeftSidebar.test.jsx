import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeftSidebar from './LeftSidebar';

const mockMentorship = {
    id: 1,
    subject_name: 'Cálculo Vectorial',
    mentor_name: 'Mentor Juan',
    status: 'ACEPTADA'
};

const mockCompletedMentorship = {
    ...mockMentorship,
    status: 'COMPLETADA'
};

describe('LeftSidebar Component Tests', () => {
    it('se renderiza correctamente y responde a cambios de módulo al hacer clic', () => {
        const onModuleChangeMock = vi.fn();
        const onCloseMock = vi.fn();

        render(
            <LeftSidebar
                activeModule="chat"
                onModuleChange={onModuleChangeMock}
                mentorship={mockMentorship}
                isOpen={true}
                onClose={onCloseMock}
            />
        );

        expect(screen.getByText('Cálculo Vectorial')).toBeInTheDocument();
        expect(screen.getByText('Mentor Juan')).toBeInTheDocument();
        expect(screen.getByText('Tutor Activo')).toBeInTheDocument();

        // Módulo de repositorio
        const repoBtn = screen.getByText('Repositorio');
        fireEvent.click(repoBtn);
        expect(onModuleChangeMock).toHaveBeenCalledWith('repositorio');
    });

    it('se renderiza con tutoría COMPLETADA en modo archivado', () => {
        render(
            <LeftSidebar
                activeModule="chat"
                onModuleChange={vi.fn()}
                mentorship={mockCompletedMentorship}
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('Tutor (Archivado)')).toBeInTheDocument();
    });
});
