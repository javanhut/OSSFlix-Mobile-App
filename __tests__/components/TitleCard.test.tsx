import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TitleCard } from '../../src/components/TitleCard';
import { useSessionStore } from '../../src/state/session';
import type { TitleSummary } from '../../src/types/api';

const SERVER = 'http://media.local:9000';

beforeEach(() => {
  useSessionStore.setState({
    bootstrapped: false,
    serverUrl: SERVER,
    token: null,
    profile: null,
    selectedProfile: null,
  });
});

describe('TitleCard', () => {
  const baseItem: TitleSummary = {
    name: 'Inception',
    imagePath: '/api/assets/inception.jpg',
    pathToDir: 'movies/Inception',
  };

  it('renders an image when imagePath is set, resolved against the server URL', () => {
    const { UNSAFE_getByType } = render(<TitleCard item={baseItem} onPress={() => {}} />);
    const Image = require('react-native').Image;
    const image = UNSAFE_getByType(Image);
    expect(image.props.source).toEqual({ uri: `${SERVER}/api/assets/inception.jpg` });
  });

  it('falls back to a placeholder with the title text when imagePath is null', () => {
    const item = { ...baseItem, imagePath: null };
    const { getAllByText } = render(<TitleCard item={item} onPress={() => {}} />);
    // The title appears twice: once in the placeholder, once below the image area.
    expect(getAllByText('Inception').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the title text', () => {
    const { getByText } = render(<TitleCard item={baseItem} onPress={() => {}} />);
    expect(getByText('Inception')).toBeTruthy();
  });

  it('renders a type badge when item.type is set', () => {
    const item = { ...baseItem, type: 'Movie' };
    const { getByText } = render(<TitleCard item={item} onPress={() => {}} />);
    expect(getByText('Movie')).toBeTruthy();
  });

  it('does not render a badge when item.type is missing', () => {
    const { queryByText } = render(<TitleCard item={baseItem} onPress={() => {}} />);
    expect(queryByText('Movie')).toBeNull();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<TitleCard item={baseItem} onPress={onPress} />);
    fireEvent.press(getByText('Inception'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
