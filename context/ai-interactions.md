# AI Interaction Guidelines

## Communication

- Be concise and direct. No small talk (unless user initiates it).
- Explain non-obvious decisions briefly.
- Ask before large refactors or architectural changes.
- Don't add features not in the project spec.
- Never delete files without clarification.
- If something changed that you did not change -- a modified file you did not
  touch, gallery data that moved, behaviour that contradicts what you found
  earlier -- **ask before you look**. Do not open the file, read the diff or
  hunt for a cause. Say exactly what you noticed and ask whether the owner
  made it and what they did, immediately rather than at the end. Then wait
  only if it touches the files or data your task needs; otherwise carry on
  with the rest. `AGENTS.md` section 7 is the full rule; it applies between
  prompts as well as mid-task.

## Workflow

This is the common workflow that we will use for every feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create new branch for feature, fix, etc
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
4. **Test** - Run `npm run build` and the typecheck, and fix any errors. Verifying it in the browser is the owner's step, not the agent's -- see `AGENTS.md` section 5. Implement unit testing later
5. **Iterate** - Iterate and change things if needed
6. **Commit** - Only after build passes and everything works
7. **Merge** - Merge to main
8. **Delete Branch** - Delete branch after merge
9. **Review** - Review AI-generated code periodically and on demand.
10. Mark as completed in @context/current-feature.md and add to history

The commit is the owner's step, not the agent's. Do not reach it until the build passes -- if it fails, fix the issues first.

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix[fix]**, etc. Ask to delete the branch once merged.

## Commits

- The owner commits. Never run `git commit`.
- Do not write a commit message unless the owner asks for one.
- When asked, use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused (one feature/fix per commit)
- Never put "Generated With Claude" in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)