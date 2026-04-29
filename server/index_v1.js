import "dotenv/config" 
import express from "express"
import cors from "cors"
import OpenAI from "openai"
import fs from "fs"
import path from "path"

console.log("🔥 OPENAI BACKEND RUNNING")

const app = express()

app.use(cors({ origin: "*" }))
app.use(express.json())

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.get("/", (req, res) => {
  res.send("Backend is working!")
})

const getKnowledgeBase = (role) => {
  try {
    // This creates a path to specific department folder
    const folderPath = path.join(process.cwd(), "data", role);
    
    // This reads the names of all files in that folder
    const files = fs.readdirSync(folderPath);
    
    let combinedContent = "";

    // Loop through each file and add its text to the "brain"
    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, "utf8");
      combinedContent += `\n--- SOURCE FILE: ${file} ---\n${content}\n`;
    });

    return combinedContent;
  } catch (error) {
    console.error("Error reading knowledge base:", error);
    return "No specific departmental data found.";
  }
}
app.post("/chat", async (req, res) => {
  const { message, role } = req.body;

  // 1. Get the real data from your .txt files
  const knowledge = getKnowledgeBase(role);

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: `You are an expert assistant for the ${role} department. 
          Use the following internal employee experiences to answer the user's question. 
          
          GUIDELINES:
          1. If the answer is in the provided text, summarize it.
          2. Always mention which employee(s) or file(s) the information came from.
          3. If the answer is NOT in the text, say: "I couldn't find a specific internal case for this, but based on general ${role} practices..."
          
          INTERNAL KNOWLEDGE BASE:
          ${knowledge}` 
        },
        { role: "user", content: message }
      ],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error("🔥 Error:", error);
    res.status(500).json({ reply: "Error with AI response." });
  }
});

app.listen(5001, () => {
  console.log("Server running on port 5001")
})