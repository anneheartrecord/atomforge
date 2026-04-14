#!/bin/bash
# Pre-commit hook: scan for leaked API keys and secrets
# Install: cp scripts/check-secrets.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

RED='\033[0;31m'
NC='\033[0m'

# Patterns to detect
PATTERNS=(
  'AIza[0-9A-Za-z_-]{35}'           # Google API Key
  'sk-[0-9a-zA-Z]{48}'              # OpenAI Key
  'sk-ant-[0-9a-zA-Z-]{90,}'        # Anthropic Key
  'ghp_[0-9a-zA-Z]{36}'             # GitHub PAT
  'github_pat_[0-9a-zA-Z_]{80,}'    # GitHub Fine-grained PAT
  'sb_[a-zA-Z0-9_-]{30,}'           # Supabase Key (in code files only)
)

# Files to skip
SKIP_PATTERNS='.env.local|.env|node_modules|dist|.git/|package-lock.json|check-secrets'

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  # Scan staged files only
  MATCHES=$(git diff --cached --name-only | grep -v -E "$SKIP_PATTERNS" | xargs grep -l -E "$pattern" 2>/dev/null)
  if [ -n "$MATCHES" ]; then
    echo -e "${RED}🚨 Potential secret leaked!${NC}"
    echo "Pattern: $pattern"
    echo "Files:"
    echo "$MATCHES" | while read f; do
      echo "  - $f"
      grep -n -E "$pattern" "$f" | head -3 | sed 's/^/    /'
    done
    echo ""
    FOUND=1
  fi
done

# Also check if .env or .env.local is being committed
ENV_FILES=$(git diff --cached --name-only | grep -E '^\.(env|env\.local|env\.production)$')
if [ -n "$ENV_FILES" ]; then
  echo -e "${RED}🚨 Environment file being committed!${NC}"
  echo "$ENV_FILES"
  FOUND=1
fi

if [ $FOUND -eq 1 ]; then
  echo -e "${RED}❌ Commit blocked. Remove secrets before committing.${NC}"
  exit 1
fi

echo "✅ No secrets detected."
exit 0
