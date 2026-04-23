import { useState } from 'react'

function App() {
  const [role, setRole] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)

  const handleAsk = async () => {
    // 1. Validation: Ensure both role and question exist
    if (!role || !question.trim()) {
      alert("Please select a role and type a question.");
      return;
    }

    // 2. Capture the current question in a variable before clearing state
    const currentQuestion = question;
    const userMessage = { sender: "user", text: currentQuestion };

    // 3. Update UI to show user's message and clear input
    setMessages((prev) => [...prev, userMessage]);
    setQuestion(""); 
    setIsTyping(true);

    try {
      console.log("🚀 SENDING TO BACKEND...");

      const res = await fetch("http://127.0.0.1:5001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: currentQuestion, // Use the captured variable here
          role: role
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      console.log("📦 RESPONSE DATA:", data);

      const botMessage = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("❌ ERROR:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to server. Make sure the backend is running on port 5000." }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div style={{ 
      padding: 20, 
      maxWidth: 600, 
      margin: "0 auto", 
      fontFamily: "sans-serif" 
    }}>
      <h1>Company Chatbot</h1>

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

      <div
        style={{
          border: "1px solid #ccc",
          padding: 15,
          height: 400,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          borderRadius: 8,
          backgroundColor: "#f9f9f9"
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#888", textAlign: "center" }}>No messages yet. Select a role and ask something!</p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              background: msg.sender === "user" ? "#007bff" : "#e5e5ea",
              color: msg.sender === "user" ? "white" : "black",
              padding: "10px 15px",
              borderRadius: "18px",
              maxWidth: "80%",
              wordBreak: "break-word"
            }}
          >
            {msg.text}
          </div>
        ))}

        {isTyping && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#e5e5ea",
              padding: "10px 15px",
              borderRadius: "18px",
              fontStyle: "italic",
              color: "#555"
            }}
          >
            AI is thinking...
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <input
          type="text"
          placeholder="Type your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
          style={{ 
            flex: 1, 
            padding: "10px", 
            borderRadius: "5px", 
            border: "1px solid #ccc" 
          }}
        />
        <button 
          onClick={handleAsk}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default App