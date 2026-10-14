import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { describe, it, expect, afterEach, vi } from "vitest";

import Login from "../pages/Login";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

// Displays the current URL for navigation testing.
function LocationDisplay() {
  const location = useLocation();

  return <p>Current path: {location.pathname}</p>;
}

// Renders the Login component with a test home page.
function renderLogin() {
  const setUser = vi.fn();

  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />

        <Route
          path="/"
          element={
            <>
              <h1>Home Page</h1>
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  return { setUser };
}

describe("Login Page", () => {
  it("renders the login form and page content", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", {
        name: /welcome back/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Enter your password"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /sign in/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/create an account/i)).toBeInTheDocument();

    expect(
      screen.getByText(/qualified healthcare professional/i),
    ).toBeInTheDocument();
  });

  it("marks email and password fields as required", () => {
    renderLogin();

    expect(screen.getByPlaceholderText("Enter your email")).toBeRequired();

    expect(screen.getByPlaceholderText("Enter your password")).toBeRequired();
  });

  it("allows the user to enter email and password", async () => {
    const user = userEvent.setup();

    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");

    const passwordInput = screen.getByPlaceholderText("Enter your password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("Password123");
  });

  it("shows the loading state when the form is submitted", async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "test@example.com",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "Password123",
    );

    await user.click(
      screen.getByRole("button", {
        name: /sign in/i,
      }),
    );

    const loadingButton = await screen.findByRole("button", {
      name: /signing in/i,
    });

    expect(loadingButton).toBeDisabled();
  });

  it("logs in successfully, stores the token, and navigates home", async () => {
    const user = userEvent.setup();
    const { setUser } = renderLogin();

    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "test@example.com",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "Password123",
    );

    await user.click(
      screen.getByRole("button", {
        name: /sign in/i,
      }),
    );

    // Verify that the loading state appears.
    expect(
      await screen.findByRole("button", {
        name: /signing in/i,
      }),
    ).toBeDisabled();

    // Wait until navigation to the home page is complete.
    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", {
            name: "Home Page",
          }),
        ).toBeInTheDocument();

        expect(screen.getByText("Current path: /")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify that the user state was updated.
    expect(setUser).toHaveBeenCalledWith({
      email: "test@example.com",
      name: "Demo User",
    });

    // Verify that the demo token was stored.
    expect(localStorage.getItem("token")).toBe("a fake token");
  });
});
