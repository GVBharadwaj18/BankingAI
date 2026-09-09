"""
Master Evaluation Harness Runner for BankingAI
Runs intent routing and slot extraction evaluation suites, printing a consolidated metric summary dashboard.
"""

import json
import os
import sys
import time

import builtins

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

# Ensure project root is in python path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from evaluation.evaluate_router import evaluate_router
from evaluation.evaluate_slots import evaluate_slots


def run_full_evaluation():
    start_time = time.time()
    
    print("\n" + "=" * 70)
    print("🏆 BANKING AI AGENTIC SYSTEM FULL EVALUATION SUITE")
    print("=" * 70)
    
    router_report = evaluate_router()
    slots_report = evaluate_slots()
    
    total_time = round(time.time() - start_time, 2)
    
    total_queries = router_report["total_cases"]
    intent_acc = router_report["intent_routing_accuracy_pct"]
    tool_acc = router_report["tool_handler_accuracy_pct"]
    unknown_f1 = router_report["unknown_query_metrics"]["f1_score"]
    
    slot_queries = slots_report["total_slot_queries"]
    llm_slot_f1 = slots_report["llm_slot_extractor"]["f1_score"]
    heur_slot_f1 = slots_report["heuristic_slot_extractor"]["f1_score"]
    
    print("=" * 70)
    print("🎯 EXECUTIVE EVALUATION SUMMARY & METRICS")
    print("=" * 70)
    print(f"• Total Test Cases Evaluated : {total_queries} representative queries across 7 workflows")
    print(f"• Intent Routing Accuracy   : {intent_acc:.1f}%")
    print(f"• Tool Selection Accuracy   : {tool_acc:.1f}%")
    print(f"• Ambiguous Query Handling  : F1-Score {unknown_f1:.1f}%")
    print(f"• Slot Extraction F1-Score  : {llm_slot_f1:.1f}% (LLM) | {heur_slot_f1:.1f}% (Heuristic Fallback)")
    print(f"• Avg Router Latency        : {router_report['latency_stats_ms']['avg_ms']:.1f} ms")
    print(f"• Total Benchmark Runtime   : {total_time}s")
    print("=" * 70)
    
    print("\n💡 RESUME / PORTFOLIO HIGHLIGHT STATEMENT:")
    print("-" * 70)
    highlight = (
        f"Built a production evaluation harness with {total_queries}+ test cases, achieving "
        f"{intent_acc:.1f}% intent-routing accuracy across 7 core banking workflows, {tool_acc:.1f}% tool selection accuracy, "
        f"and {llm_slot_f1:.1f}% slot extraction F1-score with deterministic fallback handling."
    )
    print(f"\"{highlight}\"")
    print("-" * 70 + "\n")
    
    summary_path = os.path.join(os.path.dirname(__file__), "summary_metrics.json")
    summary_data = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_test_cases": total_queries,
        "intent_routing_accuracy_pct": intent_acc,
        "tool_selection_accuracy_pct": tool_acc,
        "ambiguous_query_f1_score": unknown_f1,
        "slot_extraction_f1_llm": llm_slot_f1,
        "slot_extraction_f1_heuristic": heur_slot_f1,
        "avg_router_latency_ms": router_report['latency_stats_ms']['avg_ms'],
        "resume_highlight": highlight
    }
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
        
    print(f"✅ Summary benchmark report saved to: {summary_path}")


if __name__ == "__main__":
    run_full_evaluation()
