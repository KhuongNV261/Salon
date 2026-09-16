import requests

s = requests.Session()
res = s.post('http://localhost:8000/api/auth/login', json={
    'slug': 'minhthanh',
    'phone': '0923456789', # Tạm lấy một tài khoản có sẵn
    'password': '123'
})

if res.status_code == 200:
    token = res.json().get('token')
    print("Login OK")
    
    # Try booking
    res2 = s.post('http://localhost:8000/api/appointments', json={
        "customer_name": "a",
        "customer_phone": "123",
        "stylist_id": None,
        "stylist_name": None,
        "service_id": None,
        "service_name": None,
        "appointment_time": "2026-09-17T08:00:00",
        "duration_minutes": 30,
        "note": None
    }, headers={'Authorization': f'Bearer {token}'})
    print(res2.status_code)
    print(res2.text)
else:
    print("Login failed:", res.text)
