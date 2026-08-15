# Auto Prompt Saver Rule

## Continuous Prompt Archival
- Every master prompt, feature request, debug directive, and error resolution provided by the user must be automatically tracked and archived.
- Whenever completing a major task or on explicit sync, maintain `docs/PROMPT_HISTORY.md` and ensure prompts are synced to the database `PromptLog` table using `npm run save-prompts`.
- Prompts are categorized into: `feature`, `design`, `bug`, `plan`, `question`, or `other`.
- The database model `PromptLog` and `docs/PROMPT_HISTORY.md` serve as the dual source of truth for all project prompts.
