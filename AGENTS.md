This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

---

## Implementation Workflow

This project has detailed specifications. Follow this workflow when implementing:

### Documents to Follow

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `docs/IMPLEMENTATION_PHASES.md` | Order and process | **Primary guide** - follow phase by phase |
| `docs/IMPLEMENTATION_SPEC.md` | Backend details | Model, API, auth, cron jobs |
| `docs/UI_ACCESSIBILITY_SPEC.md` | UI details | Colors, components, screens, accessibility |
| `docs/TESTING_SPEC.md` | Test cases | Writing tests for each phase |

### Workflow per Phase

```
1. Read current phase in IMPLEMENTATION_PHASES.md
2. For each task:
   - Backend task → check IMPLEMENTATION_SPEC.md
   - UI task → check UI_ACCESSIBILITY_SPEC.md
   - Test task → check TESTING_SPEC.md
3. Implement the task
4. Write unit tests (REQUIRED)
5. Write integration tests when applicable (REQUIRED)
6. Verify all tests pass
7. Commit with conventional commit message
8. Move to next task or phase
```

### Mandatory Before Commit

- [ ] All phase tasks completed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (where applicable)
- [ ] Code matches specifications
- [ ] No lint errors (`npx expo lint` for mobile, `npm run lint` for backend)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Manually tested and working

### Tech Stack (do not change)

- **Backend**: Node.js + Express + TypeScript, Prisma, PostgreSQL, Zod, Argon2, JWT, node-cron
- **Mobile**: Expo + TypeScript, Expo Router, Redux Toolkit + RTK Query, expo-secure-store, Expo Notifications
- **Testing**: Jest, Supertest, jest-expo, React Native Testing Library

### Git Branching Strategy

Each phase should be developed in a feature branch:

```
1. Create branch: git checkout -b feat/fase-X-nombre
2. First commit of Fase 0 ONLY: docs: especificaciones del proyecto
   - Include only /docs and AGENTS.md
   - This versions the specs separately from code
3. Subsequent commits: conventional commits (feat:, fix:, test:, etc.)
4. When phase complete and all tests pass: merge to main
5. Start next phase from main
```

**Branch naming:**
- `feat/fase-0-setup`
- `feat/fase-1-auth`
- `feat/fase-2-ui-components`
- etc.

**Commit message format:**
```
type(scope): description

Examples:
- feat(auth): implement register endpoint
- feat(ui): add AppButton component
- test(auth): add login integration tests
- fix(payments): correct due date calculation
- docs: update API documentation
```

**Do NOT:**
- Commit directly to main
- Merge without passing tests
- Skip the docs commit in Fase 0

### Autonomous Git Operations

The agent is authorized to perform git operations **without asking for approval**:

- `git checkout -b` - Create feature branches
- `git add` - Stage files
- `git commit` - Commit changes
- `git checkout main` - Switch to main
- `git merge` - Merge feature branch to main (only after all tests pass)
- `git branch -d` - Delete merged feature branches

**Merge to main is automatic** when:
1. All phase tasks are completed
2. All unit tests pass
3. All integration tests pass
4. Lint and typecheck pass

Do NOT ask the user for confirmation on these operations. Just do them.

### Autonomous Decision Making

If a specification has a gap or ambiguity not covered by the docs:

1. **Make the decision** based on:
   - Best practices for the tech stack
   - Consistency with existing patterns in the codebase
   - Simplicity over complexity

2. **Document the decision** in the appropriate spec file:
   - Add a section or note explaining what was decided
   - Mark it with `<!-- Decision: YYYY-MM-DD -->` comment

3. **Continue implementation** without stopping to ask

**Examples of autonomous decisions:**
- Minor API response field names not specified
- Validation rules not explicitly defined
- Component prop defaults
- Error message wording
- Test edge cases not listed

**Do NOT decide autonomously on:**
- Major architectural changes
- Adding new dependencies not in tech stack
- Changing the database schema structure
- Modifying the phase order
