# 🤖 Depts-Chatbot: AI-Powered Internal Knowledge Assistant

An intelligent, department-aware chatbot that uses **RAG (Retrieval-Augmented Generation)** to provide answers based on real employee experiences. Instead of general AI guesses, this bot "reads" internal documentation to give context-specific advice.

---

## 🌟 Overview

This application allows users to select their department (HR, Finance, or Engineering) and ask questions. The AI then scans a knowledge base of specific employee-written case studies and challenges to provide an answer that is grounded in the company's actual history.

### 🚀 [Live Demo](https://deps-chatbot.vercel.app/)

---

## 🛠️ How it Works (The Tech Stack)

This is a full-stack application built with a modern web architecture:

* **Frontend:** React.js (Vite) hosted on **Vercel**. It manages user roles and provides a real-time chat interface.
* **Backend:** Node.js & Express hosted on **Render**. It acts as a secure gateway to the OpenAI API.
* **AI Engine:** OpenAI's `gpt-4o-mini` model.
* **Knowledge Base (RAG):** A custom file-system-based retrieval system. The backend reads `.txt` files from departmental folders to "inject" context into the AI's prompt.



---

## 📁 Project Structure

```text
├── server/              # Node.js Backend
│   ├── data/            # Knowledge Base (.txt files organized by dept)
│   ├── index.js         # Main logic & RAG implementation
│   └── .env             # Private API keys (hidden from GitHub)
├── src/                 # React Frontend
│   ├── App.jsx          # Chat UI & API communication
│   └── main.jsx         # Entry point
└── README.md            # You are here!