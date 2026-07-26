import sqlite3

def alter_db():
    conn = sqlite3.connect('expense_tracker.db')
    try:
        conn.execute('ALTER TABLE transactions ADD COLUMN original_amount FLOAT')
    except Exception as e:
        print("original_amount error:", e)
        
    try:
        conn.execute('ALTER TABLE transactions ADD COLUMN original_currency VARCHAR')
    except Exception as e:
        print("original_currency error:", e)
        
    try:
        conn.execute('ALTER TABLE transactions ADD COLUMN exchange_rate FLOAT')
    except Exception as e:
        print("exchange_rate error:", e)
        
    conn.commit()
    print("Done")

alter_db()
