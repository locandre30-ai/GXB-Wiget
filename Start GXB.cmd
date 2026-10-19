@echo off
cd /d "%~dp0"
node tools\launch.cjs
if errorlevel 1 pause
