@echo off
echo ============================================
echo   Push MMRRDiKub to GitHub
echo ============================================
echo.

REM Check git status
echo [1/5] Checking git status...
git status

REM Add remote if not exists
echo.
echo [2/5] Setting up remote...
git remote remove origin 2>nul
git remote add origin https://github.com/KhomTech/mmrrdikub.git
git remote -v

REM Stage all changes
echo.
echo [3/5] Staging all changes...
git add -A

REM Commit
echo.
echo [4/5] Committing changes...
git commit -m "Fix: Request Timeout, Total PnL calculation, Vercel deployment config"

REM Push to GitHub
echo.
echo [5/5] Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ============================================
echo   Done! Check GitHub for updates.
echo   https://github.com/KhomTech/mmrrdikub
echo ============================================
pause
