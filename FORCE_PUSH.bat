@echo off
title FORCE PUSH TO GITHUB
echo ===================================================
echo   WARNING: THIS WILL FORCE PUSH EVERYTHING
echo   TO https://github.com/saugata-malakar/IIM-MUMBAI
echo ===================================================
echo.

echo [*] Initializing/Resetting Git repository...
git init
git branch -M main

echo [*] Adding all files and data...
git add .

echo [*] Committing changes...
git commit -m "Final production push with all code, UI fixes, and data"

echo [*] Setting remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/saugata-malakar/IIM-MUMBAI.git

echo [*] Force pushing to GitHub (this may take a minute if data is large)...
git push -u -f origin main

echo.
echo ===================================================
echo   DONE! EVERYTHING HAS BEEN FORCE PUSHED!
echo ===================================================
pause
