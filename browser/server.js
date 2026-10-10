import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express from "express";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const here = dirname(fileURLToPath(import.meta.url));
// The transport packages are browser-only, so point at their dist folders directly.
const epoxyPath = join(here, "node_modules/@mercuryworkshop/epoxy-transport/dist");
const port = Number(process.env.PORT) || 8080;

logging.set_level(process.env.WISP_DEBUG ? logging.DEBUG : logging.WARN);
// Keep the proxy from being used to reach the host's own network. Only flip
// these for local testing against services on this machine.
wisp.options.allow_private_ips = process.env.ALLOW_PRIVATE === "1";
wisp.options.allow_loopback_ips = process.env.ALLOW_PRIVATE === "1";

const app = express();
app.disable("x-powered-by");

// Our own uv.config.js lives in public/uv and must win over the stock one.
app.use("/uv/", express.static(join(here, "public/uv")));
app.use("/uv/", express.static(uvPath));
app.use("/baremux/", express.static(baremuxPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use(express.static(join(here, "public")));

app.use((req, res) => res.status(404).sendFile(join(here, "public/index.html")));

const server = createServer(app);

server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/wisp/")) wisp.routeRequest(req, socket, head);
  else socket.end();
});

server.listen(port, () => console.log(`Sidebar browser on http://localhost:${port}`));
