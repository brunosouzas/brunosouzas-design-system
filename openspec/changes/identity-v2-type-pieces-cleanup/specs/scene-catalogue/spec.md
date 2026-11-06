## REMOVED Requirements

### Requirement: Cast motion test
**Reason**: The composition `cast-motion-test` animates the seven-role cast, removed in 0.7.0 (ADR 0007 amendment); it illustrates no article, so no scene depends on it.
**Migration**: None in this repository: `src/scenes/cast-motion-test/`, its `Folder` in `src/Root.tsx` and its test go. The timing helpers of `src/brand/cast-motion.ts` stay ("Cast timing helpers").

### Requirement: One emote at a time in the motion test
**Reason**: Removed with the `cast-motion-test` composition.
**Migration**: None; a future scene that shows emotes specifies its own beats.

### Requirement: Motion test frames frozen
**Reason**: Removed with the `cast-motion-test` composition and its frame hashes in `test/fixtures/cast-0.5.0.json`.
**Migration**: None; emote drawings stay pinned by "Emote look frozen" (illustration-pieces).
