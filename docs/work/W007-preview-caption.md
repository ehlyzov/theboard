# W007 — remove the redundant preview caption

Status: done (bounded technical outcome). Owner: TheBoard chat. Source: direct owner request,2026-11-08.
Base:8e6ab8efe2da21694c1a940297ea5d96df0aa37e.

UI-05: remove the footer caption `Просмотр · масштаб до 400%` from the
standalone example template and the currently served local copy. Preserve the
zoom controls, navigation hint, diagnostics and embedded board data. The main
editor does not contain this caption. The owner also asked where annotation
controls are: the contextual header marker/B is available in the main editor,
while the separate layout example remains read-only.

Verification before edit: exact caption found in the template and local example.
This is cosmetic copy removal; inspect the bounded HTML diff and served output,
without artificial behavior tests or an unrelated full local audit. Run one
fresh-context bounded read-only review; protected CI still gates PR integration.
Technical verdict: PASS. Independent bounded review of5e8a3b033e4b196996359fa019b60c2dd13fca37
against8e6ab8e verified that only the caption span was removed. HTMLParser
confirmed balanced nesting, identical IDs/remaining text, unchanged navigation
hint, zoom/diagnostics controls and embedded data placeholder. Author checks
also preserved the live private example data byte-for-byte and verified its
served4182 HTML omits the caption. No local build/full suite or UI rendering
check was necessary for this one-line cosmetic change; protected CI remains
mandatory. Human caption acceptance pending.

The subsequent screenshot was from the old standalone focus view, which only
filters global positions. The owner opened the main editor and confirmed the
controls were visible there; W006 temporary focus layout belongs to that editor.
The standalone remains the historical comparison, with this cosmetic removal.
This report/status follow-up retains the independently reviewed product diff.
