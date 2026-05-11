import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import multer from "multer"; // Added for file uploads

console.log("🔥 AI BACKEND WITH DYNAMIC UPLOAD & MEMORY RUNNING");

const app = express();

// 1. Initialize Clients
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Configure Multer to store files in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

// 2. Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// 3. Health Check Route
app.get("/", (req, res) => {
  res.send("Backend is working! Admin upload and Vector Search active.");
});

// 4. ADMIN ROUTE: Upload and Embed New Files
// This route replaces the need to run ingest.js manually
app.post("/admin/upload", upload.single("file"), async (req, res) => {
  const { role } = req.body;
  const file = req.file;

  if (!file || !role) {
    return res.status(400).json({ error: "Missing file or role selection." });
  }

  try {
    console.log(`📥 Processing new file upload for ${role}...`);
    const content = file.buffer.toString("utf-8");

    // STEP 1: Create embedding for the new content
    const embeddingResponse = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // STEP 2: Save to Supabase 'documents' table
    const { error } = await supabase.from("documents").insert({
      content,
      role,
      embedding,
    });

    if (error) throw error;

    res.json({ message: `Knowledge base updated successfully for ${role}!` });
  } catch (error) {
    console.error("❌ UPLOAD ERROR:", error);
    res.status(500).json({ error: "Failed to process and save the file." });
  }
});

// 5. Main Chat Route (Vector RAG + Memory Logic)
app.post("/chat", async (req, res) => {
  const { message, role, history = [] } = req.body;

  try {
    console.log(`🔍 Processing request for ${role} with memory...`);

    // STEP A: Create Embedding for user query
    const embedRes = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: message
    });
    const queryVector = embedRes.data[0].embedding;

    // STEP B: Search Supabase
    // Note: match_threshold is set to 0.3 as per your recent project adjustments
    const { data: matchedDocs, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_threshold: 0.3, 
      match_count: 5,       
      filter_role: role
    });

    if (searchError) throw searchError;

    // STEP C: Combine found snippets
    const knowledge = matchedDocs && matchedDocs.length > 0 
      ? matchedDocs.map(d => d.content).join("\n---\n")
      : "No specific internal data found for this query.";

    // STEP D: Prepare Conversation History (Last 10 messages)
    const shortHistory = history.slice(-10);

    // STEP E: Construct the Messages array
    const messages = [
      { 
        role: "system", 
        content: `You are a professional assistant for the ${role} department. 
        
        GUIDELINES:
        0. If the user is just introducing themselves, acknowledge them warmly.
        1. CORE LOGIC: Match USER'S INTENT with the CONTEXT provided. Treat synonyms and different phrasing as the same concept.
        2. STRICTNESS: If the INTERNAL KNOWLEDGE BASE below is empty, state that you do not have internal information. Do not invent policies.
        3. SOURCE ATTRIBUTION: Clearly credit the source if found.

        INTERNAL KNOWLEDGE BASE:
        ${knowledge}` 
      },
      ...shortHistory,
      { role: "user", content: message }
    ];

    // STEP F: Send to OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: messages,
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ reply: "I'm having trouble searching my internal brain right now." });
  }
});

// 6. Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});