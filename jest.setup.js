// Replace @expo/vector-icons with a noop component so we avoid font-loading
// state updates that trigger React act() warnings during render tests.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const makeIcon = (familyName) => {
    const Icon = ({ name, ...rest }) =>
      React.createElement(Text, { ...rest, accessibilityLabel: `${familyName}-${name}` }, '');
    Icon.displayName = familyName;
    return Icon;
  };
  return new Proxy(
    {},
    {
      get: (_, prop) => makeIcon(String(prop)),
    }
  );
});

// Silence noisy logs that originate inside mocked native modules.
const originalWarn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((...args) => {
  const first = args[0];
  if (typeof first === 'string' && /VirtualizedLists|act\(/.test(first)) return;
  originalWarn(...args);
});
