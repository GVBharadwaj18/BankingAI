import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from groq_client import chat_completion, extract_groq_text
import motor.motor_asyncio
import bcrypt
import jwt
from datetime import datetime, timedelta
from bson import ObjectId

# Password Utilities
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT Utilities
JWT_SECRET = os.getenv("JWT_SECRET", "bankingai-super-secret-key-12345")
JWT_ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded_token if decoded_token["exp"] >= datetime.utcnow().timestamp() else None
    except jwt.PyJWTError:
        return None

# Load environment variables
load_dotenv()

# Ensure Hugging Face token aliases are available for downstream libraries
hf_token = os.getenv("HUGGINGFACE_HUB_TOKEN") or os.getenv("HF_TOKEN")
if hf_token:
    os.environ["HUGGINGFACE_HUB_TOKEN"] = hf_token
    os.environ["HF_TOKEN"] = hf_token

# Memory system imports (Redis-based)
try:
    from memory.history import add_message, get_context, clear_conversation
    memory_available = True
    print("Redis-based conversation memory initialized")
except ImportError:
    memory_available = False
    print("Memory system not available")
    # Fallback functions
    def add_message(session_id, role, text, intent="unknown", score=0.0):
        pass
    def get_context(session_id, limit=6):
        return None
    def clear_conversation(session_id):
        pass

# Initialize FastAPI app
app = FastAPI(title="BankingAI API", description="Intelligent banking chatbot with semantic routing and conversation memory")

# Database connection globals
db_client = None
db = None

@app.on_event("startup")
async def startup_db_client():
    global db_client, db
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://mongodb:27017")
    db_name = os.getenv("MONGODB_DB", "banking_ai")
    print(f"Connecting to MongoDB at {mongodb_url}...")
    try:
        db_client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
        db = db_client[db_name]
        # Create indexes
        await db.users.create_index("username", unique=True)
        await db.users.create_index("email", unique=True)
        print("Connected to MongoDB successfully and created indexes.")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

    # Pre-warm the embedding model so first chat request is instant
    try:
        import asyncio
        from concurrent.futures import ThreadPoolExecutor

        def _warmup_embeddings():
            try:
                from memory.history import get_context
                # Trigger a dummy lookup which initializes the embedding model
                get_context("__warmup__", limit=1)
                print("[INFO] Embedding model pre-warmed successfully.")
            except Exception as we:
                print(f"[WARN] Embedding model warmup skipped: {we}")

        loop = asyncio.get_event_loop()
        executor = ThreadPoolExecutor(max_workers=1)
        loop.run_in_executor(executor, _warmup_embeddings)
    except Exception as e:
        print(f"[WARN] Could not schedule embedding warmup: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    global db_client
    if db_client:
        db_client.close()
        print("Closed MongoDB connection.")

# Add CORS middleware
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    for origin in env_origins.split(","):
        stripped = origin.strip()
        if stripped and stripped not in cors_origins:
            cors_origins.append(stripped)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import orchestrator
try:
    from orchestrator import handle_turn
    orchestrator_available = True
except ImportError as e:
    orchestrator_available = False
    print(f"Orchestrator not available: {e}")

# Auth Models
class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    emailOrUsername: str
    password: str

# Pydantic models
class ChatRequest(BaseModel):
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    text: str

class ChatResponse(BaseModel):
    reply: str
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    pending: Optional[list] = None
    router: Optional[dict] = None
    proposal: Optional[dict] = None
    showFeedback: Optional[bool] = False  # Show "Was this helpful?" when true

@app.get("/")
async def root():
    return {"message": "BankingAI API is running! Use POST /chat to send messages."}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "BankingAI API is running"}

@app.post("/auth/signup")
async def signup(user_in: UserSignup):
    if not user_in.username.strip() or not user_in.email.strip() or not user_in.password.strip():
        raise HTTPException(status_code=400, detail="All fields are required")
        
    username = user_in.username.strip()
    email = user_in.email.strip().lower()
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"username": username},
            {"email": email}
        ]
    })
    if existing_user:
        if existing_user.get("email") == email:
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Username already taken")
            
    # Create user with initial mock account data
    hashed_password = hash_password(user_in.password)
    new_user = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "accounts": {
            "savings_balance": 828456.50,
            "wealth_balance": 200000.00
        },
        "investments": {
            "mutual_funds": 250000.00,
            "fixed_deposits": 100000.00,
            "gold_bonds": 62500.00
        },
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Generate token
    token = create_access_token({"sub": user_id, "username": username, "email": email})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": username,
            "email": email,
            "accounts": new_user["accounts"],
            "investments": new_user["investments"]
        }
    }

@app.post("/auth/login")
async def login(user_in: UserLogin):
    login_id = user_in.emailOrUsername.strip()
    password = user_in.password
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    # Find user by username or email
    user = await db.users.find_one({
        "$or": [
            {"username": login_id},
            {"email": login_id.lower()}
        ]
    })
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "username": user["username"], "email": user["email"]})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
            "accounts": user.get("accounts", {
                "savings_balance": 828456.50,
                "wealth_balance": 200000.00
            }),
            "investments": user.get("investments", {
                "mutual_funds": 250000.00,
                "fixed_deposits": 100000.00,
                "gold_bonds": 62500.00
            })
        }
    }

@app.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Unauthorized or expired token")
        
    user_id = payload.get("sub")
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    # Fetch from db to verify user still exists
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token details")
        
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "accounts": user.get("accounts", {
            "savings_balance": 828456.50,
            "wealth_balance": 200000.00
        }),
        "investments": user.get("investments", {
            "mutual_funds": 250000.00,
            "fixed_deposits": 100000.00,
            "gold_bonds": 62500.00
        })
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, authorization: Optional[str] = Header(None)):
    try:
        # Validate input
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Check if Groq API key is configured
        if not os.getenv("GROQ_API_KEY"):
            raise HTTPException(status_code=500, detail="Groq API key not configured")
        
        user_id = request.userId
        # Parse user details from Authorization Header if present
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            payload = decode_access_token(token)
            if payload:
                user_id = payload.get("sub")
                print(f"Authenticated user request: {payload.get('username')} ({user_id})")

        query = request.text.strip()
        session_id = request.sessionId or f"session_{user_id or 'anon'}_{int(__import__('time').time())}"
        
        # Use orchestrator if available, otherwise fallback to simple LLM
        if orchestrator_available:
            print(f"Using LangGraph Orchestrator for: '{query[:50]}...'")
            
            # Get conversation context from Redis (last 6 messages)
            context_text = get_context(session_id, limit=6)
            if context_text:
                print(f"Retrieved conversation context for session {session_id}")
            
            # Call orchestrator with context
            result = handle_turn(
                user_id=user_id,
                session_id=session_id,
                text=query,
                context=context_text
            )
            
            # Store this turn in Redis conversation context
            intent = result.get("router", {}).get("intent", "unknown")
            score = result.get("router", {}).get("score", 0.0)
            
            add_message(session_id, "user", query)
            add_message(session_id, "assistant", result['reply'], intent, score)
            print(f"Stored conversation turn in Redis (session: {session_id})")
            
            # Show feedback when proposal is returned (task completed)
            show_feedback = bool(result.get("proposal"))
            
            return ChatResponse(
                reply=result["reply"],
                userId=user_id,
                sessionId=session_id,
                pending=result.get("pending"),
                router=result.get("router"),
                proposal=result.get("proposal"),
                showFeedback=show_feedback
            )
        else:
            # Fallback to simple Groq call
            print(f"Orchestrator unavailable, using fallback Groq model")
            
            response = chat_completion(
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a helpful banking assistant. Provide concise, friendly responses to customer inquiries about banking services, account information, and general financial questions."
                    },
                    {
                        "role": "user", 
                        "content": query
                    }
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            reply = extract_groq_text(response)
            
            return ChatResponse(
                reply=reply,
                userId=user_id,
                sessionId=session_id
            )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


class FeedbackRequest(BaseModel):
    sessionId: str
    helpful: bool

@app.post("/chat/feedback")
async def chat_feedback(request: FeedbackRequest):
    """
    Handle user feedback. If helpful=true, clear the conversation to start fresh.
    
    Args:
        request: Feedback request with sessionId and helpful flag
        
    Returns:
        Success confirmation
    """
    if not request.sessionId or not request.sessionId.strip():
        raise HTTPException(status_code=400, detail="Missing sessionId")
    
    try:
        session_id = request.sessionId.strip()
        
        if request.helpful:
            # Clear Redis-based conversation context
            clear_conversation(session_id)
            print(f"User feedback: helpful=true, cleared Redis context for session {session_id}")
            
            return {
                "ok": True,
                "message": "Thank you! Conversation cleared for a fresh start.",
                "cleared": True
            }
        else:
            print(f"User feedback: helpful={request.helpful}, session {session_id}")
            return {
                "ok": True,
                "message": "Thank you for your feedback!",
                "cleared": False
            }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process feedback: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
