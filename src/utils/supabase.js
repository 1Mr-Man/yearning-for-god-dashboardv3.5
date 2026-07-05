import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewxhnzumaztxdqigjgxo.supabase.co'
const supabaseKey = 'sb_publishable_PO3FlNmNFkxx2AN5EcZUBg_UF4n7hVa'

export const supabase = createClient(supabaseUrl, supabaseKey)