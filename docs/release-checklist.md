# Release Checklist

Use this checklist to verify the repository is clean before creating a release package.

- [ ] Run `git status` to ensure no uncommitted changes remain.
- [ ] Remove any chat transcripts or temporary notes.
- [ ] Delete empty `project-structure*.txt` files.
- [ ] Ensure every `package-lock.json` has a corresponding `package.json` in the same directory.
- [ ] Confirm `node_modules` directories and build artifacts are not committed.
- [ ] Run backend tests with `npm test` from the `backend` directory.
- [ ] Run frontend tests with `npm test` from the `frontend` directory.
- [ ] Review documentation for accuracy and completeness.
- [ ] Regenerate the static HTML docs with `python scripts/generate_docs_html.py` so the ZIP bundle contains up-to-date guides.
- [ ] Confirm `docs/index.html` is present in the packaged archive so Envato reviewers land on the consolidated documentation hub.
- [ ] Verify the application builds successfully.
- [ ] Verify the light/dark mode toggle in the dashboard header switches themes without visual regressions.

Following this checklist helps keep release packages lean and reliable.
