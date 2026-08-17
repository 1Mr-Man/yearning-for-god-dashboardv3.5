// R9.1 — Plain-text Book Journey ingestion: deterministic chapter-boundary
// detection only. No AI, no fuzzy heuristics. A line is treated as a chapter
// heading only when it starts with "chapter" followed by a number or a
// recognized number word, and is short enough to plausibly be a heading
// rather than a sentence.

const ONES = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['twenty', 'thirty', 'forty', 'fifty']

const NUMBER_WORDS = new Set([...ONES, ...TEENS, ...TENS])
TENS.forEach(t => ONES.forEach(o => NUMBER_WORDS.add(`${t}-${o}`)))

const HEADING_RE = /^chapter\s+([0-9]{1,3}|[a-z]+(?:[\s-][a-z]+)?)\s*[:.\-–—]?\s*(.*)$/i
const MAX_HEADING_LINE_LENGTH = 80

function isRecognizedChapterToken(token) {
  const normalized = token.toLowerCase().trim().replace(/\s+/g, '-')
  return /^[0-9]{1,3}$/.test(normalized) || NUMBER_WORDS.has(normalized)
}

export function splitIntoChapters(rawText) {
  const issues = []
  if (!rawText || !rawText.trim()) {
    return { chapters: [], issues: ['The file is empty.'] }
  }

  const lines = rawText.split(/\r\n|\r|\n/)
  const headingLines = []
  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.length > MAX_HEADING_LINE_LENGTH) return
    const m = trimmed.match(HEADING_RE)
    if (!m) return
    if (!isRecognizedChapterToken(m[1])) return
    headingLines.push({ lineIndex: idx, inlineTitle: (m[2] || '').trim() })
  })

  if (headingLines.length === 0) {
    return {
      chapters: [],
      issues: ['No chapter headings were detected (expected lines such as "Chapter 1", "CHAPTER ONE", "Chapter 1: Title").'],
    }
  }

  const chapters = headingLines.map((h, i) => {
    const endLine = i + 1 < headingLines.length ? headingLines[i + 1].lineIndex : lines.length
    const raw_source_text = lines.slice(h.lineIndex, endLine).join('\n').trim()
    const word_count = raw_source_text ? raw_source_text.split(/\s+/).filter(Boolean).length : 0
    return {
      chapter_number: i + 1,
      title: h.inlineTitle ? h.inlineTitle.slice(0, 160) : null,
      raw_source_text,
      word_count,
    }
  })

  const tiny = chapters.filter(c => c.word_count < 20)
  if (tiny.length) {
    issues.push(`${tiny.length} detected chapter(s) have very little text (under 20 words) — review before importing.`)
  }

  return { chapters, issues }
}

export function suggestTitleFromFileName(fileName) {
  return String(fileName || '').replace(/\.txt$/i, '').replace(/[_-]+/g, ' ').trim()
}
