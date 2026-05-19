@echo off
title FORCE PUSH TO GITHUB
echo ===================================================
echo   FORCE PUSHING EVERYTHING TO GITHUB
echo ===================================================
echo.

cd /d "c:\Users\trina\Downloads\PROJECTS\IIM MUMBAI"

echo [*] Adding ALL files...
git add -A

echo [*] Committing...
git commit -m "Fix Render deployment: add tesseract, spacy model, fix port binding" --allow-empty

echo [*] Force pushing...
git push -u -f origin main

echo.
echo ===================================================
echo   DONE! Check Render dashboard to redeploy.
echo ===================================================
pause
