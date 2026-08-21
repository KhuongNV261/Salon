@echo off
echo ===================================================
echo DANG DAY CODE TU MAY TINH CA NHAN LEN WEB...
echo ===================================================

cd /d "%~dp0"

echo [1/3] Them tat ca cac file da sua...
git add .

echo [2/3] Luu lich su...
git commit -m "Cap nhat tu nut day code"

echo [3/3] Day len GitHub (Render va Vercel se tu dong cap nhat)...
git push origin main

echo ===================================================
echo HOAN TAT! 
echo Vercel va Render se tu dong cap nhat web trong 1-2 phut.
echo ===================================================
pause
