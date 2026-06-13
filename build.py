#!/usr/bin/env python3
"""Build the Honkaku Bench static site.

Reads the per-puzzle translation fragments (_src/NN.html) and metadata
(_src/NN.meta.json), then emits:
  - puzzle-NN.html  (one "case file" page per released puzzle, with a solve form)
  - puzzles.html    (the portal grid linking to all released puzzles)

index.html and thanks.html are hand-authored and not touched here.

STRICT RULE: only puzzles 01-08 are released. PUZZLES below is the whitelist.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "_src"

# --- the only puzzles we are allowed to publish -------------------------------
PUZZLES = ["01", "02", "03", "04", "05", "06", "07", "08"]

# benchmark scores for the released set (percent): id -> (fable5, opus48)
SCORES = {
    "01": (80.0, 45.0), "02": (100.0, 100.0), "03": (75.0, 42.5),
    "04": (100.0, 40.0), "05": (100.0, 100.0), "06": (100.0, 55.0),
    "07": (88.9, 5.6),  "08": (26.3, 0.0),
}

SITE_URL = "https://honkaku-bench.github.io"
EMAIL = "honkakubench@gmail.com"

NAV = """<header class="nav"><div class="wrap nav-inner">
  <a class="brand" href="{home}index.html"><svg class="mag" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><line x1="12.9" y1="12.9" x2="18" y2="18"/></svg><span>HONKAKU<b>BENCH</b></span></a>
  <nav class="nav-links">
    <a href="{home}index.html#results">Results</a>
    <a href="{home}analysis.html">Analysis</a>
    <a class="cta" href="{home}puzzles.html">Try a Case</a>
  </nav>
</div></header>"""

FOOT = """<footer><div class="wrap foot-grid">
  <div>HONKAKU BENCH &middot; 79 honkaku mysteries vs. frontier LLMs &middot; graded by an LLM judge on the reasoning chain, not just the verdict.</div>
  <div><a href="{home}index.html">Home</a> &nbsp;&middot;&nbsp; <a href="{home}analysis.html">Analysis</a> &nbsp;&middot;&nbsp; <a href="{home}puzzles.html">The Cases</a> &nbsp;&middot;&nbsp; <a href="mailto:{email}">{email}</a></div>
</div></footer>"""

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="{home}assets/css/style.css">
</head>
<body>
"""


def score_badge(pid):
    f, o = SCORES[pid]
    return (f'<span class="tag" title="Best LLM score on this case">'
            f'Best AI: {f:.0f}%</span>')


def puzzle_page(meta, bodies):
    pid = meta["id"]
    email = EMAIL
    site = SITE_URL
    diff = meta.get("difficulty", "Fiendish")
    tags = "".join(f'<span class="tag">{t}</span>' for t in meta.get("tags", []))
    f, o = SCORES[pid]
    subject = f"[Honkaku Bench] Solution — Case {pid}: {meta['en_title']}"
    head = HEAD.format(
        title=f"Case {pid}: {meta['en_title']} — Honkaku Bench",
        desc=meta.get("teaser", ""), home="")
    return f"""{head}{NAV.format(home="")}
<main>
<div class="wrap narrow case-head">
  <a class="back-link" href="puzzles.html">&larr; All cases</a>
  <div class="case-meta">
    <span class="case-no">CASE {pid}</span>
    <span class="diff {diff}">{diff}</span>
    <span class="tag" title="Best score any tested model earned">Best AI score &middot; {f:.0f}%</span>
  </div>
  <h1>{meta['en_title']}</h1>
  <div class="zh">{meta.get('zh_title','')}</div>
  <div class="tags">{tags}</div>
  <div class="lang-switch" role="group" aria-label="Choose language">
    <button type="button" data-lang="en" aria-pressed="true">English</button>
    <button type="button" data-lang="ja" aria-pressed="false">&#26085;&#26412;&#35486;</button>
    <button type="button" data-lang="zh" aria-pressed="false">&#20013;&#25991;</button>
  </div>
</div>

<div class="wrap narrow">
  <article class="dossier">
    <div class="lang-pane active" data-lang="en">
{bodies['en']}
    </div>
    <div class="lang-pane" data-lang="ja" lang="ja">
{bodies['ja']}
    </div>
    <div class="lang-pane" data-lang="zh" lang="zh-Hans">
{bodies['zh']}
    </div>
  </article>
</div>

<div class="wrap narrow solve">
  <div class="solve-card">
    <h2>Submit your solution</h2>
    <p class="note">Think you've cracked it? Lay out your reasoning &mdash; the culprit, the method, the trick, and <em>why the clues force it</em>. We read every submission.</p>
    <div class="challenge-ask"><strong>Your task:</strong> {meta.get('challenge_prompt','')}</div>

    <form action="https://formsubmit.co/{email}" method="POST">
      <input type="hidden" name="_subject" value="{subject}">
      <input type="hidden" name="_captcha" value="false">
      <input type="hidden" name="_template" value="table">
      <input type="hidden" name="_next" value="{site}/thanks.html">
      <input type="hidden" name="case" value="Case {pid} — {meta['en_title']}">
      <input type="text" name="_honey" class="hp" tabindex="-1" autocomplete="off">

      <label class="spoiler-guard">
        <input type="checkbox" required>
        <span>This is my own attempt. I understand the official solution is <strong>not</strong> published here &mdash; this is a real challenge.</span>
      </label>

      <div class="form-row">
        <div class="field">
          <label for="name">Name or handle</label>
          <input id="name" type="text" name="name" placeholder="e.g. Detective Cao" required>
        </div>
        <div class="field">
          <label for="email">Email <span class="hint" style="display:inline">(optional &mdash; only if you'd like a reply)</span></label>
          <input id="email" type="email" name="email" placeholder="you@example.com">
        </div>
      </div>

      <div class="field">
        <label for="culprit">Your verdict &mdash; who / what / how (one line)</label>
        <input id="culprit" type="text" name="verdict" placeholder="The culprit is&hellip; by means of&hellip;">
      </div>

      <div class="field">
        <label for="solution">Full reasoning</label>
        <textarea id="solution" name="solution" required placeholder="Walk us through the deduction step by step. Which clue forces which conclusion? How do you eliminate the other suspects?"></textarea>
        <div class="hint">English or Chinese both welcome. The more your chain of reasoning is spelled out, the better.</div>
      </div>

      <button class="btn btn-primary" type="submit">Send my solution &rarr;</button>
      <p class="note" style="margin-top:16px">Submissions are emailed to the benchmark authors at <strong>{email}</strong> via FormSubmit. We never publish the answer key &mdash; so no spoilers, ever.</p>
    </form>
  </div>
</div>
</main>
{FOOT.format(home="", email=email)}
<script src="assets/js/puzzle.js"></script>
</body>
</html>"""


def card(meta):
    pid = meta["id"]
    diff = meta.get("difficulty", "Fiendish")
    tags = "".join(f'<span class="tag">{t}</span>' for t in meta.get("tags", [])[:3])
    f, o = SCORES[pid]
    return f"""  <a class="pcard" href="puzzle-{pid}.html">
    <div class="pcard-top">
      <span class="case-no">{pid}</span>
      <span class="diff {diff}">{diff}</span>
    </div>
    <h3>{meta['en_title']}</h3>
    <p class="teaser">{meta.get('teaser','')}</p>
    <div class="tags">{tags}</div>
    <div class="pcard-foot"><span>Open the case file</span><span>Best AI &middot; {f:.0f}%</span></div>
  </a>"""


def puzzles_index(metas):
    head = HEAD.format(
        title="The Cases — Honkaku Bench",
        desc="Try solving the first eight honkaku mysteries from the benchmark. No spoilers — submit your own solution.",
        home="")
    cards = "\n".join(card(m) for m in metas)
    return f"""{head}{NAV.format(home="")}
<main>
<section class="hero" style="padding-bottom:24px">
  <div class="wrap">
    <span class="eyebrow">The Portal &middot; 8 Released Cases</span>
    <h1>Out-deduce the <span class="hl">machine</span>.</h1>
    <p class="lede">These are the first eight mysteries from the benchmark &mdash; the same case files we handed to frontier models. Every clue you need is on the page. The author swears it.</p>
    <p class="sub">We do <strong>not</strong> publish the official solutions. Read a case, reason it out, and submit your answer &mdash; it goes straight to the benchmark authors. Beat the best AI score on the card.</p>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap">
    <div class="puzzle-grid">
{cards}
    </div>
    <p class="note" style="color:var(--faint);margin-top:30px;text-align:center">Only the first eight cases are public. The remaining seventy-one stay sealed.</p>
  </div>
</section>
</main>
{FOOT.format(home="", email=EMAIL)}
</body>
</html>"""


def main():
    metas = []
    for pid in PUZZLES:
        meta = json.loads((SRC / f"{pid}.meta.json").read_text(encoding="utf-8"))
        bodies = {
            "en": (SRC / f"{pid}.html").read_text(encoding="utf-8"),
            "zh": (SRC / f"{pid}.zh.html").read_text(encoding="utf-8"),
            "ja": (SRC / f"{pid}.ja.html").read_text(encoding="utf-8"),
        }
        metas.append(meta)
        page = puzzle_page(meta, bodies)
        (ROOT / f"puzzle-{pid}.html").write_text(page, encoding="utf-8")
        print(f"wrote puzzle-{pid}.html  ({meta['en_title']})")
    (ROOT / "puzzles.html").write_text(puzzles_index(metas), encoding="utf-8")
    print("wrote puzzles.html")


if __name__ == "__main__":
    main()
