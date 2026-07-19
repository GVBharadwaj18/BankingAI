# BankingAI — Running Guide

Complete guide for setting up, running, and managing the BankingAI project.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [First-Time Setup](#2-first-time-setup)
3. [Option A — Docker Compose (Recommended)](#3-option-a--docker-compose-recommended)
4. [Option B — Manual / Local Setup](#4-option-b--manual--local-setup)
5. [Service URLs](#5-service-urls)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Inspecting the MongoDB Database](#7-inspecting-the-mongodb-database)
8. [Stopping & Resetting](#8-stopping--resetting)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Make sure the following are installed before you begin:

| Tool | Version | Download |
|------|---------|----------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Node.js | 18+ | https://nodejs.org |
| Python | 3.11 | https://www.python.org |
| Git | Any | https://git-scm.com |

> **For Option A (Docker):** Only Docker Desktop is strictly required.  
> **For Option B (Manual):** Node.js + Python are required. Docker is only used for Redis + MongoDB.

---

## 2. First-Time Setup

### Clone the project and configure environment

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd BankingAI

# 2. Copy the example env file
copy .env.example .env        # Windows
# OR
cp .env.example .env          # Mac/Linux

# 3. Open .env and fill in your API keys
```

### Required `.env` values to fill in

```env
GROQ_API_KEY=gsk_...           # Get from https://console.groq.com
HF_TOKEN=hf_...                # Get from https://huggingface.co/settings/tokens
HUGGINGFACE_HUB_TOKEN=hf_...   # Same token as above
JWT_SECRET=your-secret-key     # Any random string, keep it secret
```

---

## 3. Option A — Docker Compose (Recommended)

This spins up **all 4 services** in one command:
- MongoDB (database)
- Redis Stack (memory + semantic routing)
- FastAPI Backend
- Next.js Frontend

### Start everything

```bash
docker compose up --build
```

> First run downloads ~3 GB of packages (PyTorch, CUDA libs). Subsequent runs use the cache and start in seconds.

### What starts and in what order

```
MongoDB  ──┐
           ├──> Backend (FastAPI) ──> Frontend (Next.js)
Redis   ───┘
```

Docker Compose handles this order automatically via `depends_on`.

### Check that all containers are running

```bash
docker compose ps
```

Expected output:
```
NAME                  STATUS
bankingai-mongodb     Up (healthy)
bankingai-redis       Up (healthy)
bankingai-backend     Up (healthy)
bankingai-frontend    Up (healthy)
```

### View live logs

```bash
# All services
docker compose logs -f

# Just the backend
docker compose logs -f backend

# Just MongoDB
docker compose logs -f mongodb
```

---

## 4. Option B — Manual / Local Setup

Run each service individually in separate terminal windows.

### Step 1 — Start MongoDB + Redis (via Docker)

These are easier to run via Docker even in manual mode:

```bash
# MongoDB
docker run -d --name bankingai-mongo -p 27017:27017 mongo:latest

# Redis Stack
docker run -d --name bankingai-redis -p 6380:6379 -p 8001:8001 redis/redis-stack:latest
```

> If you already have MongoDB/Redis installed locally, skip this step and update the URLs in `.env`.

### Step 2 — Update `.env` for local URLs

When running manually, update these two lines in `.env`:

```env
REDIS_URL=redis://localhost:6380
MONGODB_URL=mongodb://localhost:27017
```

### Step 3 — Backend (FastAPI)

Open a **new terminal**:

```bash
# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Wait for this message before proceeding:
```
Connected to MongoDB successfully and created indexes.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 4 — Frontend (Next.js)

Open another **new terminal**:

```bash
cd nextjs-app

# Install dependencies (first time only)
npm install

# Start the frontend dev server
npm run dev
```

Wait for:
```
▲ Next.js 14.x.x
✓ Ready in X.Xs
```

### Manual startup order summary

| Order | Service | Command | Port |
|-------|---------|---------|------|
| 1st | MongoDB | `docker run ...` | 27017 |
| 2nd | Redis | `docker run ...` | 6380 |
| 3rd | Backend | `uvicorn main:app ...` | 8000 |
| 4th | Frontend | `npm run dev` | 3000 |

---

## 5. Service URLs

Once everything is running, access the services here:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main web app (Sign In / Dashboard) |
| **Backend API** | http://localhost:8000 | FastAPI REST API |
| **API Docs** | http://localhost:8000/docs | Swagger UI (auto-generated) |
| **Health Check** | http://localhost:8000/health | Returns `{"status":"healthy"}` |
| **RedisInsight** | http://localhost:8001 | Redis GUI (only with Redis Stack) |
| **MongoDB** | mongodb://localhost:27017 | Connect via Compass or mongosh |

---

## 6. Environment Variables Reference

Full reference for the `.env` file:

```env
# ─── Groq AI ──────────────────────────────────────────────────────────────────
GROQ_API_KEY=gsk_...                    # Required. Your Groq API key.
GROQ_MODEL=llama-3.3-70b-versatile     # AI model to use.
GROQ_API_URL=https://api.groq.com/openai/

# ─── Hugging Face (for embeddings) ───────────────────────────────────────────
HF_TOKEN=hf_...                         # Required for sentence-transformers downloads.
HUGGINGFACE_HUB_TOKEN=hf_...           # Same value as HF_TOKEN.

# ─── Redis ────────────────────────────────────────────────────────────────────
# Docker Compose:  redis://redis:6379
# Manual/Local:    redis://localhost:6380
REDIS_URL=redis://redis:6379

# ─── MongoDB ──────────────────────────────────────────────────────────────────
# Docker Compose:  mongodb://mongodb:27017
# Manual/Local:    mongodb://localhost:27017
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=banking_ai

# ─── Auth ─────────────────────────────────────────────────────────────────────
JWT_SECRET=bankingai-super-secret-key  # Change this in production!

# ─── RedisVL Memory ───────────────────────────────────────────────────────────
HISTORY_INDEX=bank:msg:index
HISTORY_NAMESPACE=bank:chat
HISTORY_TOPK_RECENT=8
HISTORY_TOPK_RELEVANT=6
HISTORY_DISTANCE_THRESHOLD=0.35
```

> **Note:** Docker Compose injects its own `MONGODB_URL` and `REDIS_URL` that override the `.env` values. So the Docker URLs (`mongodb://mongodb:27017`) are always used when running via `docker compose up`.

---

## 7. Inspecting the MongoDB Database

### Using the terminal (mongosh inside Docker)

All commands follow this pattern:
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "<COMMAND>"
```

#### List all users (passwords hidden)
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "db.users.find({}, {password:0}).pretty()"
```

#### Count total registered users
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "db.users.countDocuments()"
```

#### Find a specific user by username
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "db.users.findOne({username: 'john'}, {password:0})"
```

#### Find a specific user by email
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "db.users.findOne({email: 'john@example.com'}, {password:0})"
```

#### See all collections in the database
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "db.getCollectionNames()"
```

#### See a user's accounts and investments
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "db.users.findOne({username: 'john'}, {accounts:1, investments:1, _id:0})"
```

#### See ALL data including passwords (careful!)
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "db.users.find().pretty()"
```

#### Delete a specific user
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "db.users.deleteOne({username: 'john'})"
```

#### Wipe all users (reset the collection)
```bash
docker exec bankingai-mongodb mongosh banking_ai --eval "db.users.drop()"
```

---

### Using MongoDB Compass (GUI) — Easiest Option

1. Download **MongoDB Compass** (free): https://www.mongodb.com/try/download/compass
2. Open Compass → click **"New Connection"**
3. Paste this connection string:
   ```
   mongodb://localhost:27017
   ```
4. Click **Connect**
5. Navigate to: `banking_ai` → `users`

You'll see all users with their full document including accounts and investments visually.

---

### Direct mongosh interactive shell

For an interactive session inside the container:

```bash
# Windows (PowerShell)
docker exec bankingai-mongodb mongosh banking_ai

# Then type MongoDB commands interactively:
> db.users.find({}, {password:0}).pretty()
> db.users.countDocuments()
> exit
```

---

## 8. Stopping & Resetting

### Stop all containers (keeps data)
```bash
docker compose down
```

### Stop and delete all data (full reset)
```bash
docker compose down -v
```
> The `-v` flag removes the `mongodb_data` Docker volume — all users and data are permanently deleted.

### Restart a single service
```bash
docker compose restart backend
docker compose restart frontend
```

### Rebuild after code changes
```bash
# Rebuild everything
docker compose up --build

# Rebuild only the backend
docker compose up --build backend
```

---

## 9. Troubleshooting

### Port already in use
```bash
# Find what's using port 3000
netstat -ano | findstr :3000      # Windows
lsof -i :3000                     # Mac/Linux

# Kill it (Windows — use the PID from above)
taskkill /PID <PID> /F
```

### Backend can't connect to MongoDB
- Make sure `bankingai-mongodb` container is running: `docker compose ps`
- Check the `MONGODB_URL` env var — in Docker it must be `mongodb://mongodb:27017`

### Frontend can't reach the backend
- Check that the backend is healthy: `curl http://localhost:8000/health`
- Ensure `NEXT_PUBLIC_API_BASE=http://localhost:8000` in frontend environment

### Hugging Face download errors
- Make sure `HF_TOKEN` and `HUGGINGFACE_HUB_TOKEN` are set in `.env`
- If behind a corporate proxy, set `HTTPS_PROXY` in the environment

### Clean everything and start fresh
```bash
docker compose down -v
docker system prune -a
docker compose up --build
```
> ⚠️ `docker system prune -a` removes ALL unused Docker images, containers, and volumes on your system — not just this project.

### View backend errors in real time
```bash
docker compose logs -f backend
```
