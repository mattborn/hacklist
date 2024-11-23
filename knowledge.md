# Hacklist Project

## Architecture
- Manage root-level files separately from project directories
- Use copy operations (not moves) to sync files between root and hacklist/
- Avoid git submodule complexity by maintaining files in both locations
- Root files (index.html, styles.css, etc.) should work in both root and hacklist/

## Managed Files
- index.html
- styles.css
- scripts.js
- README.md
- .prettierrc.js
- hacklist.js (CLI tool)

## CLI Usage
```bash
# Copy files into hacklist/
./hacklist.js bury

# Copy files back to root (override)
./hacklist.js dig
```
