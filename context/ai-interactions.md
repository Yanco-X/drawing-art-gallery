# AI Interaction Guidelines

## Communication

- Be concise and direct. No small talk (unless user initiates it).
- Explain non-obvious decisions briefly.
- Ask before large refactors or architectural changes.
- Don't add features not in the project spec.
- Never delete files without clarification.

## Workflow

This is the common workflow that we will use for every feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create new branch for feature, fix, etc
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
4. **Test** - Verify it works in the browser. Implement unit testing later. Run `npm run build` and fix any errors
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