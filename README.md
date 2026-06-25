# BankingAI

A developer demo chatbot for banking workflows with semantic routing, slot collection, and tool-driven answers.

## What this project shows

- Intent routing across loan, credit card, savings, forex, policy, and fraud scenarios.
- Guided slot collection to ask follow-up questions when required data is missing.
- Domain-specific tool execution for EMI calculation, card recommendation, and policy lookup.
- Session memory stored in RedisVL MessageHistory.
- Frontend chat UI built in Next.js.

## What we built

- Built a conversational banking assistant with semantic intent routing and slot-filling flow.
- Integrated RedisVL for semantic search, conversation memory, and routing logic.
- Implemented LangGraph orchestration for stateful slot collection and tool execution.
- Used Groq generative AI for structured slot extraction from user messages.
- Developed banking tools for EMI, credit card recommendation, forex advice, policy lookup, and fraud response.
- Containerized the full stack with Docker Compose for local development.

## Tech stack

### Backend
- **FastAPI**: API server
- **LangGraph**: state machine orchestration
- **RedisVL**: semantic routing and conversation memory
- **Groq**: LLM-powered slot extraction
- **LangChain-style tools**: specialized banking operations
- **Python 3.11**

### Frontend
- **Next.js 14**
- **React**
- **TypeScript**
- **Tailwind CSS**

### Infrastructure
- **Docker Compose**: service orchestration
- **Redis Stack**: Redis + vector search
- **Groq OpenAI-compatible API**

## Features

- Semantic intent classification
- Dynamic slot-filling conversation flow
- Tool-based responses with structured summaries
- Per-session conversation context
- Simple API for chat and feedback

## Quick start

### Recommended: Docker

1. Copy `.env.example` to `.env`.
2. Update keys and Redis URL.
3. Run:

```bash
docker compose up --build
```

Access:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- RedisInsight: `http://localhost:8001`

### Manual setup

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start Redis:

```bash
docker run -d --name redis-stack -p 6380:6379 -p 8001:8001 redis/redis-stack:latest
```

Backend:

```bash
python -m uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd nextjs-app
npm install
npm run dev
```

## Environment example

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_API_URL=https://api.groq.com/openai/
HF_TOKEN=
HUGGINGFACE_HUB_TOKEN=
REDIS_URL=redis://redis:6379
HISTORY_INDEX=bank:msg:index
HISTORY_NAMESPACE=bank:chat
HISTORY_TOPK_RECENT=8
HISTORY_TOPK_RELEVANT=6
HISTORY_DISTANCE_THRESHOLD=0.35
```

## API

### POST /chat

Request:

```json
{
  "userId": "optional",
  "sessionId": "optional",
  "text": "I need a personal loan"
}
```

Response:

```json
{
  "reply": "What type of loan do you need?",
  "pending": ["loan_type", "amount", "tenure"],
  "router": {
    "intent": "loan",
    "confidence": "medium",
    "score": 0.92
  },
  "proposal": null,
  "showFeedback": false
}
```

### POST /chat/feedback

Request:

```json
{
  "sessionId": "session_xyz",
  "helpful": true
}
```

Response:

```json
{
  "ok": true,
  "message": "Thank you! Conversation cleared for a fresh start.",
  "cleared": true
}
```

## Project structure

- `main.py` — FastAPI server and chat endpoints
- `orchestrator.py` — LangGraph workflow and slot orchestration
- `groq_client.py` — Groq chat completion integration
- `router_config.yaml` — routing metadata and intent definitions
- `memory/history.py` — RedisVL message history
- `nextjs-app/` — frontend chat UI

## Running tests

```bash
python router_bank.py
python orchestrator.py
python test_system.py
```

## Notes for recruiters / developers

- This is a proof-of-concept conversational banking assistant.
- The system is designed for fast prototyping, not for production use without hardening.
- Redis is used for memory and routing, while Groq supports the natural language extraction layer.
- The frontend is a minimal chat interface with a modern component stack.

## Troubleshooting

- Use `docker compose down -v` to reset containers.
- If Hugging Face downloads warn, set `HF_TOKEN`.
- RedisGears load warnings are non-blocking for this app.
- If ports conflict, change frontend/backend ports in `docker-compose.yml`.

docker system prune -a
```

## Dependencies

### Python (Backend)
- fastapi: Web framework
- langgraph: State machine orchestration
- langchain: Tool framework
- redisvl: Semantic routing & message history
- sentence-transformers: Text embeddings
- requests: Groq API HTTP client

### Node.js (Frontend)
- next: 14.2.33
- react: 18
- typescript: 5
- tailwindcss: 3.4.1

### Infrastructure
- redis-stack: Vector database & search
- docker: Containerization

## Result

A production-ready banking assistant that:
- Routes queries semantically
- Collects information through conversation
- Executes banking operations
- Returns structured, detailed responses
- Displays beautifully in modern UI
- Manages conversation memory intelligently
- Provides user feedback system
- Runs in Docker containers

A complete semantic routing solution for intelligent banking conversations!
