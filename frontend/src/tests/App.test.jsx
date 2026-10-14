import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import App from "../App";

afterEach(() => {
  cleanup();
});

// Mock Navbar
vi.mock("../components/Navbar", () => ({
  default: ({ user }) => (
    <div data-testid="navbar">Navbar - {user?.name || "No user"}</div>
  ),
}));

// Mock Home
vi.mock("../pages/Home", () => ({
  default: ({ user }) => (
    <div data-testid="home-page">Home Page - {user?.name || "No user"}</div>
  ),
}));

// Mock Chat
vi.mock("../pages/Chat", () => ({
  default: ({ user }) => (
    <div data-testid="chat-page">Chat Page - {user?.name || "No user"}</div>
  ),
}));

// Mock Profile
vi.mock("../pages/Profile", () => ({
  default: ({ user }) => (
    <div data-testid="profile-page">
      Profile Page - {user?.name || "No user"}
    </div>
  ),
}));

// Mock Login
vi.mock("../pages/Login", () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

// Mock Signup
vi.mock("../pages/Signup", () => ({
  default: () => <div data-testid="signup-page">Signup Page</div>,
}));

function renderApp(path = "/") {
  window.history.replaceState({}, "", path);
  return render(<App />);
}

describe("App Component", () => {
  it("renders the Navbar", () => {
    renderApp("/");

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByText("Navbar - Demo User")).toBeInTheDocument();
  });

  it("renders the Home page at /", () => {
    renderApp("/");

    expect(screen.getByTestId("home-page")).toBeInTheDocument();
    expect(screen.getByText("Home Page - Demo User")).toBeInTheDocument();
  });

  it("renders the Chat page at /chat", () => {
    renderApp("/chat");

    expect(screen.getByTestId("chat-page")).toBeInTheDocument();
    expect(screen.getByText("Chat Page - Demo User")).toBeInTheDocument();
  });

  it("renders the Profile page at /profile", () => {
    renderApp("/profile");

    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    expect(screen.getByText("Profile Page - Demo User")).toBeInTheDocument();
  });

  it("renders the Login page at /login", () => {
    renderApp("/login");

    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("renders the Signup page at /signup", () => {
    renderApp("/signup");

    expect(screen.getByTestId("signup-page")).toBeInTheDocument();
  });

  it("redirects an unknown URL to the Home page", async () => {
    renderApp("/unknown-page");

    expect(await screen.findByTestId("home-page")).toBeInTheDocument();
  });
});
