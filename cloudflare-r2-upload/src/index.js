function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
}

async function verifySupabaseUser(request, env) {
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    throw new Error('Missing bearer token')
  }

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Invalid Supabase session')
  }

  const user = await response.json()
  if (!user?.id) {
    throw new Error('Could not verify user')
  }

  return user
}

function sanitizeSegment(value = '') {
  return String(value).replace(/[^a-zA-Z0-9/_-]/g, '_')
}

function guessContentType(name = '') {
  const lower = String(name).toLowerCase()
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}

async function handleUpload(request, env) {
  const user = await verifySupabaseUser(request, env)

  const formData = await request.formData()

  const original = formData.get('original')
  const medium = formData.get('medium')
  const thumb = formData.get('thumb')

  const folder = sanitizeSegment(formData.get('folder') || 'attires')
  const entityId = sanitizeSegment(formData.get('entityId') || '')
  const kind = sanitizeSegment(formData.get('kind') || 'image')

  if (!entityId) {
    return new Response(JSON.stringify({ error: 'Missing entityId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(env.CORS_ORIGIN) }
    })
  }

  if (!(original instanceof File)) {
    return new Response(JSON.stringify({ error: 'Missing original file' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(env.CORS_ORIGIN) }
    })
  }

  const basePath = `${user.id}/${folder}/${entityId}`

  async function putIfPresent(file, suffix) {
    if (!(file instanceof File)) return { path: '', url: '' }

    const safeName = sanitizeSegment(file.name)
    const objectPath = `${basePath}/${kind}-${Date.now()}-${suffix}-${safeName}`

    await env.MOD_ASSETS.put(objectPath, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type || guessContentType(file.name),
        cacheControl: 'public, max-age=31536000, immutable'
      }
    })

    return {
      path: objectPath,
      url: `${env.R2_PUBLIC_BASE_URL}/${objectPath}`
    }
  }

  const [originalResult, mediumResult, thumbResult] = await Promise.all([
    putIfPresent(original, 'original'),
    putIfPresent(medium, 'medium'),
    putIfPresent(thumb, 'thumb')
  ])

  return new Response(
    JSON.stringify({
      ok: true,
      originalPath: originalResult.path,
      mediumPath: mediumResult.path,
      thumbPath: thumbResult.path,
      external_original_url: originalResult.url,
      external_medium_url: mediumResult.url,
      external_thumb_url: thumbResult.url
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(env.CORS_ORIGIN)
      }
    }
  )
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env.CORS_ORIGIN)
      })
    }

    const url = new URL(request.url)

    try {
      if (request.method === 'POST' && url.pathname === '/upload-image-variants') {
        return await handleUpload(request, env)
      }

      return new Response('Not found', { status: 404 })
    } catch (error) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: error.message || 'Worker error'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(env.CORS_ORIGIN)
          }
        }
      )
    }
  }
}