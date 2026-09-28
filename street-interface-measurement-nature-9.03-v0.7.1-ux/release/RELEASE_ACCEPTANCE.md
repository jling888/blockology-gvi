v0.7.1-UX1.3 Final UI Cleanup Candidate Acceptance
This package is a UX/reporting-only candidate built on v0.7.0 RELEASE VERIFIED and the validated v0.7.1 simplified workflow.
Scientific status
Scientific core remains `v0.6.3_GOLDEN_FREEZE`.
Nature 9.03 No-Omega formulas and n00045 golden values are unchanged.
Deterministic multi-source validation remains 66/66 PASS.
Repository source pins, GWR machinery, behavioral gates, and protocol boundaries are unchanged.
Runtime export schema lineage remains `V0_7_0_MULTI_SOURCE_INTEGRATION_RC1`; UX1.3 does not redefine the scientific schema.
UX1.3 final cleanup
Direct Qwen CSV Import / Advanced Import is removed from the operator interface.
Team Repository Data and paper authorization details are collapsed under one `Repository & Approval Provenance` advanced disclosure.
Automatic authorization is described as automatic in UI and JSON export; it is no longer mislabeled as an explicit user approval.
PDF footer and visible workflow/report labels identify `v0.7.1-UX1.3` instead of the legacy v0.6 display label.
Street-View Sampling Node Geometry remains background-only with unresolved crosswalks preserved when no explicit source mapping exists.
Acceptance gate
Before promotion beyond candidate status, run the AI Studio host lint/compile/runtime smoke test and verify:
App loads without runtime error.
Presentation Screenshot Recovery checkbox is absent and recovery remains system-default ON.
The primary VLM path exposes only the single `vlm_observations_murrayhill.csv` workflow; no Direct Qwen CSV Import is visible.
Importing `vlm_observations_murrayhill.csv` automatically matches, loads, bridges, and authorizes an eligible repository record.
Team Repository / authorization details are hidden under the collapsed Advanced Provenance disclosure.
Golden n00045 remains I/Y/D/M = 6.785792291750779 / 4.275239548226926 / 6.861271847132807 / 6.214327916148292.
Exported JSON uses automatic-authorization wording and preserves the v0.7.0 integration schema lineage.
PDF footer identifies v0.7.1-UX1.3 and no longer says `v0.6 — Team Repository Data Bridge`.
Demo-only segmentation warning remains visible when presentation recovery is used.
Current status: FINAL UI CLEANUP CANDIDATE — HOST VALIDATION PENDING.