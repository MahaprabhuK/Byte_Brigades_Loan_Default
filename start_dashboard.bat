@echo off
REM Loan Default Studio - one-click launcher (Windows)
cd /d "%~dp0"
title Loan Default Studio

python -c "import fastapi, uvicorn, mlxtend" 2>nul || (
  echo Installing dashboard dependencies, one time only...
  python -m pip install fastapi uvicorn mlxtend --quiet
)

echo.
echo  Starting the API and dashboard on http://localhost:8000
echo  Default models train in the background, about 20 seconds.
echo  Keep this window open during the demo. Close it to stop.
echo.
start "" cmd /c "timeout /t 5 >nul & start http://localhost:8000"
python api\main.py
pause
