@echo off
cd /d "%~dp0"
set "GO=%~dp0.runtime\tools\go\bin\go.exe"
if not exist "%GO%" set "GO=go"
"%GO%" -C backend run .
pause
