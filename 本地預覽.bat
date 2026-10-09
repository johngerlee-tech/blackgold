@echo off
chcp 65001 >nul
title 《黑金魔法術─永續食物循環系統》- GitHub & Firebase 網頁版本地預覽

echo ======================================================================
echo   🧙‍♂️《黑金魔法術─永續食物循環系統》(GitHub & Firebase 網頁版)
echo ======================================================================
echo.
echo [提示] 正在啟動輕量本地靜態網頁伺服器 (Port: 8088)...
echo.
start http://localhost:8088/index.html
python -m http.server 8088

pause
