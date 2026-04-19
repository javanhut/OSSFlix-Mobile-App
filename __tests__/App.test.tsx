/**
 * App is a thin wrapper. We mock the heavy children so the test focuses on
 * the Android-only ImmersiveMode side effects.
 */

const mockSetVisibility = jest.fn<Promise<void>, [string]>(async () => {});
const mockSetBehavior = jest.fn<Promise<void>, [string]>(async () => {});
const mockSetBg = jest.fn<Promise<void>, [string]>(async () => {});
const mockSetButton = jest.fn<Promise<void>, [string]>(async () => {});
const mockSetPosition = jest.fn<Promise<void>, [string]>(async () => {});

jest.mock("expo-navigation-bar", () => ({
  setVisibilityAsync: (arg: string) => mockSetVisibility(arg),
  setBehaviorAsync: (arg: string) => mockSetBehavior(arg),
  setBackgroundColorAsync: (arg: string) => mockSetBg(arg),
  setButtonStyleAsync: (arg: string) => mockSetButton(arg),
  setPositionAsync: (arg: string) => mockSetPosition(arg),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("../src/providers/AppProviders", () => {
  const React = require("react");
  return { AppProviders: ({ children }: any) => React.createElement(React.Fragment, null, children) };
});

jest.mock("../src/navigation/RootNavigator", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { RootNavigator: () => React.createElement(Text, null, "root-nav") };
});

import React from "react";
import { Platform } from "react-native";
import { render, waitFor } from "@testing-library/react-native";
import App from "../App";

afterEach(() => {
  jest.clearAllMocks();
});

describe("App", () => {
  it("renders the navigator", () => {
    const { getByText } = render(<App />);
    expect(getByText("root-nav")).toBeTruthy();
  });

  it("configures the immersive nav bar on Android", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    render(<App />);
    await waitFor(() => {
      expect(mockSetVisibility).toHaveBeenCalledWith("hidden");
      expect(mockSetBehavior).toHaveBeenCalledWith("overlay-swipe");
      expect(mockSetBg).toHaveBeenCalledWith("#00000000");
      expect(mockSetButton).toHaveBeenCalledWith("light");
      expect(mockSetPosition).toHaveBeenCalledWith("absolute");
    });
  });

  it("does NOT configure the navigation bar on iOS", () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    render(<App />);
    expect(mockSetVisibility).not.toHaveBeenCalled();
    expect(mockSetBehavior).not.toHaveBeenCalled();
  });
});
