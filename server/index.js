import "dotenv/config" 
import express from "express"
import cors from "cors"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

console.log("🔥 AI BACKEND WITH CONVERSATION MEMORY RUNNING")

const app = express()

// 1. Initialize Clients
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// 2. Middleware
app.use(cors({ origin: "*" }))
app.use(express.json())

// 3. Health Check Route
app.get("/", (req, res) => {
  res.send("Backend is working with Vector Search and Memory!")
})

// 4. Main Chat Route (Vector RAG + Memory Logic)
app.post("/chat", async (req, res) => {
  // We now accept 'history' from the frontend request body
  const { message, role, history = [] } = req.body;

  try {
    console.log(`🔍 Processing request for ${role} with memory...`);

    // STEP A: Turn the user's question into a mathematical vector (Embedding)
    const embedRes = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: message
    });
    const queryVector = embedRes.data[0].embedding;

    // STEP B: Search Supabase for the most relevant content snippets
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

    // STEP D: Prepare the Conversation History
    // We only take the last 10 messages to keep the context clean and cheap (History Slicing)
    const shortHistory = history.slice(-10);

    // STEP E: Construct the Multi-Message Array
    const messages = [
  { 
    role: "system", 
    content: `You are a strict internal assistant for the ${role} department. 
    
    RULES:
    1. ONLY use the provided INTERNAL KNOWLEDGE BASE to answer.
    2. If the answer is not in the text, say: "I'm sorry, I don't have information on that in our internal files."
    3. DO NOT use your own outside knowledge.
    4. ALWAYS mention specific names, files, or departments found in the text (e.g., "According to James Adamson...").
    
    INTERNAL KNOWLEDGE BASE:
    ${knowledge}` 
  },
  ...shortHistory,
  { role: "user", content: message }
];

    // STEP F: Send everything to OpenAI
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

// 5. Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})