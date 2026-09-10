import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from main import engine, Category, Session
from sqlalchemy import text

db = Session()
try:
    # Test query giống hệt backend
    tenant_id = '631ece7d-ccc8-4867-a752-23d41f53bc85'
    cats = db.query(Category).filter(
        Category.tenant_id == tenant_id, 
        Category.is_active == True
    ).order_by(Category.sort_order, Category.name).all()
    
    print(f"Query result: {len(cats)} categories")
    for c in cats:
        print(f"  id={c.id}, name={c.name!r}, is_active={c.is_active}")
finally:
    db.close()
