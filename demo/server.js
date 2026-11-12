import http from "node:http";
import { readFile } from "node:fs/promises";
const page = await readFile(new URL("index.html", import.meta.url));
const server = http.createServer((request, response) => {
  if (!["/", "/pricing"].includes(new URL(request.url, "http://localhost").pathname)) {
    response.writeHead(404); response.end("Not found"); return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); response.end(page);
});
server.listen(Number(process.env.PORT || 4173), "127.0.0.1", () => console.log(`Annot demo: http://127.0.0.1:${server.address().port}`));
