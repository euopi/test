# Twelve Axes

A socialist ideology test: 12 axes, 87 tendencies of the socialist left, adaptive
drill-down modules, and an optional Marxist theory module. Static HTML/CSS/JS with
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

1. **Core (114 questions).** Seven per axis, balanced so half agree toward each
   pole, plus short blocks on capitalism, religion, violence, social values, the
   national question, liberation politics, and technology/AI.
2. **Drill-down.** The two families closest to the core answers get their own
   module (8-16 questions each) of signature questions that separate tendencies
   with near-identical axis profiles. Results offer the rest as extras.
3. **Theory (optional, 23 questions).** Places the visitor among 13 schools of
   Marxist theory. Doesn't affect the tendency result.

Scoring is a weighted squared-error match. Each tendency has a position on every
scale (`site/js/data-tendencies.js`), and its expected answer to a question comes
from the question's loadings. Hand-set expectations (`x` in the item files)
override that wherever a tradition's doctrine is specific. Module answers only
reorder tendencies inside their own family.

## Files

    site/js/data-meta.js        axes, scales, families, tags, theory schools
    site/js/data-tendencies.js  the 87 tendency profiles
    site/js/data-items.js       core questions
    site/js/data-modules.js     family drill-down modules
    site/js/data-theory.js      theory module
    site/js/engine.js           scoring (shared with the validator)
    site/js/app.js              interface
    tools/validate.js           synthetic-respondent validation
    tools/build-artifact.js     single-file bundle -> dist/

## Validation

`node tools/validate.js [noise] [runs] [drift]` simulates respondents from every
tendency's expected answers, with answer noise and per-person drift from the
archetype, and runs them through the same adaptive flow as the site.

| noise | drift | top-1 | top-3 | right family drilled | theory top-1 |
|-------|-------|-------|-------|----------------------|--------------|
| 0.35  | 0.2   | 99.1% | 99.9% | 99.9%                | 97.0%        |
| 0.5   | 0.3   | 89.7% | 96.5% | 97.1%                | 88.6%        |

This checks that every tendency is reachable and separable from its neighbours.
It can't check whether the profiles themselves are right. That needs real
respondents who know their own tradition.
