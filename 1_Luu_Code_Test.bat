@echo off
echo ===================================================
echo DANG LUU CODE LEN TRANG TEST (STAGING)...
echo ===================================================
echo.

echo [1/3] Dong goi code Frontend...
cd frontend
call npm run build
cd ..

echo [2/3] Day len web Test (Cloudflare Workers)...
call npx wrangler deploy --env staging

echo [3/3] Luu code len Github...
git add .
set /p commit_msg="Ghi chu sua doi (VD: sua loi nut bam): "
if "%commit_msg%"=="" set commit_msg="Cap nhat code Test - %date% %time%"
git commit -m "%commit_msg%"
git push origin staging

echo.
echo ===================================================
echo HOAN TAT! 
echo Web Test da duoc cap nhat tai: https://salon-staging.nvkhuong-neu.workers.dev
echo ===================================================
pause
