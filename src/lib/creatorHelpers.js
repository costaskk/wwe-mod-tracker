import { supabase } from './supabase'

export async function createCreator({
  name,
  setCreators,
  setNewCreatorName,
  openNotice
}) {
  const cleanName = String(name || '').trim()
  if (!cleanName) return null

  const { data, error } = await supabase
    .from('creators')
    .insert({ name: cleanName })
    .select('*')
    .single()

  if (error) throw error

  setCreators((current) => {
    const exists = current.some((item) => item.id === data.id || item.name === data.name)
    if (exists) return current
    return [...current, data].sort((a, b) => a.name.localeCompare(b.name))
  })

  setNewCreatorName('')

  openNotice(
    'success',
    'Creator added',
    `${data.name} is now available in the creator dropdown.`
  )

  return data
}