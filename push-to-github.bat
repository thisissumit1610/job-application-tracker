@echo off
setlocal

rem  Creates the GitHub repo and pushes this project to it.
rem  Windows: just double-click this file.
rem
rem  Change these two lines if you want a different name or a public repo.
set "REPO_NAME=job-application-tracker"
set "VISIBILITY=private"

rem Double-clicking starts in an unpredictable folder, so move to this file's own.
cd /d "%~dp0"

echo.
echo   Push to GitHub
echo   repo: %REPO_NAME%  ^| visibility: %VISIBILITY%
echo.

rem ------------------------------------------------------------ prerequisites
echo ==^> Checking prerequisites

where git >nul 2>&1
if errorlevel 1 (
  echo.
  echo   ERROR: git is not installed.
  echo   Install it from https://git-scm.com/download/win then run this again.
  goto :fail
)
echo   ok  git found

where gh >nul 2>&1
if errorlevel 1 (
  echo.
  echo   ERROR: the GitHub CLI ^(gh^) is not installed - it is what creates the repo.
  echo.
  echo     Run this in PowerShell:  winget install --id GitHub.cli
  echo     Or download it from:     https://cli.github.com
  echo.
  echo   Then close this window, open a NEW one, and double-click this file again.
  goto :fail
)
echo   ok  gh found

rem ------------------------------------------------------------ github login
echo.
echo ==^> Checking your GitHub login

gh auth status >nul 2>&1
if errorlevel 1 (
  echo   !   Not logged in yet - opening the GitHub login flow.
  echo       Choose: GitHub.com then HTTPS then Login with a web browser
  gh auth login
  if errorlevel 1 (
    echo   ERROR: login did not complete. Run this file again once you are logged in.
    goto :fail
  )
)

for /f "delims=" %%i in ('gh api user --jq .login 2^>nul') do set "OWNER=%%i"
if "%OWNER%"=="" (
  echo   ERROR: could not read your GitHub username.
  echo   Open a terminal, run "gh auth login", then try this file again.
  goto :fail
)
echo   ok  signed in as %OWNER%

rem ------------------------------------------------------------ local git repo
echo.
echo ==^> Preparing the local repository

if not exist ".git" (
  git init -b main >nul
  if errorlevel 1 goto :gitfail
  echo   ok  initialised a new git repository
)

git rev-parse HEAD >nul 2>&1
if errorlevel 1 (
  git add -A
  git -c user.name="%OWNER%" -c user.email="%OWNER%@users.noreply.github.com" commit -qm "Initial commit"
  if errorlevel 1 goto :gitfail
  echo   ok  created the first commit
) else (
  echo   ok  commits already present
)

git branch -M main >nul 2>&1

rem Commit anything left over so the push is complete.
git diff --quiet HEAD >nul 2>&1
if errorlevel 1 (
  git add -A
  git commit -qm "Update project files" >nul 2>&1
  echo   ok  committed uncommitted changes
)

rem ------------------------------------------------------------ create + push
echo.
echo ==^> Creating %OWNER%/%REPO_NAME% on GitHub

gh repo view "%OWNER%/%REPO_NAME%" >nul 2>&1
if errorlevel 1 (
  git remote remove origin >nul 2>&1
  gh repo create "%REPO_NAME%" --%VISIBILITY% --source=. --remote=origin --description "Kanban board for tracking job applications, interview stages and follow-ups."
  if errorlevel 1 (
    echo   ERROR: could not create the repository.
    echo   If the name is already taken, change REPO_NAME at the top of this file.
    goto :fail
  )
  echo   ok  repository created
) else (
  echo   !   that repo already exists - pushing to it instead of creating it
  git remote remove origin >nul 2>&1
  git remote add origin "https://github.com/%OWNER%/%REPO_NAME%.git"
)

echo.
echo ==^> Pushing
git push -u origin main
if errorlevel 1 (
  echo.
  echo   ERROR: the push failed. Scroll up for the exact reason.
  echo.
  echo   If it mentions "non-fast-forward" or "fetch first", the GitHub repo
  echo   already has commits in it - usually a README added when it was created.
  echo   Fix it by running these two commands in this folder:
  echo.
  echo       git pull --rebase origin main
  echo       git push -u origin main
  goto :fail
)

echo.
echo   Done. Your code is at:
echo.
echo       https://github.com/%OWNER%/%REPO_NAME%
echo.
pause
exit /b 0

:gitfail
echo   ERROR: a git command failed. Scroll up for the details.

:fail
echo.
pause
exit /b 1
