# Register First Risk Assist Preview Acceptance (2026-03-23)

## Purpose

This document is the preview acceptance protocol for the Risk Assist slice on the
Use-Case detail page.

It is intentionally conservative.
The feature should prove three things before rollout:

1. it reduces uncertainty around `Risikoklasse`
2. it does not create the feeling of automated governance judgement
3. it stays visually aligned with institutional minimalism

This is not a broad launch checklist.
It is a focused preview gate for the detail-page slice.

## Release boundary

Included in this preview:

- canonical AI Act risk taxonomy
- deterministic suggestion engine
- compact assist surface in the detail page
- manual canonical class selection
- short review dialog with human confirmation
- flag-based rollback

Not included in this preview:

- no automatic risk classification
- no auto-save of governance decisions
- no mandatory AI drafting
- no redesign of broader governance/control surfaces

## Flags

Relevant flags:

- `NEXT_PUBLIC_REGISTER_FIRST_RISK_ASSIST_DETAIL`
- `REGISTER_FIRST_RISK_ASSIST_DETAIL`

Default state:

- `false`

Preview validation must cover both:

- flag `off`
- flag `on`

## Required technical checks

1. Flag off -> legacy path remains intact
   Expected:
   - `Risikoklasse` shows the existing free-text input in edit mode
   - save still works
   - no assist card appears

2. Flag on -> assist surface appears only on the detail page
   Expected:
   - compact assist row visible in the `Risikoklasse` field block
   - no global governance overlay appears elsewhere

3. Suggestion does not silently overwrite current data
   Expected:
   - no class changes without explicit user action
   - `Als Entwurf uebernehmen` changes the draft only after click

4. Existing free-text values remain preserved until explicitly replaced
   Expected:
   - custom legacy/free-text label is shown as existing entry
   - manual canonical selection replaces it only after deliberate action

5. Review dialog uses current edit draft, not only the last saved card
   Expected:
   - if the user changes purpose / scope / data categories in edit mode and opens review before save,
     the dialog reflects those draft values

6. Save path preserves unrelated governance fields
   Expected:
   - existing `governanceAssessment.core` fields are not dropped
   - existing `governanceAssessment.flex` fields are not dropped

## Required scenario checks

### Scenario A: Calm internal assistive case

Example:

- purpose: `Interne Zusammenfassung von Meeting-Notizen`
- usage context: `Nur interne Prozesse`
- decision influence: `Reine Assistenz`
- data categories: `Keine personenbezogenen Daten`

Expected:

- suggestion tends to `Minimales Risiko`
- review may remain optional
- governance follow-up step may stay hidden

### Scenario B: Customer-facing chatbot

Example:

- purpose: `Kundensupport Chatbot fuer haeufige Fragen`
- usage context: `Kund*innen betroffen`
- decision influence: `Reine Assistenz`
- data categories: `Personenbezogene Daten`

Expected:

- suggestion tends to `Begrenztes Risiko (Transparenzpflichten)`
- review recommended is visible
- explanation references communication / chatbot / external interaction

### Scenario C: Applicant communication

Example:

- purpose: `Bewerberkommunikation und Terminabstimmung`
- usage context: `Bewerber*innen betroffen`
- decision influence: `Vorbereitung von Entscheidungen`
- data categories: `Personenbezogene Daten`, `Interne / vertrauliche Unternehmensdaten`

Expected:

- suggestion is not automatically `Hochrisiko`
- suggestion should stay conservative, typically `Begrenztes Risiko`
- open question should point toward ranking / scoring / selection ambiguity
- short review is recommended

### Scenario D: Applicant scoring / selection

Example:

- purpose: `Automatisiertes Bewerber-Scoring und Ranking fuer die Vorauswahl`
- usage context: `Bewerber*innen betroffen`
- decision influence: `Trifft oder automatisiert Entscheidungen`
- data categories: `Personenbezogene Daten`, `Besondere personenbezogene Daten`

Expected:

- suggestion tends to `Hochrisiko`
- signal strength appears strong
- review recommended is clearly visible
- governance follow-up step appears

### Scenario E: Existing custom free-text value

Example:

- existing stored value: `Sonderfall mit Zusatzpruefung`

Expected:

- current display still shows the custom value
- no forced normalization happens on open
- once a canonical class is chosen and saved, the stored value is normalized

## Required UI checks

The preview must explicitly check alignment with the UI charter.

### Institutional minimalism checks

- no dominant red or amber warning treatment in the assist path
- no badge-heavy or dashboard-like visual language
- the primary object remains the use case, not the assist mechanism
- the review dialog reads like documentation, not like a conversion funnel
- the copy stays calm:
  - visible proposal
  - human confirmation
  - no claim of automated legal certainty

### Edit-mode separation checks

- metadata editing remains distinct from formal review capture
- the short review is a separate workflow action, not hidden behind generic edit mode language

## Acceptance checklist

- [ ] Flag-off path behaves exactly like the pre-assist detail page
- [ ] Flag-on path shows the compact assist UI only in the detail-page risk section
- [ ] No silent prefill or autosave occurs
- [ ] Custom free-text values are preserved until explicit replacement
- [ ] Unsaved draft edits are reflected in the review dialog
- [ ] Saving the short review preserves existing governance data
- [ ] Scenario A behaves conservatively and calmly
- [ ] Scenario B suggests `LIMITED` / transparency-oriented classification
- [ ] Scenario C does not over-escalate applicant communication into automatic `HIGH`
- [ ] Scenario D escalates strong applicant scoring cases appropriately
- [ ] UI remains within institutional minimalism
- [ ] Rollback via flag disable has been confirmed

## Evidence to capture

For preview sign-off, collect:

1. one screenshot with flag `off`
2. one screenshot with flag `on` collapsed
3. one screenshot with flag `on` expanded
4. one screenshot of the short review dialog
5. short note on whether the copy felt calm and non-automatic
6. any case where the suggestion felt too strong, too weak, or too legalistic

## Stop conditions

Do not release the slice if one of these is true:

- the feature feels like automatic governance judgement
- applicant communication is routinely over-classified as `HIGH`
- the dialog drops existing governance fields when saving
- the UI becomes visually louder than the surrounding object page
- flag-off path is not equivalent to the previous detail-page behavior

## Rollback

Primary rollback:

1. set `NEXT_PUBLIC_REGISTER_FIRST_RISK_ASSIST_DETAIL=false`
2. redeploy
3. validate that the detail page returns to the free-text path

Expected rollback effect:

- no assist card
- no review dialog entry from the risk field
- existing saved data remains valid

## Sign-off block

- Preview URL:
- Preview reviewer:
- Product acceptor:
- Date:
- Result:
  - `accepted`
  - `accepted with follow-ups`
  - `not accepted`

- Follow-ups:
