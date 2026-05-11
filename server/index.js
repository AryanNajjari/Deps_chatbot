import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

console.log("🚀 BACKEND LIVE: CHAT + ADMIN MANAGEMENT ACTIVE");

const app = express();

// 1. Initialize Clients
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Configure Multer for file uploads (stored in memory)
const upload = multer({ storage: multer.memoryStorage() });

// 2. Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// 3. Health Check Route
app.get("/", (req, res) => {
  res.send("Backend is fully operational: Chat, Upload, List, and Delete routes active.");
});

// --- ADMIN ROUTES (For the Admin Portal) ---

// A. UPLOAD: Embed and save a new file
app.post("/admin/upload", upload.single("file"), async (req, res) => {
  const { role } = req.body;
  const file = req.file;

  if (!file || !role) {
    return res.status(400).json({ error: "Missing file or role selection." });
  }

  try {
    const content = file.buffer.toString("utf-8");

    // Create embedding
    const embeddingResponse = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // Save to Supabase
    const { error } = await supabase.from("documents").insert({
      content,
      role,
      embedding,
    });

    if (error) throw error;
    res.json({ message: `Success! Knowledge added to ${role}.` });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Failed to process and save file." });
  }
});

// B. LIST: Get all documents stored in the database
app.get("/admin/documents", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, content, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch documents list." });
  }
});

// C. DELETE: Remove a specific document by ID
app.delete("/admin/documents/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Document deleted successfully." });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete document." });
  }
});

// --- CHAT ROUTE (For the Chatbot Site) ---

app.post("/chat", async (req, res) => {
  const { message, role, history = [] } = req.body;

  try {
    // Generate query embedding
    const embedRes = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: message
    });
    const queryVector = embedRes.data[0].embedding;

    // Vector Search in Supabase
    const { data: matchedDocs, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_threshold: 0.3, 
      match_count: 5,       
      filter_role: role
    });

    if (searchError) throw searchError;

    const knowledge = matchedDocs && matchedDocs.length > 0 
      ? matchedDocs.map(d => d.content).join("\n---\n")
      : "No internal data found.";

    const messages = [
      { 
        role: "system", 
        content: `You are a assistant for the ${role} department. Use the following context:
        ${knowledge}` 
      },
      ...history.slice(-10),
      { role: "user", content: message }
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: messages,
    });

    res.json({ reply: response.choices[0].message.content });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ reply: "Search error occurred." });
  }
});

// 6. Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});