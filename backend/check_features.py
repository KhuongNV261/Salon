from main import engine
from sqlalchemy import text

with engine.connect() as conn:
    print(conn.execute(text('SELECT slug, features FROM tenants;')).fetchall())
