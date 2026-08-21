import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('main.py', encoding='utf-8') as f:
    content = f.read()

# 1. Add notify_upcoming to User model
old1 = "    is_active = Column(Boolean, default=True)\n    last_login_at = Column(DateTime(timezone=True))\n    created_at = Column(DateTime(timezone=True), server_default=func.now())\n\nclass Category"
new1 = "    is_active = Column(Boolean, default=True)\n    notify_upcoming = Column(Boolean, default=False, server_default='false')\n    last_login_at = Column(DateTime(timezone=True))\n    created_at = Column(DateTime(timezone=True), server_default=func.now())\n\nclass Category"

if old1 in content:
    content = content.replace(old1, new1, 1)
    print("Model: OK")
else:
    print("Model: NOT FOUND")

# 2. Update list_staff response to include notify_upcoming
old2 = '            "notify_upcoming": bool(u.notify_upcoming),'
if old2 in content:
    print("list_staff: already patched")
else:
    old2b = '            "is_active": u.is_active,\n            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None'
    new2b = '            "is_active": u.is_active,\n            "notify_upcoming": bool(u.notify_upcoming),\n            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None'
    if old2b in content:
        content = content.replace(old2b, new2b, 1)
        print("list_staff: OK")
    else:
        print("list_staff: NOT FOUND")

# 3. Update update_staff to save notify_upcoming
old3 = '        if "is_active" in d: u.is_active = d["is_active"]\n        if d.get("password"): u.password_hash = generate_password_hash(d["password"])'
new3 = '        if "is_active" in d: u.is_active = d["is_active"]\n        if "notify_upcoming" in d: u.notify_upcoming = bool(d["notify_upcoming"])\n        if d.get("password"): u.password_hash = generate_password_hash(d["password"])'

if old3 in content:
    content = content.replace(old3, new3, 1)
    print("update_staff: OK")
else:
    print("update_staff: NOT FOUND")

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
