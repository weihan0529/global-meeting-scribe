# Unisono – Real-Time Meeting Assistant

Unisono (global-meeting-scribe) is a modern, AI-powered meeting assistant that helps you record, transcribe, translate, summarize, and export your meetings with ease.  
It features a React/TypeScript frontend, a Django/Python backend, and leverages state-of-the-art AI models for speech processing and insights.

---

## 🚀 Features

- **Batch Audio Recording & Processing**: Record audio in batches for efficient, resource-friendly transcription and analysis.
- **Speaker Diarization**: Automatically detects and labels different speakers.
- **Accurate Transcription**: Uses Whisper for high-quality speech-to-text in multiple languages.
- **Intelligent Translation**: Translates transcripts into your chosen language, with smart pivoting if direct translation is unavailable.
- **AI-Powered Summaries & Insights**: Get concise meeting summaries and actionable insights using Google Gemini.
- **Live Editing**: Edit summaries and speaker names directly in the UI.
- **PDF Export**: Export meeting notes, summaries, and insights as a branded PDF.
- **Meeting History**: Save and revisit past meetings, powered by MongoDB.
- **Multi-language Support**: Transcribe and translate in many languages.
- **Responsive UI**: Built with React, Tailwind CSS, and shadcn/ui for a seamless experience on all devices.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, jsPDF, html2canvas, Lucide-react
- **Backend**: Django, Django Channels (WebSocket), Daphne (ASGI), Python
- **AI Models**: pyannote (diarization), Whisper (transcription), Helsinki-NLP (translation), Google Gemini (insights)
- **Database**: MongoDB Atlas (via PyMongo)
- **Communication**: WebSocket (real-time), REST API (CRUD for meetings/history)

---

## 🖥️ Local Development

### Prerequisites

- Node.js & npm
- Python 3.9+
- MongoDB Atlas account (or local MongoDB)
- [HuggingFace account](https://huggingface.co/) (for model access)

### 1. Clone the Repository

```sh
git clone https://github.com/weihan0529/global-meeting-scribe
cd global-meeting-scribe
```

### 2. Install Frontend Dependencies

```sh
npm install
```

### 3. Start the Frontend

```sh
npm run dev
```

### 4. Backend Setup

- Create a Python virtual environment and activate it.
- Install backend dependencies:

```sh
pip install -r requirements.txt
```

- **Important:**  
  Before running the backend, you must manually accept the terms for the required HuggingFace models:
  1. Visit https://huggingface.co/pyannote/speaker-diarization-3.1 and click "Accept".
  2. Visit https://huggingface.co/pyannote/segmentation-3.0 and click "Accept".

- Configure your MongoDB connection string in the backend settings.

- Start the backend server:

```sh
python unisono_backend/manage.py runserver
# or, for ASGI/WebSocket support:
python -m daphne unisono_backend.unisono_backend.asgi:application
```

### 5. Start Using Unisono

- Open your browser and go to the frontend URL (usually http://localhost:5173).
- Start a meeting, record audio, and explore all features!

---

## 🌐 Deployment

- Deploy the frontend using [Lovable](https://lovable.dev/) or your preferred static hosting.
- Deploy the backend on a server with Python, Django, and Daphne support.
- Set up environment variables for production (MongoDB URI, secret keys, etc.).

---

## 📝 Documentation

- **Architecture**:  
  - Batch audio processing pipeline (pyannote, Whisper, Helsinki-NLP, Gemini)
  - WebSocket for real-time updates
  - MongoDB for meeting storage

- **Key Features**:  
  - Batch-based audio upload and processing
  - Multi-language transcription and translation
  - Editable summaries and speaker names
  - PDF export with branding

- **Testing**:  
  - Unit tests for backend processing
  - User acceptance survey for feature satisfaction

---

## 📄 License

This project is for educational and demonstration purposes.

---

## 🙏 Acknowledgements

- HuggingFace for open-source models
- Helsinki-NLP, OpenAI/Whisper, Google Gemini
- shadcn/ui, Tailwind CSS, Vite, React

---

**For more details, see the in-app help or contact the project maintainer.**

