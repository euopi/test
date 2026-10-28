# Sunline Festival

Open-world driving game with online multiplayer. `server.js` serves the game from `public/` and relays car positions between players. It uses only Node's built-in modules.

## Play online (Render)

1. Sign in at [render.com](https://render.com) with GitHub and give Render access to this repository.
2. Choose **New > Blueprint**, pick this repository and the branch `claude/lucid-turing-k801kx`. Render reads `render.yaml` and creates the `sunline-festival` web service.
3. When the deploy finishes, open the `https://sunline-festival-....onrender.com` link Render shows.

Rooms keep groups apart: add `?room=` and any name to the link, for example `https://sunline-festival-xxxx.onrender.com/?room=friday`. Everyone with the same room name drives together. Without it, players share the room `main`.

Free Render services sleep after about 15 minutes with nobody connected, so the first visit after a break takes up to a minute to load.

## Run on a home network

Install Node.js 18 or newer, then run `node server.js` in this folder (or double-click `start-windows.bat`). Other devices on the same network open the `http://192.168.x.x:8080` link it prints.

## Controls

W/S throttle and brake, A/D steer, Space handbrake, M map, E start or invite to a race, J join a race invite, C camera, R reset, Esc garage.
