import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './Home';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('../../components/nav/Nav.js', () => () => <div>Nav</div>);
jest.mock('../../components/Footer.js', () => () => <div>Footer</div>);
jest.mock('../../components/button/BaseButton.js', () => ({ text, onClick }) => (
  <button onClick={onClick}>{text}</button>
));

describe('Home Component', () => {
  const mockNavigate = jest.fn();
  const mockT = jest.fn((key) => key);

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useTranslation.mockReturnValue({ t: mockT });
    mockT.mockImplementation((key) => {
      const translations = {
        'subtitle': 'Test Subtitle',
        'play': 'Play',
        'user-ranking': 'User Ranking',
        'rankingFeature': 'See user rankings',
        'seeRanking': 'See Ranking',
        'personalStats': 'Personal Stats',
        'profileFeature': 'View your profile',
        'seeProfile': 'See Profile',
        'apiForDevelopers': 'API for Developers',
        'apiKeyFeature': 'Get your API key',
        'askForAPIKey': 'Request API Key',
      };
      return translations[key] || key;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByText('WIChat')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('displays all feature sections', () => {
    render(<Home />);
    expect(screen.getByText('User Ranking')).toBeInTheDocument();
    expect(screen.getByText('Personal Stats')).toBeInTheDocument();
    expect(screen.getByText('API for Developers')).toBeInTheDocument();
  });

  it('navigates to ranking page when ranking button is clicked', () => {
    render(<Home />);
    fireEvent.click(screen.getByText('See Ranking'));
    expect(mockNavigate).toHaveBeenCalledWith('/ranking');
  });

  it('navigates to auth page when profile button is clicked and not authenticated', () => {
    render(<Home />);
    fireEvent.click(screen.getByText('See Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('navigates to profile page when profile button is clicked and authenticated', () => {
    localStorage.setItem('username', 'testuser');
    render(<Home />);
    fireEvent.click(screen.getByText('See Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('navigates to apiKeyGenerator page when API button is clicked', () => {
    render(<Home />);
    fireEvent.click(screen.getByText('Request API Key'));
    expect(mockNavigate).toHaveBeenCalledWith('/apiKeyGenerator');
  });

  it('navigates to auth page when play button is clicked and not authenticated', () => {
    render(<Home />);
    fireEvent.click(screen.getByText('Play'));
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('renders all feature icons', () => {
    render(<Home />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('💻')).toBeInTheDocument();
  });

  it('renders Nav and Footer components', () => {
    render(<Home />);
    expect(screen.getByText('Nav')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});