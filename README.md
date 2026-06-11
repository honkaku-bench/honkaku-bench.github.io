# Honkaku Bench — project website

A static site for the *honkaku* (本格) mystery benchmark: headline results, case
studies, and a portal where visitors can try solving the **first eight** cases
themselves and submit their solutions by email.

Live target: **https://honkaku-bench.github.io/**

## What's here

| File / dir | Purpose |
|---|---|
| `index.html` | Landing page — hero, headline results, leaderboard, the first-eight table, three case studies (solution-revealing analysis gated behind spoiler toggles), method & caveats. |
| `puzzles.html` | The portal — a grid of the eight released cases. |
| `puzzle-01.html` … `puzzle-08.html` | One "case file" per released puzzle, in **three languages** (English / 中文 / 日本語) behind a toggle, + a solve form. |
| `thanks.html` | Post-submission confirmation page. |
| `assets/css/style.css` | All styling (detective-noir theme). |
| `assets/js/main.js` | Renders the first-eight comparison bars (landing page). |
| `assets/js/puzzle.js` | Per-case language toggle; remembers choice in `localStorage`. |
| `assets/img/` | Puzzle figures (only non-spoiler images) + the RPG-JUMP map. |
| `_src/NN.html` | **Source** — English translation fragment. |
| `_src/NN.zh.html` | **Source** — Chinese original, reformatted to HTML (ground truth). |
| `_src/NN.ja.html` | **Source** — Japanese translation fragment. |
| `_src/NN.meta.json` | **Source** — title / teaser / tags / difficulty / challenge prompt. |
| `build.py` | Regenerates `puzzle-*.html` and `puzzles.html` from `_src/`. |

### Languages
Each case page embeds all three language versions as `.lang-pane` blocks and shows
one at a time. The Chinese pane is the original puzzle text; English and Japanese
are faithful translations. All three reuse the exact same (non-spoiler) figures.
CJK reading is handled with a system serif font stack (no heavy web-font download).

### Strict release scope
Only cases **01–08** are public. `build.py`'s `PUZZLES` whitelist enforces this;
do not add later cases. Solution-spoiler images that shipped in the puzzle media
folders (culprit flowcharts, teleport-route diagrams) were deliberately **excluded**
from `assets/img/`.

## Rebuilding the puzzle pages

Edit a translation in `_src/NN.html` or its `_src/NN.meta.json`, then:

```bash
python3 build.py
```

This rewrites the eight `puzzle-*.html` files and `puzzles.html`. `index.html`,
`thanks.html`, the CSS and JS are hand-authored and untouched by the build.

## The solution form (IMPORTANT — one-time setup)

Each case's form posts to **[FormSubmit](https://formsubmit.co/)**, a free,
backend-less relay that forwards submissions to `honkakubench@gmail.com`:

```
action="https://formsubmit.co/honkakubench@gmail.com"
```

**Activation:** the *first* time anyone submits any form, FormSubmit emails
`honkakubench@gmail.com` a one-time confirmation link. Click it once to activate
forwarding; after that every submission arrives automatically (subject line
`[Honkaku Bench] Solution — Case NN: …`). Submissions never expose the answer key.

To switch providers (e.g. Formspree) or change the address, update the `action`
and the `_next` redirect URL in `build.py` and re-run it.

## Deploying on GitHub Pages

This repo is named `honkaku-bench.github.io`, so it's a user/org Pages site served
at the root domain. To publish:

```bash
git add -A
git commit -m "Publish Honkaku Bench site"
git push origin main
```

Then in the repo settings enable **Pages → Deploy from branch → `main` / root**.
`.nojekyll` is present so files are served as-is (no Jekyll processing).
