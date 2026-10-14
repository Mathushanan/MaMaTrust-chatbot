import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Chat from "../pages/Chat";

const PROFILE_STORAGE_KEY = "mamatrust_baby_profiles";

const testProfiles = [
  {
    id: "baby-1",
    name: "Baby Alex",
    dob: "2026-01-15",
    stage: "just_started",
    approach: "purees",
    familyHistory: "no",
    allergies: ["Egg"],
    answerStyle: "quick",
  },
  {
    id: "baby-2",
    name: "Baby Sarah",
    dob: "2025-12-10",
    stage: "established_solids",
    approach: "mixed",
    familyHistory: "yes",
    allergies: ["Peanut"],
    answerStyle: "detailed",
  },
];

function renderChat() {
  return render(
    <MemoryRouter initialEntries={["/chat"]}>
      <Routes>
        <Route path="/chat" element={<Chat />} />

        <Route
          path="/profile"
          element={<h1>Baby Profile Management Page</h1>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function saveTestProfiles(profiles = testProfiles) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
}

async function startChatWithBaby(user, babyName = "Baby Alex") {
  const baby = testProfiles.find((profile) => profile.name === babyName);

  if (!baby) {
    throw new Error(`Test profile not found: ${babyName}`);
  }

  await user.selectOptions(
    screen.getByLabelText("Select baby profile"),
    baby.id,
  );

  await user.click(
    screen.getByRole("button", {
      name: /start chatting/i,
    }),
  );
}

describe("Chat Page", () => {
  beforeEach(() => {
    localStorage.clear();

    // jsdom does not implement scrollIntoView.
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the chat page heading and description", () => {
    renderChat();

    expect(
      screen.getByRole("heading", {
        name: "MamaTrust Assistant",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Evidence-aware baby feeding guidance"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Who are we chatting about?",
      }),
    ).toBeInTheDocument();
  });

  it("shows a message when no baby profiles exist", () => {
    renderChat();

    expect(
      screen.getByText("You need to create a baby profile before chatting."),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /create baby profile/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText("Select baby profile"),
    ).not.toBeInTheDocument();
  });

  it("loads saved baby profiles from localStorage", () => {
    saveTestProfiles();

    renderChat();

    expect(
      screen.getByRole("option", {
        name: "Baby Alex",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "Baby Sarah",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Select baby profile")).toHaveValue("");
  });

  it("displays the selected baby's profile information", async () => {
    const user = userEvent.setup();

    saveTestProfiles();
    renderChat();

    await user.selectOptions(
      screen.getByLabelText("Select baby profile"),
      "baby-1",
    );

    expect(screen.getByText("2026-01-15")).toBeInTheDocument();
    expect(screen.getByText("Just Started")).toBeInTheDocument();
    expect(screen.getByText("Purees")).toBeInTheDocument();

    expect(screen.getByText("Egg", { exact: true })).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /start chatting/i,
      }),
    ).toBeEnabled();
  });

  it("disables Start chatting until a baby is selected", () => {
    saveTestProfiles();
    renderChat();

    expect(
      screen.getByRole("button", {
        name: /start chatting/i,
      }),
    ).toBeDisabled();
  });

  it("starts a chat and displays the welcome message", async () => {
    const user = userEvent.setup();

    saveTestProfiles();
    renderChat();

    await startChatWithBaby(user);

    expect(
      screen.getByText(
        /Hello! I'm MamaTrust\. Let's talk about Baby Alex's feeding journey/,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Baby Alex", {
        selector: ".mt-active-baby span",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Your question",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Demo mode · Sample answers")).toBeInTheDocument();
  });

  it("sends an egg question and displays the sample answer", async () => {
    const user = userEvent.setup();

    saveTestProfiles();
    renderChat();

    await startChatWithBaby(user);

    const questionInput = screen.getByRole("textbox", {
      name: "Your question",
    });

    await user.type(questionInput, "When can I introduce egg?");

    await user.click(
      screen.getByRole("button", {
        name: "Send question",
      }),
    );

    expect(
      screen.getByText("When can I introduce egg?", {
        selector: ".mt-user-bubble",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /Egg can generally be introduced when your baby is ready/,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Supported by guidelines")).toBeInTheDocument();

    expect(
      screen.getByText("Demo classification — not verified evidence"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Demo only\. This is not a verified evidence assessment/,
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(questionInput).toHaveValue("");
    });
  });

  it("displays a sample answer when a suggested question is clicked", async () => {
    const user = userEvent.setup();

    saveTestProfiles();
    renderChat();

    await startChatWithBaby(user);

    // The suggestions appear in both the welcome section
    // and the bottom toolbar, so select the first match.
    const peanutSuggestions = screen.getAllByRole("button", {
      name: "Should I introduce peanuts?",
    });

    await user.click(peanutSuggestions[0]);

    expect(
      await screen.findByText(
        /Peanut can be introduced during complementary feeding/,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Partly supported")).toBeInTheDocument();

    expect(
      screen.getByText(/Illustrative demo comparison/),
    ).toBeInTheDocument();
  });

  it("displays the sample response for allergic-reaction questions", async () => {
    const user = userEvent.setup();

    saveTestProfiles();
    renderChat();

    await startChatWithBaby(user);

    const reactionSuggestions = screen.getAllByRole("button", {
      name: "What are the signs of an allergic reaction?",
    });

    await user.click(reactionSuggestions[0]);

    expect(
      await screen.findByText(
        /Possible food allergy symptoms include hives, swelling, vomiting/,
      ),
    ).toBeInTheDocument();

    // This demo question currently returns a normal answer,
    // not an emergency escalation.
    expect(
      screen.queryByRole("link", {
        name: "Call 000",
      }),
    ).not.toBeInTheDocument();
  });

  it("allows the user to change the selected baby", async () => {
    const user = userEvent.setup();

    saveTestProfiles();
    renderChat();

    await startChatWithBaby(user);

    await user.click(
      screen.getByRole("button", {
        name: "Change baby",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Who are we chatting about?",
      }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Select baby profile"),
      "baby-2",
    );

    expect(screen.getByText("2025-12-10")).toBeInTheDocument();
    expect(screen.getByText("Established Solids")).toBeInTheDocument();
    expect(screen.getByText("Mixed")).toBeInTheDocument();

    expect(screen.getByText("Peanut", { exact: true })).toBeInTheDocument();
  });

  it("clears the conversation when New chat is clicked", async () => {
    const user = userEvent.setup();

    saveTestProfiles();
    renderChat();

    await startChatWithBaby(user);

    const questionInput = screen.getByRole("textbox", {
      name: "Your question",
    });

    await user.type(questionInput, "When can I introduce egg?");

    await user.click(
      screen.getByRole("button", {
        name: "Send question",
      }),
    );

    expect(
      await screen.findByText(
        /Egg can generally be introduced when your baby is ready/,
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "New chat",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "How can I help today?",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        /Egg can generally be introduced when your baby is ready/,
      ),
    ).not.toBeInTheDocument();

    expect(questionInput).toHaveValue("");
  });

  it("opens the baby profile management page", async () => {
    const user = userEvent.setup();

    saveTestProfiles();
    renderChat();

    await user.click(
      screen.getByRole("link", {
        name: /add or manage baby profiles/i,
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Baby Profile Management Page",
      }),
    ).toBeInTheDocument();
  });

  it("handles invalid profile JSON without crashing", () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, "{invalid json");

    renderChat();

    expect(
      screen.getByRole("heading", {
        name: "MamaTrust Assistant",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("You need to create a baby profile before chatting."),
    ).toBeInTheDocument();
  });
});
