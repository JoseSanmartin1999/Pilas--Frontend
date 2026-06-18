import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import App from "./App";

describe("Aplicación Pilas", () => {

    it("renderiza correctamente la página principal", () => {

        render(<App />);

        expect(
            screen.getByText(/¡Ponte las Pilas!/i)
        ).toBeInTheDocument();

    });

    it("muestra la sección Buscar tu Tutor", () => {

        render(<App />);

        expect(
            screen.getByText(/Busca tu Tutor/i)
        ).toBeInTheDocument();

    });

    it("muestra la sección Gana Insignias", () => {

        render(<App />);

        expect(
            screen.getByText(/Gana Insignias/i)
        ).toBeInTheDocument();

    });

});