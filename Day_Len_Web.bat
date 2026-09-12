@echo off
echo ===================================================
echo DANG DAY CODE LEN CLOUDFLARE WORKERS...
echo ===================================================

cd /d "%~dp0"

echo [1/4] Build frontend...
cd frontend
call npm install
call npm run build
cd ..

echo [2/4] Deploy len Cloudflare Workers...
call npx wrangler deploy

echo [3/4] Luu code len GitHub (de backup)...
git add .
git commit -m "Cap nhat - %date% %time%"
git push origin main

echo ===================================================
echo HOAN TAT!
echo Web da duoc cap nhat tai: https://khuong2601.io.vn
echo Tiem toc: https://tiemtocthanhthanh.khuong2601.io.vn
echo ===================================================
pause
