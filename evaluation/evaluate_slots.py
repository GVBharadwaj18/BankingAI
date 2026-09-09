"""
Evaluation Script for BankingAI Slot Extractor
Evaluates structured slot extraction accuracy across banking workflows.
Compares LLM-based slot extraction vs Heuristic fallback extraction.
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

from orchestrator import parse_slots_node, extract_slots_from_text

def normalize_value(val: Any) -> str:
    """Normalize slot values for comparison"""
    if val is None:
        return ""
    if isinstance(val, (int, float)):
        return str(int(val))
    return str(val).strip().lower()

def evaluate_slots(dataset_path: str = None) -> Dict[str, Any]:
    if dataset_path is None:
        dataset_path = os.path.join(os.path.dirname(__file__), "routing_cases.json")

    with open(dataset_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    # Filter test cases with expected slots
    slot_cases = [c for c in cases if c.get("expected_slots")]

    print(f"\n============================================================")
    print(f"🎯 EVALUATING BANKING SLOT EXTRACTION ({len(slot_cases)} Test Cases)")
    print(f"============================================================")

    # Metrics containers for LLM & Heuristic methods
    llm_tp = 0
    llm_fp = 0
    llm_fn = 0

    heur_tp = 0
    heur_fp = 0
    heur_fn = 0

    per_slot_stats = {}

    llm_failures = []
    latencies_ms = []

    for case in slot_cases:
        query = case["query"]
        expected_slots = case.get("expected_slots", [])
        expected_values = case.get("expected_slot_values", {})

        # Setup state for LLM slot parsing node
        state = {
            "text": query,
            "intent": case.get("expected_intent"),
            "pending_slots": expected_slots.copy(),
            "slots": {},
            "history": []
        }

        # 1. LLM Extraction (with immediate fallback if API rate limited)
        start_time = time.perf_counter()
        try:
            res_state = parse_slots_node(state)
            llm_extracted = res_state.get("slots", {})
        except Exception as e:
            llm_extracted = extract_slots_from_text(query, expected_slots)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        latencies_ms.append(elapsed_ms)

        # 2. Heuristic Extraction
        heur_extracted = extract_slots_from_text(query, expected_slots)

        # Compare LLM Extraction against ground truth expected_values
        for slot in expected_slots:
            if slot not in per_slot_stats:
                per_slot_stats[slot] = {"expected": 0, "llm_correct": 0, "heur_correct": 0}

            exp_val = expected_values.get(slot)
            has_exp_val = (exp_val is not None)

            if has_exp_val:
                per_slot_stats[slot]["expected"] += 1

            # Check LLM extraction
            llm_val = llm_extracted.get(slot)
            if llm_val is not None:
                if has_exp_val and normalize_value(llm_val) == normalize_value(exp_val):
                    llm_tp += 1
                    per_slot_stats[slot]["llm_correct"] += 1
                elif not has_exp_val:
                    # Extracted value when none expected or wrong value
                    llm_fp += 1
                else:
                    llm_fp += 1
            else:
                if has_exp_val:
                    llm_fn += 1

            # Check Heuristic extraction
            heur_val = heur_extracted.get(slot)
            if heur_val is not None:
                if has_exp_val and normalize_value(heur_val) == normalize_value(exp_val):
                    heur_tp += 1
                    per_slot_stats[slot]["heur_correct"] += 1
                else:
                    heur_fp += 1
            else:
                if has_exp_val:
                    heur_fn += 1

            # Track failure cases for LLM
            if has_exp_val and normalize_value(llm_val) != normalize_value(exp_val):
                llm_failures.append({
                    "id": case.get("id"),
                    "query": query,
                    "slot": slot,
                    "expected": exp_val,
                    "extracted": llm_val
                })

    # Compute aggregate metrics
    llm_prec = (llm_tp / (llm_tp + llm_fp) * 100.0) if (llm_tp + llm_fp) > 0 else 0.0
    llm_rec = (llm_tp / (llm_tp + llm_fn) * 100.0) if (llm_tp + llm_fn) > 0 else 0.0
    llm_f1 = (2 * llm_prec * llm_rec / (llm_prec + llm_rec)) if (llm_prec + llm_rec) > 0 else 0.0

    heur_prec = (heur_tp / (heur_tp + heur_fp) * 100.0) if (heur_tp + heur_fp) > 0 else 0.0
    heur_rec = (heur_tp / (heur_tp + heur_fn) * 100.0) if (heur_tp + heur_fn) > 0 else 0.0
    heur_f1 = (2 * heur_prec * heur_rec / (heur_prec + heur_rec)) if (heur_prec + heur_rec) > 0 else 0.0

    avg_latency = sum(latencies_ms) / len(latencies_ms) if latencies_ms else 0.0

    # Per-slot type metrics
    slot_breakdown = {}
    for slot, stats in per_slot_stats.items():
        exp_c = stats["expected"]
        llm_c = stats["llm_correct"]
        heur_c = stats["heur_correct"]

        slot_breakdown[slot] = {
            "expected_count": exp_c,
            "llm_accuracy_pct": round((llm_c / exp_c * 100.0), 2) if exp_c > 0 else 100.0,
            "heuristic_accuracy_pct": round((heur_c / exp_c * 100.0), 2) if exp_c > 0 else 100.0
        }

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_slot_queries": len(slot_cases),
        "llm_slot_extractor": {
            "precision_pct": round(llm_prec, 2),
            "recall_pct": round(llm_rec, 2),
            "f1_score": round(llm_f1, 2),
            "avg_latency_ms": round(avg_latency, 2)
        },
        "heuristic_slot_extractor": {
            "precision_pct": round(heur_prec, 2),
            "recall_pct": round(heur_rec, 2),
            "f1_score": round(heur_f1, 2)
        },
        "per_slot_type_breakdown": slot_breakdown,
        "mismatches": llm_failures[:10]
    }

    # Print Report
    print(f"\n📊 SLOT EXTRACTION EVALUATION SUMMARY")
    print(f"------------------------------------------------------------")
    print(f"Total Queries Evaluated     : {len(slot_cases)}")
    print(f"LLM Extractor Precision    : {llm_prec:.2f}%")
    print(f"LLM Extractor Recall       : {llm_rec:.2f}%")
    print(f"LLM Extractor F1-Score     : {llm_f1:.2f}%")
    print(f"Avg Slot Extraction Time   : {avg_latency:.2f} ms")
    print(f"------------------------------------------------------------")
    print(f"Heuristic Fallback Precision: {heur_prec:.2f}%")
    print(f"Heuristic Fallback Recall   : {heur_rec:.2f}%")
    print(f"Heuristic Fallback F1-Score : {heur_f1:.2f}%")
    print(f"------------------------------------------------------------\n")

    print("📋 ACCURACY BY SLOT TYPE:")
    print(f"{'Slot Name':<18} | {'Total Expected':<14} | {'LLM Acc (%)':<12} | {'Heuristic Acc (%)':<15}")
    print("-" * 66)
    for slot, b in slot_breakdown.items():
        print(f"{slot:<18} | {b['expected_count']:<14} | {b['llm_accuracy_pct']:>11.1f}% | {b['heuristic_accuracy_pct']:>14.1f}%")

    out_file = os.path.join(os.path.dirname(__file__), "slots_eval_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\n✅ Detailed slot evaluation saved to: {out_file}\n")

    return report


if __name__ == "__main__":
    evaluate_slots()
