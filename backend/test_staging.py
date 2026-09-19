import requests

s = requests.Session()
# Lấy JWT từ staging
res = s.post('https://salon-staging.onrender.com/api/auth/login', json={
    'slug': 'minhthanh',
    'phone': '0923456789', # Tạm lấy một tài khoản có sẵn
    'password': '123'
})

if res.status_code == 200:
    token = res.json().get('access_token') or res.json().get('token')
    print("Login OK, token:", token[:20])
    
    # Try booking
    res2 = s.post('https://salon-staging.onrender.com/api/appointments', json={
        "customer_name": "a",
        "customer_phone": "123",
        "stylist_id": "5f605eb4-b850-4adc-b6fc-5394f80c28ee", # ID của user 0923456789
        "stylist_name": "Minh Thành",
        "service_id": None,
        "service_name": None,
        "appointment_time": "2026-09-17T09:00:00",
        "duration_minutes": 30,
        "note": None
    }, headers={'Authorization': f'Bearer {token}'})
    print(res2.status_code)
    print(res2.text)
else:
    print("Login failed:", res.status_code, res.text)
