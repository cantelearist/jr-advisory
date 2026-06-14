# RCA Fonts

Place the following Canela Deck (CG) font files in this directory:

```
CG-Regular.ttf
CG-Medium.ttf
CG-SemiBold.ttf
CG-Bold.ttf
CG-Italic.ttf
```

## Install from zip

```bash
unzip -o ~/Downloads/rca_fonts.zip -d ~/.claude/skills/rca/rca-report-style/rca_fonts/
```

## Verify

```bash
ls ~/.claude/skills/rca/rca-report-style/rca_fonts/*.ttf
```

If fonts are absent, `rca_report_style.py` falls back to Helvetica and logs a warning.
These are binary files and must be added manually — they cannot be committed to the repository.
