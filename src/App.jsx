import { useState } from 'react'

function App() {
  // Chat States
  const [role, setRole] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)

  // --- Chat Logic ---
  const handleAsk = async () => {
    if (!role || !question.trim()) {
      alert("Please select a role and type a question.");
      return;
    }

    const currentQuestion = question;
    const userMessage = { sender: "user", text: currentQuestion };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setQuestion(""); 
    setIsTyping(true);

    try {
      const historyForBackend = messages.map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text
      }));

      const res = await fetch("https://deps-chatbot.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentQuestion,
          role: role,
          history: historyForBackend
        })
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data = await res.json();
      const botMessage = { sender: "bot", text: data.reply };
      setMessages([...updatedMessages, botMessage]);

    } catch (error) {
      console.error("❌ ERROR:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to server. Check your backend connection." }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Company Chatbot</h1>

      {/* Department Selection */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 5 }}><strong>Select Department:</strong></label>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          style={{ padding: "8px", width: "100%" }}
        >
          <option value="">--Choose Role--</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Engineering">Engineering</option>
        </select>
      </div>

      {/* Chat Window */}
      <div style={{
          border: "1px solid #ccc",
          padding: 15,
          height: 450, // Increased height slightly since admin panel is gone
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          borderRadius: 8,
          backgroundColor: "#f9f9f9"
      }}>
        {messages.length === 0 && (
          <p style={{ color: "#888", textAlign: "center" }}>No messages yet. Select a role and ask something!</p>
        )}

        {messages.map((msg, index) => (
          <div key={index} style={{
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              background: msg.sender === "user" ? "#007bff" : "#e5e5ea",
              color: msg.sender === "user" ? "white" : "black",
              padding: "10px 15px",
              borderRadius: "18px",
              maxWidth: "80%",
              wordBreak: "break-word"
          }}>
            {msg.text}
          </div>
        ))}

        {isTyping && (
          <div style={{ alignSelf: "flex-start", background: "#e5e5ea", padding: "10px 15px", borderRadius: "18px", fontStyle: "italic", color: "#555" }}>
            AI is thinking...
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <input
          type="text"
          placeholder="Type your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
          style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button 
          onClick={handleAsk}
          style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default App