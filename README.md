# AI Study Buddy

An AI-powered study assistant for engineering students. Upload your lecture notes (PDF or TXT) and instantly get a summary, flashcards and a quiz, then track which topics you keep getting wrong.


## Features
- Secure signup and login (JWT + bcrypt password hashing)
- Upload PDF or TXT notes with automatic text extraction
- AI-generated summary, 8 flashcards and a 6-question quiz (Google Gemini)
- Interactive flip-cards and a scored quiz
- Weak-topic tracking: accuracy per topic across all quiz attempts

## Tech Stack
- Frontend: React (Vite), React Router, Axios
- Backend: Node.js, Express
- Database: MongoDB Atlas (Mongoose)
- AI: Gemini API
- Deployment: Vercel (frontend), Render (backend)

## How it works
1. User uploads notes, the server extracts the text and stores it
2. The text is sent to the AI with a structured prompt, and the JSON reply is validated
3. Quiz answers are marked on the server, and topic accuracy is aggregated

## Run locally
1. Clone the repo
2. `cd server && npm install`, create `.env` with MONGO_URI, JWT_SECRET, GEMINI_API_KEY, GEMINI_MODEL, then `npm run dev`
3. `cd client && npm install && npm run dev`

## Future improvements
- Support scanned PDFs with OCR
- Spaced-repetition flashcard reminders
- Study-group sharing