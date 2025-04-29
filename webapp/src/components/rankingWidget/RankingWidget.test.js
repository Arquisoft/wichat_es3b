import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import RankingWidget from "./RankingWidget";

jest.mock("axios");
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

describe("RankingWidget Component", () => {
  const mockNavigate = jest.fn();
  const mockT = jest.fn((key) => key);
  const scrollToMock = jest.fn();

  const mockUsers = [
    {
      _id: "1",
      username: "user1",
      games: 10,
      rightAnswers: 80,
      wrongAnswers: 20,
      ratio: 0.8,
      averageTime: 5.5,
      maxScore: 1000,
    },
    {
      _id: "2",
      username: "user2",
      games: 15,
      rightAnswers: 90,
      wrongAnswers: 30,
      ratio: 0.75,
      averageTime: 4.8,
      maxScore: 950,
    },
    {
      _id: "3",
      username: "user3",
      games: 8,
      rightAnswers: 50,
      wrongAnswers: 10,
      ratio: 0.83,
      averageTime: 6.2,
      maxScore: 850,
    },
    {
      _id: "4",
      username: "user4",
      games: 5,
      rightAnswers: 25,
      wrongAnswers: 5,
      ratio: 0.83,
      averageTime: 7.0,
      maxScore: 500,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.scrollTo = scrollToMock;
    useNavigate.mockReturnValue(mockNavigate);
    useTranslation.mockReturnValue({
      t: mockT,
      ready: true,
    });
    axios.get.mockResolvedValue({ data: mockUsers });
  });

  test("renders loading state when translation is not ready", () => {
    useTranslation.mockReturnValue({
      t: mockT,
      ready: false,
    });

    render(<RankingWidget />);
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  test("fetches and displays ranking data correctly", async () => {
    render(<RankingWidget />);
    expect(axios.get).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText("user1")).toBeInTheDocument();
      expect(screen.getByText("user2")).toBeInTheDocument();
      expect(screen.getByText("user3")).toBeInTheDocument();
      expect(screen.getByText("user4")).toBeInTheDocument();
    });

    const user1Container = screen.getByText("user1").closest(".ranking-item");
    const { getByText } = within(user1Container);

    expect(getByText("10")).toBeInTheDocument();
    expect(getByText("80")).toBeInTheDocument();
    expect(getByText("20")).toBeInTheDocument();
    expect(getByText("0.80")).toBeInTheDocument();
    expect(getByText("5.50 s")).toBeInTheDocument();
    expect(getByText("1000")).toBeInTheDocument();
  });

  test("handles click on ranking item to navigate to user stats", async () => {
    render(<RankingWidget />);

    await waitFor(() => {
      expect(screen.getByText("user1")).toBeInTheDocument();
    });

    const firstRankingItem = screen
      .getAllByText("user1")[0]
      .closest(".ranking-item");
    fireEvent.click(firstRankingItem);

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(mockNavigate).toHaveBeenCalledWith("/stats/user1");
  });

  test("displays medal icons for top 3 users", async () => {
    render(<RankingWidget />);

    await waitFor(() => {
      expect(screen.getByText("user1")).toBeInTheDocument();
    });

    const rankingPositions = screen.getAllByText(/^[1-3]$/);

    expect(rankingPositions[0]).toHaveStyle("background-color: #FFD700");
    expect(rankingPositions[1]).toHaveStyle("background-color: #C0C0C0");
    expect(rankingPositions[2]).toHaveStyle("background-color: #CD7F32");

    const fourthPosition = screen.getByText("4");
    expect(fourthPosition).toHaveStyle(
      "background-color: var(--color-primario)"
    );
  });

  test("handles API error when fetching ranking data", async () => {
    const originalConsoleError = console.error;
    console.error = jest.fn();

    axios.get.mockRejectedValueOnce(new Error("API error"));

    render(<RankingWidget />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error al obtener el ranking",
        expect.any(Error)
      );
    });

    console.error = originalConsoleError;
  });

  test("uses default gateway URL when environment variable is not set", async () => {
    const originalEnv = process.env.REACT_APP_GATEWAY_SERVICE_URL;
    delete process.env.REACT_APP_GATEWAY_SERVICE_URL;

    render(<RankingWidget />);

    expect(axios.get).toHaveBeenCalledWith("http://localhost:8000/getranking");

    process.env.REACT_APP_GATEWAY_SERVICE_URL = originalEnv;
  });

  test("uses environment variable for gateway URL when set", async () => {
    const originalEnv = process.env.REACT_APP_GATEWAY_SERVICE_URL;
    process.env.REACT_APP_GATEWAY_SERVICE_URL = "https://api.example.com";

    render(<RankingWidget />);

    expect(axios.get).toHaveBeenCalledWith(
      "https://api.example.com/getranking"
    );

    process.env.REACT_APP_GATEWAY_SERVICE_URL = originalEnv;
  });
});
