import React from 'react';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Game from "./Game";
import axios from "axios";
import { AuthProvider } from "../context/AuthContext";

jest.mock("axios");

const mockQuestion = {
  imageUrl: "https://example.com/image.jpg",
  correctAnswer: "Paris",
  options: ["Paris", "London", "Rome", "Berlin"],
};

describe("Game Component", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockQuestion });
  });

  test("renders game and loads question", async () => {
    render(
      <AuthProvider>
        <Game />
      </AuthProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    expect(screen.getByRole("img")).toHaveAttribute("src", mockQuestion.imageUrl);
    mockQuestion.options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  test("selecting an answer", async () => {
    render(
      <AuthProvider>
        <Game />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("Paris")).toBeInTheDocument());
    const optionButton = screen.getByText("Paris");
    fireEvent.click(optionButton);
    expect(optionButton).toHaveClass("selected");
  });
});
