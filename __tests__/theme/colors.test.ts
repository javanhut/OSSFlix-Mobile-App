import { colors } from "../../src/theme/colors";

const HEX = /^#[0-9a-fA-F]{6}$/;

describe("theme/colors", () => {
  const requiredKeys: (keyof typeof colors)[] = [
    "background",
    "surface",
    "surfaceElevated",
    "surfaceAccent",
    "border",
    "borderStrong",
    "primary",
    "primaryPressed",
    "primaryText",
    "accentText",
    "text",
    "textMuted",
    "textSoft",
  ];

  it.each(requiredKeys)("exposes %s as a 6-digit hex color", (key) => {
    expect(colors[key]).toMatch(HEX);
  });

  it("has no extra keys (catches accidental drift)", () => {
    expect(Object.keys(colors).sort()).toEqual([...requiredKeys].sort());
  });
});
