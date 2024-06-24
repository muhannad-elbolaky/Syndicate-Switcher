@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM Function to check if a command exists
:command_exists
where /q "%~1"
IF %ERRORLEVEL% NEQ 0 (
    exit /b 1
) ELSE (
    exit /b 0
)

REM Function to install NVM if not already installed
:install_nvm
echo NVM (Node Version Manager) is not installed. Installing...
REM Install NVM (curl method)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
REM Load NVM into current shell session
SET "NVM_DIR=%USERPROFILE%\.nvm"
call "%NVM_DIR%\nvm.sh"
call "%NVM_DIR%\bash_completion"

REM Function to install bun if not already installed
:install_bun
echo bun is not installed. Installing...
REM Install bun
curl -fsSL https://bun.sh/install | bash
REM Source the shell to make bun available in the current session
call "%USERPROFILE%\.bashrc"
call "%USERPROFILE%\.zshrc"

REM Check if installation was successful
if not exist %USERPROFILE%\AppData\Local\bun\bun.exe (
    echo Failed to configure bun. Please check installation manually.
    exit /b 1
)

REM Check if NVM is installed
call :command_exists nvm
if %ERRORLEVEL% NEQ 0 (
    call :install_nvm
) else (
    echo NVM (Node Version Manager) is already installed.
)

REM Check if bun is installed
call :command_exists bun
if %ERRORLEVEL% NEQ 0 (
    call :install_bun
) else (
    echo bun is already installed.
)

REM Install the latest Node.js version and use it
echo Installing the latest Node.js version...
call nvm install node
call nvm use node

REM Display installed Node.js version
echo Node.js version:
node --version

REM Check bun version
echo bun version:
bun --version

ENDLOCAL
