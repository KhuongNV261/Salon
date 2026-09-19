import requests
from flask_jwt_extended import create_access_token
from main import app, get_db, User, Tenant

db = get_db()
u = db.query(User).first()
t = db.query(Tenant).filter_by(id=u.tenant_id).first()

with app.app_context():
    token = create_access_token(
        identity=str(u.id),
        additional_claims={"tenant_id": str(t.id), "role": u.role}
    )

print(f"Token: {token}")

# Call localhost:8000
res = requests.post("http://localhost:8000/api/appointments", json={
    "customer_name": "a",
    "customer_phone": "123",
    "stylist_id": str(u.id),
    "stylist_name": u.name,
    "service_id": None,
    "service_name": None,
    "appointment_time": "2026-09-17T08:00:00",
    "duration_minutes": 30,
    "note": None
}, headers={"Authorization": f"Bearer {token}"})

print(res.status_code)
print(res.text)
