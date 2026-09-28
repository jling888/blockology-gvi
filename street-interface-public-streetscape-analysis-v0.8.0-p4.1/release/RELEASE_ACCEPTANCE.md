v0.8.0-P4.1 Protocol-Aware Validation Candidate
P4.1 changes validation architecture, not the scientific model.
The core rule is now explicit: historical canonical research parity and public
single-photo live reproducibility are different validation classes and must not
be compared as though they were the same input protocol.
Accepted boundaries:
`RESEARCH_90_HALF_VIEW_GOLDEN` uses canonical historical n00045 medians and
requires exact frozen-core numerical parity.
`PUBLIC_SINGLE_PHOTO_LIVE` is assigned automatically to successful public
single-photo results. It requires same-input runtime stability and explicitly
carries `historicalGoldenComparable=false`.
The public SIM gateway does not accept a caller-controlled flag that could
relabel a public upload as a research golden case.
P2B VM, P3.1 Qwen source/runtime locks, and the frozen Nature 9.03 engine stay
unchanged.
Active synthesis remains `M_i = I_i^a_i × Y_i^b_i × D_i^c_i`; Omega and
external environmental `A_i` remain inactive.
Fallback elasticities remain `0.4 / 0.2 / 0.4`, source
`PAPER_GLOBAL_REFERENCE`, status `REFERENCE_NOT_LOCAL_GWR`.
Packaging validation completed:
Modified TypeScript/TSX files passed transpile-based syntax diagnostics.
A targeted TypeScript check with temporary external-library stubs reported
no errors in the P4.1 modified files.
Protocol class contract test passed.
Canonical n00045 frozen-core regression passed within `1e-12`; maximum
observed delta was floating-point epsilon (`8.88e-16`).
Frozen engine SHA-256 remained
`645ee93d6efe63e66e76ba1b4a4fb24bc7048d7b19c25ba49181cb4e2c280902`.
Public live repeat-run audit script passed Node syntax validation.
Required user-host P4.1 gates:
Overlay/install P4.1 over the already-working P4 folder (or use the complete
P4.1 package).
Run `npm.cmd install`, `npm.cmd run lint`, `npm.cmd run build`, and
`npm.cmd run validate:p4.1`.
Keep the VM worker on 8010 and Qwen worker on 8020 running, then run:
`npm.cmd run validate:p4.1:live -- .\001_n00045_S.jpg --runs=3`.
Confirm the public result card labels the result
`PUBLIC_SINGLE_PHOTO_LIVE` and does not claim historical golden parity.
Until those P4.1 host gates pass, this remains a development candidate rather
than a sealed release.