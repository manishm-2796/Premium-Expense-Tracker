from app.routes.transactions import auto_categorize

def test_auto_categorize():
    assert auto_categorize("Starbucks Coffee") == "Coffee"
    assert auto_categorize("Walmart Supercenter") == "Groceries"
    assert auto_categorize("Shell Gas Station") == "Gas"
    assert auto_categorize("Uber Eats") == "Food"
    assert auto_categorize("Amazon.com") == "Shopping"
    assert auto_categorize("Comcast Internet") == "Utilities"
    assert auto_categorize("Random Vendor") == "Other"
