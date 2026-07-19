"""
Semantic Router for Banking Application
Uses RedisVL to route user queries to appropriate banking intents
"""

import os
from typing import Dict, List, Optional
from redisvl.extensions.router import SemanticRouter, Route, RoutingConfig
from dotenv import load_dotenv

load_dotenv()

# Banking routes with example phrases
BANKING_ROUTES = [
    Route(
        name="credit_card",
        references=[
            "I want to apply for a credit card",
            "What credit cards do you offer?",
            "Tell me about your credit card benefits",
            "Which card is best for travel rewards?",
            "How do I get a new credit card?",
            "What's the credit limit on your cards?"
        ],
        metadata={
            "category": "cards",
            "required_slots": ["income", "card_type"],
            "handler": "cards_tool"
        },
        distance_threshold=0.4
    ),
    Route(
        name="loan",
        references=[
            "I need a personal loan",
            "How can I apply for a home loan?",
            "What's the interest rate on education loans?",
            "Tell me about car loan EMI",
            "I want to check loan eligibility",
            "How much loan can I get?"
        ],
        metadata={
            "category": "loans",
            "required_slots": ["loan_type", "amount", "tenure"],
            "handler": "loans_tool"
        },
        distance_threshold=0.4
    ),
    Route(
        name="savings_fd",
        references=[
            "What are the FD interest rates?",
            "I want to open a fixed deposit",
            "Tell me about savings account benefits",
            "How to create an FD ladder?",
            "What's the best investment option?",
            "Recurring deposit vs fixed deposit"
        ],
        metadata={
            "category": "savings",
            "required_slots": ["amount", "tenure"],
            "handler": "savings_tool"
        },
        distance_threshold=0.4
    ),
    Route(
        name="policy_faq",
        references=[
            "What are your branch timings?",
            "How do I reset my password?",
            "What documents do I need for KYC?",
            "Tell me about your privacy policy",
            "How to close my account?",
            "What are the service charges?"
        ],
        metadata={
            "category": "policy",
            "required_slots": [],
            "handler": "policy_rag_tool"
        },
        distance_threshold=0.45
    ),
    Route(
        name="forex_travel",
        references=[
            "I need foreign exchange for travel",
            "What's the USD to INR rate today?",
            "How to get forex card for abroad?",
            "Travel insurance options",
            "Best forex rates for Europe trip",
            "Currency exchange services"
        ],
        metadata={
            "category": "forex",
            "required_slots": ["currency", "amount"],
            "handler": "forex_tool"
        },
        distance_threshold=0.4
    ),
    Route(
        name="fraud_dispute",
        references=[
            "I see an unauthorized transaction",
            "My card was stolen",
            "Report a fraudulent charge",
            "Dispute a transaction",
            "Someone used my card without permission",
            "Block my credit card immediately"
        ],
        metadata={
            "category": "security",
            "required_slots": ["transaction_id", "description"],
            "handler": "fraud_tool"
        },
        distance_threshold=0.35
    ),
    Route(
        name="spending_analysis",
        references=[
            "Analyze my monthly spending",
            "Where did I spend my money?",
            "Check my monthly outflow",
            "Give me a spending report",
            "Show my budget audit",
            "Breakdown of my monthly spends",
            "What did I spend on this month?"
        ],
        metadata={
            "category": "spending",
            "required_slots": [],
            "handler": "spending_tool"
        },
        distance_threshold=0.4
    )
]


class BankingRouter:
    """Semantic router for banking queries"""
    
    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize the banking semantic router
        
        Args:
            redis_url: Redis connection URL (defaults to env REDIS_URL)
        """
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        
        routing_config = RoutingConfig(
            max_k=3,  # Return top 3 matches
            aggregation_method="avg"
        )
        
        self.redis_available = True
        try:
            import redis
            test_client = redis.Redis.from_url(self.redis_url, socket_connect_timeout=2.0)
            test_client.ping()
            
            self.router = SemanticRouter(
                name="banking_router",
                routes=BANKING_ROUTES,
                routing_config=routing_config,
                redis_url=self.redis_url,
                overwrite=False  # Don't overwrite on each restart
            )
            print(f"[INFO] Banking Router initialized with {len(BANKING_ROUTES)} routes in Redis")
        except Exception as e:
            print(f"[WARNING] Redis is offline for router: {e}. Falling back to LLM-based semantic routing.")
            self.redis_available = False
            self.router = None
            
    def _route_text_llm(self, text: str) -> Dict:
        """Fallback LLM-based intent classifier using Groq"""
        from groq_client import chat_completion, extract_groq_text
        import json
        
        prompt = """You are a semantic intent classifier for a banking chatbot. 
Classify the user's message into exactly one of the following intents:
- 'credit_card' (questions about applying for credit cards, benefits, reward rates, card limits, travel cards)
- 'loan' (questions about personal/home/car/education loans, interest rates, eligibility, EMI calculations)
- 'savings_fd' (questions about savings accounts, fixed deposits, FDs, recurring deposits, investing)
- 'policy_faq' (questions about branch timings, password reset, KYC documents, account closure, service charges, privacy policy)
- 'forex_travel' (questions about foreign exchange, USD/EUR/GBP rates, forex cards, currency exchange, travel insurance)
- 'fraud_dispute' (questions about unauthorized transactions, stolen cards, fraudulent charges, blocking cards, disputing charges)
- 'spending_analysis' (questions about monthly spending, outflow, where money was spent, budget audit, spending breakdown)
- 'unknown' (if the message does not fit any of the banking intents above)

You must output ONLY a valid JSON object with the following keys. Do not include any markdown, triple backticks, or explanation. Just the JSON object.
{{
  "intent": "intent_name",
  "confidence": "high" | "medium" | "low",
  "score": 0.0 to 1.0
}}

User Message: "{query}"
"""
        try:
            response = chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise intent classifier returning only JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt.format(query=text)
                    }
                ],
                temperature=0.0,
                max_tokens=150
            )
            
            output_text = extract_groq_text(response).strip()
            # Clean up potential markdown formatting in LLM output
            if output_text.startswith("```"):
                lines = output_text.splitlines()
                # Find JSON block
                json_lines = [l for l in lines if not l.startswith("```")]
                output_text = "".join(json_lines)
            
            result = json.loads(output_text)
            intent = result.get("intent", "unknown")
            confidence = result.get("confidence", "low")
            score = result.get("score", 0.5)
            
            # Find the route metadata
            metadata = {}
            for r in BANKING_ROUTES:
                if r.name == intent:
                    metadata = r.metadata
                    break
                    
            return {
                "intent": intent,
                "score": score,
                "confidence": confidence,
                "metadata": metadata,
                "topK": [{"intent": intent, "score": score}],
                "threshold": None
            }
        except Exception as e:
            print(f"[ERROR] Fallback LLM routing failed: {e}")
            return {
                "intent": "unknown",
                "score": 0.0,
                "confidence": "none",
                "metadata": {},
                "topK": [],
                "threshold": None
            }
    
    def route_text(self, text: str) -> Dict:
        """
        Route user text to appropriate banking intent
        
        Args:
            text: User query
            
        Returns:
            Dict with: {intent, score, confidence, metadata, topK}
        """
        if not self.redis_available or not self.router:
            return self._route_text_llm(text)
            
        try:
            matches = self.router(text)
            
            # Ensure matches is a list
            if not isinstance(matches, list):
                matches = [matches] if matches else []
            
            if not matches or matches[0].name is None:
                return {
                    "intent": "unknown",
                    "score": 0.0,
                    "confidence": "none",
                    "metadata": {},
                    "topK": [],
                    "threshold": None
                }
            
            top_match = matches[0]
            route = self.router.get(top_match.name)
            
            # Determine confidence level
            if top_match.distance < 0.2:
                confidence = "high"
            elif top_match.distance < 0.35:
                confidence = "medium"
            else:
                confidence = "low"
            
            return {
                "intent": top_match.name,
                "score": round(1 - top_match.distance, 3),  # Convert distance to similarity
                "distance": round(top_match.distance, 3),
                "confidence": confidence,
                "metadata": route.metadata if route else {},
                "topK": [
                    {
                        "intent": m.name,
                        "score": round(1 - m.distance, 3),
                        "distance": round(m.distance, 3)
                    }
                    for m in matches if m.name is not None
                ],
                "threshold": route.distance_threshold if route else None
            }
        except Exception as e:
            print(f"[WARNING] Redis semantic routing failed: {e}. Falling back to LLM routing.")
            self.redis_available = False
            return self._route_text_llm(text)
    
    def get_required_slots(self, intent: str) -> List[str]:
        """Get required slots for an intent"""
        for r in BANKING_ROUTES:
            if r.name == intent:
                return r.metadata.get("required_slots", [])
        return []
    
    def get_handler(self, intent: str) -> Optional[str]:
        """Get handler name for an intent"""
        for r in BANKING_ROUTES:
            if r.name == intent:
                return r.metadata.get("handler")
        return None


# Singleton instance
_router_instance = None

def get_router() -> BankingRouter:
    """Get or create banking router instance"""
    global _router_instance
    if _router_instance is None:
        _router_instance = BankingRouter()
    return _router_instance


if __name__ == "__main__":
    # Test the router
    router = BankingRouter()
    
    test_queries = [
        "I want to apply for a credit card",
        "What's the EMI for a 5 lakh home loan?",
        "Tell me about FD rates",
        "I need forex for my US trip",
        "Someone used my card without permission",
        "What are your branch timings?"
    ]
    
    print("\n" + "="*60)
    print("Testing Banking Semantic Router")
    print("="*60)
    
    for query in test_queries:
        result = router.route_text(query)
        print(f"\nQuery: {query}")
        print(f"Intent: {result['intent']} (score: {result['score']}, confidence: {result['confidence']})")
        print(f"Handler: {result['metadata'].get('handler', 'N/A')}")
        print(f"Required Slots: {result['metadata'].get('required_slots', [])}")

