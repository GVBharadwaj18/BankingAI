"""
Conversation memory using RedisVL MessageHistory
https://redis.io/docs/latest/develop/ai/redisvl/api/message_history/
"""
import os
from typing import Optional
from redisvl.extensions.message_history import MessageHistory

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
INDEX_NAME = os.getenv("HISTORY_INDEX", "bank:msg:history")

# Cache of MessageHistory instances per session
_history_cache = {}

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
    history = get_history(session_id)
    history.store(prompt, response, session_tag=session_id)

def get_context(session_id: str, limit: int = 6) -> Optional[str]:
    """
    Get recent conversation context as a formatted string
    
    Args:
        session_id: Session identifier
        limit: Number of recent messages to retrieve
        
    Returns:
        Formatted conversation context string or None
    """
    try:
        history = get_history(session_id)
        
        # Get recent messages as list of dicts
        print(f"🔍 Attempting to get context for session {session_id}")
        recent_messages = history.get_recent(top_k=limit, as_text=False, raw=False, session_tag=session_id)
        
        print(f"📥 Retrieved {len(recent_messages) if recent_messages else 0} messages")
        
        if not recent_messages:
            print(f"ℹ️  No messages found for session {session_id}")
            return None
        
        # Format messages as text
        formatted = []
        for msg in recent_messages:
            print(f"📝 Processing message: {type(msg)} - {msg}")
            if isinstance(msg, dict):
                role = msg.get("role", "unknown").capitalize()
                content = msg.get("content", "")
                metadata = msg.get("metadata", {})
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
            print(f"✅ Context retrieved successfully:\n{result}")
        return result
        
    except Exception as e:
        import traceback
        print(f"❌ Failed to get context: {e}")
        traceback.print_exc()
        return None

def clear_conversation(session_id: str):
    """
    Clear all conversation history for a session
    
    Args:
        session_id: Session identifier
    """
    try:
        history = get_history(session_id)
        history.clear()
        
        # Remove from cache
        if session_id in _history_cache:
            del _history_cache[session_id]
        
        print(f"🗑️  Cleared conversation history for session {session_id}")
        return True
    except Exception as e:
        print(f"⚠️  Failed to clear conversation: {e}")
        return False
