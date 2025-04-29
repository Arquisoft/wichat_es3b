import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import RankingWidget from "./RankingWidget";

// Mock the dependencies
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

  // Sample test data
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
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock window.scrollTo
    global.scrollTo = scrollToMock;
    
    // Setup mocks
    useNavigate.mockReturnValue(mockNavigate);
    useTranslation.mockReturnValue({
      t: mockT,
      ready: true,
    });
    
    // Mock successful axios response
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

    // Check that axios was called with the correct URL
    expect(axios.get).toHaveBeenCalled();
    
    // Wait for the ranking items to be displayed
    await waitFor(() => {
      expect(screen.getByText("user1")).toBeInTheDocument();
      expect(screen.getByText("user2")).toBeInTheDocument();
      expect(screen.getByText("user3")).toBeInTheDocument();
      expect(screen.getByText("user4")).toBeInTheDocument();
    });

    // Get the first user's container to scope our queries
    const user1Container = screen.getByText("user1").closest(".ranking-item");
    
    // Use within to scope our queries to just the first user's container
    const { getByText } = within(user1Container);
    
    // Verify stats are displayed correctly for user1
    expect(getByText("10")).toBeInTheDocument(); // gamesPlayed
    expect(getByText("80")).toBeInTheDocument(); // correctAnswers
    expect(getByText("20")).toBeInTheDocument(); // wrongAnswers
    expect(getByText("0.80")).toBeInTheDocument(); // ratio
    expect(getByText("5.50 s")).toBeInTheDocument(); // averageTime
    expect(getByText("1000")).toBeInTheDocument(); // bestScore
  });

  test("handles click on ranking item to navigate to user stats", async () => {
    render(<RankingWidget />);

    // Wait for the ranking items to be rendered
    await waitFor(() => {
      expect(screen.getByText("user1")).toBeInTheDocument();
    });

    // Find and click on the first ranking item
    const firstRankingItem = screen.getAllByText("user1")[0].closest(".ranking-item");
    fireEvent.click(firstRankingItem);

    // Check if scrollTo and navigate were called with the correct arguments
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(mockNavigate).toHaveBeenCalledWith("/stats/user1");
  });

  test("displays medal icons for top 3 users", async () => {
    render(<RankingWidget />);

    // Wait for the ranking items to be rendered
    await waitFor(() => {
      expect(screen.getByText("user1")).toBeInTheDocument();
    });

    // Check for medal icons (via their parent divs with specific colors)
    const rankingPositions = screen.getAllByText(/^[1-3]$/);
    
    expect(rankingPositions[0]).toHaveStyle("background-color: #FFD700"); // Gold
    expect(rankingPositions[1]).toHaveStyle("background-color: #C0C0C0"); // Silver
    expect(rankingPositions[2]).toHaveStyle("background-color: #CD7F32"); // Bronze
    
    // Check that 4th position has default color
    const fourthPosition = screen.getByText("4");
    expect(fourthPosition).toHaveStyle("background-color: var(--color-primario)");
  });

  test("handles API error when fetching ranking data", async () => {
    // Mock console.error to test error handling
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Mock axios to reject with an error
    axios.get.mockRejectedValueOnce(new Error("API error"));

    render(<RankingWidget />);

    // Wait for the error to be logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error al obtener el ranking", 
        expect.any(Error)
      );
    });

    // Restore console.error
    console.error = originalConsoleError;
  });

  test("uses default gateway URL when environment variable is not set", async () => {
    // Save original environment variable
    const originalEnv = process.env.REACT_APP_GATEWAY_SERVICE_URL;
    delete process.env.REACT_APP_GATEWAY_SERVICE_URL;

    render(<RankingWidget />);

    // Check if axios was called with the default URL
    expect(axios.get).toHaveBeenCalledWith("http://localhost:8000/getranking");

    // Restore environment variable
    process.env.REACT_APP_GATEWAY_SERVICE_URL = originalEnv;
  });

  test("uses environment variable for gateway URL when set", async () => {
    // Save original environment variable and set a test value
    const originalEnv = process.env.REACT_APP_GATEWAY_SERVICE_URL;
    process.env.REACT_APP_GATEWAY_SERVICE_URL = "https://api.example.com";

    render(<RankingWidget />);

    // Check if axios was called with the URL from environment variable
    expect(axios.get).toHaveBeenCalledWith("https://api.example.com/getranking");

    // Restore environment variable
    process.env.REACT_APP_GATEWAY_SERVICE_URL = originalEnv;
  });
});