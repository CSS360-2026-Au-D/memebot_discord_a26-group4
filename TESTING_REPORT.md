# Testing Report — Shiv

**Author:** Shiv (ShivanshBhatt2006)
**Date:** 2026-11-13
**Branch / commit:** `main` @ `5f1a6a5`
**Environment:** macOS, Node v24.16.0, npm 11.13.0 (clean `npm ci` install)

## Summary

| Check | Command | Result |
|---|---|---|
| Dependency audit (all) | `npm audit` | ❌ 24 vulnerabilities (1 critical, 15 high, 7 moderate, 1 low) |
| Dependency audit (production only) | `npm audit --omit=dev` | ❌ 7 vulnerabilities (1 critical, 3 high, 3 moderate) |
| Lint | `npx eslint .` | ❌ 12 errors, 0 warnings |
| Build | `npm run build` | ✅ Passes |
| Unit tests | `npm test` | ❌ No test files exist (`./tests/` folder is missing) |
| Outdated packages | `npm outdated` | ⚠️ 8 packages behind |

---

## 1. `npm audit`

### Production dependencies (these ship with the bot)

| Package | Severity | Comes from | Fix |
|---|---|---|---|
| `form-data` 4.0.0–4.0.5 | **Critical** | axios | `npm audit fix` |
| `axios` ≤0.33.0 | High | direct dependency (0.27.2) | Upgrade to `axios@1.x` (breaking) |
| `undici` ≤6.29.0 | High | discord.js | `npm audit fix` |
| `ws` 8.0.0–8.20.1 | High | discord.js | `npm audit fix` |
| `follow-redirects` ≤1.15.11 | Moderate | axios | `npm audit fix` |
| `file-type` 13.0.0–21.3.0 | Moderate | `@discordjs/rest` | `npm audit fix` |

**Note:** `axios` isn't imported anywhere in `src/`. We could just remove it (`npm uninstall axios`), which also removes the axios-related `form-data` and `follow-redirects` issues, with no code changes.

### Dev-only dependencies (used for building and testing; not shipped)

| Package | Severity | Comes from | Fix |
|---|---|---|---|
| `brace-expansion`, `braces`, `picomatch` | High | nodemon / mocha / eslint | `npm audit fix` |
| `minimatch` | High | eslint 10, mocha, nodemon | `npm audit fix --force` would downgrade eslint to 9 (not recommended); wait for an eslint patch |
| `js-yaml`, `nanoid`, `serialize-javascript`, `diff` | High / Low | mocha 10.0.0 | `npm audit fix` (updates mocha within v10) |
| `get-func-name` | High | chai 4.3.6 | `npm audit fix` |
| `semver` | High | nodemon 2.x | Upgrade to `nodemon@3` (breaking) |
| `esbuild` ≤0.24.2 | Moderate | direct (0.15.9) | Upgrade to `esbuild@0.28` (breaking); only affects the esbuild dev server, which we don't use |

**Recommendation:** first run `npm audit fix`. It needs no breaking changes and fixes most of the list. Then remove `axios` and upgrade `nodemon` to v3.

---

## 2. ESLint (`npx eslint .`)

Config: `eslint.config.mjs` (`js/recommended`, Node globals). **12 errors:**

| File | Line | Rule | Issue |
|---|---|---|---|
| [src/events/blackjack.js](src/events/blackjack.js#L137) | 137 | `no-useless-assignment` | `resultText` initial value never used |
| [src/events/blackjack.js](src/events/blackjack.js#L138) | 138 | `no-useless-assignment` | `color` initial value never used |
| [src/events/blackjack.js](src/events/blackjack.js#L178) | 178 | `no-useless-assignment` | `res` initial value never used |
| [src/events/blackjack.js](src/events/blackjack.js#L216) | 216 | `no-useless-assignment` | `summary` initial value never used |
| [src/events/blackjack.js](src/events/blackjack.js#L217) | 217 | `no-useless-assignment` | `finalColor` initial value never used |
| [src/events/blackjack.js](src/events/blackjack.js#L243) | 243 | `no-useless-assignment` | `label` initial value never used |
| [src/events/guildMemberAdd.js](src/events/guildMemberAdd.js#L4) | 4 | `no-unused-vars` | `MEME_URL` is never used |
| [src/events/guildMemberAdd.js](src/events/guildMemberAdd.js#L22) | 22 | `no-unused-vars` | `getWelcomeMessage` is never used |
| [src/events/guildMemberAdd.js](src/events/guildMemberAdd.js#L45) | 45 | `no-useless-escape` | Unnecessary `\'` |
| [src/events/guildMemberAdd.js](src/events/guildMemberAdd.js#L46) | 46 | `no-useless-escape` | Unnecessary `\'` |
| [src/games/cards/Deck.js](src/games/cards/Deck.js#L6) | 6 | `no-unused-private-class-members` | `#discarded` is never used |
| [src/games/poker/handRank.js](src/games/poker/handRank.js#L5) | 5 | `no-unused-vars` | `Tier` is never used |

All 12 are code-quality issues (dead code or unneeded initial values), not runtime bugs. The `blackjack.js` ones can be fixed by declaring the variables without an initial value (`let resultText;`). Note that `getWelcomeMessage` being unused may mean the welcome message feature isn't wired up yet.

---

## 3. Build (`npm run build`)

✅ esbuild compiled all 19 files in `src/` into `build/` with no errors.

⚠️ `src/commands/poker.js` and `src/games/poker/poker.js` compile to **0 bytes**. They contain only comments or placeholders, so poker isn't implemented yet.

---

## 4. Unit tests (`npm test`)

❌ `Error: No test files found: "./tests/*.spec.js"`

The `test` script expects `./tests/*.spec.js`, but the repo has no `tests/` folder. Mocha and Chai are installed and ready. Good first candidates for tests, since they are pure logic with no Discord dependency:

- `src/games/cards/Deck.js` / `Card.js`: deck has 52 unique cards, shuffling, drawing
- `src/games/poker/handRank.js`: hand ranking (pair, flush, straight, …)
- Blackjack `calculateScore` (aces counted as 1 or 11, bust over 21)
- `src/helpers/manDataBase.js` / `dailyReset.js` / `checkIns.js`: database read/write and reset logic

---

## 5. Outdated packages (`npm outdated`)

| Package | Current | Wanted (in range) | Latest |
|---|---|---|---|
| axios | 0.27.2 | 0.27.2 | 1.21.1 |
| chai | 4.3.6 | 4.5.0 | 6.3.0 |
| discord.js | 14.5.0 | 14.28.1 | 14.28.1 |
| dotenv | 16.0.2 | 16.6.1 | 18.0.10 |
| esbuild | 0.15.9 | 0.15.18 | 0.28.2 |
| esbuild-runner | 2.2.1 | 2.2.2 | 2.2.2 |
| mocha | 10.0.0 | 10.8.2 | 12.0.3 |
| nodemon | 2.0.20 | 2.0.22 | 3.1.14 |

`discord.js` is 23 minor versions behind. Upgrading within v14 should be safe and picks up the `undici` and `ws` security fixes.

---

## Action items for the group

1. Run `npm audit fix` (no breaking changes) and commit the updated `package-lock.json`.
2. Remove the unused `axios` dependency.
3. Fix the 12 ESLint errors listed above.
4. Create `tests/` and add `*.spec.js` tests, starting with Deck, hand ranking, and blackjack scoring.
5. Upgrade `nodemon` to v3 and `discord.js` to the latest 14.x.
6. Consider adding `"lint": "eslint ."` to the `package.json` scripts and running it in CI (`.github/`).
