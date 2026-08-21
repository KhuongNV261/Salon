@echo off
echo ===================================================
echo DANG KHOI DONG HE THONG LOCAL...
echo ===================================================

cd /d "%~dp0"

echo [1/2] Dang chay Server (Backend)...
start cmd /k "cd backend && .venv\Scripts\activate && python main.py"

echo [2/2] Dang chay Giao dien (Frontend)...
start cmd /k "cd frontend && npm run dev"

echo ===================================================
echo Da khoi dong xong! 
echo Hay vao trinh duyet va mo: http://localhost:5173
echo ===================================================
pause
