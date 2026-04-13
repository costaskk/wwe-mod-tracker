import { serve } from "https://deno.land/std/http/server.ts"

function normalizeUrl(url: string) {
  const value = String(url || "").trim()
  if (!value) return ""

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `https://${value}`
}

async function checkSingleUrl(url: string) {
  const normalized = normalizeUrl(url)

  if (!normalized) {
    return {
      url,
      normalizedUrl: normalized,
      ok: false,
      status: "empty",
      message: "No URL provided."
    }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(normalized, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal
    })

    clearTimeout(timeout)

    return {
      url,
      normalizedUrl: normalized,
      ok: response.ok,
      status: response.ok ? "working" : "dead",
      httpStatus: response.status,
      finalUrl: response.url,
      message: response.ok ? "Link looks valid." : `HTTP ${response.status}`
    }
  } catch (error) {
    return {
      url,
      normalizedUrl: normalized,
      ok: false,
      status: "error",
      httpStatus: 0,
      finalUrl: normalized,
      message: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

serve(async (req: Request) => {
  try {
    const body: { urls?: string[] } = await req.json().catch(() => ({}))
    const urls: string[] = Array.isArray(body?.urls) ? body.urls : []

    const results = await Promise.all(
      urls.map((url: string) => checkSingleUrl(String(url)))
    )

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    )
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})