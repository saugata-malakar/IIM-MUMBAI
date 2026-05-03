@echo off
title Push MedShield to GitHub
echo ===================================================
echo   MedShield - GitHub Initialization & Push
echo ===================================================
echo.
echo Make sure you have created an empty repository on GitHub first!
echo.
set /p repo_url="Enter your GitHub Repository URL (e.g., https://github.com/username/medshield.git): "

if "%repo_url%"=="" (
    echo Error: URL cannot be empty.
    pause
    exit /b
)

echo.
echo [*] Initializing Git repository...
git init

echo [*] Adding files...
git add .

echo [*] Committing files...
git commit -m "Initial commit: MedShield DPDP-compliant Medical Anonymization Platform (IIM Mumbai)"

echo [*] Setting main branch...
git branch -M main

echo [*] Adding remote origin...
git remote add origin %repo_url%

echo [*] Pushing to GitHub...
git push -u origin main

echo.
echo ===================================================
echo   DONE! MedShield has been pushed to GitHub.
echo ===================================================
pause
