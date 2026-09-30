const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        service: "Youtube_InnerTube Worker",
        status: "ready",
      });
    }

    if (request.method === "POST" && url.pathname === "/live-chat") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "invalid_json" }, 400);
      }

      const { apiKey, clientContext, continuation } = body ?? {};

      if (!apiKey || !clientContext || !continuation) {
        return json(
          {
            ok: false,
            error: "missing_fields",
            required: ["apiKey", "clientContext", "continuation"],
          },
          400,
        );
      }

      const endpoint =
        "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat" +
        "?key=" +
        encodeURIComponent(apiKey) +
        "&prettyPrint=false";

      try {
        const upstream = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            context: clientContext,
            continuation,
          }),
        });

        const responseBody = await upstream.text();

        return new Response(responseBody, {
          status: upstream.status,
          headers: {
            ...corsHeaders,
            "Content-Type":
              upstream.headers.get("Content-Type") ||
              "application/json; charset=utf-8",
          },
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error: "upstream_request_failed",
            message: error instanceof Error ? error.message : String(error),
          },
          502,
        );
      }
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};
