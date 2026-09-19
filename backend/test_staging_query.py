import psycopg
conn = psycopg.connect('postgresql://neondb_owner:npg_nsE3jBrdlxo8@ep-rough-firefly-azgm5tgr-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
cur = conn.cursor()
try:
    cur.execute("SELECT id FROM appointments WHERE scheduled_at + cast(duration_minutes || ' minutes' as interval) > now()")
    print('OK')
except Exception as e:
    print('ERROR:', e)
