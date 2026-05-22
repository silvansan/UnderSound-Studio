@echo off
setlocal

:: Double-click this file (or right-click -> Run as administrator) to open LAN ports.
:: UAC will prompt for elevation if needed.

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0open-lan-firewall.ps1\"' -Wait"

echo.
echo If rules were added, test from your phone:
echo   http://YOUR_LAN_IP:3000/api/health
echo Run: npm run lan:urls
echo.
pause
