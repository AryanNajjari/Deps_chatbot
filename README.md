# 🤖 Depts-Chatbot: AI-Powered Internal Knowledge Assistant

An intelligent, department-aware chatbot that uses **RAG (Retrieval-Augmented Generation)** to provide answers based on real company documentation. Instead of general AI guesses, this bot "reads" internal knowledge files to provide grounded, context-specific advice.

---

## 🌟 Overview

This application allows users to select their department (HR, Finance, or Engineering) and ask questions. The AI then scans a **Supabase Vector Database** to find the most relevant internal information to answer the user's query accurately.

### 🚀 [Live Demo](https://deps-chatbot.vercel.app/)

---

## 🏗️ The Ecosystem Architecture

This project is part of a **Multi-App System** designed for security and scalability:

1. **User Chatbot (This Repo):** The public-facing interface for employees to ask questions. Admin functions have been decoupled to ensure security.
2. **[Admin Knowledge Portal](https://github.com/AryanNajjari/deps-admin):** A separate, private dashboard used to upload, view, and delete knowledge base files.
3. **Unified Backend:** A centralized Node.js API hosted on Render that serves both the User and Admin applications.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite) hosted on **Vercel**.
* **Backend:** Node.js & Express hosted on **Render**.
* **AI Engine:** OpenAI `gpt-4o-mini` and `text-embedding-3-small` (for embeddings).
* **Vector Database:** **Supabase (PostgreSQL)** using `pgvector` for semantic search.

---

## 📁 Project Structure (Chatbot Client)

```text
├── src/                   # React Frontend
│   ├── App.jsx            # User Chat Interface (Cleaned of admin logic)
│   └── main.jsx           # Entry point
├── public/                # Static assets (logos, icons)
└── README.md              # Project Documentation