"""
Conversation memory using RedisVL MessageHistory
https://redis.io/docs/latest/develop/ai/redisvl/api/message_history/
"""
import os
import sys
import builtins
from typing import Optional
from redisvl.extensions.message_history import MessageHistory

# Ensure console printing is safe from UnicodeEncodeError on Windows
def safe_print(*args, **kwargs):
    new_args = []
    encoding = sys.stdout.encoding or 'ascii'
    for arg in args:
        if isinstance(arg, str):
            new_args.append(arg.encode(encoding, errors='replace').decode(encoding))
        else:
            new_args.append(arg)
    builtins.print(*new_args, **kwargs)

print = safe_print

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
INDEX_NAME = os.getenv("HISTORY_INDEX", "bank:msg:history")

# Cache of MessageHistory instances per session
_history_cache = {}

REDIS_AVAILABLE = True
_in_memory_history = {}

# Test Redis connection gracefully on startup
try:
    import redis
    test_client = redis.Redis.from_url(REDIS_URL, socket_connect_timeout=2.0)
    test_client.ping()
    print("[INFO] Redis server is online and reachable")
except Exception as e:
    print(f"[WARNING] Redis is offline or unreachable: {e}. Switching to in-memory fallback memory.")
    REDIS_AVAILABLE = False

def get_history(session_id: str) -> MessageHistory:
    """
    Get or create a MessageHistory instance for a session
    
    Args:
        session_id: Session identifier
        
    Returns:
        MessageHistory instance
    """
    if session_id not in _history_cache:
        _history_cache[session_id] = MessageHistory(
            name=INDEX_NAME,
            session_tag=session_id,
            redis_url=REDIS_URL
        )
    return _history_cache[session_id]

def add_message(session_id: str, role: str, text: str, intent: str = "unknown", score: float = 0.0):
    """
    Add a message to conversation history
    
    Args:
        session_id: Session identifier
        role: 'user' or 'assistant'
        text: Message text
        intent: Detected intent (for assistant messages)
        score: Router confidence score
    """
    global REDIS_AVAILABLE
    if REDIS_AVAILABLE:
        try:
            history = get_history(session_id)
            
            # Create message dict with metadata
            message = {
                "role": role,
                "content": text,
                "metadata": {
                    "intent": intent,
                    "score": score
                }
            }
            
            history.add_message(message, session_tag=session_id)
            return
        except Exception as e:
            print(f"[WARNING] Redis add_message failed: {e}. Falling back to in-memory history.")
            REDIS_AVAILABLE = False

    # In-memory fallback
    if session_id not in _in_memory_history:
        _in_memory_history[session_id] = []
    _in_memory_history[session_id].append({
        "role": role,
        "content": text,
        "metadata": {
            "intent": intent,
            "score": score
        }
    })

def store_exchange(session_id: str, prompt: str, response: str, intent: str = "unknown", score: float = 0.0):
    """
    Store a complete prompt-response exchange
    
    Args:
        session_id: Session identifier
        prompt: User prompt
        response: Assistant response
        intent: Detected intent
        score: Router confidence score
    """
    global REDIS_AVAILABLE
    if REDIS_AVAILABLE:
        try:
            history = get_history(session_id)
            history.store(prompt, response, session_tag=session_id)
            return
        except Exception as e:
            print(f"[WARNING] Redis store_exchange failed: {e}. Falling back to in-memory history.")
            REDIS_AVAILABLE = False
            
    # In-memory fallback
    add_message(session_id, "user", prompt)
    add_message(session_id, "assistant", response, intent, score)

def get_context(session_id: str, limit: int = 6) -> Optional[str]:
    """
    Get recent conversation context as a formatted string
    
    Args:
        session_id: Session identifier
        limit: Number of recent messages to retrieve
        
    Returns:
        Formatted conversation context string or None
    """
    global REDIS_AVAILABLE
    recent_messages = None
    
    if REDIS_AVAILABLE:
        try:
            history = get_history(session_id)
            
            # Get recent messages as list of dicts
            print(f"[INFO] Attempting to get context from Redis for session {session_id}")
            recent_messages = history.get_recent(top_k=limit, as_text=False, raw=False, session_tag=session_id)
            print(f"[INFO] Retrieved {len(recent_messages) if recent_messages else 0} messages from Redis")
        except Exception as e:
            print(f"[WARNING] Redis get_context failed: {e}. Switching to in-memory history.")
            REDIS_AVAILABLE = False
            
    if not REDIS_AVAILABLE:
        print(f"[INFO] Attempting to get context from in-memory history for session {session_id}")
        recent_messages = _in_memory_history.get(session_id, [])[-limit:]
        print(f"[INFO] Retrieved {len(recent_messages) if recent_messages else 0} messages from in-memory history")
        
    if not recent_messages:
        print(f"[INFO] No messages found for session {session_id}")
        return None
    
    # Format messages as text
    formatted = []
    for msg in recent_messages:
        # print(f"[INFO] Processing message: {type(msg)}")
        if isinstance(msg, dict):
            role = msg.get("role", "unknown").capitalize()
            content = msg.get("content", "")
            metadata = msg.get("metadata", {}) or {}
            intent = metadata.get("intent", "unknown")
            score = metadata.get("score", 0.0)
            
            if role == "User":
                formatted.append(f"User: {content}")
            else:
                formatted.append(f"Assistant: {content[:100]}... Intent: {intent} ({score:.2f})")
        elif isinstance(msg, str):
            formatted.append(msg)
    
    result = "\n".join(formatted) if formatted else None
    if result:
        print(f"[INFO] Context retrieved successfully ({len(formatted)} messages)")
    return result

def clear_conversation(session_id: str):
    """
    Clear all conversation history for a session
    
    Args:
        session_id: Session identifier
    """
    global REDIS_AVAILABLE
    if REDIS_AVAILABLE:
        try:
            history = get_history(session_id)
            history.clear()
            
            # Remove from cache
            if session_id in _history_cache:
                del _history_cache[session_id]
            
            print(f"[INFO] Cleared Redis conversation history for session {session_id}")
            return True
        except Exception as e:
            print(f"[WARNING] Failed to clear Redis conversation: {e}. Switching to in-memory history.")
            REDIS_AVAILABLE = False
            
    if session_id in _in_memory_history:
        _in_memory_history[session_id] = []
    
    if session_id in _history_cache:
        del _history_cache[session_id]
        
    print(f"[INFO] Cleared in-memory conversation history for session {session_id}")
    return True

