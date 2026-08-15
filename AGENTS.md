# Project Agent Guidelines — Thoughts Whatever

## Auto Prompt & Debug Tracking
1. **Continuous Prompt Logging**: Every user instruction, debug log, and master feature directive is preserved in `docs/PROMPT_HISTORY.md` and synced to the PostgreSQL `PromptLog` table.
2. **Automated Sync Tooling**: Run `npm run save-prompts` to extract and sync transcripts across sessions into the database.
3. **Documentation Integrity**: Maintain `docs/` references whenever altering data models, build processes, or performance configurations.
