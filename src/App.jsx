import { useState } from 'react'

function App() {
  // Chat States
  const [role, setRole] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)

  // Admin States
  const [adminFile, setAdminFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)

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

  // --- Admin Logic ---
  const handleUpload = async () => {
    if (!adminFile || !role) {
      alert("Please select a department and a .txt file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Processing upload...");

    const formData = new FormData();
    formData.append("file", adminFile);
    formData.append("role", role);

    try {
      const res = await fetch("https://deps-chatbot.onrender.com/admin/upload", {
        method: "POST",
        // Note: Do NOT set Content-Type header when sending FormData; 
        // the browser needs to set it automatically with the boundary string.
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadStatus(`✅ Success: ${data.message}`);
        setAdminFile(null); // Clear file input
      } else {
        setUploadStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadStatus("❌ Upload failed. check backend connection.");
    } finally {
      setIsUploading(false);
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
          height: 350,
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

      {/* --- ADMIN PANEL SECTION --- */}
      <div style={{ 
        marginTop: 50, 
        padding: 20, 
        border: "2px dashed #bbb", 
        borderRadius: 10, 
        backgroundColor: "#fff" 
      }}>
        <h3 style={{ marginTop: 0 }}>🛠️ Admin: Update Knowledge Base</h3>
        <p style={{ fontSize: "0.85em", color: "#666" }}>
          Upload a <strong>.txt</strong> file to add new info to the <strong>{role || "selected"}</strong> department.
        </p>
        
        <input 
          type="file" 
          accept=".txt" 
          onChange={(e) => setAdminFile(e.target.files[0])}
          style={{ marginBottom: 10, display: "block" }}
        />
        
        <button 
          onClick={handleUpload}
          disabled={isUploading}
          style={{ 
            padding: "10px 15px", 
            backgroundColor: isUploading ? "#ccc" : "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: "5px", 
            cursor: isUploading ? "not-allowed" : "pointer" 
          }}
        >
          {isUploading ? "Uploading..." : `Upload to ${role || "Department"}`}
        </button>

        {uploadStatus && (
          <p style={{ 
            marginTop: 10, 
            fontSize: "0.9em", 
            fontWeight: "bold", 
            color: uploadStatus.includes("✅") ? "green" : "red" 
          }}>
            {uploadStatus}
          </p>
        )}
      </div>
    </div>
  )
}

export default App