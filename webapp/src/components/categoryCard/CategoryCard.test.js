import { render, screen, fireEvent } from "@testing-library/react";
import CategoryCard from "../categoryCard/CategoryCard";

describe("CategoryCard component", () => {
    const mockClick = jest.fn();

    test("Muestra el nombre y la imagen correctamente", () => {
        render(
            <CategoryCard
                name="Cine"
                imageSrc="/cine.jpg"
                isSelected={false}
                onClick={mockClick}
            />
        );

        expect(screen.getByAltText("Cine")).toBeInTheDocument();
        expect(screen.getByText("Cine")).toBeInTheDocument();
    });

    test("Llama a onClick cuando se hace clic", () => {
        render(
            <CategoryCard
                name="Literatura"
                imageSrc="/literatura.jpg"
                isSelected={false}
                onClick={mockClick}
            />
        );

        fireEvent.click(screen.getByText("Literatura"));
        expect(mockClick).toHaveBeenCalled();
    });

    test("Aplica la clase selected si está seleccionada", () => {
        const { container } = render(
            <CategoryCard
                name="Arte"
                imageSrc="/arte.jpg"
                isSelected={true}
                onClick={mockClick}
            />
        );

        expect(container.firstChild).toHaveClass("selected");
    });
});
