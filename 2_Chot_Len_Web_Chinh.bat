@echo off
echo ===================================================
echo DANG DUA CODE TU TRANG TEST SANG WEB CHINH...
echo ===================================================
echo.

echo [1/4] Chuyen sang nhanh main (Web chinh)...
git checkout main

echo [2/4] Gop code tu nhanh test vao...
git merge staging

echo [3/4] Day len web Chinh (Cloudflare Workers)...
cd frontend
call npm run build
cd ..
call npx wrangler deploy

echo [4/4] Luu code len Github...
git push origin main

echo.
echo [Hoan tat] Chuyen ve lai nhanh test de lam viec tiep...
git checkout staging

echo.
echo ===================================================
echo HOAN TAT! 
echo Web chinh aureliasalon.online da duoc cap nhat.
echo ===================================================
pause
