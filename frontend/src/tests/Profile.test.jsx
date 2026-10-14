import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

import Profile from "../pages/Profile";

const STORAGE_KEY = "mamatrust_baby_profiles";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

beforeEach(() => {
  localStorage.clear();

  // Keep the date input's maximum date predictable.
  vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(
    function (locale, options) {
      if (locale === "en-CA" && options === undefined) {
        return "2026-10-14";
      }

      return "1/1/2026";
    },
  );
});

function renderProfile() {
  return render(<Profile />);
}

describe("Profile Page", () => {
  it("renders the profile page and form fields", () => {
    renderProfile();

    expect(
      screen.getByRole("heading", { name: "Baby profiles" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Your babies" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /add baby/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Baby profile name")).toBeInTheDocument();

    expect(screen.getByLabelText("Date of birth")).toBeInTheDocument();

    expect(screen.getByLabelText("Feeding stage")).toBeInTheDocument();

    expect(screen.getByLabelText("Feeding approach")).toBeInTheDocument();

    expect(
      screen.getByLabelText("Family history of allergy"),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Answer style")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /save profile/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/no saved baby profiles yet/i)).toBeInTheDocument();
  });

  it("shows validation messages when required fields are missing", async () => {
    const user = userEvent.setup();

    renderProfile();

    const form = screen.getByLabelText("Baby profile name").closest("form");

    // Bypass browser validation to test the component's own validation.
    fireEvent.submit(form);

    expect(
      await screen.findByText("Please enter a baby profile name."),
    ).toBeInTheDocument();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Provide a name, but leave the date of birth empty.
    await user.type(screen.getByLabelText("Baby profile name"), "Baby Alex");

    fireEvent.submit(form);

    expect(
      await screen.findByText("Please select the date of birth."),
    ).toBeInTheDocument();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("allows the user to select and deselect allergies", async () => {
    const user = userEvent.setup();

    renderProfile();

    const peanutCheckbox = screen.getByRole("checkbox", {
      name: "Peanut",
    });

    const eggCheckbox = screen.getByRole("checkbox", {
      name: "Egg",
    });

    await user.click(peanutCheckbox);
    await user.click(eggCheckbox);

    expect(peanutCheckbox).toBeChecked();
    expect(eggCheckbox).toBeChecked();

    await user.click(peanutCheckbox);

    expect(peanutCheckbox).not.toBeChecked();
    expect(eggCheckbox).toBeChecked();
  });

  it("saves a new baby profile to localStorage", async () => {
    const user = userEvent.setup();

    renderProfile();

    await user.type(screen.getByLabelText("Baby profile name"), "Baby Alex");

    await user.type(screen.getByLabelText("Date of birth"), "2026-01-15");

    await user.selectOptions(
      screen.getByLabelText("Feeding stage"),
      "just_started",
    );

    await user.selectOptions(
      screen.getByLabelText("Feeding approach"),
      "mixed",
    );

    await user.selectOptions(
      screen.getByLabelText("Family history of allergy"),
      "yes",
    );

    await user.click(screen.getByRole("checkbox", { name: "Peanut" }));

    await user.selectOptions(screen.getByLabelText("Answer style"), "detailed");

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    expect(
      await screen.findByText("Baby profile saved successfully."),
    ).toBeInTheDocument();

    const storedProfiles = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(storedProfiles).toHaveLength(1);

    expect(storedProfiles[0]).toMatchObject({
      name: "Baby Alex",
      dob: "2026-01-15",
      stage: "just_started",
      approach: "mixed",
      familyHistory: "yes",
      allergies: ["Peanut"],
      answerStyle: "detailed",
    });

    expect(storedProfiles[0].id).toBeTruthy();

    expect(
      screen.getByRole("heading", { name: "Edit baby profile" }),
    ).toBeInTheDocument();
  });

  it("loads saved profiles from localStorage", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
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
      ]),
    );

    renderProfile();

    expect(await screen.findByText("Baby Alex")).toBeInTheDocument();

    expect(screen.getByLabelText("Baby profile name")).toHaveValue("Baby Alex");

    expect(screen.getByLabelText("Date of birth")).toHaveValue("2026-01-15");

    expect(screen.getByRole("checkbox", { name: "Egg" })).toBeChecked();
  });

  it("allows the user to start creating another profile", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "baby-1",
          name: "Baby Alex",
          dob: "2026-01-15",
          stage: "not_started_solids",
          approach: "purees",
          familyHistory: "no",
          allergies: [],
          answerStyle: "quick",
        },
      ]),
    );

    renderProfile();

    expect(await screen.findByText("Baby Alex")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add baby/i }));

    expect(
      screen.getByRole("heading", { name: "Create baby profile" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Baby profile name")).toHaveValue("");

    expect(screen.getByLabelText("Date of birth")).toHaveValue("");
  });

  it("allows the user to select an existing profile", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "baby-1",
          name: "Baby Alex",
          dob: "2026-01-15",
          stage: "not_started_solids",
          approach: "purees",
          familyHistory: "no",
          allergies: [],
          answerStyle: "quick",
        },
        {
          id: "baby-2",
          name: "Baby Sam",
          dob: "2025-12-01",
          stage: "just_started",
          approach: "mixed",
          familyHistory: "yes",
          allergies: ["Peanut"],
          answerStyle: "detailed",
        },
      ]),
    );

    renderProfile();

    await user.click(await screen.findByRole("button", { name: /Baby Sam/i }));

    expect(screen.getByLabelText("Baby profile name")).toHaveValue("Baby Sam");

    expect(screen.getByLabelText("Date of birth")).toHaveValue("2025-12-01");

    expect(screen.getByLabelText("Feeding approach")).toHaveValue("mixed");

    expect(screen.getByRole("checkbox", { name: "Peanut" })).toBeChecked();
  });

  it("updates an existing profile without creating a duplicate", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "baby-1",
          name: "Baby Alex",
          dob: "2026-01-15",
          stage: "not_started_solids",
          approach: "purees",
          familyHistory: "no",
          allergies: [],
          answerStyle: "quick",
        },
      ]),
    );

    renderProfile();

    await screen.findByText("Baby Alex");

    const nameInput = screen.getByLabelText("Baby profile name");

    await user.clear(nameInput);
    await user.type(nameInput, "Baby Alex Updated");

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    expect(
      await screen.findByText("Baby profile saved successfully."),
    ).toBeInTheDocument();

    const storedProfiles = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(storedProfiles).toHaveLength(1);
    expect(storedProfiles[0].id).toBe("baby-1");
    expect(storedProfiles[0].name).toBe("Baby Alex Updated");
  });

  it("deletes a profile after confirmation", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "baby-1",
          name: "Baby Alex",
          dob: "2026-01-15",
          stage: "not_started_solids",
          approach: "purees",
          familyHistory: "no",
          allergies: [],
          answerStyle: "quick",
        },
      ]),
    );

    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderProfile();

    await screen.findByText("Baby Alex");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(window.confirm).toHaveBeenCalled();

    expect(
      await screen.findByText("Baby profile deleted."),
    ).toBeInTheDocument();

    expect(localStorage.getItem(STORAGE_KEY)).toBe("[]");

    expect(screen.getByText(/no saved baby profiles yet/i)).toBeInTheDocument();
  });

  it("keeps a profile when deletion is cancelled", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "baby-1",
          name: "Baby Alex",
          dob: "2026-01-15",
          stage: "not_started_solids",
          approach: "purees",
          familyHistory: "no",
          allergies: [],
          answerStyle: "quick",
        },
      ]),
    );

    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderProfile();

    await screen.findByText("Baby Alex");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(window.confirm).toHaveBeenCalled();

    expect(screen.getByLabelText("Baby profile name")).toHaveValue("Baby Alex");

    const storedProfiles = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(storedProfiles).toHaveLength(1);
    expect(storedProfiles[0].name).toBe("Baby Alex");
  });

  it("handles invalid JSON in localStorage without crashing", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    localStorage.setItem(STORAGE_KEY, "{invalid json");

    renderProfile();

    expect(
      screen.getByRole("heading", { name: "Baby profiles" }),
    ).toBeInTheDocument();

    expect(screen.getByText(/no saved baby profiles yet/i)).toBeInTheDocument();

    expect(consoleError).toHaveBeenCalledWith(
      "Could not load baby profiles:",
      expect.any(SyntaxError),
    );
  });
});
