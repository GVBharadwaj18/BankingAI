"""
Evaluation Script for BankingAI Intent Router
Evaluates Intent Routing Accuracy, Tool Selection Accuracy, and Out-of-Scope Query Handling.
"""

import json
import os
import sys
import time
from typing import Dict, List, Any

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

from router_bank import BankingRouter, BANKING_ROUTES

def evaluate_router(dataset_path: str = None) -> Dict[str, Any]:
    if dataset_path is None:
        dataset_path = os.path.join(os.path.dirname(__file__), "routing_cases.json")

    with open(dataset_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    print(f"\n============================================================")
    print(f"🚀 EVALUATING BANKING INTENT ROUTER ({len(cases)} Test Cases)")
    print(f"============================================================")

    router = BankingRouter()

    total_cases = len(cases)
    intent_correct = 0
    handler_correct = 0
    unknown_tp = 0
    unknown_fp = 0
    unknown_fn = 0
    unknown_tn = 0

    per_intent_stats = {}
    all_intents = [r.name for r in BANKING_ROUTES] + ["unknown"]
    for intent in all_intents:
        per_intent_stats[intent] = {
            "total_expected": 0,
            "total_predicted": 0,
            "correct": 0
        }

    failures = []
    latencies_ms = []

    for case in cases:
        query = case["query"]
        expected_intent = case["expected_intent"]
        expected_handler = case.get("expected_handler")

        start_time = time.perf_counter()
        res = router.route_text(query)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        latencies_ms.append(elapsed_ms)
        time.sleep(0.5)

        pred_intent = res.get("intent", "unknown")
        pred_handler = res.get("metadata", {}).get("handler") if res.get("metadata") else None

        # Update per intent counts
        if expected_intent in per_intent_stats:
            per_intent_stats[expected_intent]["total_expected"] += 1
        else:
            per_intent_stats[expected_intent] = {"total_expected": 1, "total_predicted": 0, "correct": 0}

        if pred_intent in per_intent_stats:
            per_intent_stats[pred_intent]["total_predicted"] += 1
        else:
            per_intent_stats[pred_intent] = {"total_expected": 0, "total_predicted": 1, "correct": 0}

        is_intent_match = (pred_intent == expected_intent)
        if is_intent_match:
            intent_correct += 1
            if expected_intent in per_intent_stats:
                per_intent_stats[expected_intent]["correct"] += 1

        is_handler_match = (pred_handler == expected_handler)
        if is_handler_match:
            handler_correct += 1

        # Out of scope / unknown metrics
        if expected_intent == "unknown" and pred_intent == "unknown":
            unknown_tp += 1
        elif expected_intent != "unknown" and pred_intent == "unknown":
            unknown_fn += 1
        elif expected_intent == "unknown" and pred_intent != "unknown":
            unknown_fp += 1
        else:
            unknown_tn += 1

        if not is_intent_match:
            failures.append({
                "id": case.get("id"),
                "query": query,
                "expected_intent": expected_intent,
                "predicted_intent": pred_intent,
                "score": res.get("score"),
                "confidence": res.get("confidence")
            })

    intent_accuracy = (intent_correct / total_cases) * 100.0 if total_cases > 0 else 0.0
    handler_accuracy = (handler_correct / total_cases) * 100.0 if total_cases > 0 else 0.0

    # Ambiguous query handling metrics
    unknown_precision = (unknown_tp / (unknown_tp + unknown_fp)) * 100.0 if (unknown_tp + unknown_fp) > 0 else 0.0
    unknown_recall = (unknown_tp / (unknown_tp + unknown_fn)) * 100.0 if (unknown_tp + unknown_fn) > 0 else 0.0
    unknown_f1 = (2 * unknown_precision * unknown_recall / (unknown_precision + unknown_recall)) if (unknown_precision + unknown_recall) > 0 else 0.0

    # Calculate per-intent precision/recall/F1
    intent_metrics = {}
    for intent, stats in per_intent_stats.items():
        exp = stats["total_expected"]
        pred = stats["total_predicted"]
        corr = stats["correct"]

        acc = (corr / exp * 100.0) if exp > 0 else 0.0
        prec = (corr / pred * 100.0) if pred > 0 else 0.0
        rec = (corr / exp * 100.0) if exp > 0 else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        intent_metrics[intent] = {
            "expected_count": exp,
            "predicted_count": pred,
            "correct_count": corr,
            "accuracy_pct": round(acc, 2),
            "precision_pct": round(prec, 2),
            "recall_pct": round(rec, 2),
            "f1_score": round(f1, 2)
        }

    avg_latency = sum(latencies_ms) / len(latencies_ms) if latencies_ms else 0.0
    latencies_sorted = sorted(latencies_ms)
    p95_latency = latencies_sorted[int(len(latencies_sorted) * 0.95)] if latencies_sorted else 0.0

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_cases": total_cases,
        "intent_routing_accuracy_pct": round(intent_accuracy, 2),
        "tool_handler_accuracy_pct": round(handler_accuracy, 2),
        "unknown_query_metrics": {
            "precision_pct": round(unknown_precision, 2),
            "recall_pct": round(unknown_recall, 2),
            "f1_score": round(unknown_f1, 2)
        },
        "latency_stats_ms": {
            "avg_ms": round(avg_latency, 2),
            "p95_ms": round(p95_latency, 2),
            "min_ms": round(min(latencies_ms), 2) if latencies_ms else 0.0,
            "max_ms": round(max(latencies_ms), 2) if latencies_ms else 0.0
        },
        "per_intent_metrics": intent_metrics,
        "total_failures": len(failures),
        "failures": failures
    }

    # Print Report
    print(f"\n📊 INTENT ROUTER EVALUATION SUMMARY")
    print(f"------------------------------------------------------------")
    print(f"Total Queries Evaluated     : {total_cases}")
    print(f"Intent Routing Accuracy    : {intent_accuracy:.2f}% ({intent_correct}/{total_cases})")
    print(f"Tool Selection Accuracy    : {handler_accuracy:.2f}% ({handler_correct}/{total_cases})")
    print(f"Ambiguous Query Detection  : Precision {unknown_precision:.1f}% | Recall {unknown_recall:.1f}% | F1 {unknown_f1:.1f}%")
    print(f"Average Routing Latency     : {avg_latency:.2f} ms (P95: {p95_latency:.2f} ms)")
    print(f"------------------------------------------------------------\n")

    print("📋 PER-INTENT BREAKDOWN:")
    print(f"{'Intent':<20} | {'Expected':<8} | {'Correct':<8} | {'Accuracy':<10} | {'F1-Score':<8}")
    print("-" * 65)
    for intent, m in intent_metrics.items():
        if m["expected_count"] > 0 or m["predicted_count"] > 0:
            print(f"{intent:<20} | {m['expected_count']:<8} | {m['correct_count']:<8} | {m['accuracy_pct']:>8.1f}% | {m['f1_score']:>8.1f}")

    if failures:
        print(f"\n⚠️ MISCLASSIFIED QUERIES ({len(failures)}):")
        for f in failures[:5]:
            print(f"  • [{f['id']}] \"{f['query']}\"")
            print(f"    Expected: {f['expected_intent']} | Got: {f['predicted_intent']} (score: {f['score']})")

    out_file = os.path.join(os.path.dirname(__file__), "router_eval_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\n✅ Detailed router evaluation saved to: {out_file}\n")

    return report


if __name__ == "__main__":
    evaluate_router()
