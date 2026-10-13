import React, { useEffect, useState } from "react";
import {
  FiHeart,
  FiPlus,
  FiSave,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";

const STORAGE_KEY = "mamatrust_baby_profiles";

const allergyOptions = [
  "Peanut",
  "Egg",
  "Cow's milk",
  "Tree nuts",
  "Wheat",
  "Soy",
  "Sesame",
  "Fish",
  "Shellfish",
];

const emptyProfile = {
  name: "",
  dob: "",
  stage: "not_started_solids",
  approach: "purees",
  familyHistory: "no",
  allergies: [],
  answerStyle: "quick",
};

const Profile = () => {
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [formData, setFormData] = useState(emptyProfile);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const storedProfiles = localStorage.getItem(STORAGE_KEY);

    if (storedProfiles) {
      try {
        const parsedProfiles = JSON.parse(storedProfiles);

        if (Array.isArray(parsedProfiles)) {
          setProfiles(parsedProfiles);

          if (parsedProfiles.length > 0) {
            setSelectedId(parsedProfiles[0].id);
            setFormData(parsedProfiles[0]);
          }
        }
      } catch (error) {
        console.error("Could not load baby profiles:", error);
      }
    }
  }, []);

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSavedMessage("");
  };

  const handleAllergyChange = (allergy) => {
    setFormData((previous) => {
      const alreadySelected = previous.allergies.includes(allergy);

      return {
        ...previous,
        allergies: alreadySelected
          ? previous.allergies.filter((item) => item !== allergy)
          : [...previous.allergies, allergy],
      };
    });

    setSavedMessage("");
  };

  const handleAddProfile = () => {
    setSelectedId("");
    setFormData(emptyProfile);
    setSavedMessage("");
  };

  const handleSelectProfile = (id) => {
    setSelectedId(id);
    setSavedMessage("");

    if (id === "demo-1" || id === "demo-2") {
      const demo = demoProfiles[id === "demo-1" ? 0 : 1];

      setFormData({
        ...demo,
        id: "",
      });

      return;
    }

    const profile = profiles.find((item) => item.id === id);

    if (profile) {
      setFormData({ ...profile });
    } else {
      setFormData(emptyProfile);
    }
  };

  const handleSave = (event) => {
    event.preventDefault();
    setSavedMessage("");

    if (!formData.name.trim()) {
      setSavedMessage("Please enter a baby profile name.");
      return;
    }

    if (!formData.dob) {
      setSavedMessage("Please select the date of birth.");
      return;
    }

    const profileId = selectedId || crypto.randomUUID();

    const updatedProfile = {
      ...formData,
      id: profileId,
      name: formData.name.trim(),
    };

    const updatedProfiles = profiles.some((profile) => profile.id === profileId)
      ? profiles.map((profile) =>
          profile.id === profileId ? updatedProfile : profile,
        )
      : [...profiles, updatedProfile];

    setProfiles(updatedProfiles);
    setSelectedId(profileId);
    setFormData(updatedProfile);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfiles));

    setSavedMessage("Baby profile saved successfully.");
  };

  const handleDelete = () => {
    if (!selectedId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this baby profile?",
    );

    if (!confirmed) return;

    const updatedProfiles = profiles.filter(
      (profile) => profile.id !== selectedId,
    );

    setProfiles(updatedProfiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfiles));

    if (updatedProfiles.length > 0) {
      setSelectedId(updatedProfiles[0].id);
      setFormData(updatedProfiles[0]);
    } else {
      setSelectedId("");
      setFormData(emptyProfile);
    }

    setSavedMessage("Baby profile deleted.");
  };

  return (
    <div className="profile-page container-fluid">
      <header className="profile-header">
        <div className="profile-heading-icon">
          <FiHeart />
        </div>

        <div>
          <h1>Baby profiles</h1>
          <p>
            Add a profile for each of your babies. MamaTrust can use these
            details to tailor its feeding guidance.
          </p>
        </div>
      </header>

      <div className="profile-layout border">
        <section className="profile-list-card">
          <div className="profile-list-heading">
            <h2>Your babies</h2>

            <button
              type="button"
              className="profile-add-button"
              onClick={handleAddProfile}
            >
              <FiPlus />
              Add baby
            </button>
          </div>

          {profiles.length === 0 ? (
            <p className="profile-empty">
              No saved baby profiles yet. Add your first profile.
            </p>
          ) : (
            <div className="baby-profile-list">
              {profiles.map((profile) => (
                <button
                  type="button"
                  key={profile.id}
                  className={`baby-profile-item ${
                    selectedId === profile.id ? "selected" : ""
                  }`}
                  onClick={() => handleSelectProfile(profile.id)}
                >
                  <span className="baby-avatar">
                    <FiHeart />
                  </span>

                  <span className="baby-profile-info">
                    <strong>{profile.name}</strong>
                    <small>
                      {profile.dob
                        ? new Date(
                            `${profile.dob}T00:00:00`,
                          ).toLocaleDateString()
                        : "Date of birth not set"}
                    </small>
                  </span>

                  {selectedId === profile.id && (
                    <FiCheckCircle className="profile-selected-icon" />
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="profile-form-card border">
          <div className="profile-form-heading">
            <h2>{selectedId ? "Edit baby profile" : "Create baby profile"}</h2>
            <p>Complete the details below.</p>
          </div>

          <form onSubmit={handleSave}>
            <div className="profile-field">
              <label htmlFor="baby-name">Baby profile name</label>
              <input
                id="baby-name"
                type="text"
                placeholder="e.g. My baby"
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="baby-dob">Date of birth</label>
              <input
                id="baby-dob"
                type="date"
                value={formData.dob}
                max={new Date().toLocaleDateString("en-CA")}
                onChange={(event) => updateField("dob", event.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="baby-stage">Feeding stage</label>
              <select
                id="baby-stage"
                value={formData.stage}
                onChange={(event) => updateField("stage", event.target.value)}
              >
                <option value="not_started_solids">Not started solids</option>
                <option value="just_started">Just started</option>
                <option value="established_solids">
                  Established on solids
                </option>
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="baby-approach">Feeding approach</label>
              <select
                id="baby-approach"
                value={formData.approach}
                onChange={(event) =>
                  updateField("approach", event.target.value)
                }
              >
                <option value="purees">Purees</option>
                <option value="baby_led_weaning">Baby-led weaning</option>
                <option value="mixed">Mixed</option>
                <option value="unsure">Not sure yet</option>
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="baby-family-history">
                Family history of allergy
              </label>
              <select
                id="baby-family-history"
                value={formData.familyHistory}
                onChange={(event) =>
                  updateField("familyHistory", event.target.value)
                }
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <fieldset className="profile-field allergy-field">
              <legend>Known or suspected allergies</legend>

              <div className="allergy-grid">
                {allergyOptions.map((allergy) => (
                  <label className="allergy-option" key={allergy}>
                    <input
                      type="checkbox"
                      checked={formData.allergies.includes(allergy)}
                      onChange={() => handleAllergyChange(allergy)}
                    />
                    <span>{allergy}</span>
                  </label>
                ))}
              </div>

              <small>Select only allergies that are known or suspected.</small>
            </fieldset>

            <div className="profile-field">
              <label htmlFor="baby-answer-style">Answer style</label>
              <select
                id="baby-answer-style"
                value={formData.answerStyle}
                onChange={(event) =>
                  updateField("answerStyle", event.target.value)
                }
              >
                <option value="quick">Quick</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="profile-save-button">
                <FiSave />
                Save profile
              </button>

              {selectedId && (
                <button
                  type="button"
                  className="profile-delete-button"
                  onClick={handleDelete}
                >
                  <FiTrash2 />
                  Delete
                </button>
              )}
            </div>

            {savedMessage && (
              <p
                className={`profile-saved-message ${
                  savedMessage.includes("successfully") ||
                  savedMessage.includes("deleted")
                    ? "success"
                    : "error"
                }`}
                role="status"
              >
                {savedMessage}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
