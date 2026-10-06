# GitHub and private runtime data

Only the sanitized project belongs in the public repository. This folder uses neutral application defaults and a synthetic test-only fixture. The earlier personalized source archive is a private deliverable: do not upload it.

Never add .env, identity databases, MFA keys, financial exports, personal seed data, screenshots of real finances or credentials. .gitignore excludes runtime data, SQLite/WAL files, keys, backups, CSV/XLSX exports, ZIP files, generated builds and dependencies. Ignoring a file does not untrack an already committed file; review staged files before each push.

```sh
git status --short
git diff --cached
git ls-files
```

Repository setup (when GitHub authentication is available):

```sh
git remote add origin https://github.com/cgonzalez2064/the-coin-fix.git
git push -u origin main
```

Use GitHub CLI, GitHub Desktop or a credential manager; never paste tokens into source, remote URLs or chat. CLI install/login instructions: https://cli.github.com/. Use GitHub's private/noreply commit email to avoid publishing a personal address.

If a secret ever enters Git history, rotate it immediately and remove it from history; deleting the current file alone is insufficient. A public repository does not automatically deploy the application or expose local browser/SQLite data.
