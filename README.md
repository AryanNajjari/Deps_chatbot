# 🤖 Depts-Chatbot: AI-Powered Internal Knowledge Assistant

An intelligent, department-aware chatbot that uses **RAG (Retrieval-Augmented Generation)** to provide answers based on real employee experiences. Instead of general AI guesses, this bot "reads" internal documentation to give context-specific advice.

---

## 🌟 Overview

This application allows users to select their department (HR, Finance, or Engineering) and ask questions. The AI then scans a **Vector Database** of specific employee-written case studies and challenges to provide an answer that is grounded in the company's actual history.

### 🚀 [Live Demo](https://deps-chatbot.vercel.app/)

---

## 🛠️ How it Works (The Tech Stack)

This is a full-stack application built with a modern web architecture:

* **Frontend:** React.js (Vite) hosted on **Vercel**. It manages user roles and provides a real-time chat interface.
* **Backend:** Node.js & Express hosted on **Render**. It processes natural language queries and coordinates the RAG workflow.
* **AI Engine:** OpenAI's `gpt-4o-mini` for chat completions and `text-embedding-3-small` for semantic search.
* **Knowledge Base (Vector RAG):** * **Supabase (PostgreSQL):** Uses the `pgvector` extension to store and query high-dimensional embeddings.
    * **Semantic Search:** Instead of simple keyword matching, the system finds information based on the mathematical "meaning" of the user's question.

---

## 📁 Project Structure

```text
├── server/                # Node.js Backend
│   ├── data/              # Source Knowledge Base (.txt files for ingestion)
│   ├── index.js           # Main API logic & Supabase Vector search
│   ├── ingest.js          # Script to convert text files into database vectors
│   └── .env               # Private API keys (Supabase & OpenAI)
├── src/                   # React Frontend
│   ├── App.jsx            # Chat UI & API communication
│   └── main.jsx           # Entry point
└── README.md              # You are here!