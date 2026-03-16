# Coverage Assist Integration (2026-03-16)

## Scope

This slice completes the Phase-1 handoff between:

- app-side assist entry on `/capture`
- `QuickCaptureModal`
- persisted Register-First use case cards
- lightweight local analytics
- download/help trust copy

## Data model

Coverage Assist still does **not** introduce a new `origin.source`.
Confirmed use cases remain human-created and keep the existing manual/access-code/import semantics.

Additive metadata continues to live in `assistContext` only. The context now carries:

- `source`
- `detectedToolId`
- `selectionMode`
- `seedSuggestionId` optional
- `seedSuggestionLabel` optional
- `libraryVersion` optional

The project deliberately keeps `seedSuggestionId` instead of introducing a second alias like
`selectedSuggestionId`. Two field names for the same thing would add migration overhead without
improving the model.

## Selection modes

- `seed_suggestion`
- `custom_purpose`
- `tool_only`

These modes describe how the draft reached Quick Capture. They do not imply any governance result.

## Analytics boundary

Analytics stay local and minimal:

- no raw browsing history
- no full URLs
- no background use case creation

Tracked events in the app contract:

- `assist_entry_shown`
- `assist_suggestion_selected`
- `assist_custom_purpose_used`
- `assist_saved`
- `assist_dismissed`
- `assist_disabled`

The Chrome extension records `assist_disabled` locally when the device toggle is switched off.

## Rollback

- Leave Coverage Assist flags disabled.
- Remove `selectionMode` / `libraryVersion` from `assistContext` if needed.
- Remove local analytics calls and keep the capture flow intact.
