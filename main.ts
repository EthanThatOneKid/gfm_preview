import type { Route } from "@std/http/unstable-route";
import { route } from "@std/http/unstable-route";
import { serveFile } from "@std/http/file-server";
import { CSS, render } from "@deno/gfm";

export default {
  fetch(request) {
    return router(request);
  },
} satisfies Deno.ServeDefaultExport;

export const routes: Route[] = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/favicon.ico" }),
    handler(_request) {
      return new Response(null, { status: 204 });
    },
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/" }),
    handler(request) {
      return serveFile(request, "./static/index.html");
    },
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/*" }),
    async handler(request) {
      const url = new URL(request.url);
      const gfmURL = url.pathname.slice(1);
      const rawGfmURL = toRaw(gfmURL);
      const gfmResponse = await fetch(rawGfmURL);
      const gfm = await gfmResponse.text();
      const bodyHTML = render(
        gfm,
        {
          baseUrl: gfmURL,
          mediaBaseUrl: rawGfmURL,
        },
      );
      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      main {
        max-width: 800px;
        margin: 0 auto;
      }
      ${CSS}
    </style>
  </head>
  <body>
    <main data-color-mode="light" data-light-theme="light" data-dark-theme="dark" class="markdown-body">
      ${bodyHTML}
    </main>
  </body>
</html>`;
      return new Response(
        html,
        {
          headers: { "Content-Type": "text/html" },
        },
      );
    },
  },
];

export function defaultHandler(_request: Request) {
  return new Response("Not found", { status: 404 });
}

export const router = route(routes, defaultHandler);

/** toRaw converts a GitHub blob URL to a "raw" URL. */
export function toRaw(url: string) {
  return url.replace(
    /^https\:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\/blob\//,
    "https://raw.githubusercontent.com/$1/$2/",
  );
}
