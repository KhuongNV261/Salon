# QUAT TAC LAM VIEC — DU AN LOCALPOS (Salon Management)

> File nay duoc AI doc TU DONG truoc moi phien lam viec.
> Moi quy tac duoi day phai duoc TUAN THU TUYET DOI.

---

## QUY TRINH DEPLOY (BAT BUOC)

### AI KHONG duoc tu deploy len production
- KHONG chay: npx wrangler deploy (khong co --env staging)
- KHONG chay: 2_Chot_Len_Web_Chinh.bat hay Day_Len_Web.bat
- CHI duoc: build frontend (npm run build trong thu muc frontend/)
- CHI duoc: push code len GitHub branch staging (git push origin staging)
- Sau khi xong, PHAI NHAC nguoi dung: "Hay chay 1_Luu_Code_Test.bat de deploy staging kiem tra truoc, sau do chay 2_Chot_Len_Web_Chinh.bat de len web chinh."

### Quy trinh chuan
  Sua code -> Build kiem tra -> Push GitHub staging -> Nhac user chay 1_Luu_Code_Test.bat -> User kiem tra staging -> User chay 2_Chot_Len_Web_Chinh.bat

---

## KIEN TRUC DU AN

### Stack
- Frontend: React + Vite (thu muc frontend/)
- Backend: Python Flask + SQLAlchemy + PostgreSQL (thu muc backend/main.py)
- Deploy Frontend: Cloudflare Workers (wrangler.toml)
- Deploy Backend: Render.com (tu dong deploy khi push GitHub)
- Database: Neon PostgreSQL (timezone-aware, DateTime(timezone=True))

### Moi truong
| Moi truong         | URL                                    | Branch  | Deploy command              |
|--------------------|----------------------------------------|---------|-----------------------------|
| Staging (Test)     | salon-staging.nvkhuong-neu.workers.dev | staging | wrangler deploy --env staging |
| Production (Chinh) | aureliasalon.online                    | main    | wrangler deploy             |

### Timezone quan trong!
- Server backend chay UTC, database luu timezone-aware
- Moi appointment_time phai duoc gan UTC+7 (Vietnam) truoc khi luu
- Backend co ham parse_apt_time(s) — BAT BUOC dung ham nay thay vi datetime.fromisoformat() truc tiep
- Frontend gui format YYYY-MM-DDTHH:mm:00 (khong timezone offset) — backend tu xu ly

---

## CAU TRUC FILE QUAN TRONG

  localpos/
    frontend/src/pages/
      Booking.jsx          <- Dat lich, Timeline, Drag & Drop
      POS.jsx              <- Ban hang
      Dashboard.jsx        <- Tong quan
      Staff.jsx            <- Quan ly nhan vien
      Settings.jsx         <- Cai dat tiem
    backend/
      main.py              <- TOAN BO API backend (1 file ~3000 dong)
    1_Luu_Code_Test.bat    <- Deploy staging (dung truoc)
    2_Chot_Len_Web_Chinh.bat <- Deploy production (dung sau khi test on)
    .agents/rules/GEMINI.md  <- File quy tac nay

---

## QUY TAC CODE

### Chung
- Uu tien sua dung goc re, khong patch tam
- Truoc khi sua, phai doc code hien tai de hieu context
- Khong xoa comment hay code cu neu khong co ly do ro rang

### Frontend (React)
- Dung useRef cho side-effect flags, khong dung state khong can thiet
- Thoi gian hien thi dung dayjs(isoString).format('HH:mm') — dayjs tu parse timezone
- KHONG dung dayjs().format() cho chuoi gui len API (se them offset sai)

### Backend (Python/Flask)
- Luon dung parse_apt_time() khi parse appointment_time tu request
- Dong DB session trong finally block
- Khong import trung — datetime da import o dau file

---

## CAC LOI DA BIET (TRANH LAP LAI)

| # | Loi                              | Nguyen nhan                                              | Cach fix                              |
|---|----------------------------------|----------------------------------------------------------|---------------------------------------|
| 1 | Gio dat lich sai 7 tieng        | Naive datetime khong timezone -> PostgreSQL luu nhu UTC  | Dung parse_apt_time() o backend        |
| 2 | Click timeline khong luu slot   | useEffect reset selectedSlot=null khi stylist thay doi   | Dung skipSlotResetRef flag             |
| 3 | Deploy thang len production     | Quen --env staging flag                                  | Nhac user chay bat file               |

| 4 | Logo hien vien trang | File icon.png co pixel trang o ria khi crop tron | KHONG dung borderRadius:50% + objectFit:cover cho icon.png. Dung objectFit:contain, bo borderRadius, dung filter:drop-shadow thay box-shadow |
