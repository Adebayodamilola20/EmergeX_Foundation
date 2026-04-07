# Auto-Git Skill

**Autonomous git workflow - commit constantly, branch safely, rollback always available.**

emergex handles all git operations automatically. User never needs to ask for commits, branches, or pushes. Everything is shown in the response feed but requires no interaction.

## Philosophy

Every change is versioned. Every state is recoverable. The user focuses on *what* to build, emergex handles *how* to version it.

## Automatic Behaviors

### On Task Start
```
1. git stash (if dirty working tree)
2. git checkout -b emergex/<task-slug>-<timestamp>
3. Log: "[emergex] Branch: emergex/add-auth-1710234567"
```

### During Work
```
After EVERY significant change:
1. git add <specific-files>
2. git commit -m "<type>(<scope>): <description>"
3. Log: "[emergex] Committed: feat(auth): add login form"

Commit triggers:
- File created
- File modified (>10 lines changed)
- Test passes after failing
- Error fixed
- Milestone reached
```

### On Task Complete
```
1. Final commit with summary
2. git checkout main
3. git merge emergex/<branch> --no-ff
4. Log: "[emergex] Merged to main. Branch preserved for rollback."
```

### On Error/Failure
```
1. git stash
2. git checkout main
3. Log: "[emergex] Rolled back to main. Changes stashed."
```

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `emergex/feat-<slug>-<ts>` | `emergex/feat-auth-1710234567` |
| Fix | `emergex/fix-<slug>-<ts>` | `emergex/fix-login-crash-1710234567` |
| Refactor | `emergex/refactor-<slug>-<ts>` | `emergex/refactor-api-1710234567` |
| Self-modify | `emergex/self-<slug>-<ts>` | `emergex/self-add-tool-1710234567` |

## Commit Message Format

```
<type>(<scope>): <description>

[emergex] Auto-commit during <task>
```

**Types:** feat, fix, refactor, test, chore, docs, style, perf

## Rollback Commands

User can request rollback at any time:

| Command | Action |
|---------|--------|
| `/rollback` | Undo last commit |
| `/rollback all` | Return to main, discard branch |
| `/rollback to <commit>` | Reset to specific commit |
| `/branches` | List all emergex branches |

## Feed Output (Non-Interactive)

All git operations show in the response feed:

```
[emergex:git] Created branch: emergex/feat-dashboard-1710234567
[emergex:git] Committed: feat(dashboard): add chart component
[emergex:git] Committed: feat(dashboard): add data fetching
[emergex:git] Committed: test(dashboard): add chart tests
[emergex:git] Merged to main (4 commits)
```

## Protected Operations

These NEVER happen automatically:
- `git push --force`
- `git reset --hard` on main
- Deleting branches with unmerged commits
- Modifying commits already pushed

## Integration with Self-Modify

When emergex modifies its own code:
1. Always use `emergex/self-*` branch
2. More frequent commits (every change)
3. Automatic rollback if tests fail
4. Never merge to main without passing tests

## Recovery Snapshots

Before any risky operation:
```bash
git stash push -m "emergex-snapshot-$(date +%s)"
```

List recovery points:
```bash
git stash list | grep emergex-snapshot
```

---

**Remember:** The user should never think about git. emergex handles versioning like breathing - constant, automatic, invisible until needed.
