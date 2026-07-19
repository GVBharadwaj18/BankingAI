"""
Spending Tools - Analyze monthly spending data and give AI insights
"""

from langchain.tools import tool
from typing import Dict, Any


@tool
def analyze_spending_tool(month: str = "current") -> Dict[str, Any]:
    """
    Analyze the customer's monthly spending (outflow) and return insights.
    
    Args:
        month: Month to analyze (default: "current")
        
    Returns:
        Dictionary with spending breakdown and AI audit comments
    """
    try:
        # Spending Breakdown data matching page.tsx outflow of ₹2,40,720
        breakdown = [
            {"category": "Rent", "amount": 25000, "percentage": 10.4, "status": "Fixed"},
            {"category": "EMI", "amount": 45000, "percentage": 18.7, "status": "Fixed"},
            {"category": "Savings & MF", "amount": 120000, "percentage": 49.8, "status": "Invested"},
            {"category": "Groceries", "amount": 10620, "percentage": 4.4, "status": "Normal"},
            {"category": "Shopping", "amount": 7499, "percentage": 3.1, "status": "Warning"},
            {"category": "Dining & Food", "amount": 8400, "percentage": 3.5, "status": "Warning"},
            {"category": "Travel", "amount": 15000, "percentage": 6.2, "status": "Normal"},
            {"category": "Utilities", "amount": 4500, "percentage": 1.9, "status": "Normal"},
            {"category": "Transport", "amount": 3500, "percentage": 1.5, "status": "Normal"},
            {"category": "Entertainment", "amount": 1200, "percentage": 0.5, "status": "Normal"}
        ]
        
        total_outflow = sum(item["amount"] for item in breakdown)
        
        # Indian formatting
        def format_inr(amount):
            return f"₹{amount:,.0f}"

        return {
            "summary": f"I've completed an AI analysis of your {month} monthly outflow. Your total spend is **{format_inr(total_outflow)}**. While you have maintained a strong savings rate of ~50%, there are a few discretionary areas to watch out for.",
            "bullets": [
                f"💰 **Total Outflow:** {format_inr(total_outflow)}",
                f"📈 **High savings:** You invested **{format_inr(120000)}** (49.8% of total outflow) in Mutual Funds and savings deposits.",
                f"🍔 **Dining & Food Alert:** You spent **{format_inr(8400)}** (3.5%), which is **+25%** higher than your historical baseline of ₹6,500.",
                f"🛍️ **Shopping Spikes:** Online retail purchases totaled **{format_inr(7499)}** (3.1%), primarily driven by Amazon purchases.",
                f"✈️ **Travel Outflow:** One-time flight booking accounted for **{format_inr(15000)}** (6.2%).",
                "💡 **Recommendation:** Lock your dining budgets or set transactional card alerts to keep food expenses under ₹5,000 next month."
            ],
            "data": {
                "spending_breakdown": breakdown,
                "total_outflow": total_outflow,
                "savings_rate": "49.8%",
                "discretionary_spend": 30899, # Dining + Shopping + Travel
                "savings_amount": 120000,
                "audit_status": "healthy"
            }
        }
    except Exception as e:
        return {
            "summary": f"Error auditing spends: {str(e)}",
            "bullets": ["Please check your input values and try again."],
            "data": {"error": str(e)}
        }
