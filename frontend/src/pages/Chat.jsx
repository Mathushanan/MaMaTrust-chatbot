import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiMessageCircle, FiUser, FiHeart } from "react-icons/fi";

const Chat = () => {
  const [message, setMessage] = useState("");

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
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentMessage = message;
    setMessage("");

    // Temporary fake AI response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        status: "supported",
        text: `Thanks for your question! MamaTrust will provide guidance about "${currentMessage}".`,
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
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

                <div>{msg.text}</div>
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
        />

        <button type="submit" disabled={!message.trim()}>
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
