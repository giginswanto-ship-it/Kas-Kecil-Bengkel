@echo off
title Pembaca Riwayat Kas Bengkel - Shop ^& Drive ^& Bima Motor
color 0b
echo ========================================================
echo   MEMBUKA PROGRAM PEMBACA RIWAYAT KAS BENGKEL...
echo ========================================================
echo.
cd /d "%~dp0"
node baca_riwayat.js
pause
