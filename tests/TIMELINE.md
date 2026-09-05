# Timeline preview and verification

The WordPress archive and `web/local-real-timeline.php` render the same
`template-parts/timeline.php`. The preview uses all 38 bundled history entries;
WordPress continues to prefer the editable `mc_timeline` posts.

Start PHP from the `web` directory:

```powershell
php -S 127.0.0.1:8099 -t .
```

With Playwright installed, run from the theme directory:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:/path/to/node_modules/playwright'
node tests/timeline-check.cjs
```

The check uses Edge and writes screenshots to `%TEMP%/sducraft-journey-check`.
It checks 1440×1000, 390×844, 844×390 and 320×568 layouts, descending dates,
year navigation, changing rail orientation, keyboard station focus, alpha bounds
throughout the chest animation, lossless book pagination, all 15 archive images,
book/route synchronization, visible controls, PJAX reinitialization and fallbacks.
A delayed-model cold-load check scrolls during loading and verifies that the
first exposed frame already contains the cart at its final reading position.

## Rendering

`timeline.js` owns scrolling, reading focus, year navigation, the book and
cleanup. `timeline-world.js` owns two WebGL contexts: one for the environment,
rails, minecart and torches; one shared by all chest thumbnails. Thumbnails are
copied into 2D canvases only when visible and dirty. Background rendering is
capped at 30 fps and pauses with the book open or the document hidden. Reduced
motion keeps a static environment and places the cart without interpolation.

DOM positions are projected into one orthographic world: screen Y = 0.8 × Z −
0.6 × elevation. The floor uses adjacent 64-unit cubes; the side walls stack
the same cubes in complete layers. Terrain is never scaled into thin slabs.
The rail has a constant physical height above that floor. The rail and cart use
the same curve; cart orientation follows its tangent. Torch UV coordinates
follow `template_torch.json`. Chest cameras
fit the union of 25 opening poses in camera space, including the latch.

Three.js r160 and its matching GLTFLoader/BufferGeometryUtils are bundled from
the repository's existing `story-prototype/viewer-assets/node_modules/three`.
This avoids the previous vendor build's missing `three.core.min.js` dependency.

## Sources

- History checked against https://www.sducraft.top/intro/history on 2026-09-06.
- MC textures and GLB models come from the user-provided `minecraft-asset` directory.
- Book background: `assets/minecraft/textures/gui/book.png`.
- History records: https://www.sducraft.top/api/historynode/
- Photographs and their event IDs: https://www.sducraft.top/api/imagesetforhistorynode/
- All 15 original image URLs, event IDs and image dimensions are recorded in
  `assets/timeline/history/manifest.json`.

Photographs are stored locally as WebP, at a maximum width of 1440 px. They are
displayed in timber frames with 3D supports, and open directly to the matching
book image page. The 2021-10-16 merger photograph is deliberately not attached
to the separate anniversary-video event on the same date.

Entries are stably sorted by descending date in the shared PHP template. The
previous depth metadata remains available for existing WordPress records, but
is not displayed or used for the front-end narrative. Introductory copy is
presentation text, separate from the history. Original historical links remain
available in the book.

### Continuous terrain and compositor scrolling

The world now uses an absolutely positioned viewport canvas with 240 CSS pixels of overscan on either side. Updating its document origin and orthographic camera together preserves projection alignment; native scrolling moves the last rendered frame alongside the DOM cards even between render frames. `timeline-scroll-check.cjs` deliberately pauses requestAnimationFrame and verifies equal 120px movement. Run with the same PLAYWRIGHT_MODULE setting as timeline-check.cjs.

All solid terrain cells remain 64×64×64 world units. The oblique camera projects the ground depth to 0.8 of its world length; a projected top face is therefore intentionally not a screen-space square. Directional shadow mapping, cube-sided recesses and lowered lava surfaces expose the geometry. World distance (with irregular transition boundaries), independently of years, selects grass/dirt, stone/ores, deepslate, blackstone/lava and netherrack. Minecraft animation atlases use square frames instead of stretching the whole strip. Image pages expand to a viewport-limited 1000px-wide book; the close icon uses two geometrically centered strokes.

### Origin junction

The shared template identifies the 2021-10-16 merger by date and title. The same-day anniversary video is ordered below the merger so it remains on the restoration branch. Restoration and original SDUcraft cards have explicit origin membership. The world builds a restoration route and an independent SDUcraft siding, whose cart clamps at its founding station and converges with the main cart at the merger. Both cars face toward newer history regardless of reading direction. The default/switch skin settings still apply on the shared line; rider.json branches settings control the independent origin characters. No extra renderer or external dependency is used.

Run tests/timeline-origins-check.cjs with PLAYWRIGHT_MODULE to verify desktop/mobile origin navigation, event order, branch skin isolation, founding limits and completed merger, and reverse traversal. The latest-first entrance remains unchanged; the new origin entrance scrolls to the footer without forcing the initial page position.

The final 80px before the junction use a reversible smoothstep blend of position, heading and branch opacity. Branch materials are independent so fading cannot affect the main car. The branch is hidden on the shared route. The merger is exempt from the normal 55px station snap, preserving the full scroll transition.

### Scenery and reading polish

Terrain edges vary with passage width and avoid the measured card/photo footprints. Selected gaps have timber crossings, deeper recesses and rock portals; lava pools use clustered contours. The origin branches lead into a grassy clearing with a crafting table and warm torch. Displays have visible uprights/footings; building images receive a larger 4:3 frame while milestone photographs receive layered timber surrounds. Mobile year navigation and HUD hide during scrolling and return after 650ms idle; focused year navigation remains usable, and reduced motion removes the CSS transition.

### Sakurairo production integration

The parent theme applies transition:all globally and makes dialog elements viewport-sized with zero margins. Timeline styles explicitly disable inherited transitions on its own elements (retaining only mobile navigation opacity/transform), reset dialog dimensions and auto-centering, and remove inherited text/button glow. This keeps canvas origin updates atomic and ensures image-page sizing is measured at the expanded width. The WordPress wrapper hides duplicate timeline branding and #colophon while preserving the parent's site navigation. Selectors depend on the actual timeline subtree, so PJAX navigation to other pages restores their normal presentation.

Timeline anchors preserve history.state instead of replacing it with null, allowing Sakurairo PJAX to restore scroll positions. Script initialization also disposes any earlier instance and its lifecycle listeners, preventing duplicate PJAX scene initialization.

`timeline-wordpress-check.cjs` loads the production URL while intercepting only the timeline CSS/JS with local files; it does not upload or alter the server. It verifies photo sizing/centering, disabled layout transitions, glow removal, footer hiding, preserved history, exact back-navigation scroll restoration, a single canvas, real SmoothScroll alignment, and mobile/landscape dialog positioning.

Riders default to facing away, turn toward the reader on downward page movement and away on upward movement. Both rider groups rotate locally, independently of cart path heading; reduced motion applies the turn immediately. Stationary frames retain the last facing direction.

### Adaptive performance

The renderer selects `mobile` quality for coarse pointers, viewports below 600px,
devices reporting no more than 4GB memory, or devices reporting no more than four
logical processors. Mobile quality renders at device pixel ratio 1, omits dynamic
shadow maps, uses 24 ambient particles, caps active rendering at 25fps, and stops
ambient frames once the cart settles. Full quality retains 1.5 DPR, shadows, 70
particles and continuous 30fps ambience. The selected mode is exposed as
`data-world-quality` for diagnostics.

Terrain instances are split into 12-row spatial chunks. This preserves instancing
while allowing the camera frustum to reject distant sections of the long timeline.
The document canvas still scrolls natively with the cards between render frames.

In Edge with a 390×844 viewport, DPR 2 and six-times CPU throttling, a 3.5-second
full-page scroll improved from 42.6ms average / 99.8ms p95 frame intervals to
17.1ms average / 17.7ms p95. Measured script CPU time fell from about 3468ms to
533ms. These are repeatable development measurements rather than guarantees for
every physical phone.
