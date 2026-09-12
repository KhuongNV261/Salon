import requests
r = requests.get("https://salon-p2ww.onrender.com/api/public/thanhthanh/services")
print(f"Status: {r.status_code}")
print(f"Body: {r.text}")
