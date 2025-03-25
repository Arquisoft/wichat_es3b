// src/components/__tests__/Welcome.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { MemoryRouter } from 'react-router';
import Welcome from './Welcome';

// Mock axios to prevent real API calls
jest.mock('axios');

describe('Welcome Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays the generated welcome message', async () => {
    // Mock API response with a generated welcome message
    axios.post.mockResolvedValue({ data: { answer: "Hey Guest! Get ready for some fun. Press start!" } });

    // Render the component inside a MemoryRouter to handle <NavLink>
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>
    );

    // Wait for the generated message to appear in the document
    await waitFor(() => {
      expect(screen.getByText(/Hey Guest! Get ready for some fun/i)).toBeInTheDocument();
    });

    // Verify that the "Start the fun" button is rendered
    const button = screen.getByRole('button', { name: /Start the fun/i });
    expect(button).toBeInTheDocument();

    // Check that the button contains the correct link to /gamemode
    expect(screen.getByRole('link')).toHaveAttribute('href', '/gamemode');
  });

  it('handles API call failure gracefully', async () => {
    // Mock API failure
    axios.post.mockRejectedValue(new Error('API Error'));

    // Render the component
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>
    );

    // Ensure that no welcome message is displayed if the API call fails
    await waitFor(() => {
      expect(screen.queryByText(/Get ready for some fun/i)).not.toBeInTheDocument();
    });
  });
});
