
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('main.py', encoding='utf-8') as f:
    content = f.read()

OLD_GET = '''    return ok({
            "enabled": sms.get("enabled", False),
            "provider": sms.get("provider", "speedsms"),
            "api_key": sms.get("api_key", ""),
            "secret_key": sms.get("secret_key", ""),
            "template": sms.get("template",
                "Xin ch\u00e0o {name}! {shop} nh\u1eafc b\u1ea1n c\u00f3 l\u1ecbch h\u1eb9n l\u00fac {time} h\u00f4m nay. Xin vui l\u00f2ng \u0111\u1ebfn \u0111\u00fang gi\u1edd. C\u1ea3m \u01a1n!"),
        })
    finally:
        db.close()


@app.put("/api/settings/sms")'''

NEW_GET = '''    return ok({
            "enabled":       sms.get("enabled", False),
            "provider":      sms.get("provider", "demo"),
            "api_key":       sms.get("api_key", ""),
            "secret_key":    sms.get("secret_key", ""),
            "test_email":    sms.get("test_email", ""),
            "email_subject": sms.get("email_subject", "Nh\u1eafc l\u1ecbch h\u1eb9n"),
            "template": sms.get("template",
                "Xin ch\u00e0o {name}! {shop} nh\u1eafc b\u1ea1n c\u00f3 l\u1ecbch h\u1eb9n l\u00fac {time} h\u00f4m nay. Xin vui l\u00f2ng \u0111\u1ebfn \u0111\u00fang gi\u1edd. C\u1ea3m \u01a1n!"),
        })
    finally:
        db.close()


@app.put("/api/settings/sms")'''

OLD_PUT = '''        current_settings["sms"] = {
            "enabled": d.get("enabled", False),
            "provider": d.get("provider", "speedsms"),
            "api_key": d.get("api_key", ""),
            "secret_key": d.get("secret_key", ""),
            "template": d.get("template", "Xin ch\u00e0o {name}! {shop} nh\u1eafc b\u1ea1n c\u00f3 l\u1ecbch h\u1eb9n l\u00fac {time} h\u00f4m nay. Xin vui l\u00f2ng \u0111\u1ebfn \u0111\u00fang gi\u1edd. C\u1ea3m \u01a1n!"),
        }
        t.settings = current_settings
        db.commit()
        return ok({"message": "\u0110\u00e3 c\u1eadp nh\u1eadt c\u00e0i \u0111\u1eb7t SMS"})
    except Exception as e:
        db.rollback()
        return err(str(e), 500)
    finally:
        db.close()


if __name__ == "__main__":'''

NEW_PUT = '''        cur = dict(t.settings or {})
        cur["sms"] = {
            "enabled":       d.get("enabled", False),
            "provider":      d.get("provider", "demo"),
            "api_key":       d.get("api_key", ""),
            "secret_key":    d.get("secret_key", ""),
            "test_email":    d.get("test_email", ""),
            "email_subject": d.get("email_subject", "Nh\u1eafc l\u1ecbch h\u1eb9n"),
            "template":      d.get("template", "Xin ch\u00e0o {name}! {shop} nh\u1eafc b\u1ea1n c\u00f3 l\u1ecbch h\u1eb9n l\u00fac {time} h\u00f4m nay."),
        }
        t.settings = cur
        db.commit()
        return ok({"message": "\u0110\u00e3 c\u1eadp nh\u1eadt c\u00e0i \u0111\u1eb7t th\u00f4ng b\u00e1o"})
    except Exception as e:
        db.rollback()
        return err(str(e), 500)
    finally:
        db.close()


@app.post("/api/settings/sms/test")
@jwt_required()
def test_notification():
    """G\u1eedi th\u00f4ng b\u00e1o test"""
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"): return err("Kh\u00f4ng c\u00f3 quy\u1ec1n", 403)
    d = request.json or {}
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        sms = (t.settings or {}).get("sms", {})
        provider   = sms.get("provider", "demo")
        api_key    = sms.get("api_key", "")
        secret_key = sms.get("secret_key", "")
        test_msg = f"[TEST] {t.name} - \u0110\u00e2y l\u00e0 tin nh\u1eafn ki\u1ec3m tra. N\u1ebfu nh\u1eadn \u0111\u01b0\u1ee3c, t\u00ednh n\u0103ng nh\u1eafc l\u1ecbch \u0111\u00e3 ho\u1ea1t \u0111\u1ed9ng!"
        success = False
        detail = "demo mode"

        if provider == "telegram" and api_key:
            chat_id = d.get("chat_id") or secret_key
            if not chat_id: return err("Nh\u1eadp chat_id Telegram v\u00e0o Secret Key", 400)
            success = send_telegram(chat_id, test_msg, api_key)
            detail = f"Telegram chat_id={chat_id}"
        elif provider == "zalo_oa" and api_key:
            zalo_uid = d.get("zalo_user_id") or secret_key
            if not zalo_uid: return err("Nh\u1eadp Zalo user_id v\u00e0o Secret Key", 400)
            success = send_zalo_oa(zalo_uid, test_msg, api_key)
            detail = f"Zalo user_id={zalo_uid}"
        elif provider == "gmail" and api_key and secret_key:
            email = d.get("email") or sms.get("test_email", "")
            if not email: return err("Nh\u1eadp email test", 400)
            success = send_email_gmail(email, "[TEST] Nh\u1eafc l\u1ecbch h\u1eb9n", test_msg, api_key, secret_key)
            detail = f"email={email}"
        elif provider in ("speedsms", "esms") and api_key:
            phone = d.get("phone", "")
            if not phone: return err("Nh\u1eadp s\u1ed1 \u0111i\u1ec7n tho\u1ea1i test", 400)
            success = send_sms_speedsms(phone, test_msg, api_key) if provider == "speedsms" else send_sms_esms(phone, test_msg, api_key, secret_key)
            detail = f"phone={phone}"
        else:
            print(f"[TEST DEMO] {test_msg}")
            success = True

        if success:
            return ok({"message": f"\u0110\u00e3 g\u1eedi test! ({detail})"})
        else:
            return err("G\u1eedi th\u1ea5t b\u1ea1i. Ki\u1ec3m tra l\u1ea1i API key.", 500)
    finally:
        db.close()


@app.get("/api/settings/telegram-updates")
@jwt_required()
def telegram_get_updates():
    """L\u1ea5y danh s\u00e1ch users \u0111\u00e3 nh\u1eafn bot"""
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"): return err("Kh\u00f4ng c\u00f3 quy\u1ec1n", 403)
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        sms = (t.settings or {}).get("sms", {})
        if sms.get("provider") != "telegram": return err("Ch\u01b0a ch\u1ecdn Telegram", 400)
        bot_token = sms.get("api_key", "")
        if not bot_token: return err("Ch\u01b0a nh\u1eadp Bot Token", 400)
        result = get_telegram_updates(bot_token)
        if not result.get("ok"): return err("L\u1ed7i k\u1ebft n\u1ed1i Telegram", 500)
        seen, users = set(), []
        for upd in result.get("result", []):
            m = upd.get("message") or upd.get("channel_post") or {}
            chat = m.get("chat", {})
            cid = chat.get("id")
            if cid and cid not in seen:
                seen.add(cid)
                users.append({"chat_id": cid, "name": (chat.get("first_name","") + " " + chat.get("last_name","")).strip(), "username": chat.get("username","")})
        return ok(users)
    finally:
        db.close()


if __name__ == "__main__":'''

if OLD_GET in content:
    content = content.replace(OLD_GET, NEW_GET)
    print("GET: OK")
else:
    print("GET: NOT FOUND")

if OLD_PUT in content:
    content = content.replace(OLD_PUT, NEW_PUT)
    print("PUT: OK")
else:
    print("PUT: NOT FOUND")

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done. Total lines:", content.count('\n'))
