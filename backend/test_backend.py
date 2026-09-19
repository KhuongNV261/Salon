from main import app, get_db, Appointment, User, Tenant
from flask_jwt_extended import create_access_token

db = get_db()
user = db.query(User).first()
if not user:
    print("No user")
    exit()

with app.test_request_context(
    '/api/appointments', 
    method='POST',
    json={
        "customer_name": "a",
        "customer_phone": "123",
        "stylist_id": str(user.id),
        "stylist_name": user.name,
        "service_id": None,
        "service_name": None,
        "appointment_time": "2026-09-17T08:00:00",
        "duration_minutes": 30,
        "note": None
    }
):
    from flask_jwt_extended.utils import set_access_cookies
    # We must mock JWT identity. It's easier to just mock current_user_info
    import main
    main.current_user_info = lambda: (str(user.id), str(user.tenant_id), user.role)
    
    try:
        res = main.create_appointment()
        print("RESULT:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()
