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
echo "Done. The skills reference each other at ~/.claude/skills/... paths,"
echo "so the default target requires no edits. If you installed elsewhere,"
echo "update the doctrine-load paths inside each SKILL.md."
echo "New skills are picked up at the next Claude Code session start."
