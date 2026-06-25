#!/usr/bin/env python3
"""
Rebuild the semantic router index with reference embeddings.
Run this after deleting Redis keys to restore intent matching.
"""
import os
os.environ["REDIS_URL"] = "redis://localhost:6379"

print("=" * 60)
print("🔨 REBUILDING SEMANTIC ROUTER INDEX")
print("=" * 60)
print()

try:
    import redis
    from redisvl.extensions.router import SemanticRouter, Route, RoutingConfig
    from router_bank import BANKING_ROUTES
    
    print("1️⃣ Deleting old router index...")
    r = redis.from_url("redis://localhost:6379")
    try:
        r.execute_command("FT.DROPINDEX", "banking_router:index", "DD")
        print("   ✅ Deleted old index")
    except Exception as e:
        print(f"   ℹ️  No old index found: {e}")
    print()
    
    print("2️⃣ Creating new router with reference embeddings...")
    print("   This will recreate the index and all reference embeddings")
    print()
    
    routing_config = RoutingConfig(
        max_k=3,
        aggregation_method="avg"
    )
    
    router = SemanticRouter(
        name="banking_router",
        routes=BANKING_ROUTES,
        routing_config=routing_config,
        redis_url="redis://localhost:6379",
        overwrite=True  # Force recreate
    )
    
    print("   ✅ Router created with embeddings!")
    
    print()
    print("3️⃣ Testing routing with sample queries...")
    print()
    
    test_queries = [
        "i want loan",
        "loans",
        "personal loan",
        "help me with my policy details",
        "how to close my account",
        "I need a credit card",
        "What is the FD interest rate?",
        "Need USD for travel",
    ]
    
    for query in test_queries:
        matches = router(query)
        if not isinstance(matches, list):
            matches = [matches]
        
        best = matches[0] if matches else None
        if best and hasattr(best, 'name') and best.name:
            distance = getattr(best, 'distance', 0.0)
            print(f"✅ '{query}'")
            print(f"   → {best.name} (distance: {distance:.3f})")
        else:
            print(f"❌ '{query}' → unknown")
        print()
    
    print("=" * 60)
    print("✅ ROUTER INDEX REBUILT SUCCESSFULLY!")
    print("=" * 60)
    print()
    print("You can now:")
    print("  1. View the index in RedisInsight")
    print("  2. Test your chat application")
    print("  3. The router will now correctly match intents")
    
except Exception as e:
    print(f"❌ Error rebuilding router: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

