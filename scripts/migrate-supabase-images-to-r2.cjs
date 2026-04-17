require('dotenv').config({ path: '.env.migration' })

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const { Client } = require('pg')

const {
  SUPABASE_URL,
  SUPABASE_DB_URL,
  SUPABASE_BUCKET = 'mod-assets',
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  CF_IMAGE_BASE_URL,
  MIGRATION_BATCH_SIZE = '100',
  FORCE_OVERWRITE = 'false'
} = process.env

if (
  !SUPABASE_URL ||
  !SUPABASE_DB_URL ||
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET ||
  !CF_IMAGE_BASE_URL
) {
  throw new Error('Missing required environment variables in .env.migration')
}

const FORCE = String(FORCE_OVERWRITE).toLowerCase() === 'true'
const BATCH_SIZE = Math.max(1, Number(MIGRATION_BATCH_SIZE) || 100)

const pg = new Client({
  connectionString: SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
})

function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`
}

function supabasePublicUrl(path) {
  return joinUrl(
    `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}`,
    path
  )
}

function workerUrl(path) {
  return joinUrl(CF_IMAGE_BASE_URL, path)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchBuffer(url) {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText} for ${url}`)
  }

  const arrayBuffer = await res.arrayBuffer()

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get('content-type') || 'application/octet-stream',
    cacheControl: res.headers.get('cache-control') || 'public, max-age=31536000, immutable'
  }
}

async function objectExists(key) {
  try {
    await r2.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key
      })
    )
    return true
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode
    if (status === 404 || err?.name === 'NotFound' || err?.name === 'NoSuchKey') {
      return false
    }
    throw err
  }
}

async function uploadToR2(key, sourceUrl) {
  if (!FORCE) {
    const exists = await objectExists(key)
    if (exists) {
      return workerUrl(key)
    }
  }

  const { buffer, contentType, cacheControl } = await fetchBuffer(sourceUrl)

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl || 'public, max-age=31536000, immutable'
    })
  )

  return workerUrl(key)
}

async function migrateImageRow({
  table,
  id,
  originalPath,
  mediumPath,
  thumbPath,
  externalOriginalUrl,
  externalMediumUrl,
  externalThumbUrl
}) {
  const updates = {}
  let changed = false

  if (originalPath && (FORCE || !externalOriginalUrl)) {
    updates.external_original_url = await uploadToR2(originalPath, supabasePublicUrl(originalPath))
    changed = true
  }

  if (mediumPath && (FORCE || !externalMediumUrl)) {
    updates.external_medium_url = await uploadToR2(mediumPath, supabasePublicUrl(mediumPath))
    changed = true
  }

  if (thumbPath && (FORCE || !externalThumbUrl)) {
    updates.external_thumb_url = await uploadToR2(thumbPath, supabasePublicUrl(thumbPath))
    changed = true
  }

  if (!changed) {
    return { migrated: false, updates: null }
  }

  const setClauses = []
  const values = []
  let idx = 1

  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = $${idx++}`)
    values.push(value)
  }

  values.push(id)

  const sql = `
    UPDATE public.${table}
    SET ${setClauses.join(', ')}
    WHERE id = $${idx}
  `

  await pg.query(sql, values)

  return { migrated: true, updates }
}

async function migrateHeadshotRow(row) {
  const updates = {}
  let changed = false

  if (row.headshot_path && (FORCE || !row.headshot_external_original_url)) {
    updates.headshot_external_original_url = await uploadToR2(
      row.headshot_path,
      supabasePublicUrl(row.headshot_path)
    )
    changed = true
  }

  if (row.headshot_medium_path && (FORCE || !row.headshot_external_medium_url)) {
    updates.headshot_external_medium_url = await uploadToR2(
      row.headshot_medium_path,
      supabasePublicUrl(row.headshot_medium_path)
    )
    changed = true
  }

  if (row.headshot_thumb_path && (FORCE || !row.headshot_external_thumb_url)) {
    updates.headshot_external_thumb_url = await uploadToR2(
      row.headshot_thumb_path,
      supabasePublicUrl(row.headshot_thumb_path)
    )
    changed = true
  }

  if (!changed) {
    return { migrated: false, updates: null }
  }

  const setClauses = []
  const values = []
  let idx = 1

  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = $${idx++}`)
    values.push(value)
  }

  values.push(row.id)

  const sql = `
    UPDATE public.wrestlers
    SET ${setClauses.join(', ')}
    WHERE id = $${idx}
  `

  await pg.query(sql, values)

  return { migrated: true, updates }
}

async function migrateCollectionCover(row) {
  if (!row.cover_path) {
    return { migrated: false, updates: null }
  }

  if (!FORCE && row.cover_external_url) {
    return { migrated: false, updates: null }
  }

  const externalUrl = await uploadToR2(row.cover_path, supabasePublicUrl(row.cover_path))

  await pg.query(
    `
      UPDATE public.collections
      SET cover_external_url = $1
      WHERE id = $2
    `,
    [externalUrl, row.id]
  )

  return {
    migrated: true,
    updates: { cover_external_url: externalUrl }
  }
}

async function processTable({ label, selectSql, rowHandler }) {
  let offset = 0
  let totalSeen = 0
  let totalMigrated = 0
  let totalFailed = 0

  for (;;) {
    const sql = `${selectSql} ORDER BY created_at ASC NULLS LAST, id ASC LIMIT $1 OFFSET $2`
    const { rows } = await pg.query(sql, [BATCH_SIZE, offset])

    if (!rows.length) break

    for (const row of rows) {
      totalSeen += 1

      try {
        const result = await rowHandler(row)

        if (result.migrated) {
          totalMigrated += 1
          console.log(`[${label}] migrated ${row.id}`)
        } else {
          console.log(`[${label}] skipped ${row.id}`)
        }
      } catch (err) {
        totalFailed += 1
        console.error(`[${label}] failed ${row.id}: ${err.message}`)
      }

      await sleep(50)
    }

    offset += rows.length
  }

  console.log(`[${label}] done. Seen: ${totalSeen}, Migrated: ${totalMigrated}, Failed: ${totalFailed}\n`)
}

async function main() {
  await pg.connect()

  console.log('Starting migration...\n')

  await processTable({
    label: 'attire_images',
    selectSql: `
      SELECT
        id,
        image_path AS "originalPath",
        image_medium_path AS "mediumPath",
        image_thumb_path AS "thumbPath",
        external_original_url AS "externalOriginalUrl",
        external_medium_url AS "externalMediumUrl",
        external_thumb_url AS "externalThumbUrl",
        created_at
      FROM public.attire_images
    `,
    rowHandler: (row) =>
      migrateImageRow({
        table: 'attire_images',
        ...row
      })
  })

  await processTable({
    label: 'arena_images',
    selectSql: `
      SELECT
        id,
        image_path AS "originalPath",
        image_medium_path AS "mediumPath",
        image_thumb_path AS "thumbPath",
        external_original_url AS "externalOriginalUrl",
        external_medium_url AS "externalMediumUrl",
        external_thumb_url AS "externalThumbUrl",
        created_at
      FROM public.arena_images
    `,
    rowHandler: (row) =>
      migrateImageRow({
        table: 'arena_images',
        ...row
      })
  })

  await processTable({
    label: 'title_belt_images',
    selectSql: `
      SELECT
        id,
        image_path AS "originalPath",
        image_medium_path AS "mediumPath",
        image_thumb_path AS "thumbPath",
        external_original_url AS "externalOriginalUrl",
        external_medium_url AS "externalMediumUrl",
        external_thumb_url AS "externalThumbUrl",
        created_at
      FROM public.title_belt_images
    `,
    rowHandler: (row) =>
      migrateImageRow({
        table: 'title_belt_images',
        ...row
      })
  })

  await processTable({
    label: 'other_mod_images',
    selectSql: `
      SELECT
        id,
        image_path AS "originalPath",
        image_medium_path AS "mediumPath",
        image_thumb_path AS "thumbPath",
        external_original_url AS "externalOriginalUrl",
        external_medium_url AS "externalMediumUrl",
        external_thumb_url AS "externalThumbUrl",
        created_at
      FROM public.other_mod_images
    `,
    rowHandler: (row) =>
      migrateImageRow({
        table: 'other_mod_images',
        ...row
      })
  })

  await processTable({
    label: 'titantron_images',
    selectSql: `
      SELECT
        id,
        image_path AS "originalPath",
        image_medium_path AS "mediumPath",
        image_thumb_path AS "thumbPath",
        external_original_url AS "externalOriginalUrl",
        external_medium_url AS "externalMediumUrl",
        external_thumb_url AS "externalThumbUrl",
        created_at
      FROM public.titantron_images
    `,
    rowHandler: (row) =>
      migrateImageRow({
        table: 'titantron_images',
        ...row
      })
  })

  await processTable({
    label: 'wrestlers_headshots',
    selectSql: `
      SELECT
        id,
        headshot_path,
        headshot_medium_path,
        headshot_thumb_path,
        headshot_external_original_url,
        headshot_external_medium_url,
        headshot_external_thumb_url,
        created_at
      FROM public.wrestlers
    `,
    rowHandler: migrateHeadshotRow
  })

  await processTable({
    label: 'collections_covers',
    selectSql: `
      SELECT
        id,
        cover_path,
        cover_external_url,
        created_at
      FROM public.collections
    `,
    rowHandler: migrateCollectionCover
  })

  console.log('Migration complete.')
}

main()
  .catch(async (err) => {
    console.error('\nMigration failed:\n', err)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      await pg.end()
    } catch (_) {}
  })