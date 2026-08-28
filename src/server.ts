import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

const SUPABASE_URL = "https://efydortqxworusxwubsb.supabase.co";
const SUPABASE_KEY = "sb_publishable_Qm3rw9onqv9ugF40g6qUGA_sUhSvkH1";
const RESERVED = new Set(["app", "p", "auth", "login", "register", "api", "assets", "terms", "about", "_server", "favicon.ico"]);

async function getPureHtmlPage(pathname: string): Promise<string | null> {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean || clean.includes("/") || clean.includes(".")) return null;
  if (RESERVED.has(clean.toLowerCase())) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pages?slug=eq.${encodeURIComponent(clean)}&status=eq.active&select=blocks,cover_image,description&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as any[];
    if (!rows || rows.length === 0) return null;
    const p = rows[0];
    const blocks = p.blocks as any[];
    if (blocks && blocks.length === 1 && blocks[0]?.type === "html" && !p.cover_image && !p.description) {
      const html = blocks[0]?.data?.html;
      if (html && (html.includes("<html") || html.includes("<!DOCTYPE") || html.includes("<head") || html.includes("<body"))) {
        return html;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Servir Mini Apps y Páginas HTML completas directamente en modo nativo 100% puro
    if (request.method === "GET") {
      const pureHtml = await getPureHtmlPage(url.pathname);
      if (pureHtml) {
        return new Response(pureHtml, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=0, must-revalidate",
          },
        });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
