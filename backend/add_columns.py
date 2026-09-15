import os
from sqlalchemy import create_engine, text

# Get DB_URL logic from main.py
DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres123@localhost:5432/localpos_dev")
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DB_URL.startswith("postgresql://") and "+" not in DB_URL:
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://", 1)

print(f"Connecting to database to add columns...")
engine = create_engine(DB_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;"))
        print("Added logo_url column successfully (or it already exists).")
    except Exception as e:
        print(f"Error adding logo_url: {e}")
        
    try:
        conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS login_bg_url TEXT;"))
        print("Added login_bg_url column successfully (or it already exists).")
    except Exception as e:
        print(f"Error adding login_bg_url: {e}")
        
    conn.commit()
print("Done!")
