import sqlite3

def add_push_token_column():
    conn = sqlite3.connect('expense_tracker.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN push_token VARCHAR;")
        print("Successfully added push_token column to users table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column push_token already exists.")
        else:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_push_token_column()
