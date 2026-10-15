# Twelve Axes

A socialist ideology test: 12 axes, 89 tendencies of the socialist left, adaptive
drill-down modules, and an optional 40-question Marxist theory module. Static HTML/CSS/JS with
no build step and no server. Answers stay in the visitor's browser.

## Hosting it

`site/` is the whole website. Any static host works:

- **GitHub Pages**: the workflow in `.github/workflows/twelve-axes-pages.yml`
  deploys `twelve-axes/site`. Enable it once under the repository's
  Settings -> Pages -> Source: "GitHub Actions", then push or run the workflow.
- **Netlify / Cloudflare Pages / Vercel**: point the publish directory at
  `twelve-axes/site` (no build command), or drag the folder into Netlify Drop.
- **Locally**: `python3 -m http.server -d twelve-axes/site 8000`, then open
  http://localhost:8000.

## How it works

1. **Core (125 questions).** Eight per axis (fifteen for the two strategy axes,
   Transition and Arena), plus short blocks on capitalism, religion, legality and
   violence, social values, the national question, liberation politics,
   autogestion beyond the workplace, and technology/AI. About a third are
   scenario questions with three to five options, including in-between and
   hybrid positions; each option sits at a position on the scales it measures.
2. **Drill-down.** The two families closest to the core answers get their own
   module (8-16 questions each) of signature questions that separate tendencies
   with near-identical axis profiles. A third module runs when the second and
   third families are nearly tied. Results offer the rest as extras.
3. **Theory (optional, 40 questions).** Places the visitor among 18 schools of
   Marxist theory, with a block on Political Marxism (origins of capitalism,
   market dependence, the separation of the economic and the political).
   Doesn't affect the tendency result.

Scoring is a weighted squared-error match. Each tendency has a position on every
scale (`site/js/data-tendencies.js`). Its expected answer to an agree/disagree
question comes from the question's loadings; its fit to a multiple-choice option
is its distance from that option's position. Hand-set expectations (`x` in the
item files) override that wherever a tradition's doctrine is specific. Module
answers only reorder tendencies inside their own family. When no tendency fits
well (best match under 70%), the results page says so.

## Files

    site/js/data-meta.js        axes, scales, families, tags, theory schools
    site/js/data-tendencies.js  the 87 tendency profiles
    site/js/data-items.js       core questions
    site/js/data-modules.js     family drill-down modules
    site/js/data-theory.js      theory module
    site/js/engine.js           scoring (shared with the validator)
    site/js/app.js              interface
    tools/validate.js           synthetic-respondent and persona validation
    tools/personas.js           hand-written answer sheets for 15 real positions
    tools/build-artifact.js     single-file bundle -> dist/

## Validation

`node tools/validate.js [noise] [runs] [drift]` simulates respondents from every
tendency's expected answers, with answer noise and per-person drift from the
archetype, and runs them through the same adaptive flow as the site.

| noise | drift | top-1 | top-3 | right family drilled | theory top-1 |
|-------|-------|-------|-------|----------------------|--------------|
| 0.35  | 0.2   | 99.0% | 99.9% | 100%                 | 99.3%        |
| 0.5   | 0.3   | 89.3% | 96.5% | 98.4%                | 92.7%        |

The simulation only shows that every tendency is reachable and separable. It
can't check whether the profiles are right, because the simulated people answer
from those profiles. `tools/personas.js` covers that gap partly: core answer
sheets written by hand from 15 real positions (Lenin, Berlinguer, Poulantzas,
Bernstein, Bordiga, Bookchin, Kropotkin, Lefebvre, Pannekoek, Palme,
Wagenknecht, Deng, Cliff, Saito, and a left-Eurocommunist test taker). All 15
land on the expected tendency. Real respondents who know their own tradition
remain the real test.
