import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from groq_client import chat_completion, extract_groq_text

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

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Validate input
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Check if Groq API key is configured
        if not os.getenv("GROQ_API_KEY"):
            raise HTTPException(status_code=500, detail="Groq API key not configured")
        
        query = request.text.strip()
        session_id = request.sessionId or f"session_{request.userId or 'anon'}_{int(__import__('time').time())}"
        
        # Use orchestrator if available, otherwise fallback to simple LLM
        if orchestrator_available:
            print(f"Using LangGraph Orchestrator for: '{query[:50]}...'")
            
            # Get conversation context from Redis (last 6 messages)
            context_text = get_context(session_id, limit=6)
            if context_text:
                print(f"Retrieved conversation context for session {session_id}")
            
            # Call orchestrator with context
            result = handle_turn(
                user_id=request.userId,
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
                userId=request.userId,
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
                userId=request.userId,
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
