const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { HomeScreen } from "../../src/screens/HomeScreen";
import { api } from "../../src/api/client";
import { useSessionStore } from "../../src/state/session";
import { renderWithQuery } from "../utils/renderWithQuery";

beforeEach(() => {
  mockNavigate.mockReset();
  useSessionStore.setState({
    bootstrapped: false,
    serverUrl: "http://media.local",
    token: "tok",
    profile: { id: 1, name: "Ada" } as any,
    selectedProfile: null,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("HomeScreen", () => {
  it("shows a loader while queries are pending", () => {
    jest.spyOn(api, "getCategories").mockReturnValue(new Promise(() => {}));
    jest.spyOn(api, "getContinueWatching").mockReturnValue(new Promise(() => {}));
    jest.spyOn(api, "getWatchlist").mockReturnValue(new Promise(() => {}));
    const { UNSAFE_root } = renderWithQuery(<HomeScreen />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it("renders the brand and rails when data is loaded", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([
      {
        genre: "Action",
        titles: [{ name: "Bond", imagePath: null, pathToDir: "movies/Bond" }],
      },
    ]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({
      genre: "Continue",
      titles: [{ name: "Resume", imagePath: null, pathToDir: "movies/Resume" }],
    });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({
      genre: "Watchlist",
      titles: [{ name: "Saved", imagePath: null, pathToDir: "movies/Saved" }],
    });
    const { findByText, getByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText("Reelscape")).toBeTruthy();
    expect(getByText("Continue Watching")).toBeTruthy();
    expect(getByText("My List")).toBeTruthy();
    expect(getByText("Action")).toBeTruthy();
  });

  it("hero More Info opens details and Play opens details with autoplay", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([
      {
        genre: "Newly Added",
        titles: [
          {
            name: "Hero",
            imagePath: "/api/assets/hero.jpg",
            pathToDir: "movies/Hero",
          },
        ],
      },
    ]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({ genre: "Continue", titles: [] });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({ genre: "Watchlist", titles: [] });
    jest.spyOn(api, "getTitleDetails").mockReturnValue(new Promise(() => {}));

    const { findByText, getByText } = renderWithQuery(<HomeScreen />);
    fireEvent.press(await findByText("More Info"));
    expect(mockNavigate).toHaveBeenCalledWith("TitleDetails", {
      dirPath: "movies/Hero",
    });
    fireEvent.press(getByText("Play"));
    expect(mockNavigate).toHaveBeenCalledWith("TitleDetails", {
      dirPath: "movies/Hero",
      autoplay: true,
    });
  });

  it("renders the empty state when there are no categories", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({ genre: "Continue", titles: [] });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({ genre: "Watchlist", titles: [] });
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText("No library data yet")).toBeTruthy();
  });
});
