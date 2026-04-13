import { serve } from "https://deno.land/std/http/server.ts"

const SUPABASE_URL = Deno.env.get("PROJECT_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!

async function checkUrl(url: string) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function fetchRows(table: string) {
  const selectColumns =
    table === "attires"
      ? "id,wrestler_id,download_url,last_checked_at"
      : "id,download_url,last_checked_at"

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=${selectColumns}`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch ${table}: ${text}`)
  }

  return await response.json()
}

async function updateRow(table: string, id: string, payload: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to update ${table}.${id}: ${text}`)
  }
}

async function fetchOpenDeadLinkRequest(table: string, filter: string) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=id&status=eq.open&request_type=eq.dead_link&${filter}&limit=1`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch ${table} dead-link request: ${text}`)
  }

  const rows = await response.json()
  return rows?.[0] || null
}

async function createDeadLinkRequestForRow(table: string, row: Record<string, any>) {
  let requestTable = ""
  let payload: Record<string, unknown> = {}

  if (table === "attires") {
    requestTable = "mod_requests"
    payload = {
      wrestler_id: row.wrestler_id,
      attire_id: row.id,
      request_type: "dead_link",
      status: "open",
      notes: "Automatically flagged by daily link check.",
    }
  } else if (table === "arenas") {
    requestTable = "arena_requests"
    payload = {
      arena_id: row.id,
      request_type: "dead_link",
      status: "open",
      notes: "Automatically flagged by daily link check.",
    }
  } else if (table === "title_belts") {
    requestTable = "title_belt_requests"
    payload = {
      title_belt_id: row.id,
      request_type: "dead_link",
      status: "open",
      notes: "Automatically flagged by daily link check.",
    }
  } else if (table === "other_mods") {
    requestTable = "other_mod_requests"
    payload = {
      other_mod_id: row.id,
      request_type: "dead_link",
      status: "open",
      notes: "Automatically flagged by daily link check.",
    }
  } else {
    return
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${requestTable}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to insert ${requestTable}: ${text}`)
  }
}

async function ensureDeadLinkRequestExists(table: string, row: { id: string }) {
  let filter = ""

  if (table === "attires") {
    filter = `attire_id=eq.${row.id}`
  } else if (table === "arenas") {
    filter = `arena_id=eq.${row.id}`
  } else if (table === "title_belts") {
    filter = `title_belt_id=eq.${row.id}`
  } else if (table === "other_mods") {
    filter = `other_mod_id=eq.${row.id}`
  } else {
    return
  }

  const existing = await fetchOpenDeadLinkRequest(
    table === "attires"
      ? "mod_requests"
      : table === "arenas"
      ? "arena_requests"
      : table === "title_belts"
      ? "title_belt_requests"
      : "other_mod_requests",
    filter
  )

  if (!existing) {
    await createDeadLinkRequestForRow(table, row)
  }
}

async function processTable(table: string) {
  const rows = await fetchRows(table)
  const now = new Date()

  for (const row of rows) {
    const urlText = String(row.download_url || "").trim()

    if (!urlText) {
      await updateRow(table, row.id, {
        link_status: "missing",
        last_checked_at: now.toISOString(),
      })
      continue
    }

    if (row.last_checked_at) {
      const lastChecked = new Date(row.last_checked_at)
      const diffMs = now.getTime() - lastChecked.getTime()

      if (diffMs < 24 * 60 * 60 * 1000) {
        continue
      }
    }

    const links = urlText
      .split("\n")
      .map((x: string) => x.trim())
      .filter(Boolean)

    let anyWorking = false

    for (const link of links) {
      const result = await checkUrl(link)
      if (result.ok) {
        anyWorking = true
        break
      }
    }

    const nextStatus = anyWorking ? "working" : "dead"

    await updateRow(table, row.id, {
      link_status: nextStatus,
      last_checked_at: now.toISOString(),
    })

    if (nextStatus === "dead") {
      await ensureDeadLinkRequestExists(table, row)
    }
  }
}

serve(async () => {
  try {
    await processTable("attires")
    await processTable("arenas")
    await processTable("title_belts")
    await processTable("other_mods")

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})