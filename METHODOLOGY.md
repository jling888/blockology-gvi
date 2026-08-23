# Methodology, findings, and open questions

Design rationale, literature review, and unresolved questions behind
`blockology-gvi`'s choices -- FOV, solid-angle weighting, capture geometry,
and segmentation model selection. For how to actually run the pipeline, see
[README.md](README.md).

**Status note:** the solid-angle weighting described in the next two
sections was implemented and verified (correct math, checked against the
closed-form solid angle, checked against Google's documented Static API
behavior) but has since been **removed from the pipeline**. It's a pure
camera-geometry correction, not a claim about human vision -- but there
wasn't confidence in taking a dependency on that reasoning for this
iteration of the study, separately from whether the geometry itself is
right. GVI/VEI currently come from plain pixel counting (see "Removing
solid-angle weighting" near the end of this file). The sections below are
kept as-is, unedited, as the reasoning trail for revisiting this in a later
iteration -- they describe what the code *used to* do, not what it does now.

## Methodology: why FOV=60, and what solid-angle weighting does (and doesn't) fix

Street View shots are a rectilinear (gnomonic) projection: a real-world
angle theta off a shot's own center lands at a pixel position proportional
to tan(theta), so content stretches toward the edges, faster than theta
grows, as the shot's own half-angle (FOV/2) widens. Two different problems
follow from this, and it matters which one a given fix actually addresses.

**Problem 1: the GVI ratio's aggregation math.** A flat pixel count
over-weights whatever's near the frame edge, because the same real-world
angular patch is spread over more pixels there than at center. This is
fixed by `stage_06_metrics.py`'s per-pixel solid-angle weight
(`_pixel_weights`, `ΔΩ(u,v)`): it converts "count of pixels labeled
vegetation" into "fraction of solid angle that's vegetation," which is the
geometrically correct quantity, and it's correct at *any* FOV, including 90
or 120 degrees. Once weighting is in place, the GVI ratio itself is no
longer biased by projection distortion, regardless of FOV.

**Problem 2: segmentation accuracy.** Weighting does not fix whether the
segmentation model classified those edge pixels correctly in the first
place. Mask2Former/CLIPSeg were trained mostly on normally-framed photos.
Near a wide-FOV shot's edge, real objects aren't just magnified -- they're
sheared/warped (a tree trunk that should read as a vertical line starts to
curve), which is a domain shift the model wasn't trained for, so its
per-pixel labels get less reliable exactly where the distortion is worst.
Reweighting a *wrong* label just gives a wrong answer with a fancier weight
attached -- there's no way to reweight your way out of a classification
error.

That's the actual reason FOV still matters post-weighting: it bounds how
severe that edge warping gets, since the max off-axis angle in any shot is
FOV/2, and the warping rate grows nonlinearly with that angle (the stretch
factor's rate of change is proportional to sec^2(theta)). Going 90 -> 60
degrees cuts the max off-axis angle from 45 -> 30 degrees, a real,
meaningful reduction in worst-case classification degradation.

**Why not go narrower still (30 degrees or less)** -- the returns taper off
fast:
- Diminishing returns on distortion itself: sec^2(30deg) ~= 1.33 vs
  sec^2(15deg) ~= 1.07 -- going 60 -> 30 only trims the worst-case edge
  magnification from ~33% to ~7%, a much smaller marginal gain than the
  90 -> 60 step bought.
- Cost is linear in the number of shots needed for full coverage: 60
  degrees needs 6 shots for 360; 30 degrees needs 12 -- double the billed
  API calls and double the GPU segmentation time for that small residual
  improvement.
- Very narrow shots lose scene *context* that segmentation genuinely uses
  (a green blob is a shrub vs. wall paint partly from what's around it).
- At 640px, 60-degree FOV already gives ~10 px/degree -- plenty of
  resolution for typical street-level vegetation. Going finer mainly helps
  if specific small/thin objects (distant branches, thin ivy) are being
  missed -- a symptom to check for, not a default assumption.

Net: 60 degrees is a reasonable rule-of-thumb balance, not a rigorously
derived optimum. The rigorous way to settle it would be an empirical
sensitivity check -- segment the same locations at 60 vs 90 degrees (both
solid-angle-weighted) and compare edge-region classification
confidence/accuracy directly -- not yet run.

## How Google Street View imagery is actually captured

Street View cars use a multi-camera "rosette" rig -- several individual
cameras, each a normal rectilinear lens (not fisheye), pointed in different
directions around a shared hub. Google's backend stitches roughly 21
simultaneous shots per capture point into one canonical **equirectangular
(Plate Carrée) panorama**, 360 x 180 degrees, 2:1 aspect ratio -- that's the
format actually stored and served by Street View's tile system.

The Static API (`fov`/`heading`/`pitch`/`size`, used by `stage_03_imagery.py`)
does not hand back a literal crop of that equirectangular image. It
simulates a virtual camera aimed at the requested heading/pitch with the
requested FOV, and resamples the underlying sphere into that virtual
camera's view. Google's own docs describe `fov` as acting like optical zoom
on a fixed-size viewport -- the signature of a true perspective (gnomonic)
reprojection, since an equirectangular crop would not "zoom" that way
(equirectangular pixels map linearly to angle regardless of zoom level).
This confirms, rather than just assumes, that the images this pipeline
downloads are genuine rectilinear/pinhole-camera projections, reprojected
server-side from a spherical source -- which is exactly the projection model
`_pixel_weights` in `stage_06_metrics.py` is built for.

A separate, useful consequence: every shot at a node, regardless of
heading, is a virtual re-render of the *same* underlying panorama from the
*same* optical center (that's why imagery is fetched by `pano_id`, not
lat/lon -- see `stage_03_imagery.py`'s docstring). The six shots per node
differ only in which way the virtual camera is pointed, never in position.
That fact matters for how multiple shots can be combined -- see "Aggregating
to a 180-degree pedestrian-facing view" below.

## Literature check: do published GVI studies correct for this distortion?

Checked directly against the source material rather than assumed. Short
answer: no, not with real geometric correction.

**Li et al. 2015 ("Treepedia"; Urban Forestry & Urban Greening 14:675-685)**
is the most-cited GVI-via-Street-View methodology and the direct ancestor of
most later work, including NYC-specific follow-ups. Their capture scheme is,
coincidentally, close to this pipeline's: FOV=60 degrees, six headings at
0/60/120/180/240/300 degrees, three pitch angles (-45/0/45) for 18 images
per site. Green pixels are classified with a simple RGB-band color-difference
heuristic, and the GVI formula is a flat ratio:
`Green View = sum(Area_green) / sum(Area_total) * 100%`, summed unweighted
across all 18 images. No mention anywhere in the methodology of projection
distortion, pixel stretch, or any geometric correction -- every pixel counts
equally regardless of where in the frame it falls. Their own predecessor,
Yang et al. 2009 (four cardinal-direction photos), has the same flat-ratio
structure.

Later work doesn't change this. "Enhanced Green View Index" (PMC9445380)
uses "simple thresholding" with no distortion discussion. A 2025 comparative
survey ("Comprehensive Comparative Analysis... of GVI Calculation Methods,"
MDPI *Land* 14(2):289) is the one paper that engages with distortion as a
named problem -- but only for full spherical panoramas, and the fix it
surveys is **cropping** ("some studies cropped square images in the center
of the panoramic image"; "clipping the distortion area... though this
approach did not cover all greenery information"), or, for equirectangular
panoramas specifically, a sinusoidal reprojection aimed at pole-singularity
distortion, not rectilinear edge-stretch in a perspective crop -- a
different problem than the one this pipeline addresses.

The instructive contrast is a neighboring field: forest ecology's
hemispherical (fisheye) canopy photography has used real geometric
weighting for decades -- canopy openness is computed as gap fraction
weighted by a `cos(theta) * sin(theta) * dtheta` zenith-ring function, and
"equisolid" fisheye lenses are chosen specifically because they preserve
equal area per solid angle. So the *principle* this pipeline applies isn't
novel -- it's standard practice in a sibling discipline that the
urban-GVI-from-Street-View literature never imported. (The specific
canopy-photography formula isn't directly reusable, though -- see below.)

**Conclusion:** the dominant published GVI methodology uses uncorrected
flat pixel ratios. This pipeline's solid-angle weighting is a defensible
methodological improvement over field standard practice, not a deviation
from an established norm -- worth stating explicitly as such if this
becomes part of a paper (e.g. "unlike prior GVI studies [Li et al. 2015],
we apply per-pixel solid-angle weighting analogous to established practice
in hemispherical canopy photography, correcting for rectilinear projection
distortion rather than discarding or ignoring it").

Sources: [Li et al. 2015 PDF](https://senseable.mit.edu/treepedia/treepedia_publication.pdf) --
[Enhanced green view index (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9445380/) --
[Comprehensive Comparative Analysis... GVI Calculation Methods (MDPI *Land*)](https://doi.org/10.3390/land14020289) --
[How GVI... Relates to Pedestrians' Perspective (MDPI *Land*)](https://doi.org/10.3390/land15060917) --
[Coverage and Bias of Street View Imagery (arXiv)](https://arxiv.org/html/2409.15386v1)

## Why the hemispherical-canopy-photography formula isn't reused as-is

The *instinct* to borrow from that field is right; the literal formula
isn't, for two independent reasons:

- **Different source projection.** Canopy photography uses a single fisheye
  lens covering a full hemisphere in one shot, with a lens-specific
  nonlinear mapping (equidistant, equisolid, etc.). Street View Static API
  images are rectilinear/gnomonic reprojections (see above) -- a different
  pixel-to-angle mapping entirely. The gnomonic Jacobian already implemented
  (`f / (x^2 + y^2 + f^2)^1.5`) is the correct one for this source; a
  fisheye formula would not be.
- **Different physical quantity.** Canopy studies mostly report "canopy
  openness" (Diffuse Non-Interceptance), which weights gap fraction by
  `cos(theta) * sin(theta) * dtheta` -- that extra `cos(theta)` term is
  Lambert's cosine law, accounting for how much *diffuse light* actually
  lands on a horizontal receiving surface. That's a radiometric quantity.
  GVI wants "what fraction of my visual field is vegetation" -- a purely
  angular quantity, with no light-transport term. Plain solid angle
  (`sin(theta) * dtheta * dphi`, or its rectilinear-crop equivalent, which
  is what's implemented) is the correct analog, not the cosine-weighted
  version. (Some canopy tools also report plain per-ring gap fraction
  without the cosine term -- *that* one would be the correct analog, but
  "canopy openness/DIFN" specifically, the more commonly cited number in
  that literature, is not.)

## Does solid-angle weighting model human vision?

Checked, and the answer is: not really, and it shouldn't try to.

Human vision has no single matching "projection" -- optical field of view
is roughly 200-210 degrees horizontal (a ~120 degree binocular overlap plus
two ~35-40 degree monocular-only side wings) and 130-150 degrees vertical,
asymmetric (~50 degrees above the horizon, 70-80 degrees below). But acuity
across that field is wildly non-uniform: sharp only in the ~1-2 degree
fovea, down to under 10% of central acuity by just 5 degrees of
eccentricity, with "central vision" conventionally ending around 30 degrees
eccentricity -- everything past that is periphery. There's no single
"human" projection to correct toward.

What *is* real is that the GVI literature's own FOV convention (50-60
degrees, Walker et al. 1990, cited verbatim by both Yang et al. 2009 and Li
et al. 2015: "the central field of vision for most people covers an angle
between 50 and 60 degrees") is explicitly modeling the near-foveal/
parafoveal cone people actually attend to -- an attention argument, not an
optics argument. This pipeline's `FOV=60` lands on the same number the
field's own foundational convention uses, independently.

Given that, solid-angle weighting and foveal acuity falloff are easy to
conflate but are not the same correction, and shouldn't be merged:

- **Solid-angle weighting corrects an over-representation.** Left
  uncorrected, a rectilinear camera's own geometry makes edge content
  occupy *more* pixels than its true share of the visual cone (the
  tan(theta) stretch). The correction removes that artifact, bringing every
  direction within the FOV back down to counting **equally per steradian**
  -- an objective, geometrically neutral baseline.
- **Foveal weighting would require actively under-weighting edges *below*
  that equal baseline** -- because even with a perfectly undistorted
  camera, the brain still doesn't treat all directions in a 60 degree cone
  as equally important. That's a second, deliberately separate,
  perceptual-salience correction that this pipeline does not apply and
  that no reviewed GVI study applies either -- it would change what GVI
  measures (an "objectively visible" ratio) into something else (a
  "perceived-salience-weighted" ratio).
- **The magnitudes don't even come close to matching.** At FOV=60 (30
  degree half-angle), the solid-angle weight at the frame edge is about
  `cos^3(30deg) ~= 65%` of the center weight -- a mild, smooth correction
  spread across the full 30 degree cone. Real foveal acuity falls to under
  10% of central acuity by just 5 degrees -- six times closer to center
  than this pipeline's entire frame edge, and far steeper. If solid-angle
  weighting were somehow standing in for foveal weighting, it would be off
  by an order of magnitude in both steepness and where the falloff even
  starts.

**Conclusion:** solid-angle weighting and foveal falloff share a qualitative
family resemblance ("edges matter less") for two unrelated reasons -- one a
camera-geometry artifact, one a retinal/neural one -- and land at very
different places. The current implementation (plain solid angle, no
perceptual weighting) is the geometrically correct choice for the metric as
currently defined; adding foveation weighting would be a scope change, not
a bug fix.

## Aggregating to a 180-degree pedestrian-facing view

One open design question: should GVI represent "what one pedestrian sees
facing one direction" (a 180-ish-degree forward cone) rather than, or in
addition to, the omnidirectional 360-degree environmental measure the
pipeline currently sums? (The field's own foundational convention is
inconsistent on this -- Li et al. 2015 justify their *per-shot* FOV with a
"central vision" argument but then sum *all 6 headings*, which has nothing
to do with one direction of view. A 180-degree-facing framing is arguably
more internally consistent with "model a pedestrian's view" than the field's
own norm is.)

**Don't stitch pixels to get there.** Three consecutive 60-degree-spaced
headings (e.g. offsets 300/0/60, or 120/180/240) tile 180 degrees exactly,
same zero-overlap/zero-gap principle as the existing 360-degree, six-image
tiling. Solid angle is additive over a partition, so the 180-degree GVI is
exactly recoverable by summing the three images' already-computed `w_veg`
and `w_total`:

```
GVI_facing = sum(w_veg over 3 images) / sum(w_total over 3 images)
```

This is not an approximation of what a real composited 180-degree image
would give -- it *is* that number, computed in three pieces instead of one,
with no possible improvement available on the other side of stitching.
Compositing first could only make it worse:

- A true 180-degree FOV cannot be a flat rectilinear image (`tan(90deg)` is
  infinite), so a pixel composite needs a different target surface (a
  cylinder, most naturally) -- a second geometric model, requiring its own
  derivation and validation, for a result no more correct than summing the
  three already-exact per-image totals.
- Building the composite requires resampling/interpolation at the seams --
  real numerical error that doesn't exist in the current per-source-pixel
  computation.
- Segmenting a stitched composite instead of the three source images would
  push further from the rectilinear-photo domain the segmentation models
  were trained on, and would give CLIPSeg's fixed 352x352 native resolution
  *less* effective resolution per real-world object than segmenting three
  native-resolution crops separately.
- `cv2.Stitcher`'s feature-matching/RANSAC machinery exists to estimate an
  *unknown* relative camera pose -- not needed here, since same-`pano_id`
  images share one true optical center (pure rotation, zero parallax, see
  above); it's solving a problem this data doesn't have. If a visual
  composite is ever wanted (for QA or feeding a VLM, not for the number
  itself), a deterministic closed-form reprojection using the known heading
  offsets and the gnomonic inverse-projection formula is the right tool,
  not `cv2.Stitcher`.

**A subtlety worth recording:** treating three images separately means each
one's weight function peaks at *its own* optical axis -- three local maxima
across the 180-degree span in pixel space, not one. This looks like it
could bias the boundary between images. It doesn't, but the reason is more
precise than "it exactly cancels everywhere," which is an overstatement --
checked numerically against the actual `_pixel_weights` implementation
rather than just asserted, and it's worth recording exactly what does and
doesn't hold.

Converting weight-per-pixel to weight-per-degree-of-true-heading via the
chain rule (`dOmega/dphi = (dOmega/dx) / (dphi/dx)`) does give an *exactly*
flat result -- but only under the idealized assumption that a column's
weight is integrated over infinite vertical extent (`dOmega/dx` in the
1D sense, `~ 2f/(x^2+f^2)`, matching `dphi/dx ~ f/(x^2+f^2)` up to a
constant). The real images are finite squares (only +/-30 degrees of
vertical extent at FOV=60, not an infinite strip), so the true 2D
column-summed weight-per-degree is *not* perfectly flat: numerically, for
the pipeline's actual 640x640/FOV=60 geometry, it varies about 11.8%
peak-to-trough across a single image's width, with each image's own edges
running about 10.5% below its own center. This isn't a bug -- stretching
the image height while holding width/FOV fixed makes the deviation shrink
toward zero (1.005 at 10x the height, 1.0001 at 100x), confirming it's
specifically the finite-vertical-extent truncation the idealized 1D
argument assumes away, not an error in the formula or the code.

What *does* hold exactly, independent of that residual profile: the two
columns on either side of any seam -- one image's own edge and the
adjacent image's matching edge -- are evaluated by the identical formula at
identical `|x|` (the weight depends on `x^2`, not `x`), so they match
exactly regardless of height. That's confirmed numerically too (leftmost
and rightmost column of the same image agree to full floating-point
precision at every height tested). So there's no privileged single
"center" to measure everything from -- solid angle is a measure on
directions/rays from the (shared) observer position, and each camera's own
optical axis is just a coordinate-system choice within its own pixel
parameterization, privileged only in that parameterization, not physically.
No double-counting or under-counting artifact exists *at the seams*
between adjacent images -- that conclusion survives fully intact. What
doesn't survive at full strength is the stronger claim that per-degree
weighting is flat everywhere within an image; it's only approximately so
(good to within ~10%), and exactly so only in the infinite-strip
idealization.

**Practical recommendation, not yet implemented:** group the existing six
captured headings (`stage_03_imagery.OFFSETS`) into two 180-degree-spanning
triads -- `{300, 0, 60}` (centered on offset 0, the along-street "direction
of travel" per `GRID_BEARING`) and `{120, 180, 240}` (the reverse facing) --
and sum weighted sums within each triad instead of, or alongside, the full
six-image omnidirectional sum. This is a grouping change in
`stage_06_metrics.py` only; it needs no new imagery, no new API calls, and
no change to imagery or segmentation.

## Segmentation model choices

Two goals: segment all vegetation ("greens" -- trees, lawns, flowers, ivy,
planters, anything green), and, as an add-on, segment scaffolding (common
in NYC streetscapes).

**Main goal -- vegetation.** Keep Mask2Former
(`facebook/mask2former-swin-large-ade-semantic`) as the primary segmenter.
ADE20K's `tree`/`grass`/`plant`/`palm`/`flower` classes give real
per-species granularity most segmentation datasets don't have, and
Mask2Former-Swin-Large is close to the ceiling of general-purpose dense
segmentation accuracy among off-the-shelf models. The real gap is what
ADE20K's fixed classes structurally can't see -- ivy on a wall, a windowsill
planter, a flower box on a railing -- which is what the vision-language
segmentation stage (`VEG_PROMPTS`, currently via CLIPSeg) exists for.

*Recommended upgrade:* replace CLIPSeg with **Grounded-SAM** (Grounding
DINO for text-prompted detection + SAM/SAM2 for mask refinement) for the
vision-language stage. CLIPSeg outputs a coarse 352x352 thresholded
heatmap, not a real segmentation mask -- imprecise exactly where precision
matters most (thin ivy strands, narrow window boxes). Grounded-SAM gives
full-resolution, boundary-accurate masks from the same kind of text prompts
already in use, at the cost of a second model (more memory, slower per
image, two thresholds to tune instead of one).

*Considered and rejected as a primary-model swap:* SegFormer-B5 fine-tuned
on Cityscapes (`nvidia/segformer-b5-finetuned-cityscapes-1024-1024`).
Cityscapes' vegetation-relevant classes (`vegetation` for trees/hedges,
`terrain` for grass mixed with bare soil/sand) are coarser and riskier than
ADE20K's -- `terrain` would introduce false positives from dirt/sand if used
as a lawn signal. Cityscapes was collected from car-mounted dashcams across
a handful of European cities with a fixed forward-facing camera pose, a
narrower and more different domain than this pipeline's varied 60-degree-
spaced headings (including sideways/backward views a dashcam dataset never
contains) than ADE20K's broad, arbitrarily-framed training distribution is.
Its higher reported mIoU (~82 vs. Mask2Former-ADE20K's ~56-57) reflects an
easier, narrower benchmark, not better real-world accuracy on this task.
Possible narrow role: a second-opinion cross-check on vegetation calls only
(flagging disagreements for review), restricted to its `vegetation` class
and excluding `terrain`, given SegFormer's lighter compute footprint --
not a replacement. (Implemented anyway as a swappable alternative backend,
`stage_04_segmentation_vision_segformer.py` -- see README.md for how to
switch to it.)

**Add-on goal -- scaffolding.** No general segmentation dataset (ADE20K,
COCO, Cityscapes) contains a scaffolding class -- it's NYC-specific and
absent from every public benchmark, so every viable option is some form of
zero-shot, text-prompted vision-language detection (fine-tuning on a
hand-labeled set was considered and explicitly deferred for now).

- **Primary:** the same Grounded-SAM upgrade above, since Grounding DINO's
  phrase-grounding handles descriptive multi-word prompts better than
  CLIPSeg's simpler embedding similarity. NYC scaffolding has visually
  distinct sub-types worth prompting separately rather than with one
  generic string -- sidewalk sheds (covered pedestrian walkway, flat roof),
  bare pipe-and-plank scaffolding, green/black safety netting, blue plywood
  construction fencing.
- **Validation layer (new, sample-only):** periodically sample a few
  hundred images and ask a cloud VLM (Gemini or Claude) a structured
  "is scaffolding present, and roughly where?" question, compared against
  Grounded-SAM's output, to catch systematic false positives/negatives.
  Not a per-image production path -- too costly/slow at this pipeline's
  volume (thousands of nodes x 6 headings). Mirrors the GPT-4o inter-rater
  pattern already used for VLM-scoring validation in the sibling
  `pgvi-blockology` package (`stage_09_validation.py`), applied to
  segmentation instead.
- **Free external cross-check:** NYC DOB Sidewalk Shed Permit open data
  (location + permit dates) as a non-vision ground-truth signal -- for any
  node/date with a high measured `scaffold_frac`, check whether a permitted
  shed actually existed there then. Mirrors the existing pattern of
  validating VEI/vision output against real municipal data
  (`pgvi-blockology/stage_07_geometry.py` uses NYC Building Footprints for
  height validation) -- not yet implemented.

## Merging the vision and vision-language results

Two models can both flag the same real pixel -- e.g. a plant Mask2Former
already calls `plant` can also trip CLIPSeg's "potted plants" prompt.
Early on this was handled by summing each model's independently-computed
total (`w_veg + w_veg_extra`), which double-counts any pixel both models
agree on. Fixed by merging at the *mask* level instead of the *number*
level: CLIPSeg's mask is nearest-neighbor resampled onto the vision mask's
own resolution, then the two are combined with a per-pixel union
(`veg OR veg_extra`), so a doubly-flagged pixel counts exactly once. See
`stage_06_metrics.py` for the implementation.

This also resolved a separate, previously-unsolved problem for free:
supporting *unweighted* GVI (flat pixel ratio, matching most published
Street View GVI methodology, as an alternative to solid-angle weighting)
requires an unweighted version of CLIPSeg's contribution too, and that
didn't exist -- the old design only ever computed a weighted
`w_veg_extra`, because weighting was what made combining CLIPSeg's
352x352 grid with Mask2Former's 640x640 grid unit-consistent in the first
place. Since the merge now happens on a resampled, shared-resolution mask
*before* either weighted or unweighted totals are computed, both fall out
of the same deduplicated mask symmetrically -- no separate rescale hack
needed for the unweighted case.

Scaffolding is deliberately *not* merged into the building count the same
way -- it's a correction signal (Mask2Former misreads scaffolding as
`building`, inflating VEI), not an additive vegetation-style category, so
summing it into `bldg` isn't obviously correct the way the vegetation union
is. It's reported as its own separate metric (`scaffold_frac`) instead;
folding it into a corrected VEI is a possible future change, not
implemented.

## Removing solid-angle weighting

Implemented, verified, and then deliberately pulled back out, so it's
worth recording precisely why, since the two "why not" questions that come
up are actually different questions with different answers.

**Is it a claim about human vision?** No. Everything in "Does solid-angle
weighting model human vision?" above establishes this explicitly: the
weighting corrects a rectilinear *camera projection* artifact (the
`tan(theta)` edge-stretch), a provable geometric fact, verified against
Google's own documented Static API behavior and against the closed-form
solid angle to 6 decimal places. It has nothing to do with retinas or
foveal acuity -- the one place this project actually considered a
vision-biology-dependent correction (foveal-falloff weighting, so a shot's
center would matter more than its edges because that's how eyes work) was
explicitly rejected, for lack of confident grounds to assume a specific
perceptual model. That rejection is still in effect; it was never in the
code to begin with.

**So why remove it?** Not because the geometry is wrong -- because
building any correction into the primary reported metric, geometric or
perceptual, is a decision the study wants to make deliberately in a later
iteration rather than carry by default in this one. That's a scope/timing
call, not a correction to the math above. GVI/VEI are now:

    GVI = sum(px_veg) / sum(px_total) * 100%
    VEI = sum(px_bldg) / sum(px_sky + px_bldg)

-- flat pixel-count ratios, matching the uncorrected convention the
"Literature check" section above found in Li et al. 2015 and the rest of
the published GVI-via-Street-View literature. `_pixel_weights` and
`compute_weighted_sums` (in what was `stage_06_weighting.py`, before the
stage_06/07 merge) are gone from the codebase; `stage_06_metrics.py`'s
`compute_pixel_counts` keeps the mask-merge/deduplication logic from
"Merging the vision and vision-language results" above (that's unrelated
to weighting -- it's about not double-counting when two models agree) but
no longer computes a weighted sum at all.

If a later iteration wants this back: the math in the first three sections
of this file is unchanged and already verified, `_pixel_weights`'s
implementation is preserved in this file's own edit history, and the
seam/"three centers" analysis under "Aggregating to a 180-degree
pedestrian-facing view" still applies unmodified to however weighting gets
reintroduced.
