import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, afterEach } from "vitest";
import Home from "../pages/Home";

afterEach(() => {
  cleanup();
});

describe("Home component", () => {
  it("shows the welcome message for a logged-in user", () => {
    render(
      <MemoryRouter>
        <Home
          user={{
            name: "Test User",
            email: "test@example.com",
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Welcome back, Test User/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Start Chat/i })).toHaveAttribute(
      "href",
      "/chat",
    );
  });

  it("shows the landing page when no user is logged in", () => {
    render(
      <MemoryRouter>
        <Home user={null} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Supporting you through/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Get Started/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows the main feature section", () => {
    render(
      <MemoryRouter>
        <Home user={null} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: /How MamaTrust can help/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /Ask Questions/i,
      }),
    ).toBeInTheDocument();
  });
});
