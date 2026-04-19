import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FeaturedCarousel } from '../../src/components/FeaturedCarousel';
import { useSessionStore } from '../../src/state/session';
import type { TitleSummary } from '../../src/types/api';

beforeEach(() => {
  useSessionStore.setState({
    bootstrapped: false,
    serverUrl: 'http://media.local',
    token: null,
    profile: null,
    selectedProfile: null,
  });
});

const items: TitleSummary[] = [
  { name: 'One', imagePath: '/api/assets/one.jpg', pathToDir: 'movies/One' },
  { name: 'Two', imagePath: '/api/assets/two.jpg', pathToDir: 'movies/Two' },
  { name: 'Three', imagePath: '/api/assets/three.jpg', pathToDir: 'movies/Three' },
];

describe('FeaturedCarousel', () => {
  it('returns null when items is empty', () => {
    const { toJSON } = render(<FeaturedCarousel items={[]} onSelect={() => {}} />);
    expect(toJSON()).toBeNull();
  });

  it('renders every slide title', () => {
    const { getByText } = render(<FeaturedCarousel items={items} onSelect={() => {}} />);
    expect(getByText('One')).toBeTruthy();
    expect(getByText('Two')).toBeTruthy();
    expect(getByText('Three')).toBeTruthy();
  });

  it('fires onSelect when Open Title is pressed on a slide', () => {
    const onSelect = jest.fn();
    const { getAllByText } = render(<FeaturedCarousel items={items} onSelect={onSelect} />);
    fireEvent.press(getAllByText('Open Title')[0]);
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });
});
