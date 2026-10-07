import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiMessageCircle, FiUser, FiHeart, FiAlertTriangle } from "react-icons/fi";
import axios from "axios";
import { ClipLoader } from "react-spinners";

// Backend URL - change this if you deploy the API somewhere other than localhost.
const API_BASE_URL = "http://localhost:8000";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hi! I'm MamaTrust 💙 How can I help you with your little one's feeding and nutrition today?",
    },
  ]);

  const messagesEndRef = useRef(null);

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentMessage = message;
    setMessage("");
    setIsLoading(true);

    try {
      // Calls the real backend - /score/demo scores the claim against the
      // local sample_chunks.json. Once Gayathri's real retrieval is wired
      // in (Week 7), this can switch to /score with real retrieved chunks
      // instead of the demo endpoint.
      const response = await axios.post(
        `${API_BASE_URL}/score/demo`,
        null,
        { params: { claim: currentMessage } }
      );

      const data = response.data;

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        // Backend sends "Supported"/"Unsupported"/"Uncertain" (capitalized);
        // CSS classes are lowercase, so convert here to match.
        status: data.verdict ? data.verdict.toLowerCase() : undefined,
        text: data.explanation,
        sources: data.sources || [],
        escalate: data.escalate,
        escalationReason: data.escalation_reason,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling MamaTrust API:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: "Sorry, I'm having trouble reaching the MamaTrust service right now. Please check that the backend is running and try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-page">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-icon">
          <FiMessageCircle />
        </div>

        <div>
          <h2>MamaTrust Assistant</h2>
          <p>Your AI parenting & feeding assistant</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-row ${
              msg.sender === "user" ? "user-message" : "bot-message"
            }`}
          >
            {/* Bot avatar */}
            {msg.sender === "bot" && (
              <div className="message-avatar bot-avatar">
                <FiHeart />
              </div>
            )}

            <div className="message-content">
              <div className="message-bubble">
                {msg.sender === "bot" && msg.status && (
                  <span className={`response-tag ${msg.status}`}>
                    {msg.status}
                  </span>
                )}

                {msg.sender === "bot" && msg.escalate && (
                  <div className="escalation-banner">
                    <FiAlertTriangle />
                    <span>
                      {msg.escalationReason ||
                        "Please consult a healthcare professional about this."}
                    </span>
                  </div>
                )}

                <div>{msg.text}</div>

                {/* Source citations - links back to the real guideline pages */}
                {msg.sender === "bot" && msg.sources && msg.sources.length > 0 && (
                  <div className="message-sources">
                    <p className="sources-label">Sources:</p>
                    <ul>
                      {msg.sources.map((src) => (
                        <li key={src.chunk_id}>
                          <a href={src.source_url} target="_blank" rel="noopener noreferrer">
                            {src.source_name}
                          </a>
                          {src.stance && (
                            <span className="source-stance"> — {src.stance}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* User avatar */}
            {msg.sender === "user" && (
              <div className="message-avatar user-avatar-chat">
                <FiUser />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator while waiting for the backend */}
        {isLoading && (
          <div className="message-row bot-message">
            <div className="message-avatar bot-avatar">
              <FiHeart />
            </div>
            <div className="message-content">
              <div className="message-bubble">
                <ClipLoader size={16} color="#888" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      {/* Suggested Questions */}
      <div className="suggested-questions">
        <button
          onClick={() =>
            setMessage("What foods are suitable for my baby's age?")
          }
        >
          🥣 Foods for my baby
        </button>

        <button
          onClick={() => setMessage("How should I introduce solid foods?")}
        >
          🍎 Introducing solids
        </button>

        <button onClick={() => setMessage("What are common food allergies?")}>
          🥜 Food allergies
        </button>
      </div>

      {/* Message Input */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Ask MamaTrust about feeding or nutrition..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
        />

        <button type="submit" disabled={!message.trim() || isLoading}>
          <FiSend />
        </button>
      </form>

      {/* Disclaimer */}
      <p className="chat-disclaimer">
        MamaTrust provides general feeding and nutrition information. For
        medical concerns, consult a qualified healthcare professional.
      </p>
    </div>
  );
};

export default Chat;