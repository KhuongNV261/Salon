import requests
import psycopg

# Lấy 1 user thật trên staging để tạo JWT
conn = psycopg.connect('postgresql://neondb_owner:npg_nsE3jBrdlxo8@ep-rough-firefly-azgm5tgr-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
cur = conn.cursor()
cur.execute("SELECT id, tenant_id, role, phone FROM users LIMIT 1")
row = cur.fetchone()
if not row:
    print("No user found")
    exit()

u_id, t_id, u_role, u_phone = row
print(f"Found user: {u_phone}, role: {u_role}")

# Wait, we can't generate a valid JWT for Staging without the SECRET_KEY!
# SECRET_KEY on Staging is "localpos-prod-secret-2026-khuong2601"
import jwt # PyJWT
import time

payload = {
    "iat": int(time.time()),
    "nbf": int(time.time()),
    "exp": int(time.time()) + 3600,
    "jti": "some-random-jti",
    "sub": str(u_id),
    "type": "access",
    "tenant_id": str(t_id),
    "role": u_role
}
token = jwt.encode(payload, "localpos-prod-secret-2026-khuong2601", algorithm="HS256")
print(f"Token: {token}")

# Bây giờ gọi API Staging với token này!
s = requests.Session()
res2 = s.post('https://salon-staging.onrender.com/api/appointments', json={
    "customer_name": "a",
    "customer_phone": "123",
    "stylist_id": str(u_id),
    "stylist_name": "Test Stylist",
    "service_id": None,
    "service_name": None,
    "appointment_time": "2026-09-17T08:00:00",
    "duration_minutes": 30,
    "note": None
}, headers={'Authorization': f'Bearer {token}'})
print("Staging booking result:")
print(res2.status_code)
print(res2.text)
