@echo off
cd /d "%~dp0"
set "GO=%~dp0.runtime\tools\go\bin\go.exe"
if not exist "%GO%" set "GO=go"
"%GO%" -C backend run . -setup
if errorlevel 1 goto fin
call npm ci --prefix frontend
if errorlevel 1 goto fin
call npm run build --prefix frontend
:fin
pause
