from main import get_db, Appointment, User
from sqlalchemy import func
import datetime

db = get_db()
try:
    apt_time = datetime.datetime.now()
    apt_end = apt_time + datetime.timedelta(minutes=60)
    conflict = db.query(Appointment).filter(
        Appointment.status.notin_(["cancelled", "done"]),
        Appointment.appointment_time < apt_end,
        Appointment.appointment_time + func.cast(
            func.concat(Appointment.duration_minutes, " minutes"),
            __import__("sqlalchemy").types.Interval
        ) > apt_time
    ).first()
    print("Success, query executed!")
except Exception as e:
    print(f"Error executing query: {e}")
