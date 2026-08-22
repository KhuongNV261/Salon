from main import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE tenants ADD COLUMN features JSONB DEFAULT '{}'::jsonb;"))
        print("Added features column")
    except Exception as e:
        print(f"Error adding features: {e}")
        
    try:
        conn.execute(text("ALTER TABLE tenants ADD COLUMN max_staff INTEGER DEFAULT 10;"))
        print("Added max_staff column")
    except Exception as e:
        print(f"Error adding max_staff: {e}")
        
    conn.commit()
print("Migration done")
