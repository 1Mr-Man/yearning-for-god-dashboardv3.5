import React, { useRef, useState } from 'react'
import { splitIntoChapters, suggestTitleFromFileName } from '../lib/bookImport'

// R9.1 — Plain-text Book Journey ingestion.
// STRUCTURE-PRESERVATION ONLY: reads a .txt file, detects chapter
// boundaries deterministically, and — only after explicit human
// confirmation — creates one yfg_books row and one yfg_book_chapters row
// per detected chapter (raw_source_text preserved verbatim, status
// defaults to "imported"). No analysis, quotes, scripture, illustrations,
// references, production, publishing, or queue writes happen here.

const ws = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 4300,
    background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(6px)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    overflowY: 'auto', overflowX: 'hidden',
  },
  panel: {
    width: '100%', maxWidth: 900, minHeight: '100%', boxSizing: 'border-box',
    background: '#080b16', borderLeft: '1px solid rgba(51,65,85,0.7)', borderRight: '1px solid rgba(51,65,85,0.7)',
    padding: '18px 14px 140px', color: '#e2e8f0', overflowWrap: 'anywhere',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 2, margin: '-18px -14px 16px', padding: '14px',
    background: 'rgba(8,11,22,0.96)', borderBottom: '1px solid rgba(51,65,85,0.7)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
  },
  kicker: { color: '#D4AF37', fontSize: 11, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 },
  title: { margin: '6px 0 8px', fontSize: 19, lineHeight: 1.25, fontWeight: 900, color: '#fff' },
  section: { background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(51,65,85,0.75)', borderRadius: 18, padding: 14, marginBottom: 14 },
  sectionTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8' },
  label: { display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', margin: '0 0 6px' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: 12, minHeight: 46, borderRadius: 12,
    fontSize: 15, color: '#f8fafc', background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(51,65,85,0.9)',
    outline: 'none', fontFamily: 'inherit', marginBottom: 10,
  },
  btn: {
    padding: '13px 16px', minHeight: 48, borderRadius: 14, fontWeight: 850, fontSize: 15, cursor: 'pointer',
    color: '#f8fafc', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.9)',
  },
  primary: { background: 'linear-gradient(135deg,#0B1023,#1d4ed8)', border: '1px solid rgba(212,175,55,0.6)', color: '#fff' },
  gold: { background: 'linear-gradient(135deg,#D4AF37,#b8860b)', border: '1px solid rgba(212,175,55,0.8)', color: '#0B1023' },
  bar: {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 3, maxHeight: '46vh', overflowY: 'auto',
    display: 'flex', gap: 8, flexWrap: 'wrap', padding: 12, boxSizing: 'border-box',
    background: 'rgba(8,11,22,0.97)', borderTop: '1px solid rgba(51,65,85,0.8)',
  },
  banner: { borderRadius: 12, padding: '10px 12px', marginBottom: 12, fontSize: 14, fontWeight: 700, lineHeight: 1.5 },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999,
    background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.85)', color: '#cbd5e1',
    fontSize: 12, fontWeight: 800, marginRight: 6, marginBottom: 6,
  },
  chapterCard: {
    background: 'rgba(2,6,23,0.55)', border: '1px solid rgba(51,65,85,0.7)', borderRadius: 14,
    padding: 12, marginBottom: 10,
  },
}

export default function BookImport({ supabase, onClose, onImported }) {
  const fileInputRef = useRef(null)
  const [step, setStep] = useState('select') // select | preview | importing | done
  const [fileName, setFileName] = useState('')
  const [rawText, setRawText] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [err, setErr] = useState('')
  const [importedBook, setImportedBook] = useState(null)

  function close() {
    if (step === 'importing') return
    onClose && onClose()
  }

  function onFileChosen(e) {
    setErr('')
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (!/\.txt$/i.test(file.name)) {
      setErr('Only .txt files are supported in this version. PDF, EPUB, and DOCX are not yet supported.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    const reader = new FileReader()
    reader.onerror = () => setErr('The file could not be read. Please try again.')
    reader.onload = () => {
      const text = String(reader.result || '')
      const result = splitIntoChapters(text)
      setFileName(file.name)
      setRawText(text)
      setTitle(suggestTitleFromFileName(file.name))
      setParseResult(result)
      if (result.chapters.length === 0) {
        setErr(result.issues[0] || 'No chapters could be detected in this file.')
        return
      }
      setStep('preview')
    }
    reader.readAsText(file)
  }

  async function doImport() {
    if (!title.trim()) { setErr('Give the book a title first.'); return }
    if (!parseResult || parseResult.chapters.length === 0) { setErr('No chapters to import.'); return }
    setErr('')
    setStep('importing')

    const { data: book, error: bookErr } = await supabase
      .from('yfg_books')
      .insert({ title: title.trim(), author: author.trim() || null, source_format: 'txt' })
      .select().single()
    if (bookErr) {
      setErr('Book could not be created: ' + bookErr.message)
      setStep('preview')
      return
    }

    const chapterRows = parseResult.chapters.map(c => ({
      book_id: book.id,
      chapter_number: c.chapter_number,
      title: c.title,
      raw_source_text: c.raw_source_text,
      word_count: c.word_count,
    }))
    const { error: chapErr } = await supabase.from('yfg_book_chapters').insert(chapterRows)
    if (chapErr) {
      await supabase.from('yfg_books').delete().eq('id', book.id)
      setErr(
        (String(chapErr.code) === '23505' ? 'Duplicate chapter numbers were rejected. ' : 'Chapters could not be created. ')
        + chapErr.message + ' The partially created book has been removed — nothing was left behind.'
      )
      setStep('preview')
      return
    }

    setImportedBook(book)
    setStep('done')
  }

  return (
    <div style={ws.overlay} role="dialog" aria-modal="true">
      <div style={ws.panel}>
        <div style={ws.header}>
          <div style={{ minWidth: 0 }}>
            <p style={ws.kicker}>Book Journey — Import Book (R9.1)</p>
            <h2 style={ws.title}>Import .txt Book</h2>
            <div>
              <span style={ws.pill}>Supported: TXT</span>
              <span style={ws.pill}>Not yet supported: PDF · EPUB · DOCX</span>
            </div>
          </div>
          <button style={{ ...ws.btn, minHeight: 40, padding: '8px 12px' }} onClick={close} disabled={step === 'importing'}>Close</button>
        </div>

        {err && <div style={{ ...ws.banner, color: '#fecaca', border: '1px solid #7f1d1d', background: 'rgba(127,29,29,0.18)' }}>{err}</div>}

        {step === 'select' && (
          <section style={ws.section}>
            <h3 style={ws.sectionTitle}>Select a .txt file</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 0 }}>
              The original text is preserved exactly as written. Chapters are detected from lines such as
              "Chapter 1", "CHAPTER ONE", or "Chapter 1: Title" — nothing is summarized or rewritten.
            </p>
            <input ref={fileInputRef} type="file" accept=".txt,text/plain" onChange={onFileChosen} style={{ color: '#e2e8f0' }} />
          </section>
        )}

        {(step === 'preview' || step === 'importing') && parseResult && (
          <>
            <section style={ws.section}>
              <h3 style={ws.sectionTitle}>Book Details</h3>
              <label style={ws.label}>File</label>
              <div style={{ ...ws.input, minHeight: 0, color: '#94a3b8' }}>{fileName}</div>
              <label style={ws.label}>Title</label>
              <input style={ws.input} value={title} onChange={e => setTitle(e.target.value)} disabled={step === 'importing'} />
              <label style={ws.label}>Author (optional)</label>
              <input style={ws.input} value={author} onChange={e => setAuthor(e.target.value)} disabled={step === 'importing'} />
              <span style={ws.pill}>Source format: txt</span>
              <span style={ws.pill}>Detected chapters: {parseResult.chapters.length}</span>
            </section>

            {parseResult.issues.length > 0 && (
              <div style={{ ...ws.banner, color: '#fde68a', border: '1px solid #92400e', background: 'rgba(146,64,14,0.18)' }}>
                {parseResult.issues.map((iss, i) => <div key={i}>{iss}</div>)}
              </div>
            )}

            <section style={ws.section}>
              <h3 style={ws.sectionTitle}>Detected Chapters — review before importing</h3>
              {parseResult.chapters.map(c => (
                <div key={c.chapter_number} style={ws.chapterCard}>
                  <div style={{ fontWeight: 800, color: '#f1f5f9' }}>
                    Chapter {c.chapter_number}{c.title ? `: ${c.title}` : ' (untitled)'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0' }}>{c.word_count} words</div>
                  <div style={{ color: '#cbd5e1', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                    {c.raw_source_text.slice(0, 150)}{c.raw_source_text.length > 150 ? '…' : ''}
                  </div>
                </div>
              ))}
            </section>

            <div style={ws.bar}>
              <button style={{ ...ws.btn, flex: '1 1 140px' }} onClick={close} disabled={step === 'importing'}>Cancel</button>
              <button style={{ ...ws.btn, ...ws.gold, flex: '1 1 200px' }} onClick={doImport} disabled={step === 'importing'}>
                {step === 'importing' ? 'Importing…' : 'Import Book'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && importedBook && (
          <section style={ws.section}>
            <h3 style={ws.sectionTitle}>Import Complete</h3>
            <div style={{ ...ws.banner, color: '#bbf7d0', border: '1px solid #14532d', background: 'rgba(20,83,45,0.18)' }}>
              "{importedBook.title}" was imported with {parseResult.chapters.length} chapter(s), each marked "imported".
            </div>
            <span style={ws.pill}>Title: {importedBook.title}</span>
            <span style={ws.pill}>Author: {importedBook.author || 'Unknown'}</span>
            <span style={ws.pill}>Source format: {importedBook.source_format}</span>
            <span style={ws.pill}>Chapters: {parseResult.chapters.length}</span>
            <div style={ws.bar}>
              <button style={{ ...ws.btn, ...ws.primary, flex: '1 1 100%' }} onClick={() => onImported && onImported(importedBook)}>
                Open Book
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
