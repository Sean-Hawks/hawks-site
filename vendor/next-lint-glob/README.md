# Next.js lint glob compatibility

The root package replaces `fast-glob` with this private local adapter.
`@next/eslint-plugin-next` is its only transitive consumer in this project.
The plugin uses `globSync(pattern, { onlyDirectories: true })`
to resolve `settings.next.rootDir`. `tinyglobby` supplies that API without the
`micromatch` → `braces` dependency chain.

`braces` 3.0.3 is affected by
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
with no patched release as of 2026-10-05. Keep the normal `npm audit` checks enabled.

The adapter disables directory expansion to preserve literal root-directory
semantics. It deliberately exposes only the API used by the pinned Next lint
plugin; it is not a general replacement for every `fast-glob` API. Tests exercise
the installed plugin's root-directory resolution and internal-link rule.

The prerelease version `3.3.1-hawks.1` identifies this local adapter, not an upstream
`fast-glob` release. `.npmrc` packs the directory dependency during installation
so `npm ci` uses the checked-in source consistently.

Remove this override and adapter when the upstream plugin uses a dependency chain
that passes `npm audit`, then rerun those tests and the site quality workflow.
