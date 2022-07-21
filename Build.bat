@echo off
@color 3
set "output=-- Please install nodejs: https://nodejs.org/en/ --"
for /f "delims=" %%i in ('node -v 2^>nul') do set output=%%i
echo %output%
echo.
npm run build
