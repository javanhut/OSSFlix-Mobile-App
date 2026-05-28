const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { RecommendationsScreen } from "../../src/screens/RecommendationsScreen";
import { api } from "../../src/api/client";
import { useSessionStore } from "../../src/state/session";
import { renderWithQuery } from "../utils/renderWithQuery";

beforeEach(() => {
  mockNavigate.mockReset();
  useSessionStore.setState({
    bootstrapped: false,
    serverUrl: "http://media.local",
    token: "t",
    profile: null,
    selectedProfile: null,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RecommendationsScreen", () => {
  it("renders Newly Added titles", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([
      {
        genre: "Newly Added",
        titles: [
          { pathToDir: "x", name: "Alpha", imagePath: null, type: "Movie" },
          { pathToDir: "y", name: "Beta", imagePath: null, type: "Movie" },
        ],
      },
    ] as any);
    const { findAllByText } = renderWithQuery(<RecommendationsScreen />);
    expect((await findAllByText("Alpha")).length).toBeGreaterThan(0);
    expect((await findAllByText("Beta")).length).toBeGreaterThan(0);
  });

  it("navigates to TitleDetails on press", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([
      {
        genre: "Newly Added",
        titles: [{ pathToDir: "x", name: "Alpha", imagePath: null, type: "Movie" }],
      },
    ] as any);
    const { findAllByText } = renderWithQuery(<RecommendationsScreen />);
    const matches = await findAllByText("Alpha");
    fireEvent.press(matches[0]);
    expect(mockNavigate).toHaveBeenCalledWith("TitleDetails", { dirPath: "x" });
  });

  it("renders an empty state when there's no Newly Added row", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([
      { genre: "Other", titles: [{ pathToDir: "z", name: "Z", imagePath: null, type: "Movie" }] },
    ] as any);
    const { findByText } = renderWithQuery(<RecommendationsScreen />);
    expect(await findByText("Nothing to recommend yet")).toBeTruthy();
  });
});
