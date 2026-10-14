import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { describe, it, expect, afterEach, vi } from "vitest";

import Signup from "../pages/Signup";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

// Displays the current URL path for testing navigation.
function LocationDisplay() {
  const location = useLocation();

  return <p>Current path: {location.pathname}</p>;
}

// Renders Signup with routes for testing.
function renderSignup() {
  const setUser = vi.fn();

  render(
    <MemoryRouter initialEntries={["/signup"]}>
      <Routes>
        <Route path="/signup" element={<Signup setUser={setUser} />} />

        <Route
          path="/login"
          element={
            <>
              <h1>Login Page</h1>
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  return { setUser };
}

describe("Signup Page", () => {
  it("renders the signup form and all fields", () => {
    renderSignup();

    expect(
      screen.getByRole("heading", {
        name: /create account/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Create a password"),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Confirm your password"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /create account/i,
      }),
    ).toBeInTheDocument();
  });

  it("marks all signup fields as required", () => {
    renderSignup();

    expect(screen.getByPlaceholderText("Enter your name")).toBeRequired();

    expect(screen.getByPlaceholderText("Enter your email")).toBeRequired();

    expect(screen.getByPlaceholderText("Create a password")).toBeRequired();

    expect(screen.getByPlaceholderText("Confirm your password")).toBeRequired();
  });

  it("shows an error when passwords do not match", async () => {
    const user = userEvent.setup();

    renderSignup();

    await user.type(
      screen.getByPlaceholderText("Enter your name"),
      "Test Parent",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "test@example.com",
    );

    await user.type(
      screen.getByPlaceholderText("Create a password"),
      "Password123",
    );

    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "DifferentPassword123",
    );

    await user.click(
      screen.getByRole("button", {
        name: /create account/i,
      }),
    );

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();

    expect(localStorage.getItem("token")).toBeNull();
  });

  it("submits valid details and navigates to the login page", async () => {
    const user = userEvent.setup();
    const { setUser } = renderSignup();

    await user.type(
      screen.getByPlaceholderText("Enter your name"),
      "Test Parent",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "test@example.com",
    );

    await user.type(
      screen.getByPlaceholderText("Create a password"),
      "Password123",
    );

    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "Password123",
    );

    await user.click(
      screen.getByRole("button", {
        name: /create account/i,
      }),
    );

    // Check that the loading message appears.
    expect(await screen.findByText(/creating account/i)).toBeInTheDocument();

    // Wait for the signup delay and navigation.
    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", {
            name: /login page/i,
          }),
        ).toBeInTheDocument();

        expect(screen.getByText("Current path: /login")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(setUser).toHaveBeenCalledWith({
      name: "Test Parent",
      email: "test@example.com",
    });

    expect(localStorage.getItem("token")).toBe("fake-signup-token");
  });

  it("does not call setUser when passwords do not match", async () => {
    const user = userEvent.setup();
    const { setUser } = renderSignup();

    await user.type(
      screen.getByPlaceholderText("Enter your name"),
      "Test Parent",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "test@example.com",
    );

    await user.type(
      screen.getByPlaceholderText("Create a password"),
      "Password123",
    );

    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "WrongPassword123",
    );

    await user.click(
      screen.getByRole("button", {
        name: /create account/i,
      }),
    );

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();

    expect(setUser).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
