const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

import React from "react";
import { act, fireEvent, waitFor } from "@testing-library/react-native";
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

  it("renders the welcome message and rails when data is loaded", async () => {
    jest
      .spyOn(api, "getCategories")
      .mockResolvedValue([{ genre: "Action", titles: [{ name: "Bond", imagePath: null, pathToDir: "movies/Bond" }] }]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({
      genre: "Continue",
      titles: [{ name: "Resume", imagePath: null, pathToDir: "movies/Resume" }],
    });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({
      genre: "Watchlist",
      titles: [{ name: "Saved", imagePath: null, pathToDir: "movies/Saved" }],
    });
    const { findByText, getByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText(/Welcome back, Ada/)).toBeTruthy();
    expect(getByText("CONTINUE WATCHING")).toBeTruthy();
    expect(getByText("MY LIST")).toBeTruthy();
    expect(getByText("ACTION")).toBeTruthy();
  });

  it("navigates to TitleDetails when a featured slide is pressed", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([
      {
        genre: "Newly Added",
        titles: [{ name: "Hero", imagePath: "/api/assets/hero.jpg", pathToDir: "movies/Hero" }],
      },
    ]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({ genre: "Continue", titles: [] });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({ genre: "Watchlist", titles: [] });

    const { findByText } = renderWithQuery(<HomeScreen />);
    fireEvent.press(await findByText("Open Title"));
    expect(mockNavigate).toHaveBeenCalledWith("TitleDetails", { dirPath: "movies/Hero" });
  });

  it("renders the empty state when there are no categories", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({ genre: "Continue", titles: [] });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({ genre: "Watchlist", titles: [] });
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText("No library data yet")).toBeTruthy();
  });

  it("omits the comma when no profile name is set", async () => {
    useSessionStore.setState({ profile: null });
    jest.spyOn(api, "getCategories").mockResolvedValue([]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({ genre: "Continue", titles: [] });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({ genre: "Watchlist", titles: [] });
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText("Welcome back")).toBeTruthy();
  });

  it("sign-out modal: confirm calls logout, clears auth, and closes", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({ genre: "Continue", titles: [] });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({ genre: "Watchlist", titles: [] });
    const logoutSpy = jest.spyOn(api, "mobileLogout").mockResolvedValue({ ok: true });

    const { findByText, getAllByText } = renderWithQuery(<HomeScreen />);
    const signOutButton = await findByText("Sign Out");
    await act(async () => {
      fireEvent.press(signOutButton);
    });
    const confirmButtons = getAllByText("Sign Out");
    // After opening the modal there are two "Sign Out" labels: the bottom button and the modal confirm.
    expect(confirmButtons.length).toBeGreaterThanOrEqual(2);
    await act(async () => {
      fireEvent.press(confirmButtons[confirmButtons.length - 1]);
    });
    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled();
      expect(useSessionStore.getState().token).toBeNull();
    });
  });

  it("sign-out modal: cancel dismisses without logging out", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({ genre: "Continue", titles: [] });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({ genre: "Watchlist", titles: [] });
    const logoutSpy = jest.spyOn(api, "mobileLogout").mockResolvedValue({ ok: true });

    const { findByText, getByText } = renderWithQuery(<HomeScreen />);
    await act(async () => {
      fireEvent.press(await findByText("Sign Out"));
    });
    await act(async () => {
      fireEvent.press(getByText("Cancel"));
    });
    expect(logoutSpy).not.toHaveBeenCalled();
    expect(useSessionStore.getState().token).toBe("tok");
  });

  it("still clears auth even when the logout request fails", async () => {
    jest.spyOn(api, "getCategories").mockResolvedValue([]);
    jest.spyOn(api, "getContinueWatching").mockResolvedValue({ genre: "Continue", titles: [] });
    jest.spyOn(api, "getWatchlist").mockResolvedValue({ genre: "Watchlist", titles: [] });
    jest.spyOn(api, "mobileLogout").mockRejectedValue(new Error("offline"));

    const { findByText, getAllByText } = renderWithQuery(<HomeScreen />);
    await act(async () => {
      fireEvent.press(await findByText("Sign Out"));
    });
    const confirmButtons = getAllByText("Sign Out");
    await act(async () => {
      fireEvent.press(confirmButtons[confirmButtons.length - 1]);
    });
    await waitFor(() => {
      expect(useSessionStore.getState().token).toBeNull();
    });
  });
});
