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
      match_threshold: 0.25, 
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
    content: `You are a professional assistant for the ${role} department. 
    
    GUIDELINES:
    0. If the user is just introducing themselves (e.g., "I'm David" or saying "Hi,") acknowledge them warmly without searching for them in the documents unless they specifically ask "Who am I?".
    1. CORE LOGIC (SEMANTIC REASONING):
       - Your primary goal is to match the USER'S INTENT with the CONTEXT provided below.
       - Do not be restricted by exact wording. Treat synonyms, different parts of speech (e.g., verbs vs nouns), and antonymous phrases (e.g., "not happy" vs "sad") as the same concept.
       - If the internal documents discuss a topic using different terminology than the user, bridge that gap in your answer.

    2. STRICTNESS & GROUNDING:
       - If the "INTERNAL KNOWLEDGE BASE" section below is empty or labeled "NO DATA FOUND," you MUST state that you do not have internal information on that topic.
       - Do NOT use your own general training to invent policies or procedures that are not in the provided text.

    3. SOURCE ATTRIBUTION:
       - When an answer is found, clearly credit the person, file, or department mentioned in the text.
       - Example format: "According to [Source Name]..."

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