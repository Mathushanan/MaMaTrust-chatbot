import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMessageCircle,
  FiHeart,
  FiUser,
  FiSend,
  FiPlus,
  FiChevronDown,
  FiExternalLink,
  FiShield,
  FiClock,
  FiAlertTriangle,
} from "react-icons/fi";

const PROFILE_STORAGE_KEY = "mamatrust_baby_profiles";
const LEGACY_PROFILE_KEY = "mamatrust_profile";

const SUGGESTIONS = [
  "When can I introduce egg?",
  "Should I introduce peanuts?",
  "How much peanut should I give?",
  "My baby has eczema. Does that change anything?",
  "What are the signs of an allergic reaction?",
];

const POSITION_TEXT = {
  yes: "Supports",
  depends: "With conditions",
  no: "Advises against",
  unclear: "Evidence unclear",
};

const CLASSIFICATIONS = {
  Supported: {
    label: "Supported by guidelines",
    className: "supported",
  },
  Partial: {
    label: "Partly supported",
    className: "partial",
  },
  Unsupported: {
    label: "Not supported",
    className: "unsupported",
  },
  Uncertain: {
    label: "Evidence unclear",
    className: "uncertain",
  },
};

/*
 * DEMO DATA

 */
const SAMPLE_RESPONSES = [
  {
    keywords: ["egg"],
    response_type: "answer",
    classification: "Supported",
    answer_summary:
      "Egg can generally be introduced when your baby is ready for complementary foods, usually around 6 months. Offer well-cooked egg in a soft, age-appropriate texture. Always supervise your baby while eating.",
    personal_notes: [
      "Consider your baby's age and developmental readiness.",
      "If your baby has severe eczema or an existing food allergy, ask a healthcare professional about introducing allergenic foods.",
    ],
    agreement: {
      sources_checked: 3,
      score: "Illustrative demo comparison",
      by_organisation: {
        "Example Organisation A": "yes",
        "Example Organisation B": "depends",
        "Example Organisation C": "yes",
      },
    },
    sources: [
      {
        organisation: "Example Organisation A",
        source_name: "Infant Feeding Guidance (demo)",
        publish_date: "2025",
        stance: "Placeholder source for UI testing",
        position: "yes",
        excerpt:
          "This placeholder demonstrates where a source excerpt will appear when evidence is returned by the backend.",
        source_url: "",
      },
    ],
    disclaimer:
      "Demo only. This is not a verified evidence assessment or individual medical advice.",
    seconds: 0.9,
  },
  {
    keywords: ["peanut", "peanuts"],
    response_type: "answer",
    classification: "Partial",
    answer_summary:
      "Peanut can be introduced during complementary feeding in an age-appropriate form. Never give whole peanuts to a baby because they are a choking hazard. Thick spoonfuls of peanut butter can also be unsafe. The appropriate approach may depend on your baby's allergy risk and medical history.",
    personal_notes: [
      "Use an age-appropriate preparation and supervise your baby while eating.",
      "Ask a healthcare professional for guidance if your baby has severe eczema or an existing food allergy.",
    ],
    agreement: {
      sources_checked: 2,
      score: "Illustrative demo comparison",
      by_organisation: {
        "Example Organisation A": "yes",
        "Example Organisation B": "depends",
      },
    },
    sources: [],
    disclaimer:
      "Demo only. The classification and organisation comparison are placeholders, not real evidence findings.",
    seconds: 1.1,
  },
  {
    keywords: ["eczema"],
    response_type: "answer",
    classification: "Uncertain",
    answer_summary:
      "Eczema can be relevant when assessing a baby's risk of food allergy, particularly when it is severe. The best approach depends on your baby's individual history. Speak with a qualified healthcare professional if you are concerned about introducing allergenic foods.",
    personal_notes: [
      "Tell your healthcare professional about your baby's eczema and any previous reactions to food.",
    ],
    agreement: null,
    sources: [],
    disclaimer:
      "Demo only. The uncertainty label is illustrative and does not represent a completed evidence review.",
    seconds: 0.8,
  },
  {
    keywords: ["allergic reaction", "signs", "symptoms"],
    response_type: "answer",
    classification: "Supported",
    answer_summary:
      "Possible food allergy symptoms include hives, swelling, vomiting, coughing and wheezing. A severe allergic reaction may involve difficulty breathing, tongue or throat swelling, collapse or unusual floppiness. Symptoms can occur soon after eating.",
    personal_notes: [],
    agreement: null,
    sources: [],
    disclaimer:
      "Demo only. If you suspect a severe allergic reaction in Australia, call 000 immediately and follow your emergency action plan if available.",
    seconds: 1.0,
  },
  {
    keywords: ["how much peanut", "quantity", "amount"],
    response_type: "answer",
    classification: "Uncertain",
    answer_summary:
      "The appropriate amount and preparation depend on your baby's age, readiness and allergy risk. Use a safe, age-appropriate texture, and do not give whole peanuts. For a baby with severe eczema or an existing food allergy, seek individual guidance from a healthcare professional.",
    personal_notes: [],
    agreement: null,
    sources: [],
    disclaimer:
      "Demo only. No personalised dosage or verified evidence assessment has been generated.",
    seconds: 0.8,
  },
  {
    keywords: ["vegetable", "vegetables", "fruit", "fruits", "solids"],
    response_type: "answer",
    classification: "Uncertain",
    answer_summary:
      "When your baby is developmentally ready for complementary foods, offer a variety of soft, age-appropriate foods. Introduce different tastes and textures gradually, and prepare foods to reduce choking risk. Your baby's age and feeding development matter when choosing foods.",
    personal_notes: [
      "Check your baby's feeding stage and ability to manage the texture safely.",
    ],
    agreement: null,
    sources: [],
    disclaimer:
      "Demo only. The evidence classification is illustrative, not a real assessment of guidelines.",
    seconds: 0.7,
  },
];

function formatLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStoredProfiles() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(PROFILE_STORAGE_KEY) || "[]",
    );

    if (Array.isArray(stored) && stored.length > 0) {
      return stored.map((baby, index) => ({
        ...baby,
        id: String(baby.id || baby.profile_id || `baby-${index + 1}`),
      }));
    }

    const legacy = JSON.parse(
      localStorage.getItem(LEGACY_PROFILE_KEY) || "null",
    );

    if (legacy) {
      return [
        {
          ...legacy,
          id: String(legacy.id || legacy.profile_id || "legacy-profile"),
          name: legacy.name || "My baby",
          dob: legacy.dob || legacy.baby_dob || "",
          stage: legacy.stage || legacy.feeding_stage,
          approach: legacy.approach || legacy.feeding_approach,
          familyHistory: legacy.familyHistory || legacy.family_allergy_history,
          allergies:
            legacy.allergies || legacy.known_or_suspected_allergies || [],
          answerStyle: legacy.answerStyle || legacy.answer_style || "quick",
        },
      ];
    }

    return [];
  } catch {
    return [];
  }
}

function toApiProfile(baby) {
  const allergies = baby.allergies || baby.known_or_suspected_allergies || [];

  return {
    profile_id: baby.profile_id || baby.id || "custom",
    baby_dob: baby.dob || baby.baby_dob || "",
    feeding_stage: baby.stage || baby.feeding_stage || "not_started_solids",
    feeding_approach: baby.approach || baby.feeding_approach || "unsure",
    family_allergy_history:
      (baby.familyHistory || baby.family_allergy_history) === "yes"
        ? "yes"
        : "no",
    known_or_suspected_allergies: allergies.length > 0 ? allergies : ["none"],
    answer_style: baby.answerStyle || baby.answer_style || "quick",
  };
}

function getClassification(value) {
  return CLASSIFICATIONS[value] || CLASSIFICATIONS.Uncertain;
}

function getSampleResponse(question) {
  const normalizedQuestion = question.toLowerCase();

  // Check more specific phrases before broad keywords.
  const response = SAMPLE_RESPONSES.find((item) =>
    item.keywords.some((keyword) => normalizedQuestion.includes(keyword)),
  );

  if (response) {
    return {
      ...response,
      personal_notes: [...(response.personal_notes || [])],
      sources: [...(response.sources || [])],
    };
  }

  return {
    response_type: "answer",
    classification: "Uncertain",
    answer_summary:
      "Thanks for your question! This is a sample MamaTrust response to demonstrate the chat interface. When the backend is connected, your question will be processed using the application's evidence retrieval and response system.",
    personal_notes: [],
    agreement: null,
    sources: [],
    disclaimer:
      "Demo response only. No evidence has been checked for this question.",
    seconds: 0.8,
  };
}

/* ---------- Answer display ---------- */

function AnswerContent({ data }) {
  const classification = getClassification(data.classification);
  const sources = Array.isArray(data.sources) ? data.sources : [];
  const notes = Array.isArray(data.personal_notes) ? data.personal_notes : [];
  const agreement = data.agreement;

  if (data.response_type === "escalation") {
    return (
      <div className="mt-answer">
        <div className="mt-emergency">
          <div className="mt-emergency-title">
            <FiAlertTriangle />
            <strong>{data.safety_title || "Please get help now"}</strong>
          </div>

          <p>{data.answer_summary}</p>

          <a className="mt-call-button" href="tel:000">
            Call 000
          </a>
        </div>

        {data.disclaimer && (
          <p className="mt-answer-disclaimer">{data.disclaimer}</p>
        )}
      </div>
    );
  }

  if (data.response_type === "chat" || data.response_type === "off_topic") {
    return (
      <div className="mt-answer">
        <p className="mt-answer-summary">{data.answer_summary}</p>

        {data.disclaimer && (
          <p className="mt-answer-disclaimer">{data.disclaimer}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-answer">
      <div className="mt-answer-heading">
        <span className={`mt-classification ${classification.className}`}>
          {classification.label}
        </span>

        <span
          style={{
            display: "block",
            marginTop: 5,
            color: "#89939a",
            fontSize: 10,
          }}
        >
          Demo classification — not verified evidence
        </span>
      </div>

      <p className="mt-answer-summary">{data.answer_summary}</p>

      {notes.length > 0 && (
        <div className="mt-personal-notes">
          {notes.map((note, index) => (
            <div className="mt-personal-note" key={index}>
              <FiHeart />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}

      {agreement && agreement.sources_checked && (
        <div className="mt-agreement">
          <div className="mt-agreement-heading">
            <FiShield />
            <strong>Guideline comparison</strong>
          </div>

          <p>Organisations compared: {agreement.sources_checked}</p>

          {agreement.score && (
            <span className="mt-agreement-score">{agreement.score}</span>
          )}

          {agreement.by_organisation && (
            <div className="mt-organisation-list">
              {Object.entries(agreement.by_organisation).map(
                ([organisation, position]) => (
                  <div className="mt-organisation-row" key={organisation}>
                    <span>{organisation}</span>

                    <span
                      className={`mt-position ${
                        ["yes", "depends", "no", "unclear"].includes(position)
                          ? position
                          : "unclear"
                      }`}
                    >
                      {POSITION_TEXT[position] || position}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}

      {sources.length > 0 && (
        <details className="mt-sources">
          <summary>
            <span>
              <FiShield />
              Evidence sources ({sources.length})
            </span>
            <FiChevronDown className="mt-sources-chevron" />
          </summary>

          <div className="mt-source-list">
            {sources.map((source, index) => (
              <article
                className="mt-source-card"
                key={`${source.organisation}-${index}`}
              >
                <div className="mt-source-heading">
                  <strong>{source.organisation || "Organisation"}</strong>

                  {source.position && (
                    <span
                      className={`mt-position ${
                        ["yes", "depends", "no", "unclear"].includes(
                          source.position,
                        )
                          ? source.position
                          : "unclear"
                      }`}
                    >
                      {POSITION_TEXT[source.position] || source.position}
                    </span>
                  )}
                </div>

                <p className="mt-source-meta">
                  {source.source_name || "Source details unavailable"}
                  {source.publish_date
                    ? ` · ${source.publish_date.slice(0, 4)}`
                    : ""}
                  {source.stance ? ` · ${source.stance}` : ""}
                </p>

                {source.excerpt && (
                  <blockquote className="mt-source-excerpt">
                    “{source.excerpt}”
                  </blockquote>
                )}

                {source.source_url &&
                  /^https?:\/\//i.test(source.source_url) && (
                    <a
                      className="mt-source-link"
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View original source <FiExternalLink />
                    </a>
                  )}
              </article>
            ))}
          </div>
        </details>
      )}

      <div className="mt-answer-footer">
        {data.disclaimer && <span>{data.disclaimer}</span>}

        {data.seconds != null && (
          <span className="mt-response-time">
            <FiClock /> {data.seconds}s
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Chat page ---------- */

const Chat = () => {
  const [profiles, setProfiles] = useState(getStoredProfiles);
  const [selectedId, setSelectedId] = useState("");
  const [profileConfirmed, setProfileConfirmed] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const selectedBaby = profiles.find(
    (baby) => String(baby.id) === String(selectedId),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // Refresh profiles when returning from the profile page.
  useEffect(() => {
    const refreshProfiles = () => {
      const saved = getStoredProfiles();
      setProfiles(saved);

      setSelectedId((currentId) =>
        saved.some((baby) => String(baby.id) === String(currentId))
          ? currentId
          : "",
      );

      setProfileConfirmed(false);
      setMessages([]);
      setHistory([]);
      setError("");
    };

    window.addEventListener("focus", refreshProfiles);
    window.addEventListener("storage", refreshProfiles);

    return () => {
      window.removeEventListener("focus", refreshProfiles);
      window.removeEventListener("storage", refreshProfiles);
    };
  }, []);

  const handleSelectBaby = (event) => {
    setSelectedId(event.target.value);
    setProfileConfirmed(false);
    setMessages([]);
    setHistory([]);
    setError("");
    setQuestion("");
  };

  const handleStartChat = () => {
    if (!selectedBaby) {
      setError("Please select a baby profile first.");
      return;
    }

    setProfileConfirmed(true);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        kind: "welcome",
        text: `Hello! I'm MamaTrust. Let's talk about ${
          selectedBaby.name || "your baby"
        }'s feeding journey. What would you like to know?`,
      },
    ]);
    setHistory([]);
    setError("");
  };

  const ask = async (submittedQuestion) => {
    const text = submittedQuestion.trim();

    if (!text || loading || !profileConfirmed || !selectedBaby) {
      return;
    }

    setQuestion("");
    setError("");
    setLoading(true);

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
    };

    const waitingId = `waiting-${Date.now()}`;

    setMessages((previous) => [
      ...previous,
      userMessage,
      {
        id: waitingId,
        sender: "bot",
        kind: "loading",
      },
    ]);

    try {
      let data;

      /*
       * ============================================
       * DEMO MODE
       * Uses local sample answers without a backend.
       * Remove this section when enabling the API.
       * ============================================
       */

      await new Promise((resolve) => setTimeout(resolve, 900));
      data = getSampleResponse(text);

      /*
       * ============================================
       * REAL BACKEND MODE
       * When your backend is ready:
       * 1. Remove/comment out the demo delay and
       *    data = getSampleResponse(text) above.
       * 2. Uncomment this block.
       * ============================================

      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: text,
          profile: toApiProfile(selectedBaby),
          history,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      data = await response.json();

       */

      setMessages((previous) =>
        previous.map((message) =>
          message.id === waitingId
            ? {
                id: `answer-${Date.now()}`,
                sender: "bot",
                kind: "answer",
                data,
              }
            : message,
        ),
      );

      if (
        data.response_type === "answer" ||
        data.response_type === "no_evidence"
      ) {
        setHistory((previous) => [...previous, data.resolved_question || text]);
      }
    } catch (err) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== waitingId),
      );

      setError(`Something went wrong: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    ask(question);
  };

  const handleClearChat = () => {
    if (loading) return;

    setMessages([]);
    setHistory([]);
    setError("");
    setQuestion("");
    inputRef.current?.focus();
  };

  const handleChangeBaby = () => {
    if (loading) return;

    setProfileConfirmed(false);
    setMessages([]);
    setHistory([]);
    setError("");
    setQuestion("");
  };

  return (
    <div className="mt-chat-page">
      <header className="mt-chat-header">
        <div className="mt-chat-brand-icon">
          <FiMessageCircle />
        </div>

        <div className="mt-chat-title">
          <h1>MamaTrust Assistant</h1>
          <p>Evidence-aware baby feeding guidance</p>
        </div>

        {profileConfirmed && selectedBaby && (
          <div className="mt-active-baby">
            <FiHeart />
            <span>{selectedBaby.name || "My baby"}</span>
          </div>
        )}
      </header>

      {!profileConfirmed ? (
        <section className="mt-profile-gate">
          <div className="mt-gate-icon">
            <FiHeart />
          </div>

          <h2>Who are we chatting about?</h2>

          <p>
            Select a baby's profile so MamaTrust can consider their feeding
            stage and the allergy information you've provided.
          </p>

          {profiles.length > 0 ? (
            <>
              <label htmlFor="mt-baby-select">Select baby profile</label>

              <select
                id="mt-baby-select"
                value={selectedId}
                onChange={handleSelectBaby}
              >
                <option value="">Choose a baby...</option>

                {profiles.map((baby) => (
                  <option key={baby.id} value={baby.id}>
                    {baby.name || "My baby"}
                  </option>
                ))}
              </select>

              {selectedBaby && (
                <div className="mt-selected-profile-summary">
                  <div>
                    <span>Date of birth</span>
                    <strong>
                      {selectedBaby.dob ||
                        selectedBaby.baby_dob ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>Feeding stage</span>
                    <strong>
                      {formatLabel(
                        selectedBaby.stage ||
                          selectedBaby.feeding_stage ||
                          "Not specified",
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Feeding approach</span>
                    <strong>
                      {formatLabel(
                        selectedBaby.approach ||
                          selectedBaby.feeding_approach ||
                          "Not specified",
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Family allergy history</span>
                    <strong>
                      {(selectedBaby.familyHistory ||
                        selectedBaby.family_allergy_history) === "yes"
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Known or suspected allergies</span>
                    <strong>
                      {(
                        selectedBaby.allergies ||
                        selectedBaby.known_or_suspected_allergies ||
                        []
                      )
                        .filter((allergy) => allergy !== "none")
                        .map(formatLabel)
                        .join(", ") || "None listed"}
                    </strong>
                  </div>

                  <div>
                    <span>Answer style</span>
                    <strong>
                      {formatLabel(
                        selectedBaby.answerStyle ||
                          selectedBaby.answer_style ||
                          "quick",
                      )}
                    </strong>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-chat-error" role="alert">
                  <FiAlertTriangle />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                className="mt-start-chat-button"
                disabled={!selectedBaby}
                onClick={handleStartChat}
              >
                <FiMessageCircle />
                Start chatting
              </button>

              <Link to="/profile" className="mt-profile-edit-link">
                <FiPlus /> Add or manage baby profiles
              </Link>
            </>
          ) : (
            <div className="mt-no-profiles">
              <p>You need to create a baby profile before chatting.</p>

              <Link to="/profile" className="mt-start-chat-button">
                <FiPlus />
                Create baby profile
              </Link>
            </div>
          )}

          <p className="mt-profile-hint">
            Your profile selection is used to prepare the chat. You can switch
            profiles before starting another chat.
          </p>
        </section>
      ) : (
        <>
          <div className="mt-chat-toolbar">
            <div>
              <span className="mt-chat-status-dot" />
              Demo mode · Sample answers
            </div>

            <div className="mt-chat-toolbar-actions">
              <button
                type="button"
                disabled={loading}
                onClick={handleChangeBaby}
              >
                Change baby
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleClearChat}
              >
                New chat
              </button>
            </div>
          </div>

          <main className="mt-chat-conversation">
            {messages.length === 0 ? (
              <div className="mt-chat-welcome">
                <div className="mt-welcome-icon">
                  <FiHeart />
                </div>

                <h2>How can I help today?</h2>

                <p>
                  Ask a feeding question to explore the MamaTrust interface. The
                  responses currently use sample data, not live evidence
                  retrieval.
                </p>

                <div className="mt-suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={loading}
                      onClick={() => ask(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-message-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mt-message-row ${
                      message.sender === "user" ? "mt-user-row" : "mt-bot-row"
                    }`}
                  >
                    {message.sender === "bot" && (
                      <div className="mt-message-avatar mt-bot-avatar">
                        <FiHeart />
                      </div>
                    )}

                    <div className="mt-message-body">
                      {message.sender === "user" ? (
                        <div className="mt-user-bubble">{message.text}</div>
                      ) : message.kind === "loading" ? (
                        <div className="mt-bot-bubble mt-typing">
                          <span className="mt-spinner" />
                          Preparing a sample answer...
                          <small>
                            Demo mode is using local example responses.
                          </small>
                        </div>
                      ) : message.kind === "welcome" ? (
                        <div className="mt-bot-bubble">{message.text}</div>
                      ) : (
                        <div className="mt-bot-bubble">
                          <AnswerContent data={message.data} />
                        </div>
                      )}
                    </div>

                    {message.sender === "user" && (
                      <div className="mt-message-avatar mt-user-avatar">
                        <FiUser />
                      </div>
                    )}
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            )}

            {error && (
              <div className="mt-chat-error" role="alert">
                <FiAlertTriangle />
                <span>{error}</span>
              </div>
            )}
          </main>

          <div className="mt-chat-bottom">
            <div className="mt-suggestions mt-suggestions-inline">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => ask(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form className="mt-chat-input" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={`Ask about ${
                  selectedBaby?.name || "your baby"
                }'s feeding...`}
                disabled={loading}
                aria-label="Your question"
              />

              <button
                type="submit"
                disabled={!question.trim() || loading}
                aria-label="Send question"
              >
                <FiSend />
              </button>
            </form>

            <p className="mt-chat-disclaimer">
              Sample responses are for interface testing only. For medical
              concerns, seek advice from a qualified healthcare professional.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
