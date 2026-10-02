# Atlas Drill

A browser geography quiz: pick a region and locate every country in it.

Open `index.html` in a browser (double-clicking it works; no server or build step needed).

`atlas-drill.html` is the same game as a single self-contained file, so it can be downloaded
and opened on its own. Regenerate it with `python3 build-single.py` after changing any source file.

## Modes

- **Click the map**: you're given a country name and click it on the map.
- **Type the name**: a country is highlighted and you type its name. Common alternatives
  (UK, USA, DRC, Ivory Coast, Burma, Czech Republic, Swaziland...) and small typos are accepted.
  A name the game doesn't recognise doesn't cost a try.

You get three tries per country before the answer is revealed. Countries are coloured by how
many tries they took (green 1st, yellow 2nd, orange 3rd, red missed). Accuracy gives full credit
on the 1st try, two-thirds on the 2nd and one-third on the 3rd. A timer runs for each round, and
the best accuracy/time for each region and mode is saved in your browser.

## Regions

Continents (Africa, Asia, Europe, North America, South America, Oceania), their sub-regions
(e.g. West Africa, the Balkans, the Caribbean, Southeast Asia) and notable groups
(European Union, Arab League, Former Soviet Union, Mediterranean coast). 197 countries in total:
the 193 UN members plus Kosovo, Palestine, Taiwan and Vatican City.

## Map data

Borders come from Natural Earth 1:10m Admin 0 countries (public domain), simplified for size and
stored in `data/world-topo.js`. Somaliland and Northern Cyprus are drawn as part of Somalia and
Cyprus; French and Dutch overseas territories (French Guiana, Réunion, Bonaire...) are split off
from the mainland so clicking them doesn't count as France or the Netherlands. Each region uses
a Lambert azimuthal equal-area projection centred on that region, which keeps shapes and
relative sizes accurate. Microstates and small islands get a clickable round marker; the map
zooms (scroll, pinch or the +/− buttons) and pans by dragging.
