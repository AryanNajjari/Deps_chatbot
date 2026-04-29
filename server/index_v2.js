import "dotenv/config" 
import express from "express"
import cors from "cors"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

console.log("🔥 AI BACKEND WITH VECTOR DB RUNNING")

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
  res.send("Backend is working with Vector Search!")
})

// 4. Main Chat Route (The Vector RAG Logic)
app.post("/chat", async (req, res) => {
  const { message, role } = req.body;

  try {
    console.log(`🔍 Searching knowledge base for ${role}...`);

    // STEP A: Turn the user's question into a mathematical vector (Embedding)
    const embedRes = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: message
    });
    const queryVector = embedRes.data[0].embedding;

    // STEP B: Search Supabase for the most relevant content snippets
    // We call the 'match_documents' function we created in the Supabase SQL editor
    const { data: matchedDocs, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_threshold: 0.3, // Adjust this (0 to 1) to be stricter or looser
      match_count: 5,       // Number of text snippets to give the AI
      filter_role: role
    });

    if (searchError) throw searchError;

    // STEP C: Combine the found snippets into one block of text
    const knowledge = matchedDocs && matchedDocs.length > 0 
      ? matchedDocs.map(d => d.content).join("\n---\n")
      : "No specific internal data found for this query.";

    // STEP D: Send the question + the specific knowledge to OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: `You are an expert assistant for the ${role} department. 
          Use the following internal documents to answer the user's question. 
          If the answer isn't in the text, provide a general answer based on ${role} best practices.
          
          INTERNAL KNOWLEDGE BASE:
          ${knowledge}` 
        },
        { role: "user", content: message }
      ],
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