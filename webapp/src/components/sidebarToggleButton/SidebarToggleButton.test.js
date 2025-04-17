import { render, screen, fireEvent } from "@testing-library/react";
import SidebarToggleButton from "../sidebarToggleButton/SidebarToggleButton";

describe("SidebarToggleButton component", () => {
    test("Renderiza el botón correctamente", () => {
        render(<SidebarToggleButton onClick={() => {}} />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    test("Llama a onClick al hacer clic", () => {
        const mockClick = jest.fn();
        render(<SidebarToggleButton onClick={mockClick} />);
        fireEvent.click(screen.getByRole("button"));
        expect(mockClick).toHaveBeenCalled();
    });

    test("Tiene el aria-label adecuado", () => {
        render(<SidebarToggleButton onClick={() => {}} />);
        expect(screen.getByLabelText("Abrir/cerrar menú")).toBeInTheDocument();
    });
});
