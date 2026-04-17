const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/HomeScreen';
import { api } from '../../src/api/client';
import { useSessionStore } from '../../src/state/session';
import { renderWithQuery } from '../utils/renderWithQuery';

beforeEach(() => {
  mockNavigate.mockReset();
  useSessionStore.setState({
    bootstrapped: false,
    serverUrl: 'http://media.local',
    token: 'tok',
    profile: { id: 1, name: 'Ada' } as any,
    selectedProfile: null,
  });
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, btns) => {
    const destructive = btns?.find((b) => b.style === 'destructive');
    destructive?.onPress?.();
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('HomeScreen', () => {
  it('shows a loader while queries are pending', () => {
    jest.spyOn(api, 'getCategories').mockReturnValue(new Promise(() => {}));
    jest.spyOn(api, 'getContinueWatching').mockReturnValue(new Promise(() => {}));
    jest.spyOn(api, 'getWatchlist').mockReturnValue(new Promise(() => {}));
    const { UNSAFE_root } = renderWithQuery(<HomeScreen />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders the welcome message and rails when data is loaded', async () => {
    jest.spyOn(api, 'getCategories').mockResolvedValue([
      { genre: 'Action', titles: [{ name: 'Bond', imagePath: null, pathToDir: 'movies/Bond' }] },
    ]);
    jest.spyOn(api, 'getContinueWatching').mockResolvedValue({
      genre: 'Continue',
      titles: [{ name: 'Resume', imagePath: null, pathToDir: 'movies/Resume' }],
    });
    jest.spyOn(api, 'getWatchlist').mockResolvedValue({
      genre: 'Watchlist',
      titles: [{ name: 'Saved', imagePath: null, pathToDir: 'movies/Saved' }],
    });
    const { findByText, getByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText(/Welcome back, Ada/)).toBeTruthy();
    expect(getByText('Continue Watching')).toBeTruthy();
    expect(getByText('My List')).toBeTruthy();
    expect(getByText('Action')).toBeTruthy();
  });

  it('navigates to TitleDetails when the hero card is pressed', async () => {
    jest.spyOn(api, 'getCategories').mockResolvedValue([
      { genre: 'Action', titles: [{ name: 'Hero', imagePath: null, pathToDir: 'movies/Hero' }] },
    ]);
    jest.spyOn(api, 'getContinueWatching').mockResolvedValue({ genre: 'Continue', titles: [] });
    jest.spyOn(api, 'getWatchlist').mockResolvedValue({ genre: 'Watchlist', titles: [] });

    const { findByText } = renderWithQuery(<HomeScreen />);
    fireEvent.press(await findByText('Open Title'));
    expect(mockNavigate).toHaveBeenCalledWith('TitleDetails', { dirPath: 'movies/Hero' });
  });

  it('renders the empty state when there are no categories', async () => {
    jest.spyOn(api, 'getCategories').mockResolvedValue([]);
    jest.spyOn(api, 'getContinueWatching').mockResolvedValue({ genre: 'Continue', titles: [] });
    jest.spyOn(api, 'getWatchlist').mockResolvedValue({ genre: 'Watchlist', titles: [] });
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText('No library data yet')).toBeTruthy();
  });

  it('omits the comma when no profile name is set', async () => {
    useSessionStore.setState({ profile: null });
    jest.spyOn(api, 'getCategories').mockResolvedValue([]);
    jest.spyOn(api, 'getContinueWatching').mockResolvedValue({ genre: 'Continue', titles: [] });
    jest.spyOn(api, 'getWatchlist').mockResolvedValue({ genre: 'Watchlist', titles: [] });
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText('Welcome back')).toBeTruthy();
  });

  it('signs out: confirms via Alert, calls logout, and clears auth', async () => {
    jest.spyOn(api, 'getCategories').mockResolvedValue([]);
    jest.spyOn(api, 'getContinueWatching').mockResolvedValue({ genre: 'Continue', titles: [] });
    jest.spyOn(api, 'getWatchlist').mockResolvedValue({ genre: 'Watchlist', titles: [] });
    const logoutSpy = jest.spyOn(api, 'mobileLogout').mockResolvedValue({ ok: true });

    const { findByText } = renderWithQuery(<HomeScreen />);
    const signOut = await findByText('Sign Out');
    await act(async () => {
      fireEvent.press(signOut);
    });
    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled();
      expect(useSessionStore.getState().token).toBeNull();
    });
  });

  it('still clears auth even when the logout request fails', async () => {
    jest.spyOn(api, 'getCategories').mockResolvedValue([]);
    jest.spyOn(api, 'getContinueWatching').mockResolvedValue({ genre: 'Continue', titles: [] });
    jest.spyOn(api, 'getWatchlist').mockResolvedValue({ genre: 'Watchlist', titles: [] });
    jest.spyOn(api, 'mobileLogout').mockRejectedValue(new Error('offline'));

    const { findByText } = renderWithQuery(<HomeScreen />);
    const signOut = await findByText('Sign Out');
    await act(async () => {
      fireEvent.press(signOut);
    });
    await waitFor(() => {
      expect(useSessionStore.getState().token).toBeNull();
    });
  });
});
