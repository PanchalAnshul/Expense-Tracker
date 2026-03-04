import pandas as pd
from datetime import datetime, timedelta

data = {
    'Date': [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(12)],
    'Amount': [3000.0, 10.5, 20.0, 150.75, 5.0, 8.99, 1200.0, 45.0, 500.0, 30.0, 12.5, 60.0],
    'Category': ['Salary', 'Food', 'Transport', 'Shopping', 'Coffee', 'Subscriptions', 'Rent', 'Groceries', 'Freelance', 'Utilities', 'Food', 'Entertainment'],
    'Description': ['Monthly Salary', 'Lunch', 'Bus fare', 'Sneakers', 'Starbucks', 'Netflix', 'Monthly Rent', 'Trader Joes', 'Web Design Gig', 'Internet', 'Dinner', 'Movie tickets'],
    'Type': ['Income', 'Expense', 'Expense', 'Expense', 'Expense', 'Expense', 'Expense', 'Expense', 'Income', 'Expense', 'Expense', 'Expense']
}

df = pd.DataFrame(data)
df.to_excel('test_expenses.xlsx', index=False)
print("Created test_expenses.xlsx")
