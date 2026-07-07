#!/usr/bin/env bash
# Install the RCA due-diligence skills from this repo into the USER-LEVEL
# Claude Code skills directory, making them available in every project on
# this machine (not just jr-advisory, whose .claude/skills/ copy loads
# automatically for this repo only).
#
# Usage:  ./scripts/install-rca-skills.sh [target-skills-dir]
# Default target: ~/.claude/skills

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO_ROOT/.claude/skills"
DEST="${1:-$HOME/.claude/skills}"

SKILLS=(rca-evidence-doctrine counterparty-vetting pitch-deck-analysis)

mkdir -p "$DEST"

# Refuse self-installs: with DEST == SRC the rm -rf below would delete the
# source skill before the cp runs, leaving the checkout missing that skill.
SRC_REAL="$(cd "$SRC" && pwd -P)"
DEST_REAL="$(cd "$DEST" && pwd -P)"
if [ "$SRC_REAL" = "$DEST_REAL" ]; then
  echo "Nothing to do: target resolves to this repo's own .claude/skills" \
       "($DEST_REAL) — the skills already live there." >&2
  exit 0
fi

for skill in "${SKILLS[@]}"; do
  if [ ! -f "$SRC/$skill/SKILL.md" ]; then
    echo "ERROR: $SRC/$skill/SKILL.md not found — run from a full checkout." >&2
    exit 1
  fi
  rm -rf "$DEST/$skill"
  cp -r "$SRC/$skill" "$DEST/$skill"
  echo "installed: $DEST/$skill"
done

echo
echo "Done. Inter-skill references resolve relative to whichever skills root"
echo "a skill is loaded from, so any target directory works without edits —"
echo "just keep the three skill folders side by side in the same root."
echo "New skills are picked up at the next Claude Code session start."
