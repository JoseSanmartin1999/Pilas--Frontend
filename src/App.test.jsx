import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import App from "./App";

describe("Aplicación Pilas", () => {

    it("renderiza correctamente la página principal", () => {

        render(<App />);

        expect(
            screen.getByText(/Ponte las Pilas!/i)
        ).toBeInTheDocument();

    });

    it("muestra la sección Buscar tu Tutor", () => {

        render(<App />);

        expect(
            screen.getByText(/Buscar un Tutor/i)
        ).toBeInTheDocument();

    });

    it("muestra la opción de Ser Mentor", () => {

        render(<App />);

        expect(
            screen.getByText(/Ser Mentor \/ Tutor/i)
        ).toBeInTheDocument();

    });

});