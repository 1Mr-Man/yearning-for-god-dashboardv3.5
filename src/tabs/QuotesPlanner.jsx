import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../utils/supabase'

const STORAGE_KEY = 'yfg_quote_library_v1'
const DB_TABLE = 'quote_library_main'
const DB_SYNC_KEY = 'yfg_quote_library_last_cloud_sync_v2'
const MEDIA_STORAGE_KEY = 'yfg_media_library_assets_v1'

const cardBase = {
  background: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid rgba(56, 189, 248, 0.35)',
  borderRadius: 24,
  padding: 20,
  marginBottom: 18,
  boxShadow: '0 18px 45px rgba(2, 8, 23, 0.25)',
}

const buttonBase = {
  border: 0,
  borderRadius: 14,
  padding: '12px 16px',
  fontWeight: 800,
  cursor: 'pointer',
  marginRight: 10,
  marginBottom: 10,
}

const defaultQuotes = [
  {
    id: 'seed-1',
    quote: 'Faith is not a feeling; faith is acting on the Word of God.',
    author: 'Christian Quote Library',
    source: 'Starter quote - verify source before publishing',
    category: 'Faith',
    verification_status: 'needs source review',
    notes: 'Replace with exact minister/book source when available.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    quote: 'A life of prayer is a life of dependence on God.',
    author: 'Christian Quote Library',
    source: 'Starter quote - verify source before publishing',
    category: 'Prayer',
    verification_status: 'needs source review',
    notes: 'Use as a safe paraphrase unless exact source is confirmed.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    quote: 'True worship is not only a song; it is a surrendered life.',
    author: 'Christian Quote Library',
    source: 'Starter quote - verify source before publishing',
    category: 'Worship',
    verification_status: 'needs source review',
    notes: 'Use as a Yearning for God reflection or verify exact attribution.',
    created_at: new Date().toISOString(),
  },
]

function safeText(value) {
  return String(value || '').trim()
}

function normalizeQuote(item = {}) {
  const id = safeText(item.id) || `quote-${Date.now()}-${Math.random().toString(16).slice(2)}`
  return {
    id,
    quote: safeText(item.quote || item.quote_text || item.content_text),
    author: safeText(item.author || item.minister_name) || 'Christian Quote Library',
    source: safeText(item.source || item.source_note) || 'Needs source note',
    category: safeText(item.category) || 'Christian Living',
    verification_status: safeText(item.verification_status) || 'needs source review',
    notes: safeText(item.notes),
    source_type: safeText(item.source_type),
    book_title: safeText(item.book_title),
    chapter: safeText(item.chapter),
    page_location: safeText(item.page_location || item.page),
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
  }
}

function fromDatabaseQuote(row = {}) {
  return normalizeQuote({
    id: row.id,
    quote: row.quote_text,
    author: row.author,
    source: row.source_note,
    category: row.category,
    verification_status: row.verification_status,
    notes: row.notes,
    source_type: row.source_type,
    book_title: row.book_title,
    chapter: row.chapter,
    page_location: row.page_location,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })
}

function toDatabaseQuote(item = {}) {
  const quote = normalizeQuote(item)
  return {
    id: quote.id,
    quote_text: quote.quote,
    author: quote.author,
    source_note: quote.source,
    category: quote.category,
    verification_status: quote.verification_status,
    notes: quote.notes,
    source_type: quote.source_type || 'Manual / book extractor',
    book_title: quote.book_title || '',
    chapter: quote.chapter || '',
    page_location: quote.page_location || '',
    created_at: quote.created_at,
    updated_at: new Date().toISOString(),
  }
}

function dedupeQuotes(items = []) {
  const seen = new Set()
  const clean = []
  items.map(normalizeQuote).forEach((item) => {
    if (!item.quote) return
    const key = `${item.quote}|${item.author}|${item.source}`.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    clean.push(item)
  })
  return clean
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function formatDateTime(date) {
  try {
    return new Date(date).toLocaleString()
  } catch (error) {
    return 'Not scheduled'
  }
}

function shortPreview(text, max = 120) {
  const clean = safeText(text).replace(/\s+/g, ' ')
  if (!clean) return 'No preview yet.'
  if (clean.length <= max) return clean
  return `${clean.slice(0, max)}...`
}

function makeQuotePostText(item) {
  const quote = safeText(item?.quote)
  const author = safeText(item?.author) || 'Christian Quote Library'
  const source = safeText(item?.source)
  const category = safeText(item?.category) || 'Christian Living'
  const sourceLine = source ? `\n\nSource note: ${source}` : ''

  return `Daily Christian Quote\n\n"${quote}"\n\n- ${author}\n\nReflection:\nLet this truth shape your thoughts, your words, and your walk with God today.\n\nCategory: ${category}${sourceLine}\n\nBefore publishing: verify the exact quote and source if this is attributed to a minister, father of faith, patriarch, or book.\n\n#YearningForGod #ChristianQuotes #Faith #ChristianLiving`
}


function makeQuoteImageBrief(item) {
  const quote = safeText(item?.quote)
  const author = safeText(item?.author) || 'Christian Quote Library'
  const source = safeText(item?.source)
  const category = safeText(item?.category) || 'Christian Living'
  return `QUOTE IMAGE BRIEF

Format:
Square 1080x1080 for Facebook and Instagram.
Optional 1080x1920 version for stories/reels.

Main quote text:
"${quote}"

Author line:
- ${author}

Small source line:
${source || 'Source to verify before public posting'}

Design direction:
Create a beautiful, premium Christian quote graphic.
Use a clean dark or warm worship background, soft light, elegant typography, and Yearning for God branding.
Keep the quote readable on a phone.
Do not overcrowd the design.

Mood:
${category} / devotional / reflective / spiritually strong

Brand:
Yearning for God

Safety:
Verify the exact wording and source before final publishing.`
}

function makeQuoteCanvaPrompt(item) {
  const quote = safeText(item?.quote)
  const author = safeText(item?.author) || 'Christian Quote Library'
  const category = safeText(item?.category) || 'Christian Living'
  return `Create a beautiful Christian quote poster in Canva.

Canvas:
1080 x 1080 square post.
Also prepare a 1080 x 1920 story/reel version if possible.

Text on image:
"${quote}"

Author:
- ${author}

Visual style:
Premium Christian media design.
Dark navy, warm gold, soft light rays, subtle paper/grain texture, elegant serif heading, clean readable body text.
Add a small "Yearning for God" brand mark at the bottom.

Theme:
${category}

Rules:
Keep the quote readable on mobile.
Do not add too much text.
Do not use the minister's photo unless permission/asset is available.
Keep it clean, reverent, and shareable.`
}

function makeReadyQuoteCaption(item) {
  const quote = safeText(item?.quote)
  const author = safeText(item?.author) || 'Christian Quote Library'
  const source = safeText(item?.source)
  const category = safeText(item?.category) || 'Christian Living'
  const sourceLine = source ? `\n\nSource note: ${source}` : ''
  return `Daily Christian Quote

"${quote}"

- ${author}

A short word can become a daily reminder when it leads the heart back to God.

Let this truth call your heart back to focus, obedience, and intimacy with the Lord today.

What part of this quote speaks to you most?

Poster text:
"${quote}"
- ${author}

Category: ${category}${sourceLine}

#YearningForGod #ChristianQuotes #Faith #ChristianLiving #DailyQuote`
}

function makeQuoteCaptionPrompt(item) {
  const quote = safeText(item?.quote)
  const author = safeText(item?.author) || 'Christian Quote Library'
  const source = safeText(item?.source)
  const category = safeText(item?.category) || 'Christian Living'
  return `You are a Christian social media editor for Yearning for God.

Turn this quote into a publish-ready daily quote post.

Quote:
"${quote}"

Author / minister:
${author}

Source note:
${source || 'Needs source verification'}

Theme/category:
${category}

Return:
1. Short caption for Facebook and Instagram
2. Threads version
3. Poster text
4. Canva design direction
5. Hashtags

Rules:
- Keep it biblical, reverent, and clear.
- Do not invent a source.
- If the source is not verified, include "source to verify" in the internal note only, not the public caption.
- Add a short reflection after the quote.
- End with a gentle engagement question.`
}


function parseBulkLines(text, defaultAuthor, defaultSource, defaultCategory) {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.map((line, index) => {
    let quote = line
    let author = defaultAuthor || 'Christian Quote Library'
    let source = defaultSource || 'Bulk import'

    const separators = [' - ', ' - ', ' | ']
    for (const sep of separators) {
      if (line.includes(sep)) {
        const parts = line.split(sep).map((part) => part.trim()).filter(Boolean)
        if (parts.length >= 2) {
          quote = parts[0]
          author = parts[1] || author
          source = parts.slice(2).join(' - ') || source
          break
        }
      }
    }

    return {
      id: `bulk-${Date.now()}-${index}`,
      quote: quote.replace(/^"|"$/g, ''),
      author,
      source,
      category: defaultCategory || 'Christian Living',
      verification_status: 'needs source review',
      notes: 'Bulk imported. Review exact wording and source before publishing.',
      created_at: new Date().toISOString(),
    }
  })
}


function guessCategory(text) {
  const lower = String(text || '').toLowerCase()
  if (lower.includes('prayer') || lower.includes('intercession')) return 'Prayer'
  if (lower.includes('faith') || lower.includes('believe')) return 'Faith'
  if (lower.includes('worship') || lower.includes('praise')) return 'Worship'
  if (lower.includes('holy') || lower.includes('sanctification')) return 'Holiness'
  if (lower.includes('wisdom') || lower.includes('mind')) return 'Wisdom'
  if (lower.includes('spirit') || lower.includes('anointing')) return 'Holy Spirit'
  if (lower.includes('love') || lower.includes('mercy') || lower.includes('grace')) return 'Grace'
  return 'Christian Living'
}

function makeSourceNote(meta = {}) {
  const parts = []
  if (safeText(meta.bookTitle)) parts.push(safeText(meta.bookTitle))
  if (safeText(meta.chapter)) parts.push(`Chapter/section: ${safeText(meta.chapter)}`)
  if (safeText(meta.page)) parts.push(`Page/location: ${safeText(meta.page)}`)
  if (safeText(meta.sourceType)) parts.push(`Type: ${safeText(meta.sourceType)}`)
  return parts.join(' - ') || 'Book/chapter extraction'
}

function splitIntoCandidateSentences(text) {
  const clean = String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  if (!clean) return []

  const pieces = clean
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)

  const keywordList = [
    'god', 'jesus', 'christ', 'lord', 'holy spirit', 'spirit', 'faith', 'prayer', 'pray', 'worship', 'word', 'scripture',
    'kingdom', 'grace', 'mercy', 'love', 'obedience', 'holiness', 'wisdom', 'anointing', 'revival', 'surrender',
    'discipline', 'purpose', 'calling', 'vision', 'power', 'truth', 'light', 'heart', 'altar', 'presence'
  ]

  const seen = new Set()
  const scored = pieces.map((sentence) => {
    const plain = sentence.replace(/^[-*\d.\s]+/, '').replace(/^"|"$/g, '').trim()
    const lower = plain.toLowerCase()
    let score = 0
    keywordList.forEach((word) => {
      if (lower.includes(word)) score += 3
    })
    if (plain.length >= 55 && plain.length <= 180) score += 4
    if (plain.length > 180 && plain.length <= 260) score += 1
    if (plain.includes(';') || plain.includes(':')) score += 1
    if (lower.includes('therefore') || lower.includes('because') || lower.includes('must') || lower.includes('cannot')) score += 1
    if (lower.includes('chapter') || lower.includes('copyright') || lower.includes('contents')) score -= 6
    return { text: plain, score }
  }).filter((item) => {
    if (item.text.length < 45 || item.text.length > 260) return false
    const key = item.text.toLowerCase().slice(0, 90)
    if (seen.has(key)) return false
    seen.add(key)
    return item.score > 0
  })

  return scored.sort((a, b) => b.score - a.score).map((item) => item.text)
}

function makeBookExtractionPrompt(bookText, meta) {
  const source = makeSourceNote(meta)
  const author = safeText(meta.author) || 'Unknown author'
  const title = safeText(meta.bookTitle) || 'Unknown book/source'
  const category = safeText(meta.category) || 'Christian Living'
  const excerpt = safeText(bookText)

  return `You are helping build the Yearning for God Quote Library.\n\nSource title: ${title}\nAuthor/minister: ${author}\nSource note: ${source}\nDefault category: ${category}\n\nI will paste a book chapter, sermon notes, or Christian writing excerpt.\n\nExtract strong quote candidates for daily Christian quote posts.\n\nRules:\n- Do not fabricate quotes.\n- Separate exact quotes from paraphrases.\n- Keep each quote short enough for social media.\n- Do not output long copyrighted passages.\n- Preserve exact wording where possible.\n- Mark anything uncertain as Needs Source Review.\n- Include page, chapter, or location if I provided it.\n\nReturn in this exact line format so I can paste it back into the app:\nQuote text - ${author} - ${source} - ${category}\n\nPasted excerpt:\n${excerpt}`
}
export default function QuotesPlanner({ queue = [], performanceStats = [], setActiveTab, refreshAllQueueViews, styles = {} }) {
  const [quotes, setQuotes] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [persistenceStatus, setPersistenceStatus] = useState('Loading quote library...')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    quote: '',
    author: '',
    source: '',
    category: 'Christian Living',
    notes: '',
  })
  const [bulkText, setBulkText] = useState('')
  const [bulkDefaults, setBulkDefaults] = useState({
    author: '',
    source: '',
    category: 'Christian Living',
  })
  const [bookText, setBookText] = useState('')
  const [bookMeta, setBookMeta] = useState({
    bookTitle: '',
    author: '',
    chapter: '',
    page: '',
    category: 'Christian Living',
    sourceType: 'Book / soft copy',
  })
  const [bookCandidates, setBookCandidates] = useState([])
  const [aiExtractedText, setAiExtractedText] = useState('')

  useEffect(() => {
    loadQuoteLibrary()
  }, [])

  const getLocalQuotes = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      return Array.isArray(saved) ? dedupeQuotes(saved) : []
    } catch (error) {
      return []
    }
  }

  const loadQuoteLibrary = async () => {
    const localQuotes = getLocalQuotes()
    try {
      const { data, error } = await supabase
        .from(DB_TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000)

      if (!error && Array.isArray(data)) {
        const cloudQuotes = dedupeQuotes(data.map(fromDatabaseQuote))
        const combined = dedupeQuotes([...cloudQuotes, ...localQuotes])
        const finalQuotes = combined.length ? combined : defaultQuotes
        setQuotes(finalQuotes)
        setSelectedId(finalQuotes[0]?.id || '')
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalQuotes))
        setPersistenceStatus(`Cloud library loaded: ${finalQuotes.length} quote(s).`)
        if (localQuotes.length && combined.length > cloudQuotes.length) {
          syncQuoteLibraryToCloud(combined, { silent: true })
        }
        return
      }

      const finalQuotes = localQuotes.length ? localQuotes : defaultQuotes
      setQuotes(finalQuotes)
      setSelectedId(finalQuotes[0]?.id || '')
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalQuotes))
      setPersistenceStatus('Saved locally only. Run the quote_library_main SQL to make quotes permanent in Supabase.')
    } catch (error) {
      const finalQuotes = localQuotes.length ? localQuotes : defaultQuotes
      setQuotes(finalQuotes)
      setSelectedId(finalQuotes[0]?.id || '')
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalQuotes))
      setPersistenceStatus('Saved locally only. Supabase quote table is not connected yet.')
    }
  }

  const syncQuoteLibraryToCloud = async (items = quotes, options = {}) => {
    const cleanItems = dedupeQuotes(items)
    if (!cleanItems.length) return false
    try {
      setSyncing(true)
      const rows = cleanItems.map(toDatabaseQuote)
      const { error } = await supabase.from(DB_TABLE).upsert(rows, { onConflict: 'id' })
      if (error) throw error
      const now = new Date().toISOString()
      localStorage.setItem(DB_SYNC_KEY, now)
      if (!options.silent) alert(`${cleanItems.length} quote(s) synced to Supabase Quote Library.`)
      setPersistenceStatus(`Cloud sync complete: ${cleanItems.length} quote(s). Last sync: ${new Date(now).toLocaleString()}`)
      return true
    } catch (error) {
      if (!options.silent) alert(error?.message || 'Cloud sync failed. Run the SQL setup first, then try again.')
      setPersistenceStatus('Local backup saved. Cloud sync failed or quote_library_main table is missing.')
      return false
    } finally {
      setSyncing(false)
    }
  }

  const exportQuoteLibraryBackup = () => {
    const text = JSON.stringify(dedupeQuotes(quotes), null, 2)
    copyText(text)
    alert('Quote library backup copied as JSON. Keep it in Notes/Drive as a safety backup.')
  }

  const quoteQueue = useMemo(() => {
    return (queue || []).filter((item) => {
      const text = `${item?.content_type || ''} ${item?.campaign_stage || ''} ${item?.ministry_name || ''} ${item?.content_text || ''}`.toLowerCase()
      return text.includes('daily quote') || text.includes('quote library') || text.includes('independent quote')
    })
  }, [queue])

  const verifiedCount = useMemo(() => quotes.filter((item) => item.verification_status === 'verified').length, [quotes])
  const needsReviewCount = useMemo(() => quotes.filter((item) => item.verification_status !== 'verified').length, [quotes])

  const filteredQuotes = useMemo(() => {
    const q = search.toLowerCase()
    return quotes.filter((item) => {
      const haystack = `${item.quote} ${item.author} ${item.source} ${item.category}`.toLowerCase()
      const matchesSearch = !q || haystack.includes(q)
      const matchesFilter = filter === 'all' || String(item.category || '').toLowerCase().includes(filter) || String(item.verification_status || '').toLowerCase().includes(filter)
      return matchesSearch && matchesFilter
    })
  }, [quotes, search, filter])

  const selectedQuote = useMemo(() => {
    return quotes.find((item) => item.id === selectedId) || filteredQuotes[0] || quotes[0] || null
  }, [quotes, selectedId, filteredQuotes])

  const updateStorage = (next) => {
    const cleanNext = dedupeQuotes(next)
    setQuotes(cleanNext)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanNext))
    setPersistenceStatus(`Local backup saved: ${cleanNext.length} quote(s). Syncing cloud backup...`)
    syncQuoteLibraryToCloud(cleanNext, { silent: true })
  }

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied')
    } catch (error) {
      alert('Copy failed. Long press and copy manually.')
    }
  }

  const addQuote = () => {
    if (!safeText(form.quote)) {
      alert('Add the quote text first.')
      return
    }
    const nextItem = {
      id: `quote-${Date.now()}`,
      quote: safeText(form.quote),
      author: safeText(form.author) || 'Christian Quote Library',
      source: safeText(form.source) || 'Manual entry',
      category: safeText(form.category) || 'Christian Living',
      verification_status: 'needs source review',
      notes: safeText(form.notes),
      created_at: new Date().toISOString(),
    }
    const next = [nextItem, ...quotes]
    updateStorage(next)
    setSelectedId(nextItem.id)
    setForm({ quote: '', author: '', source: '', category: 'Christian Living', notes: '' })
    alert('Quote saved to Quote Library')
  }

  const importBulkQuotes = () => {
    const rows = parseBulkLines(bulkText, bulkDefaults.author, bulkDefaults.source, bulkDefaults.category)
    if (!rows.length) {
      alert('Paste at least one quote line first.')
      return
    }
    const next = [...rows, ...quotes]
    updateStorage(next)
    setSelectedId(rows[0]?.id || '')
    setBulkText('')
    alert(`${rows.length} quote(s) imported. Review sources before publishing.`)
  }

  const markSelectedVerified = () => {
    if (!selectedQuote) return
    const next = quotes.map((item) => item.id === selectedQuote.id ? { ...item, verification_status: 'verified' } : item)
    updateStorage(next)
    alert('Selected quote marked verified')
  }

  const deleteSelectedQuote = () => {
    if (!selectedQuote) return
    const ok = window.confirm('Delete this quote from local Quote Library?')
    if (!ok) return
    const next = quotes.filter((item) => item.id !== selectedQuote.id)
    updateStorage(next)
    setSelectedId(next[0]?.id || '')
  }

  const saveQuoteToQueue = async (quoteItem = selectedQuote, dayOffset = 0) => {
    if (!quoteItem) {
      alert('Select a quote first.')
      return
    }
    setSaving(true)
    try {
      const scheduled = addDays(new Date(), dayOffset)
      scheduled.setHours(8, 0, 0, 0)
      const row = {
        minister_name: quoteItem.author || 'Christian Quote Library',
        ministry_name: 'Quote Library',
        content_type: 'Daily Quote Post',
        platform: 'Facebook / Instagram / Threads',
        content_text: makeQuotePostText(quoteItem),
        campaign_stage: 'Independent Daily Quote',
        status: 'draft',
        scheduled_at: scheduled.toISOString(),
      }
      const { error } = await supabase.from('content_queue_main').insert([row])
      if (error) throw error
      if (typeof refreshAllQueueViews === 'function') await refreshAllQueueViews()
      alert('Daily quote saved to Queue as an independent draft')
    } catch (error) {
      alert(error?.message || 'Could not save quote to Queue')
    } finally {
      setSaving(false)
    }
  }


  const copyQuoteImageBrief = () => {
    if (!selectedQuote) {
      alert('Select a quote first.')
      return
    }
    copyText(makeQuoteImageBrief(selectedQuote))
  }

  const copyQuoteCanvaPrompt = () => {
    if (!selectedQuote) {
      alert('Select a quote first.')
      return
    }
    copyText(makeQuoteCanvaPrompt(selectedQuote))
  }

  const copyReadyQuoteCaption = () => {
    if (!selectedQuote) {
      alert('Select a quote first.')
      return
    }
    copyText(makeReadyQuoteCaption(selectedQuote))
  }

  const copyAdvancedQuoteCaptionPrompt = () => {
    if (!selectedQuote) {
      alert('Select a quote first.')
      return
    }
    copyText(makeQuoteCaptionPrompt(selectedQuote))
  }

  const markSelectedNeedsDesign = () => {
    if (!selectedQuote) return
    const note = 'Needs quote image/design before publishing.'
    const next = quotes.map((item) => {
      if (item.id !== selectedQuote.id) return item
      const existing = safeText(item.notes)
      return {
        ...item,
        notes: existing.includes(note) ? existing : `${existing}${existing ? '\n' : ''}${note}`,
        updated_at: new Date().toISOString(),
      }
    })
    updateStorage(next)
    alert('Selected quote marked as needing design.')
  }

  const createQuoteImageAsset = () => {
    if (!selectedQuote) {
      alert('Select a quote first.')
      return
    }
    try {
      const saved = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '[]')
      const assets = Array.isArray(saved) ? saved : []
      const asset = {
        id: `quote-asset-${Date.now()}`,
        title: `Quote Image - ${selectedQuote.author || 'Christian Quote'}`,
        asset_type: 'Quote Poster Image',
        related_minister: selectedQuote.author || 'Christian Quote Library',
        related_campaign: 'Independent Daily Quote',
        related_queue_id: '',
        file_location: '',
        status: 'needed',
        platform: 'Facebook / Instagram / Threads',
        notes: makeQuoteImageBrief(selectedQuote),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'Quotes Planner',
      }
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify([asset, ...assets]))
      alert('Quote image asset request created in Media Library.')
    } catch (error) {
      alert('Could not create quote image asset.')
    }
  }

  const saveReadyQuotePostToQueue = async () => {
    if (!selectedQuote) {
      alert('Select a quote first.')
      return
    }
    if (selectedQuote.verification_status !== 'verified') {
      const ok = window.confirm('This quote is not marked verified yet. Continue only if you will verify the exact wording/source before publishing.')
      if (!ok) return
    }
    setSaving(true)
    try {
      const scheduled = new Date()
      scheduled.setHours(8, 0, 0, 0)
      if (scheduled.getTime() < Date.now()) {
        scheduled.setDate(scheduled.getDate() + 1)
      }
      const row = {
        minister_name: selectedQuote.author || 'Christian Quote Library',
        ministry_name: 'Quote Library',
        content_type: 'Ready Quote Post',
        platform: 'Facebook / Instagram / Threads',
        content_text: makeReadyQuoteCaption(selectedQuote),
        campaign_stage: 'Independent Daily Quote',
        status: 'scheduled',
        scheduled_at: scheduled.toISOString(),
      }
      const { error } = await supabase.from('content_queue_main').insert([row])
      if (error) throw error
      if (typeof refreshAllQueueViews === 'function') await refreshAllQueueViews()
      alert('Ready quote post saved to Queue. Create/post the image, then upload manually and paste the URL.')
    } catch (error) {
      alert(error?.message || 'Could not save ready quote post to Queue')
    } finally {
      setSaving(false)
    }
  }


  const saveSevenDayQuotePlan = async () => {
    const usable = quotes.slice(0, 7)
    if (!usable.length) {
      alert('Add quotes to the library first.')
      return
    }
    setSaving(true)
    try {
      const rows = usable.map((quoteItem, index) => {
        const scheduled = addDays(new Date(), index)
        scheduled.setHours(8, 0, 0, 0)
        return {
          minister_name: quoteItem.author || 'Christian Quote Library',
          ministry_name: 'Quote Library',
          content_type: 'Daily Quote Post',
          platform: 'Facebook / Instagram / Threads',
          content_text: makeQuotePostText(quoteItem),
          campaign_stage: 'Independent Daily Quote',
          status: 'draft',
          scheduled_at: scheduled.toISOString(),
        }
      })
      const { error } = await supabase.from('content_queue_main').insert(rows)
      if (error) throw error
      if (typeof refreshAllQueueViews === 'function') await refreshAllQueueViews()
      alert(`${rows.length} independent quote drafts saved to Queue`)
    } catch (error) {
      alert(error?.message || 'Could not save quote plan')
    } finally {
      setSaving(false)
    }
  }

  const extractBookCandidatesOnPhone = () => {
    const sentences = splitIntoCandidateSentences(bookText)
    if (!sentences.length) {
      alert('No strong candidates found. Try pasting a clearer chapter section or use the AI extraction prompt.')
      return
    }

    const sourceNote = makeSourceNote(bookMeta)
    const author = safeText(bookMeta.author) || 'Unknown author'
    const category = safeText(bookMeta.category) || 'Christian Living'
    const candidates = sentences.slice(0, 15).map((sentence, index) => ({
      id: `candidate-${Date.now()}-${index}`,
      quote: sentence,
      author,
      source: sourceNote,
      category: guessCategory(sentence) || category,
      verification_status: 'needs source review',
      notes: `Extracted from pasted ${safeText(bookMeta.sourceType) || 'book text'}. Review exact wording, page, and permission before publishing.`,
      created_at: new Date().toISOString(),
      selected: index < 5,
    }))

    setBookCandidates(candidates)
    alert(`${candidates.length} candidate quote(s) extracted. Review them before saving.`)
  }

  const toggleBookCandidate = (candidateId) => {
    setBookCandidates((items) => items.map((item) => item.id === candidateId ? { ...item, selected: !item.selected } : item))
  }

  const saveSelectedBookCandidates = () => {
    const selected = bookCandidates.filter((item) => item.selected)
    if (!selected.length) {
      alert('Select at least one candidate first.')
      return
    }
    const cleanItems = selected.map((item) => {
      const { selected: _selected, ...rest } = item
      return rest
    })
    const next = [...cleanItems, ...quotes]
    updateStorage(next)
    setSelectedId(cleanItems[0]?.id || '')
    alert(`${cleanItems.length} quote candidate(s) saved to Quote Library. Mark verified only after checking the source.`)
  }

  const importAiExtractedQuotes = () => {
    const sourceNote = makeSourceNote(bookMeta)
    const rows = parseBulkLines(aiExtractedText, bookMeta.author || 'Unknown author', sourceNote, bookMeta.category || 'Christian Living')
    if (!rows.length) {
      alert('Paste AI extraction results first.')
      return
    }
    const next = [...rows, ...quotes]
    updateStorage(next)
    setSelectedId(rows[0]?.id || '')
    setAiExtractedText('')
    alert(`${rows.length} AI extracted quote(s) imported. Review sources before publishing.`)
  }

  const copyFullBookExtractionPrompt = () => {
    if (!safeText(bookText)) {
      alert('Paste book/chapter text first.')
      return
    }
    copyText(makeBookExtractionPrompt(bookText, bookMeta))
  }

  const quotePrompt = selectedQuote ? `You are a Christian quote content editor for Yearning for God.\n\nTurn this quote into a short public social media post.\n\nQuote: "${selectedQuote.quote}"\nAuthor: ${selectedQuote.author}\nSource: ${selectedQuote.source}\nCategory: ${selectedQuote.category}\nVerification status: ${selectedQuote.verification_status}\n\nRules:\n- Keep it short and powerful\n- Do not invent a source\n- If the source is not verified, say Source note: verify before publishing\n- Make it suitable for Facebook, Instagram, and Threads\n- Add a simple reflection and CTA\n\nReturn:\n1. Final caption\n2. Poster text\n3. Hashtags\n4. Source/verification reminder` : ''

  const bookImportPrompt = `You are helping build the Yearning for God Quote Library.\n\nI will paste notes or excerpts from Christian books/sermons.\n\nExtract quote candidates safely.\n\nRules:\n- Do not fabricate quotes\n- Keep exact quote wording separate from paraphrases\n- For each quote, include author, book/sermon/source, chapter/page/timestamp if available\n- Mark unknown sources as Needs Review\n- Avoid long copyrighted extracts; create short quote candidates only\n\nReturn in this format, one per line:\nQuote text - Author - Source note - Category`

  const cardStyle = styles.card || cardBase
  const buttonStyle = styles.button || buttonBase
  const primaryButton = styles.primaryButton || { ...buttonBase, background: '#22c55e', color: '#06121f' }

  return (
    <div>
      <h1 style={styles.pageTitle || styles.title}>Quotes Planner</h1>
      <p style={styles.subtitle}>Independent daily Christian quote system for books, ministers, fathers of faith, and patriarchs.</p>

      <div style={cardStyle}>
        <p style={{ color: '#93c5fd', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>Recommended next move</p>
        <h2 style={{ marginTop: 0 }}>Prepare one independent quote post per day.</h2>
        <p style={{ color: '#cbd5e1' }}>This is separate from the main daily post target. Use it as a light daily wisdom post.</p>
        <p style={{ color: '#fbbf24', fontWeight: 800 }}>Before publishing attributed quotes, verify the exact wording and source.</p>
        <button type="button" style={primaryButton} onClick={() => saveQuoteToQueue(selectedQuote, 0)} disabled={saving}>{saving ? 'Saving...' : 'Save Today Quote to Queue'}</button>
        <button type="button" style={buttonStyle} onClick={saveSevenDayQuotePlan} disabled={saving}>Save 7-Day Quote Plan</button>
        <button type="button" style={buttonStyle} onClick={() => copyText(quotePrompt)}>Copy Quote Caption Prompt</button>
        <button type="button" style={buttonStyle} onClick={() => copyText(bookImportPrompt)}>Copy Book Quote Extraction Prompt</button>
        <button type="button" style={buttonStyle} onClick={() => setActiveTab && setActiveTab('queue')}>Open Queue</button>
      </div>


      <div style={cardStyle}>
        <p style={{ color: '#93c5fd', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>Quote Library Persistence v2</p>
        <h2 style={{ marginTop: 0 }}>Permanent quote storage</h2>
        <p style={{ color: '#cbd5e1' }}>{persistenceStatus}</p>
        <p style={{ color: '#94a3b8' }}>The app now keeps a local phone/browser backup and also syncs to Supabase when the quote_library_main table exists.</p>
        <button type="button" style={primaryButton} onClick={() => syncQuoteLibraryToCloud(quotes)} disabled={syncing}>{syncing ? 'Syncing...' : 'Sync Quote Library to Supabase'}</button>
        <button type="button" style={buttonStyle} onClick={loadQuoteLibrary} disabled={syncing}>Reload Quote Library</button>
        <button type="button" style={buttonStyle} onClick={exportQuoteLibraryBackup}>Copy JSON Backup</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>QUOTE LIBRARY</p><h2>{quotes.length}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>VERIFIED</p><h2>{verifiedCount}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>NEEDS REVIEW</p><h2>{needsReviewCount}</h2></div>
        <div style={cardStyle}><p style={{ color: '#94a3b8', fontWeight: 900 }}>QUOTE QUEUE</p><h2>{quoteQueue.length}</h2></div>
      </div>

      <div style={cardStyle}>
        <h2>Selected Daily Quote</h2>
        {selectedQuote ? (
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 18, padding: 16, background: 'rgba(2, 8, 23, 0.45)' }}>
            <p style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.5 }}>&quot;{selectedQuote.quote}&quot;</p>
            <p><strong>Author:</strong> {selectedQuote.author}</p>
            <p><strong>Source:</strong> {selectedQuote.source}</p>
            <p><strong>Category:</strong> {selectedQuote.category}</p>
            <p><strong>Status:</strong> {selectedQuote.verification_status}</p>
            <p style={{ color: '#94a3b8' }}>{selectedQuote.notes}</p>
            <button type="button" style={buttonStyle} onClick={markSelectedVerified}>Mark Verified</button>
            <button type="button" style={buttonStyle} onClick={() => copyText(makeQuotePostText(selectedQuote))}>Copy Draft Caption</button>
            <button type="button" style={buttonStyle} onClick={deleteSelectedQuote}>Delete Quote</button>
          </div>
        ) : (
          <p>No quote selected yet.</p>
        )}
      </div>

      <div style={cardStyle}>
        <p style={{ color: '#93c5fd', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>Quote Image Workflow v2</p>
        <h2 style={{ marginTop: 0 }}>Turn the selected quote into a beautiful daily post</h2>
        <p style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
          Best format for Facebook and Instagram: quote image plus short caption. Best format for Threads: text quote plus short reflection.
        </p>
        <p style={{ color: '#fbbf24', fontWeight: 800 }}>
          Verify exact wording and source before publishing attributed quotes.
        </p>

        {selectedQuote ? (
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 18, padding: 14, background: 'rgba(2, 8, 23, 0.45)' }}>
            <p style={{ fontWeight: 900, marginTop: 0 }}>{shortPreview(selectedQuote.quote, 140)}</p>
            <p style={{ color: '#94a3b8' }}>{selectedQuote.author} - {selectedQuote.verification_status}</p>
            <button type="button" style={buttonStyle} onClick={copyQuoteImageBrief}>Copy Quote Image Brief</button>
            <button type="button" style={buttonStyle} onClick={copyQuoteCanvaPrompt}>Copy Canva Design Prompt</button>
            <button type="button" style={buttonStyle} onClick={copyReadyQuoteCaption}>Copy Ready Caption</button>
            <button type="button" style={buttonStyle} onClick={copyAdvancedQuoteCaptionPrompt}>Copy AI Caption Prompt</button>
            <button type="button" style={buttonStyle} onClick={markSelectedVerified}>Mark Quote Verified</button>
            <button type="button" style={buttonStyle} onClick={markSelectedNeedsDesign}>Mark Needs Design</button>
            <button type="button" style={buttonStyle} onClick={createQuoteImageAsset}>Create Quote Image Asset</button>
            <button type="button" style={primaryButton} onClick={saveReadyQuotePostToQueue} disabled={saving}>{saving ? 'Saving...' : 'Save Ready Quote Post to Queue'}</button>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Select a quote from the library first.</p>
        )}
      </div>

      <div style={cardStyle}>
        <h2>Add One Quote</h2>
        <textarea placeholder="Paste the quote text" value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} style={{ width: '100%', minHeight: 100, borderRadius: 14, padding: 12, marginBottom: 10 }} />
        <input placeholder="Author / minister / father of faith" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
        <input placeholder="Book, sermon, page, timestamp, or source note" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
        <input placeholder="Category e.g. Faith, Prayer, Worship, Holiness" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', minHeight: 70, borderRadius: 14, padding: 12, marginBottom: 10 }} />
        <button type="button" style={primaryButton} onClick={addQuote}>Save Quote to Library</button>
      </div>

      <div style={cardStyle}>
        <h2>Book Quote Extractor v2</h2>
        <p style={{ color: '#cbd5e1', lineHeight: 1.7 }}>Paste a chapter, section, sermon note, or soft-copy excerpt. The app can suggest quote candidates on your phone, or you can copy a prompt and let ChatGPT extract cleaner quotes for you.</p>
        <p style={{ color: '#fbbf24', fontWeight: 800 }}>Safety rule: do not publish long copyrighted passages. Use short quotes, verify the exact source, and add your own reflection.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <input placeholder="Book/source title" value={bookMeta.bookTitle} onChange={(e) => setBookMeta({ ...bookMeta, bookTitle: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
          <input placeholder="Author / minister" value={bookMeta.author} onChange={(e) => setBookMeta({ ...bookMeta, author: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
          <input placeholder="Chapter / section" value={bookMeta.chapter} onChange={(e) => setBookMeta({ ...bookMeta, chapter: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
          <input placeholder="Page / location" value={bookMeta.page} onChange={(e) => setBookMeta({ ...bookMeta, page: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
          <input placeholder="Default category" value={bookMeta.category} onChange={(e) => setBookMeta({ ...bookMeta, category: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
          <input placeholder="Source type" value={bookMeta.sourceType} onChange={(e) => setBookMeta({ ...bookMeta, sourceType: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
        </div>

        <textarea placeholder="Paste book chapter, sermon notes, or Christian book excerpt here. For phone use, paste one chapter or section at a time, not a whole book." value={bookText} onChange={(e) => setBookText(e.target.value)} style={{ width: '100%', minHeight: 180, borderRadius: 14, padding: 12, marginBottom: 10 }} />

        <button type="button" style={primaryButton} onClick={extractBookCandidatesOnPhone}>Extract Candidates on Phone</button>
        <button type="button" style={buttonStyle} onClick={copyFullBookExtractionPrompt}>Copy AI Extraction Prompt With Text</button>
        <button type="button" style={buttonStyle} onClick={() => setBookText('')}>Clear Pasted Text</button>

        {bookCandidates.length > 0 && (
          <div style={{ marginTop: 16, border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 18, padding: 14, background: 'rgba(2, 8, 23, 0.45)' }}>
            <h3 style={{ marginTop: 0 }}>Extracted Quote Candidates</h3>
            <p style={{ color: '#94a3b8' }}>Select only the strongest quotes. All saved candidates remain Needs Source Review until you verify them.</p>
            <button type="button" style={primaryButton} onClick={saveSelectedBookCandidates}>Save Selected Candidates to Library</button>
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              {bookCandidates.map((item) => (
                <label key={item.id} style={{ display: 'block', border: item.selected ? '2px solid #22c55e' : '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 16, padding: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!item.selected} onChange={() => toggleBookCandidate(item.id)} style={{ marginRight: 8 }} />
                  <strong>&quot;{item.quote}&quot;</strong>
                  <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>{item.author} - {item.source} - {item.category}</p>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 18, padding: 14, background: 'rgba(2, 8, 23, 0.35)' }}>
          <h3 style={{ marginTop: 0 }}>Paste AI Extraction Results</h3>
          <p style={{ color: '#cbd5e1' }}>After using the extraction prompt in ChatGPT, paste the returned lines here and import them into the library.</p>
          <textarea placeholder="Quote text - Author - Source note - Category" value={aiExtractedText} onChange={(e) => setAiExtractedText(e.target.value)} style={{ width: '100%', minHeight: 120, borderRadius: 14, padding: 12, marginBottom: 10 }} />
          <button type="button" style={primaryButton} onClick={importAiExtractedQuotes}>Import AI Extracted Quotes</button>
        </div>
      </div>

      <div style={cardStyle}>
        <h2>Bulk Import From Books or Notes</h2>
        <p style={{ color: '#cbd5e1' }}>Paste one quote per line. Supported simple format: Quote text - Author - Source note.</p>
        <textarea placeholder="Example: Prayer is earthly permission for heavenly interference - Myles Munroe - Book/source note" value={bulkText} onChange={(e) => setBulkText(e.target.value)} style={{ width: '100%', minHeight: 140, borderRadius: 14, padding: 12, marginBottom: 10 }} />
        <input placeholder="Default author if missing" value={bulkDefaults.author} onChange={(e) => setBulkDefaults({ ...bulkDefaults, author: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
        <input placeholder="Default source/book if missing" value={bulkDefaults.source} onChange={(e) => setBulkDefaults({ ...bulkDefaults, source: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
        <input placeholder="Default category" value={bulkDefaults.category} onChange={(e) => setBulkDefaults({ ...bulkDefaults, category: e.target.value })} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 10 }} />
        <button type="button" style={primaryButton} onClick={importBulkQuotes}>Import Quotes</button>
      </div>

      <div style={cardStyle}>
        <h2>Quote Library</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {['all', 'verified', 'needs source review', 'faith', 'prayer', 'worship', 'holiness'].map((item) => (
            <button key={item} type="button" style={{ ...buttonStyle, background: filter === item ? '#38bdf8' : undefined, color: filter === item ? '#06121f' : undefined }} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <input placeholder="Search quotes, authors, books, categories" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', borderRadius: 14, padding: 12, marginBottom: 14 }} />
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredQuotes.slice(0, 60).map((item) => (
            <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} style={{ textAlign: 'left', border: selectedId === item.id ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 18, padding: 14, background: 'rgba(2, 8, 23, 0.45)', color: '#e2e8f0', cursor: 'pointer' }}>
              <p style={{ margin: 0, fontWeight: 900 }}>{shortPreview(item.quote, 110)}</p>
              <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>{item.author} - {item.category} - {item.verification_status}</p>
            </button>
          ))}
          {!filteredQuotes.length && <p style={{ color: '#94a3b8' }}>No quotes found.</p>}
        </div>
      </div>

      <div style={cardStyle}>
        <h2>How this fits your posting system</h2>
        <p style={{ color: '#cbd5e1', lineHeight: 1.7 }}>Daily quotes are independent. They should not replace your main content plan. Use them as one daily wisdom post, preferably morning or night, across Facebook, Instagram, and Threads. When books are added later, use this tab to collect quote candidates first, then build book summaries in a separate future Books Summary module.</p>
      </div>
    </div>
  )
}