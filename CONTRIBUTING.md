# Contributing to Recycle Bin Locator

Thank you for your interest in contributing. This document covers how to report issues, submit pull requests, and follow the project's conventions.

## Reporting Issues

Use [GitHub Issues](../../issues) to report bugs or request features. Before opening a new issue, search existing issues to avoid duplicates.

When reporting a bug, include:
- Steps to reproduce
- Expected behaviour
- Actual behaviour
- Browser and OS version

## Submitting Pull Requests

1. Fork the repository and create a branch from `main` (see branch naming below).
2. Make your changes, following the coding conventions below.
3. Run the test suite and ensure all tests pass: `npx vitest --run`
4. Open a pull request against `main` with a clear description of what changed and why.

Keep pull requests focused on a single concern. Large, unrelated changes are harder to review.

## Coding Conventions

- **TypeScript strict mode** — all code must compile with `"strict": true`. Avoid `any`.
- **Tailwind CSS** — use Tailwind utility classes for styling. Do not add custom CSS unless there is no Tailwind equivalent.
- **No direct Leaflet imports in components** — all Leaflet usage must stay inside `src/map/LeafletMapAdapter.ts`. Components interact with the map only through the `IMapComponent` interface.
- **Pure functions for services** — `FilterService` functions (`filterByCategories`, `sortByDistance`, `haversineDistance`) must remain pure with no side effects.
- **i18n keys for all user-visible strings** — do not hardcode English text in components; use `i18n.t(key)` with a key defined in the locale files.

## Running Tests

```bash
npx vitest --run
```

Property-based tests use [fast-check](https://fast-check.dev/) and run as part of the same suite.

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| New feature | `feature/<short-description>` | `feature/add-glass-filter` |
| Bug fix | `fix/<short-description>` | `fix/marker-highlight-missing` |
| Maintenance | `chore/<short-description>` | `chore/update-dependencies` |

## Commit Message Format

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary>
```

Common types:

| Type | When to use |
|---|---|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `chore:` | Build process, dependency updates, tooling |
| `docs:` | Documentation only changes |

Examples:

```
feat: add battery category filter
fix: correct haversine distance calculation near antimeridian
chore: update leaflet to 1.9.4
docs: add contributing guide
```

## Licence

By contributing, you agree that your contributions will be licensed under the [MIT Licence](./LICENCE).
