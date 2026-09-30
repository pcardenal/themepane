#!/usr/bin/env bash
# Install Themepane into VS Code on Linux, macOS, WSL or Git Bash on Windows: the latest
# GitHub release by default, or --dev to build this checkout. WSL installs into Windows VS Code.
set -euo pipefail
# The braces make bash read the whole script before running it, so a command that reads
# stdin (cmd.exe) can't swallow the rest when it's piped from curl.
{
case "${1:-}" in
  "") DEV=0 ;;
  --dev) DEV=1 ;;
  *) echo "Usage: $0 [--dev]" >&2; exit 2 ;;
esac
RELEASE_URL=https://github.com/pcardenal/themepane/releases/latest/download/themepane.vsix
VSCE=@vscode/vsce@3 # needs Node 20+
NODE_MIN=20

case "$(uname -s)" in
  Darwin) OS=mac ;;
  Linux) if grep -qi microsoft /proc/version 2>/dev/null; then OS=wsl; else OS=linux; fi ;;
  MINGW* | MSYS* | CYGWIN*) OS=windows ;;
  *) echo "Unsupported system: $(uname -s)" >&2; exit 1 ;;
esac

die() { echo "$*" >&2; exit 1; }
# Print the command that fixes a missing tool and run it if the user agrees.
offer() {
  echo "$1"
  echo "  Install it with: $2"
  # Read from the terminal, so it still asks when the script is piped from curl.
  if (: </dev/tty) 2>/dev/null && read -r -p "  Run that now? [y/N] " reply </dev/tty && [[ $reply == [yY]* ]]; then
    eval "$2"
  else
    exit 1
  fi
}
first_of() { for f in "$@"; do if [ -n "$f" ] && [ -f "$f" ]; then echo "$f"; return; fi; done; }
# cmd.exe warns when started from a WSL path; run it from a Windows folder.
win_env() { (cd /mnt/c && cmd.exe /c "echo %$1%") </dev/null 2>/dev/null | tr -d '\r'; }

node_ok() {
  command -v node >/dev/null && command -v npx >/dev/null &&
    [ "$(node -p 'process.versions.node.split(".")[0]')" -ge "$NODE_MIN" ]
}

build() {
  if ! node_ok; then
    if command -v node >/dev/null; then have="Node.js $(node -v) is too old"; else have="Node.js is missing"; fi
    msg="$have: building Themepane needs Node.js $NODE_MIN or newer."
    case $OS in
      mac)
        command -v brew >/dev/null || die "$msg Get it from https://nodejs.org"
        offer "$msg" "brew install node" ;;
      windows)
        offer "$msg" "winget install -e --id OpenJS.NodeJS.LTS"
        die "Node.js installed. Open a new terminal and run install.sh again." ;;
      linux | wsl)
        # nvm installs a current Node without sudo; distro packages are often too old.
        if [ -s "$HOME/.nvm/nvm.sh" ]; then
          offer "$msg" '. "$HOME/.nvm/nvm.sh" && nvm install --lts'
        else
          offer "$msg" 'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && . "$HOME/.nvm/nvm.sh" && nvm install --lts'
        fi ;;
    esac
    node_ok || die "Node.js $NODE_MIN or newer still isn't on PATH. Open a new terminal and run install.sh again."
  fi
  # Runtime dependencies (jsonc-parser, for the uninstall hook) are bundled into the VSIX.
  npm install --omit=dev --no-audit --no-fund
  npx -y "$VSCE" package -o "$VSIX"
}

# Running `code` inside WSL would install into the WSL server, so WSL uses Windows' code.cmd.
find_code() {
  case $OS in
    wsl)
      local dir
      for dir in "$(win_env LOCALAPPDATA)\\Programs\\Microsoft VS Code" "$(win_env ProgramFiles)\\Microsoft VS Code"; do
        if [ -f "$(wslpath "$dir" 2>/dev/null)/bin/code.cmd" ]; then echo "$dir\\bin\\code.cmd"; return; fi
      done ;;
    mac)
      first_of "$(command -v code || true)" \
        "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" \
        "$HOME/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ;;
    linux)
      first_of "$(command -v code || true)" /usr/share/code/bin/code /snap/bin/code ;;
    windows)
      first_of "$(command -v code || true)" \
        "$(cygpath -u "${LOCALAPPDATA:-}")/Programs/Microsoft VS Code/bin/code" \
        "$(cygpath -u "${PROGRAMFILES:-}")/Microsoft VS Code/bin/code" ;;
  esac
}

CODE="$(find_code)"
if [ -z "$CODE" ]; then
  msg="VS Code isn't installed (or its code command wasn't found)."
  case $OS in
    mac)
      command -v brew >/dev/null || die "$msg Get it from https://code.visualstudio.com"
      offer "$msg" "brew install --cask visual-studio-code" ;;
    windows) offer "$msg" "winget install -e --id Microsoft.VisualStudioCode" ;;
    wsl) offer "$msg (It goes on Windows.)" "(cd /mnt/c && powershell.exe -NoProfile -Command winget install -e --id Microsoft.VisualStudioCode)" ;;
    linux)
      command -v snap >/dev/null || die "$msg Get it from https://code.visualstudio.com"
      offer "$msg" "sudo snap install code --classic" ;;
  esac
  CODE="$(find_code)"
  [ -n "$CODE" ] || die "VS Code installed. Open a new terminal and run install.sh again."
fi

# Windows' code.cmd needs a path it can read, so WSL uses the Windows temp folder.
if [ "$OS" = wsl ]; then
  VSIX="$(wslpath "$(win_env TEMP)")/themepane.vsix"
  trap 'rm -f "$VSIX"' EXIT
else
  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$TMP_DIR"' EXIT
  VSIX="$TMP_DIR/themepane.vsix"
fi

if [ "$DEV" = 1 ]; then
  cd "$(dirname "${BASH_SOURCE[0]}")"
  [ -f package.json ] || die "--dev builds a checkout: run it from the themepane folder."
  build
elif command -v curl >/dev/null; then
  curl -fL --progress-bar -o "$VSIX" "$RELEASE_URL"
elif command -v wget >/dev/null; then
  wget -q --show-progress -O "$VSIX" "$RELEASE_URL"
else
  die "Downloading the release needs curl or wget."
fi
case $OS in
  wsl) (cd /mnt/c && powershell.exe -NoProfile -Command "& '$CODE' --install-extension '$(wslpath -w "$VSIX")' --force") ;;
  windows) "$CODE" --install-extension "$(cygpath -w "$VSIX")" --force ;;
  *) "$CODE" --install-extension "$VSIX" --force ;;
esac
echo "Installed. Reload VS Code windows to pick it up."
exit
}
