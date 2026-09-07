import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('main.py', encoding='utf-8') as f:
    content = f.read()

NOTIFICATION_API = '''
# ===== THÔNG BÁO UPCOMING APPOINTMENTS =====

@app.get("/api/notifications/upcoming")
@jwt_required()
def get_upcoming_notifications():
    """
    Trả về lịch hẹn sắp đến trong vòng X phút tới,
    CHỈ của các nhân viên đã bật notify_upcoming = True.
    Frontend dùng để polling và hiện chuông thông báo.
    """
    import datetime as dt_module
    _, tenant_id, _ = current_user_info()
    minutes = int(request.args.get("minutes", 30))  # mặc định 30 phút
    db = get_db()
    try:
        now = datetime.now()
        window_end = now + dt_module.timedelta(minutes=minutes)

        # Lấy danh sách nhân viên bật thông báo
        notified_staff = db.query(User).filter(
            User.tenant_id == tenant_id,
            User.notify_upcoming == True,
            User.is_active == True
        ).all()

        if not notified_staff:
            return ok([])

        notified_ids = {str(u.id) for u in notified_staff}
        notified_map = {str(u.id): u for u in notified_staff}

        # Lấy lịch hẹn sắp tới trong window
        apts = db.query(Appointment).filter(
            Appointment.tenant_id == tenant_id,
            Appointment.appointment_time >= now,
            Appointment.appointment_time <= window_end,
            Appointment.status.notin_(["cancelled", "done"]),
        ).order_by(Appointment.appointment_time).all()

        results = []
        for apt in apts:
            # Chỉ lấy lịch của thợ đã bật thông báo
            if str(apt.stylist_id) not in notified_ids:
                continue
            stylist = notified_map.get(str(apt.stylist_id))
            minutes_left = int((apt.appointment_time - now).total_seconds() / 60)
            results.append({
                "id": str(apt.id),
                "customer_name": apt.customer_name or "Khách",
                "customer_phone": apt.customer_phone or "",
                "stylist_id": str(apt.stylist_id) if apt.stylist_id else "",
                "stylist_name": apt.stylist_name or (stylist.name if stylist else ""),
                "service_name": apt.service_name or "",
                "appointment_time": apt.appointment_time.isoformat(),
                "appointment_time_fmt": apt.appointment_time.strftime("%H:%M"),
                "minutes_left": minutes_left,
                "status": apt.status,
                "duration_minutes": apt.duration_minutes or 30,
                "note": apt.note or "",
            })

        return ok(results)
    finally:
        db.close()


@app.patch("/api/staff/<user_id>/notify-toggle")
@jwt_required()
def toggle_staff_notify(user_id):
    """Bật/tắt thông báo upcoming cho 1 nhân viên"""
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"): return err("Không có quyền", 403)
    db = get_db()
    try:
        u = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
        if not u: return err("Không tìm thấy", 404)
        u.notify_upcoming = not u.notify_upcoming
        db.commit()
        return ok({"notify_upcoming": u.notify_upcoming, "name": u.name})
    finally:
        db.close()


'''

marker = "\n# ===== APPOINTMENTS =====\n"
if marker in content:
    content = content.replace(marker, NOTIFICATION_API + marker, 1)
    print("Notification API: OK")
else:
    print("Marker NOT FOUND")

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done. Lines:", content.count('\n'))
