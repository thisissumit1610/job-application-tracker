#!/usr/bin/env bash
#
# Creates the GitHub repo and pushes this project to it.
#
# macOS:  double-click push-to-github.command
# Linux:  double-click this file (choose "Run in Terminal"), or run ./push-to-github.sh
#
# Change these two lines if you want a different name or a public repo.
REPO_NAME="job-application-tracker"
VISIBILITY="private"   # "private" or "public"

set -uo pipefail

# Double-clicking starts the script from an unpredictable working directory,
# so move to the folder this file lives in before touching any git state.
cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'

say()  { printf '%s\n' "$*"; }
step() { printf '\n%s==>%s %s\n' "$BOLD" "$RESET" "$*"; }
ok()   { printf '%s  ok%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%s  !%s  %s\n' "$YELLOW" "$RESET" "$*"; }
die()  { printf '\n%serror:%s %s\n' "$RED" "$RESET" "$*"; exit 1; }

# Keep the terminal window open so the output is readable after a double-click.
finish() {
  local code=$?
  printf '\n'
  if [ -t 0 ]; then
    read -n 1 -s -r -p "Press any key to close this window..."
    printf '\n'
  fi
  exit $code
}
trap finish EXIT

say "${BOLD}Push to GitHub${RESET}"
say "${DIM}repo: $REPO_NAME  ·  visibility: $VISIBILITY${RESET}"

# ---------------------------------------------------------------- prerequisites
step "Checking prerequisites"

command -v git >/dev/null 2>&1 || die "git is not installed. Install it from https://git-scm.com/downloads and run this again."
ok "git $(git --version | awk '{print $3}')"

if ! command -v gh >/dev/null 2>&1; then
  say ""
  die "The GitHub CLI (gh) is not installed — it is what creates the repo for you.

  macOS          brew install gh
  Ubuntu/Debian  sudo apt install gh
  Fedora         sudo dnf install gh
  anything else  https://cli.github.com

Install it, then double-click this file again."
fi
ok "gh $(gh --version | head -1 | awk '{print $3}')"

# ---------------------------------------------------------------- github login
step "Checking your GitHub login"

if ! gh auth status >/dev/null 2>&1; then
  warn "Not logged in yet — opening the GitHub login flow."
  say "${DIM}Choose: GitHub.com → HTTPS → Login with a web browser${RESET}"
  gh auth login || die "Login did not complete. Run this file again once you are logged in."
fi

OWNER="$(gh api user --jq .login 2>/dev/null)"
[ -n "$OWNER" ] || die "Could not read your GitHub username. Try 'gh auth login' in a terminal, then run this again."
ok "signed in as $OWNER"

# ---------------------------------------------------------------- local git repo
step "Preparing the local repository"

if [ ! -d .git ]; then
  git init -b main >/dev/null || die "git init failed."
  ok "initialised a new git repository"
fi

# A repo created by older git versions may still be on 'master'.
CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo main)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  git branch -M main || die "could not rename branch to main."
  ok "renamed branch '$CURRENT_BRANCH' to 'main'"
fi

if ! git rev-parse HEAD >/dev/null 2>&1; then
  git add -A
  git -c user.name="${GIT_AUTHOR_NAME:-$OWNER}" \
      -c user.email="${GIT_AUTHOR_EMAIL:-$OWNER@users.noreply.github.com}" \
      commit -qm "Initial commit" || die "nothing to commit."
  ok "created the first commit"
else
  ok "$(git rev-list --count HEAD) commit(s) already present"
fi

# Commit anything left lying around so the push is complete.
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -qm "Update project files" && ok "committed uncommitted changes"
fi

# ---------------------------------------------------------------- create + push
step "Creating $OWNER/$REPO_NAME on GitHub"

if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
  warn "that repo already exists — pushing to it instead of creating it"
  git remote remove origin >/dev/null 2>&1
  git remote add origin "https://github.com/$OWNER/$REPO_NAME.git" || die "could not set the remote."
else
  git remote remove origin >/dev/null 2>&1
  gh repo create "$REPO_NAME" "--$VISIBILITY" --source=. --remote=origin \
    --description "Kanban board for tracking job applications, interview stages and follow-ups." \
    || die "could not create the repository. If the name is taken, change REPO_NAME at the top of this file."
  ok "repository created"
fi

step "Pushing"
git push -u origin main || die "the push failed. Scroll up for the exact reason.

If it mentions 'non-fast-forward' or 'fetch first', the GitHub repo already has
commits in it — usually a README added when the repo was created. Fix it by
running these two commands in this folder:

    git pull --rebase origin main
    git push -u origin main"

# ---------------------------------------------------------------- done
printf '\n%sDone.%s Your code is at:\n\n    https://github.com/%s/%s\n' "$GREEN" "$RESET" "$OWNER" "$REPO_NAME"
