# Monster Garage

A monster truck game for a 3-year-old, built for iPad Safari.

**Phase 1 — Garage:** build your truck. 5 bodies (pickup, van, bug, fire truck, dino), 4 wheel styles, 5 decals, 8 paint colors, 4 saved truck slots, a dice button for surprise trucks. Tap the truck to honk.

**Phase 2 — Drive:** hold anywhere to go. Bouncy suspension, hills, a big jump ramp, little cars that squash flat in a burst of stars. Crush the car matching the target color for triple stars. Rainbow TURBO button. Horn button.

No backend, no accounts: trucks persist in `localStorage`. All art is inline SVG; all sound is synthesized with the Web Audio API (no asset files).

## Run it

```bash
npm install
npm run dev
```

To play on the iPad while developing, run on your local network:

```bash
npm run dev -- -H 0.0.0.0
```

then open `http://<your-mac-ip>:3000` in iPad Safari (same Wi-Fi). Sound starts after the first tap (iOS rule).

**Pro tip:** in Safari tap Share → **Add to Home Screen**. It then launches fullscreen with no browser chrome — much better for small fingers.

## Deploy

```bash
npx vercel
```

(or push to a Git repo and import it at vercel.com — zero config needed).
