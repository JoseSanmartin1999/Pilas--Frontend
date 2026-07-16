import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer Component Tests', () => {
    it('se renderiza correctamente con enlaces y detalles de contacto', () => {
        render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        expect(screen.getByAltText('Pilas! Logo')).toBeInTheDocument();
        expect(screen.getByAltText('ESPE Pilas! Logo')).toBeInTheDocument();
        
        // Enlaces
        const aboutLink = screen.getByRole('link', { name: /Sobre Nosotros \/ Beneficios/i });
        expect(aboutLink).toHaveAttribute('href', '/beneficios');

        const termsLink = screen.getByRole('link', { name: /Términos y Condiciones/i });
        expect(termsLink).toHaveAttribute('href', '/terminos');

        const supportLink = screen.getByRole('link', { name: /Soporte/i });
        expect(supportLink).toHaveAttribute('href', '/tickets');

        // Contacto
        expect(screen.getByText('Email: soporte@pilas.edu')).toBeInTheDocument();
        expect(screen.getByText(/2026 © MIC/i)).toBeInTheDocument();
    });
});
