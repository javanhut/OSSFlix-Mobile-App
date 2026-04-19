import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ProfileLookupScreen } from '../../src/screens/ProfileLookupScreen';
import { api } from '../../src/api/client';
import { useSessionStore } from '../../src/state/session';

const navigation = { navigate: jest.fn(), goBack: jest.fn() } as any;
const route = { key: 'profile-lookup', name: 'ProfileLookup' } as any;

beforeEach(() => {
  navigation.navigate.mockReset();
  navigation.goBack.mockReset();
  useSessionStore.setState({
    bootstrapped: false,
    serverUrl: 'http://media.local',
    token: null,
    profile: null,
    selectedProfile: null,
  });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ProfileLookupScreen', () => {
  it('renders the empty-state when no profiles are loaded', () => {
    const { getByText } = render(<ProfileLookupScreen navigation={navigation} route={route} />);
    expect(getByText('Choose a profile')).toBeTruthy();
    expect(getByText('No profiles loaded yet')).toBeTruthy();
  });

  it('looks up profiles by email and renders them', async () => {
    jest.spyOn(api, 'lookupProfiles').mockResolvedValue({
      profiles: [
        { id: 1, name: 'Ada', image_path: null, has_password: true },
        { id: 2, name: 'Lin', image_path: null, has_password: false },
      ],
      hasUnclaimed: false,
    });

    const { getByPlaceholderText, getByText } = render(
      <ProfileLookupScreen navigation={navigation} route={route} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), '  user@example.com  ');
    await act(async () => {
      fireEvent.press(getByText('Find Profiles'));
    });

    await waitFor(() => {
      expect(api.lookupProfiles).toHaveBeenCalledWith('user@example.com');
      expect(getByText('Ada')).toBeTruthy();
      expect(getByText('Lin')).toBeTruthy();
      expect(getByText('Password protected')).toBeTruthy();
      expect(getByText('Needs password')).toBeTruthy();
    });
  });

  it('alerts when lookup returns no profiles', async () => {
    jest.spyOn(api, 'lookupProfiles').mockResolvedValue({ profiles: [], hasUnclaimed: false });

    const { getByPlaceholderText, getByText } = render(
      <ProfileLookupScreen navigation={navigation} route={route} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.c');
    await act(async () => {
      fireEvent.press(getByText('Find Profiles'));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('No profiles', expect.stringContaining('No profiles'));
    });
  });

  it('alerts when lookupProfiles throws', async () => {
    jest.spyOn(api, 'lookupProfiles').mockRejectedValue(new Error('boom'));
    const { getByPlaceholderText, getByText } = render(
      <ProfileLookupScreen navigation={navigation} route={route} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.c');
    await act(async () => {
      fireEvent.press(getByText('Find Profiles'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Lookup failed', 'boom');
    });
  });

  it('alerts with a fallback when lookupProfiles rejects with a non-Error', async () => {
    jest.spyOn(api, 'lookupProfiles').mockRejectedValue('weird');
    const { getByPlaceholderText, getByText } = render(
      <ProfileLookupScreen navigation={navigation} route={route} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.c');
    await act(async () => {
      fireEvent.press(getByText('Find Profiles'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Lookup failed', 'Unable to load profiles.');
    });
  });

  it('lookupUnclaimed populates profiles and selects one navigates to SignIn', async () => {
    jest.spyOn(api, 'lookupUnclaimed').mockResolvedValue({
      profiles: [{ id: 5, name: 'Open', image_path: null, has_password: false }],
    });

    const { getByText } = render(<ProfileLookupScreen navigation={navigation} route={route} />);
    await act(async () => {
      fireEvent.press(getByText('Use Unclaimed Profile'));
    });
    await waitFor(() => expect(getByText('Open')).toBeTruthy());

    fireEvent.press(getByText('Open'));
    expect(useSessionStore.getState().selectedProfile?.id).toBe(5);
    expect(navigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('lookupUnclaimed alerts on empty result', async () => {
    jest.spyOn(api, 'lookupUnclaimed').mockResolvedValue({ profiles: [] });
    const { getByText } = render(<ProfileLookupScreen navigation={navigation} route={route} />);
    await act(async () => {
      fireEvent.press(getByText('Use Unclaimed Profile'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('No profiles', expect.stringContaining('unclaimed'));
    });
  });

  it('lookupUnclaimed alerts with a fallback when it rejects with a non-Error', async () => {
    jest.spyOn(api, 'lookupUnclaimed').mockRejectedValue('weird');
    const { getByText } = render(<ProfileLookupScreen navigation={navigation} route={route} />);
    await act(async () => {
      fireEvent.press(getByText('Use Unclaimed Profile'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Lookup failed', 'Unable to load profiles.');
    });
  });

  it('lookupUnclaimed alerts with the error message when it rejects with an Error', async () => {
    jest.spyOn(api, 'lookupUnclaimed').mockRejectedValue(new Error('nope'));
    const { getByText } = render(<ProfileLookupScreen navigation={navigation} route={route} />);
    await act(async () => {
      fireEvent.press(getByText('Use Unclaimed Profile'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Lookup failed', 'nope');
    });
  });

  it('navigates to Register from the link', () => {
    const { getByText } = render(<ProfileLookupScreen navigation={navigation} route={route} />);
    fireEvent.press(getByText('Create a new profile'));
    expect(navigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('the Change action clears the configured server URL', () => {
    const { getByText } = render(<ProfileLookupScreen navigation={navigation} route={route} />);
    fireEvent.press(getByText('Change'));
    expect(useSessionStore.getState().serverUrl).toBe('');
  });

  it('Continue as Guest selects the guest profile and navigates to SignIn', async () => {
    jest.spyOn(api, 'getGuestProfile').mockResolvedValue({
      profile: { id: 9, name: 'Guest', image_path: null, has_password: true },
    });

    const { getByText } = render(<ProfileLookupScreen navigation={navigation} route={route} />);
    await act(async () => {
      fireEvent.press(getByText('Continue as Guest'));
    });

    await waitFor(() => {
      expect(useSessionStore.getState().selectedProfile?.id).toBe(9);
      expect(navigation.navigate).toHaveBeenCalledWith('SignIn');
    });
  });

  it('Continue as Guest alerts when the server returns an error', async () => {
    jest.spyOn(api, 'getGuestProfile').mockRejectedValue(new Error('Guest profile not available'));
    const { getByText } = render(<ProfileLookupScreen navigation={navigation} route={route} />);
    await act(async () => {
      fireEvent.press(getByText('Continue as Guest'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Guest unavailable', 'Guest profile not available');
    });
  });
});
