#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "============================================"
echo "  DevPlan Pro — Setup & Launch"
echo "============================================"
echo ""

# Load nvm if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/local/nodejs/bin:$PATH"

# Check Node/npm
if ! command -v npm &>/dev/null; then
  echo "⚠️  Node.js not found. Please install from https://nodejs.org and re-run."
  open "https://nodejs.org/en/download"
  exit 1
fi
echo "✅ Node: $(node -v)   npm: $(npm -v)"
echo ""

# ── Anthropic API Key ─────────────────────────────────────────────────────────
if grep -q "your_anthropic_api_key_here" .env.local 2>/dev/null; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  🔑  Step 1: Anthropic API Key"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Go to: https://console.anthropic.com/settings/keys"
  echo "  Create a key and paste it below."
  echo ""
  read -r -p "  Paste Anthropic key (sk-ant-...): " ANTHROPIC_KEY
  echo ""
  if [ -n "$ANTHROPIC_KEY" ]; then
    # Update only the ANTHROPIC line, keep others
    sed -i '' "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$ANTHROPIC_KEY|" .env.local
    echo "  ✅ Anthropic key saved!"
  else
    echo "  ⚠️  Skipped — AI features will not work."
  fi
  echo ""
fi

# ── Turso Database ────────────────────────────────────────────────────────────
if grep -q "your_turso_database_url_here" .env.local 2>/dev/null; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  🗄️  Step 2: Turso Database (free)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  1. Go to: https://turso.tech  → Sign up (free)"
  echo "  2. Create a database (any name, e.g. devplan)"
  echo "  3. Go to the database → Settings → Get 'Database URL'"
  echo "     It looks like: libsql://devplan-yourname.turso.io"
  echo "  4. Generate an auth token on the same page"
  echo ""
  read -r -p "  Paste Turso URL (libsql://...): " TURSO_URL
  read -r -p "  Paste Turso Token: " TURSO_TOKEN
  echo ""
  if [ -n "$TURSO_URL" ] && [ -n "$TURSO_TOKEN" ]; then
    sed -i '' "s|TURSO_DATABASE_URL=.*|TURSO_DATABASE_URL=$TURSO_URL|" .env.local
    sed -i '' "s|TURSO_AUTH_TOKEN=.*|TURSO_AUTH_TOKEN=$TURSO_TOKEN|" .env.local
    echo "  ✅ Turso credentials saved!"
  else
    echo "  ⚠️  Skipped — app will not start without a database."
  fi
  echo ""
fi

# ── npm install ───────────────────────────────────────────────────────────────
if [ -d "node_modules" ]; then
  echo "🧹 Cleaning previous install..."
  rm -rf node_modules package-lock.json
fi

echo "📦 Installing packages (may take ~1 minute)..."
npm install

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Starting DevPlan Pro..."
echo "  Open your browser at: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

(sleep 3 && open "http://localhost:3000") &
npm run dev
