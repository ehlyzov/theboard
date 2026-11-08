# W007 — remove the redundant preview caption

Status: active. Owner: TheBoard chat. Source: direct owner request,2026-11-08.
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
Human acceptance pending. Technical verdict: NOT_RUN. Next: apply and inspect.
