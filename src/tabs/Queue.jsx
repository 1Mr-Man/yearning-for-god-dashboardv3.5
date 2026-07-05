import { useMemo, useState } from 'react'

const MEDIA_STORAGE_KEY = 'yfg_media_library_assets_v1'

function clean(value) {
  return String(value || '').trim()
}

function lc(value) {
  return clean(value).toLowerCase()
}

function isBirthdayPack(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.ministry_name || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('birthday') || text.includes('campaign pack')
}

function isDesignItem(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('poster') || text.includes('image prompt') || text.includes('design') || text.includes('thumbnail')
}

function isVideoItem(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('video script') || text.includes('short video') || text.includes('audio-first') || text.includes('reel') || text.includes('shorts')
}

function isMusicItem(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.ministry_name || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('music') || text.includes('song') || text.includes('worship atmosphere') || text.includes('safe audio') || text.includes('soundtrack') || text.includes('weekly sound')
}

function isReadyMusicPost(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return isMusicItem(item) && (
    text.includes('ready music post') ||
    text.includes('public music caption:') ||
    text.includes('publish-ready music caption:') ||
    text.includes('final music caption:')
  )
}

function isMusicBrief(item) {
  if (!isMusicItem(item)) return false
  if (isReadyMusicPost(item)) return false
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return (
    text.includes('weekly music plan') ||
    text.includes('music plan') ||
    text.includes('caption draft:') ||
    text.includes('safe audio note') ||
    text.includes('direction:') ||
    text.includes('weekly recap music') ||
    text.includes('short music video') ||
    text.includes('music reflection post') ||
    item.status === 'draft'
  )
}

function getMusicWorkflowLabel(item) {
  if (!isMusicItem(item)) return null
  if (isReadyMusicPost(item)) return { label: 'Ready Music Post', color: '#22c55e', bg: 'rgba(34,197,94,.12)' }
  if (isVideoItem(item)) return { label: 'Music Video Task', color: '#a78bfa', bg: 'rgba(167,139,250,.12)' }
  if (isDesignItem(item)) return { label: 'Music Design Task', color: '#f472b6', bg: 'rgba(244,114,182,.12)' }
  if (isMusicBrief(item)) return { label: 'Music Brief', color: '#38bdf8', bg: 'rgba(56,189,248,.12)' }
  return { label: 'Music Item', color: '#facc15', bg: 'rgba(250,204,21,.12)' }
}


function isQuoteItem(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.ministry_name || ''} ${item.content_text || ''}`.toLowerCase()
  return (
    text.includes('quote') ||
    text.includes('independent daily quote') ||
    text.includes('book excerpt') ||
    text.includes('book quote') ||
    text.includes('once said') ||
    text.includes('quote library') ||
    text.includes('source review') ||
    text.includes('patriarch') ||
    text.includes('patriark')
  )
}

function isReadyQuotePost(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return isQuoteItem(item) && (
    text.includes('ready quote post') ||
    text.includes('public quote caption:') ||
    text.includes('publish-ready quote caption:') ||
    text.includes('final quote caption:') ||
    text.includes('ready public quote:')
  )
}

function isQuoteNeedsSourceReview(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return isQuoteItem(item) && (
    text.includes('needs source review') ||
    text.includes('source status: needs') ||
    text.includes('verify source') ||
    text.includes('source review') ||
    text.includes('needs verification')
  )
}

function isQuoteBrief(item) {
  if (!isQuoteItem(item)) return false
  if (isReadyQuotePost(item)) return false
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return (
    item.status === 'draft' ||
    text.includes('independent daily quote') ||
    text.includes('daily quote post') ||
    text.includes('book quote') ||
    text.includes('quote library') ||
    text.includes('quote draft') ||
    text.includes('source review') ||
    text.includes('notes:')
  )
}

function getQuoteWorkflowLabel(item) {
  if (!isQuoteItem(item)) return null
  if (isReadyQuotePost(item)) return { label: 'Ready Quote Post', color: '#22c55e', bg: 'rgba(34,197,94,.12)' }
  if (isQuoteNeedsSourceReview(item)) return { label: 'Quote Needs Source Review', color: '#facc15', bg: 'rgba(250,204,21,.12)' }
  if (isDesignItem(item)) return { label: 'Quote Needs Design', color: '#f472b6', bg: 'rgba(244,114,182,.12)' }
  if (isQuoteBrief(item)) return { label: 'Quote Draft', color: '#38bdf8', bg: 'rgba(56,189,248,.12)' }
  return { label: 'Quote Item', color: '#facc15', bg: 'rgba(250,204,21,.12)' }
}

function extractLiveUrl(item) {
  const text = `${item.content_text || ''}`
  const match = text.match(/Live URL:\s*(https?:\/\/\S+)/i)
  return match ? match[1].trim() : ''
}

function hasQuoteTrackingBlock(item) {
  return `${item.content_text || ''}`.toLowerCase().includes('quote publishing tracking v1')
}

function hasQuotePerformanceBlock(item) {
  return `${item.content_text || ''}`.toLowerCase().includes('quote performance tracking v1')
}

function isQuotePublishedNeedsUrl(item) {
  return isQuoteItem(item) && item.status === 'published' && !extractLiveUrl(item)
}

function isQuoteNeedsStats(item) {
  if (!isQuoteItem(item)) return false
  const text = `${item.content_text || ''}`.toLowerCase()
  if (item.status !== 'published') return false
  if (!extractLiveUrl(item)) return true
  return !text.includes('24h stats recorded') || !text.includes('7d stats recorded')
}

function isQuoteWinner(item) {
  const text = `${item.content_text || ''}`.toLowerCase()
  return isQuoteItem(item) && (
    text.includes('repeat candidate: yes') ||
    text.includes('quote winner: yes') ||
    text.includes('repeat this quote style')
  )
}

function addDaysIsoString(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function parseNumber(value) {
  const n = Number(String(value || '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function isChecklistItem(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('checklist')
}

function isInternalWorkflowItem(item) {
  const typeStage = `${item.content_type || ''} ${item.campaign_stage || ''}`.toLowerCase()
  const text = `${typeStage} ${item.content_text || ''}`.toLowerCase()

  // Music and quote plan items are production briefs, but they need their own workflows instead of being hidden as generic internal items.
  if (isMusicItem(item)) return false
  if (isQuoteItem(item)) return false

  if (isChecklistItem(item)) return true
  if (typeStage.includes('manual publishing')) return true
  if (typeStage.includes('checklist')) return true
  if (typeStage.includes('poster design prompt')) return true
  if (typeStage.includes('design prompt')) return true
  if (typeStage.includes('image prompt')) return true
  if (typeStage.includes('asset request')) return true
  if (typeStage.includes('media asset')) return true
  if (typeStage.includes('caption file')) return true

  // Keep real short/video scripts scoreable, but skip production notes and internal instructions.
  if (typeStage.includes('production note')) return true
  if (text.includes('manual publishing checklist')) return true
  if (text.includes('production checklist:')) return true
  if (text.includes('internal workflow')) return true
  return false
}

function isPublicFacingContent(item) {
  return !isInternalWorkflowItem(item)
}

function isUrgentBirthdayItem(item) {
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  if (!isBirthdayPack(item)) return false
  return text.includes('days remaining: 0') || text.includes('days until: 0') || text.includes('birthday today') || text.includes('today is')
}



const MONTH_INDEX = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function parseBirthdayFromText(item) {
  const text = `${item.content_text || ''} ${item.campaign_stage || ''} ${item.content_type || ''}`
  const birthdayLine = text.match(/birthday\s*[:\-]\s*(\d{1,2})\s+([a-zA-Z]+)/i)
  if (birthdayLine) {
    const day = Number(birthdayLine[1])
    const month = MONTH_INDEX[birthdayLine[2].toLowerCase()]
    if (month !== undefined && day >= 1 && day <= 31) return { day, month }
  }

  const isoLine = text.match(/birthday\s*[:\-]\s*(\d{4})-(\d{2})-(\d{2})/i)
  if (isoLine) {
    return { day: Number(isoLine[3]), month: Number(isoLine[2]) - 1 }
  }

  return null
}

function getNextBirthdayDate(item) {
  const parsed = parseBirthdayFromText(item)
  if (!parsed) return null
  const today = startOfToday()
  let next = new Date(today.getFullYear(), parsed.month, parsed.day)
  if (next < today) next = new Date(today.getFullYear() + 1, parsed.month, parsed.day)
  return next
}

function getBirthdayTiming(item) {
  if (!isBirthdayPack(item)) return { hasBirthday: false, status: 'not-birthday', label: '', daysUntil: null }
  const next = getNextBirthdayDate(item)
  if (!next) return { hasBirthday: false, status: 'unknown', label: 'Birthday date not detected', daysUntil: null }
  const today = startOfToday()
  const diff = Math.round((next - today) / 86400000)
  const text = `${item.content_type || ''} ${item.campaign_stage || ''} ${item.content_text || ''}`.toLowerCase()
  const countdownMatch = text.match(/(\d+)\s*days?\s+to\s+go/) || text.match(/days\s+remaining\s*[:\-]\s*(\d+)/)
  const statedDays = countdownMatch ? Number(countdownMatch[1]) : null
  const isCountdown = text.includes('countdown') || /\d+\s*days?\s+to\s+go/.test(text)

  if (diff === 0 && isCountdown && statedDays !== null && statedDays > 0) {
    return { hasBirthday: true, status: 'outdated-countdown', label: 'Outdated Countdown - Birthday Today', daysUntil: 0, nextBirthday: next, statedDays }
  }
  if (diff === 0) return { hasBirthday: true, status: 'today', label: 'Birthday Today', daysUntil: 0, nextBirthday: next, statedDays }
  if (diff === 1) return { hasBirthday: true, status: 'tomorrow', label: 'Birthday Tomorrow', daysUntil: 1, nextBirthday: next, statedDays }
  if (statedDays !== null && Math.abs(statedDays - diff) >= 2 && diff <= 30) {
    return { hasBirthday: true, status: 'wrong-countdown', label: `Countdown Mismatch - ${diff} days left`, daysUntil: diff, nextBirthday: next, statedDays }
  }
  if (diff <= 7) return { hasBirthday: true, status: 'this-week', label: `${diff} days left`, daysUntil: diff, nextBirthday: next, statedDays }
  if (diff <= 30) return { hasBirthday: true, status: 'upcoming', label: `${diff} days left`, daysUntil: diff, nextBirthday: next, statedDays }
  return { hasBirthday: true, status: 'future', label: `${diff} days left`, daysUntil: diff, nextBirthday: next, statedDays }
}

function needsBirthdayTimingFix(item) {
  const timing = getBirthdayTiming(item)
  return timing.status === 'outdated-countdown' || timing.status === 'wrong-countdown'
}

function isBirthdayToday(item) {
  const timing = getBirthdayTiming(item)
  return timing.status === 'today' || timing.status === 'outdated-countdown'
}

function buildTodayHonourPost(item) {
  const minister = clean(item.minister_name) || clean((item.content_text || '').match(/celebrate\s+([^\.\n]+)/i)?.[1]) || 'this servant of God'
  const platform = getPlatformBadge(item.platform)
  return `Some voices do not just create moments - they help generations remember the faithfulness of God.

Today, we honour ${minister} and celebrate the grace of God upon his life and ministry.

We thank God for every song, message, sacrifice, and kingdom impact connected to his journey. May the Lord strengthen him, preserve him, and continue to use his life to draw many hearts closer to Jesus.

Happy Birthday, ${minister}.

If his ministry has blessed you, type Amen and share this to honour the grace of God upon his life.

Poster Text:
Happy Birthday ${minister}
A Life of Worship and Kingdom Impact

Hashtags:
#HappyBirthday #${minister.replace(/[^a-zA-Z0-9]/g, '')} #ChristianLeaders #KingdomImpact #ChristianWorship #YearningForGod

Publishing Note:
Platform: ${platform}
Status: Converted from outdated countdown to birthday-today honour post.`
}

function getWorkflowLabel(item) {
  if (item.status === 'published') return { label: 'Published', color: '#22c55e', bg: 'rgba(34,197,94,.12)' }
  const musicLabel = getMusicWorkflowLabel(item)
  if (musicLabel) return musicLabel
  const quoteLabel = getQuoteWorkflowLabel(item)
  if (quoteLabel) return quoteLabel
  if (isChecklistItem(item)) return { label: 'Manual Checklist', color: '#38bdf8', bg: 'rgba(56,189,248,.12)' }
  if (isDesignItem(item)) return { label: 'Needs Design', color: '#f472b6', bg: 'rgba(244,114,182,.12)' }
  if (isVideoItem(item)) return { label: 'Needs Video', color: '#a78bfa', bg: 'rgba(167,139,250,.12)' }
  if (item.status === 'scheduled') return { label: 'Ready / Scheduled', color: '#facc15', bg: 'rgba(250,204,21,.12)' }
  return { label: 'Draft Review', color: '#94a3b8', bg: 'rgba(148,163,184,.12)' }
}

function getPlatformBadge(platform) {
  const p = lc(platform)
  if (p.includes('tiktok')) return 'TikTok'
  if (p.includes('youtube')) return 'YouTube'
  if (p.includes('facebook')) return 'Facebook'
  if (p.includes('instagram')) return 'Instagram'
  if (p.includes('thread')) return 'Threads'
  return platform || 'Platform'
}

function truncate(text, limit = 160) {
  const value = clean(text)
  if (value.length <= limit) return value
  return `${value.slice(0, limit)}...`
}


function countMatches(text, words) {
  const value = lc(text)
  return words.reduce((sum, word) => sum + (value.includes(word) ? 1 : 0), 0)
}

function getContentQuality(item) {
  if (needsBirthdayTimingFix(item)) {
    const timing = getBirthdayTiming(item)
    return {
      skip: true,
      score: null,
      label: 'Timing Fix Needed',
      color: '#f97316',
      bg: 'rgba(249,115,22,.12)',
      hook: '',
      weak: [],
      breakdown: [],
      recommendation: `${timing.label}. Convert this item before scoring or publishing.`,
    }
  }

  if (isMusicBrief(item)) {
    return {
      skip: true,
      score: null,
      label: 'Music Brief - No Viral Score Yet',
      color: '#38bdf8',
      bg: 'rgba(56,189,248,.10)',
      hook: '',
      weak: [],
      breakdown: [],
      recommendation: 'This is a music production brief. Generate the publish-ready music caption/video asset before scoring.',
    }
  }

  if (isQuoteBrief(item)) {
    return {
      skip: true,
      score: null,
      label: 'Quote Draft - No Viral Score Yet',
      color: '#38bdf8',
      bg: 'rgba(56,189,248,.10)',
      hook: '',
      weak: [],
      breakdown: [],
      recommendation: 'This is a quote draft. Verify the source, add a short reflection, create the design asset, then mark it as a ready quote post before scoring.',
    }
  }

  if (isInternalWorkflowItem(item)) {
    return {
      skip: true,
      score: null,
      label: 'No Score Needed',
      color: '#38bdf8',
      bg: 'rgba(56,189,248,.10)',
      hook: '',
      weak: [],
      breakdown: [],
      recommendation: 'Production brief - generate the public caption before scoring.',
    }
  }

  const text = clean(item.content_text)
  const lower = lc(text)
  const platform = lc(item.platform || '')
  const isShortForm = platform.includes('tiktok') || platform.includes('youtube') || platform.includes('shorts') || platform.includes('reel')
  const isFacebook = platform.includes('facebook')
  const isBirthday = isBirthdayPack(item)

  // -- HOOK (20 pts) ----------------------------------------------------------
  // Detect the real hook: explicit label first, then first meaningful line
  const hookLabelMatch = text.match(/^hook\s*[:\-]\s*(.+)/im)
  const nonEmptyLines = text.split('\n').map(clean).filter((l) => l.length > 8)
  const firstLine = nonEmptyLines[0] || ''
  const hook = clean(hookLabelMatch ? hookLabelMatch[1] : firstLine || text.slice(0, 120))

  const hookTriggerPhrases = [
    'what if', 'hear this', 'watch this', 'this is for you', 'nobody told you',
    'stop scrolling', 'listen', 'pay attention', 'you need to hear',
  ]
  const hookTriggerWords = ['you', 'your', 'why', "don't", 'never', 'before', 'when', 'remove']

  let hookScore = 0
  // Length sweet spot: short-form hooks 20-100 chars; long-form up to 160
  const idealMin = isShortForm ? 20 : 25
  const idealMax = isShortForm ? 110 : 160
  if (hook.length >= idealMin && hook.length <= idealMax) hookScore += 9
  else if (hook.length >= 12) hookScore += 5
  // Phrase-level triggers (worth more than single words)
  hookScore += Math.min(6, hookTriggerPhrases.filter((p) => lower.startsWith(p) || hook.toLowerCase().includes(p)).length * 3)
  // Word-level triggers
  hookScore += Math.min(4, hookTriggerWords.filter((w) => hook.toLowerCase().includes(w)).length * 1)
  // Punctuation energy
  if (hook.includes('?') || hook.includes('!') || hook.includes('...')) hookScore += 2
  // Deduct if hook is just a minister name or date line
  if (/^\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(hook)) hookScore = Math.max(0, hookScore - 6)
  hookScore = Math.min(20, hookScore)

  // -- EMOTION (15 pts) -------------------------------------------------------
  // Weighted: high-impact emotional words score more than filler positives
  const highEmotionWords = ['pain', 'tears', 'fear', 'lonely', 'tired', 'broken', 'waiting', 'cry', 'weeping', 'desperate', 'lost']
  const midEmotionWords = ['hope', 'strength', 'victory', 'mercy', 'honour', 'celebrate', 'joy', 'grateful', 'thankful', 'remember', 'legacy']
  const lightEmotionWords = ['love', 'grace', 'encourage', 'birthday', 'bless', 'blessed', 'good']
  const highHits = highEmotionWords.filter((w) => lower.includes(w)).length
  const midHits = midEmotionWords.filter((w) => lower.includes(w)).length
  const lightHits = lightEmotionWords.filter((w) => lower.includes(w)).length
  const emotionScore = Math.min(15, highHits * 4 + midHits * 2 + lightHits * 1)

  // -- SPIRITUAL DEPTH (20 pts) -----------------------------------------------
  // Unique spiritual terms (not word frequency - repeating 'amen' shouldn't inflate this)
  const deepSpiritualTerms = ['holy spirit', 'anointing', 'kingdom', 'glory', 'sanctify', 'intercession', 'prophetic', 'covenant', 'consecrate', 'revival', 'doxazo']
  const coreSpiritualTerms = ['jesus', 'christ', 'lord', 'god', 'prayer', 'scripture', 'faith', 'spirit', 'bible', 'word of god', 'psalm', 'proverbs', 'corinthians']
  const lightSpiritualTerms = ['amen', 'praise', 'hallelujah', 'worship', 'bless', 'name of jesus']
  // Use Set to count unique occurrences, not total frequency
  const deepHits = deepSpiritualTerms.filter((w) => lower.includes(w)).length
  const coreHits = coreSpiritualTerms.filter((w) => lower.includes(w)).length
  const lightSpiritualHits = lightSpiritualTerms.filter((w) => lower.includes(w)).length
  // Bonus: scripture reference present
  const hasScripture = /\d\s*(corinthians|samuel|psalm|john|romans|philippians|matthew|luke|acts|genesis|isaiah|jeremiah|hebrews|james|peter|timothy|revelation)/i.test(text)
  const spiritualScore = Math.min(20, deepHits * 4 + coreHits * 2 + lightSpiritualHits * 1 + (hasScripture ? 3 : 0))

  // -- SHAREABILITY (15 pts) --------------------------------------------------
  const strongSharePhrases = ['needs this', 'send this to', 'share this with', 'tag someone', 'drop this in', 'this is for someone']
  const lightShareWords = ['share', 'tag', 'save', 'send', 'someone', 'friend', 'family', 'believer']
  const strongShareHits = strongSharePhrases.filter((p) => lower.includes(p)).length
  const lightShareHits = lightShareWords.filter((w) => lower.includes(w)).length
  const shareabilityScore = Math.min(15, strongShareHits * 5 + lightShareHits * 2 + (isBirthday ? 2 : 0))

  // -- PLATFORM FIT (15 pts) --------------------------------------------------
  let platformFitScore = 0
  if (isShortForm) {
    // TikTok/Shorts: short captions perform better
    if (text.length >= 60 && text.length <= 500) platformFitScore += 8
    else if (text.length >= 500 && text.length <= 900) platformFitScore += 5
    else if (text.length > 900) platformFitScore += 2
  } else if (isFacebook) {
    // Facebook: longer storytelling content is fine
    if (text.length >= 200 && text.length <= 2200) platformFitScore += 8
    else if (text.length >= 80) platformFitScore += 5
  } else {
    // Instagram/Threads/mixed
    if (text.length >= 80 && text.length <= 1500) platformFitScore += 8
    else if (text.length >= 80) platformFitScore += 5
  }
  if (/#[a-zA-Z]/.test(text)) platformFitScore += 4
  if (/|||||/.test(text)) platformFitScore += 2
  platformFitScore = Math.min(15, platformFitScore)

  // -- CTA (10 pts) -----------------------------------------------------------
  const strongCtaPhrases = ['drop a', 'type amen', 'comment below', 'save this', 'share this', 'tag a friend', 'tag someone']
  const lightCtaWords = ['amen', 'comment', 'follow', 'pray', 'subscribe', 'like']
  const strongCtaHits = strongCtaPhrases.filter((p) => lower.includes(p)).length
  const lightCtaHits = lightCtaWords.filter((w) => lower.includes(w)).length
  const ctaScore = Math.min(10, strongCtaHits * 4 + lightCtaHits * 2)

  // -- CLARITY / STRUCTURE (5 pts) --------------------------------------------
  const hasParagraphBreaks = text.includes('\n\n')
  const hasMinLength = text.length >= 60
  const notTooLong = text.length <= 3000
  const clarityScore = (hasMinLength ? 2 : 0) + (notTooLong ? 1 : 0) + (hasParagraphBreaks ? 2 : 0)

  const score = Math.min(100, Math.round(hookScore + emotionScore + spiritualScore + shareabilityScore + platformFitScore + ctaScore + clarityScore))

  // -- WEAK AREA DETECTION ----------------------------------------------------
  const weak = []
  if (hookScore < 12) weak.push('stronger hook')
  if (emotionScore < 7) weak.push('more emotion')
  if (spiritualScore < 10) weak.push('deeper spiritual language')
  if (shareabilityScore < 6) weak.push('share/save angle')
  if (ctaScore < 4) weak.push('clear call-to-action')
  if (!hasScripture && spiritualScore < 14) weak.push('add a scripture reference')

  // -- LABELS ----------------------------------------------------------------
  // Birthday posts naturally cap lower - adjust threshold
  const publishThreshold = isBirthday ? 72 : 80
  const polishThreshold = isBirthday ? 55 : 65

  let label = 'Rewrite Before Publishing'
  let color = '#ef4444'
  let bg = 'rgba(239,68,68,.12)'
  if (score >= publishThreshold) { label = 'Strong - Publish Ready'; color = '#22c55e'; bg = 'rgba(34,197,94,.12)' }
  else if (score >= polishThreshold) { label = 'Good - Minor Polish Needed'; color = '#facc15'; bg = 'rgba(250,204,21,.12)' }
  else if (score >= 45) { label = 'Needs Improvement'; color = '#f97316'; bg = 'rgba(249,115,22,.12)' }

  return {
    score,
    label,
    color,
    bg,
    hook,
    weak,
    breakdown: [
      { label: 'Hook', score: hookScore, max: 20 },
      { label: 'Emotion', score: emotionScore, max: 15 },
      { label: 'Spiritual Depth', score: spiritualScore, max: 20 },
      { label: 'Shareability', score: shareabilityScore, max: 15 },
      { label: 'Platform Fit', score: platformFitScore, max: 15 },
      { label: 'CTA', score: ctaScore, max: 10 },
      { label: 'Clarity', score: clarityScore, max: 5 },
    ],
    recommendation: weak.length
      ? `Improve: ${weak.join(', ')}.`
      : 'Content is strong enough for manual publishing after final review.',
  }
}

function getDateLabel(value) {
  if (!value) return 'Not scheduled'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return 'Invalid date'
  }
}

function isRepurposedPack(item) {
  const text = `${item.campaign_stage || ''} ${item.content_type || ''} ${item.ministry_name || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('repurposed') || text.includes('repurposing') || text.includes('content pack')
}

function isWeeklyThemePlan(item) {
  const text = `${item.campaign_stage || ''} ${item.content_type || ''} ${item.ministry_name || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('weekly theme') || text.includes('theme plan') || text.includes('anchor scripture')
}

function isWeeklyCalendarPlan(item) {
  const text = `${item.campaign_stage || ''} ${item.content_type || ''} ${item.ministry_name || ''} ${item.content_text || ''}`.toLowerCase()
  return text.includes('weekly calendar') || text.includes('calendar plan') || text.includes('monday') || text.includes('tuesday')
}

function isOldDraftItem(item) {
  if ((item.status || 'draft') !== 'draft') return false
  const created = item.created_at || item.updated_at || item.scheduled_at
  if (!created) return false
  const createdTime = new Date(created).getTime()
  if (!Number.isFinite(createdTime)) return false
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return Date.now() - createdTime > sevenDays
}

function isThisWeekItem(item) {
  const target = item.scheduled_at || item.created_at || item.updated_at
  if (!target) return false
  const date = new Date(target)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  const start = new Date(now)
  const day = start.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return date >= start && date < end
}

function getSmartGroupLabel(item) {
  if (isRepurposedPack(item)) return 'Repurposed Pack'
  if (isWeeklyCalendarPlan(item)) return 'Weekly Calendar'
  if (isWeeklyThemePlan(item)) return 'Weekly Theme'
  if (isMusicItem(item)) return 'Music'
  if (isBirthdayPack(item)) return 'Birthday Campaign'
  if (isReadyMusicPost(item)) return 'Ready Music'
  if (item.status === 'scheduled') return 'Ready to Upload'
  if (isDesignItem(item)) return 'Needs Design'
  if (isVideoItem(item)) return 'Needs Video'
  if (isInternalWorkflowItem(item)) return 'Internal'
  return 'Draft Review'
}

export default function Queue({
  queue = [],
  queueView,
  setQueueView,
  queueFilter,
  setQueueFilter,
  draftCount,
  scheduledCount,
  publishedCount,
  queueSearch,
  setQueueSearch,
  queueSort,
  setQueueSort,
  filteredQueue = [],
  groupedCalendar = {},
  editingPostId,
  setEditingPostId,
  editedContent,
  setEditedContent,
  busy,
  formatLocalDatetimeString,
  updateScheduleDate,
  saveEditedPost,
  duplicateQueueItem,
  updateStatus,
  deleteQueueItem,
  updateQueueItemContent,
  setActiveTab,
  styles = {},
}) {
  const [productionFilter, setProductionFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [quoteLiveUrls, setQuoteLiveUrls] = useState({})
  const [quoteStatsDrafts, setQuoteStatsDrafts] = useState({})

  const card = styles.card || { background: '#0f172a', border: '1px solid #24324a', borderRadius: 18, padding: 18, marginBottom: 18 }
  const smallButton = styles.smallButton || { padding: '8px 12px', borderRadius: 12, border: '1px solid #334155', background: '#111827', color: '#e5e7eb', fontWeight: 800 }
  const activeButton = styles.activeFilterButton || { padding: '8px 12px', borderRadius: 12, border: '1px solid #22c55e', background: '#22c55e', color: '#052e16', fontWeight: 900 }
  const deleteButton = styles.deleteButton || { padding: '8px 12px', borderRadius: 12, border: '1px solid #7f1d1d', background: '#dc2626', color: '#fff', fontWeight: 900 }
  const search = styles.search || { width: '100%', padding: 14, borderRadius: 14, border: '1px solid #334155', background: '#020617', color: '#f8fafc' }
  const dateInput = styles.dateInput || { width: '100%', padding: 12, borderRadius: 14, border: '1px solid #334155', background: '#020617', color: '#f8fafc' }
  const textarea = styles.textarea || { width: '100%', minHeight: 120, padding: 12, borderRadius: 12, border: '1px solid #334155', background: '#020617', color: '#f8fafc' }

  const birthdayPackCount = queue.filter(isBirthdayPack).length
  const designCount = queue.filter((item) => item.status !== 'published' && isDesignItem(item)).length
  const videoCount = queue.filter((item) => item.status !== 'published' && isVideoItem(item)).length
  const checklistCount = queue.filter(isChecklistItem).length
  const musicCount = queue.filter(isMusicItem).length
  const musicBriefCount = queue.filter(isMusicBrief).length
  const readyMusicCount = queue.filter(isReadyMusicPost).length
  const quoteCount = queue.filter(isQuoteItem).length
  const quoteBriefCount = queue.filter(isQuoteBrief).length
  const readyQuoteCount = queue.filter(isReadyQuotePost).length
  const quoteSourceReviewCount = queue.filter(isQuoteNeedsSourceReview).length
  const quoteNeedsUrlCount = queue.filter(isQuotePublishedNeedsUrl).length
  const quoteNeedsStatsCount = queue.filter(isQuoteNeedsStats).length
  const quoteWinnerCount = queue.filter(isQuoteWinner).length
  const readyCount = queue.filter((item) => item.status === 'scheduled').length
  const repurposedPackCount = queue.filter(isRepurposedPack).length
  const weeklyThemeCount = queue.filter(isWeeklyThemePlan).length
  const weeklyCalendarCount = queue.filter(isWeeklyCalendarPlan).length
  const oldDraftCount = queue.filter(isOldDraftItem).length
  const thisWeekCount = queue.filter(isThisWeekItem).length
  const scoreableQueue = queue.filter((item) => isPublicFacingContent(item) && !isMusicBrief(item) && !isQuoteBrief(item))
  const internalWorkflowCount = queue.filter(isInternalWorkflowItem).length
  const urgentBirthdayCount = queue.filter(isUrgentBirthdayItem).length
  const timingFixCount = queue.filter(needsBirthdayTimingFix).length
  // Thresholds match getContentQuality: birthday posts publish at 72+, others at 80+
  const strongQualityCount = scoreableQueue.filter((item) => {
    const q = getContentQuality(item)
    const threshold = isBirthdayPack(item) ? 72 : 80
    return q.score >= threshold
  }).length
  const needsPolishCount = scoreableQueue.filter((item) => {
    const q = getContentQuality(item)
    const threshold = isBirthdayPack(item) ? 72 : 80
    return q.score >= 45 && q.score < threshold
  }).length
  const rewriteCount = scoreableQueue.filter((item) => getContentQuality(item).score < 45).length

  const productionFilteredQueue = useMemo(() => {
    return filteredQueue.filter((item) => {
      if (productionFilter === 'all') return true
      if (productionFilter === 'birthday') return isBirthdayPack(item)
      if (productionFilter === 'design') return isDesignItem(item)
      if (productionFilter === 'video') return isVideoItem(item)
      if (productionFilter === 'checklist') return isChecklistItem(item)
      if (productionFilter === 'music') return isMusicItem(item)
      if (productionFilter === 'music-brief') return isMusicBrief(item)
      if (productionFilter === 'ready-music') return isReadyMusicPost(item)
      if (productionFilter === 'quotes') return isQuoteItem(item)
      if (productionFilter === 'quote-brief') return isQuoteBrief(item)
      if (productionFilter === 'ready-quote') return isReadyQuotePost(item)
      if (productionFilter === 'quote-needs-url') return isQuotePublishedNeedsUrl(item)
      if (productionFilter === 'quote-needs-stats') return isQuoteNeedsStats(item)
      if (productionFilter === 'quote-winners') return isQuoteWinner(item)
      if (productionFilter === 'quote-source-review') return isQuoteNeedsSourceReview(item)
      if (productionFilter === 'ready') return item.status === 'scheduled'
      if (productionFilter === 'repurposed') return isRepurposedPack(item)
      if (productionFilter === 'weekly-theme') return isWeeklyThemePlan(item)
      if (productionFilter === 'weekly-calendar') return isWeeklyCalendarPlan(item)
      if (productionFilter === 'this-week') return isThisWeekItem(item)
      if (productionFilter === 'hide-old-drafts') return !isOldDraftItem(item)
      if (productionFilter === 'manual') return isBirthdayPack(item) && item.status !== 'published'
      if (productionFilter === 'quality-ready') {
        const threshold = isBirthdayPack(item) ? 72 : 80
        return isPublicFacingContent(item) && getContentQuality(item).score >= threshold
      }
      if (productionFilter === 'needs-polish') {
        const threshold = isBirthdayPack(item) ? 72 : 80
        return isPublicFacingContent(item) && getContentQuality(item).score < threshold
      }
      if (productionFilter === 'internal') return isInternalWorkflowItem(item)
      if (productionFilter === 'urgent') return isUrgentBirthdayItem(item) || isBirthdayToday(item)
      if (productionFilter === 'timing-fix') return needsBirthdayTimingFix(item)
      return true
    })
  }, [filteredQueue, productionFilter])

  async function copyContent(item) {
    const text = clean(item.content_text)
    if (!text) return alert('No content to copy')
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard')
    } catch {
      alert('Copy failed. Open the post and copy manually.')
    }
  }

  async function copyQualityRewritePrompt(item) {
    const q = getContentQuality(item)
    if (q.skip) {
      await copyCaptionGenerationPrompt(item)
      return
    }
    const platform = item.platform || 'TikTok, YouTube Shorts, Instagram, Facebook and Threads'
    const minister = item.minister_name || 'the minister'
    const contentType = item.content_type || item.campaign_stage || 'social media post'
    const weakList = q.weak.length ? q.weak.join(', ') : 'minor polish only'

    const prompt = `You are a Christian short-form content editor for "Yearning for God" - a Psalm 42-inspired Christian media channel.

Improve this post before publishing.

Minister: ${minister}
Platform: ${platform}
Content type: ${contentType}
Current score: ${q.score}/100
Weak areas: ${weakList}

Rules:
- Keep it biblical, honouring, and emotionally strong.
- Make the very first line a scroll-stopping hook - it must make someone pause mid-scroll.
- Include a clear CTA (e.g. drop a , type Amen, share this, tag someone who needs this).
- Add a share/save angle - give people a reason to send this to someone else.
- Use deep spiritual language grounded in the Word, not just generic Christian phrases.
- Where possible, include or reference a relevant scripture.
- Do not invent unverified facts about the minister.
- Match the platform: ${platform.toLowerCase().includes('tiktok') || platform.toLowerCase().includes('youtube') ? 'keep it punchy and short - TikTok/Shorts captions should be under 500 characters.' : 'Facebook can go longer with story and depth.'}

POST TO IMPROVE:
${item.content_text || ''}

Return only:
1. The improved post text
2. Poster text (8 words max) if relevant
3. Hashtag set`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Rewrite prompt copied - paste it into Claude to improve this post.')
    } catch {
      alert('Copy failed. Open the post manually and copy the content.')
    }
  }

  async function copyCaptionGenerationPrompt(item) {
    const minister = item.minister_name || 'the minister'
    const platform = item.platform || 'Facebook, Instagram, TikTok, YouTube Shorts and Threads'
    const stage = item.campaign_stage || item.content_type || 'Birthday Campaign'

    const prompt = `You are a Christian social media content strategist for "Yearning for God" - a Psalm 42-inspired Christian media channel.

This queue item is an internal workflow/checklist. Turn it into a full publish-ready caption set.

Minister: ${minister}
Platform: ${platform}
Campaign stage: ${stage}

Internal item details:
${item.content_text || ''}

Write captions for TikTok and YouTube Shorts first. Also include optional Instagram, Facebook, and Threads captions.

Rules:
- Spirit-filled, clear, and Kingdom-focused.
- Make the very first line a scroll-stopping hook.
- Include a clear CTA (drop a , type Amen, share, save, tag someone).
- Include a share/save angle - give people a reason to forward it.
- Use deep spiritual language grounded in the Word.
- Do not invent unverified facts about the minister.
- Do not mention this came from a checklist or internal system.
- Make it suitable for manual publishing today if the birthday is urgent.

Return ONLY valid JSON in this format:
{
  "tiktok": "caption for TikTok",
  "youtube": { "title": "YouTube Shorts title", "description": "YouTube Shorts description" },
  "instagram": "caption for Instagram Reels",
  "facebook": "caption for Facebook",
  "threads": "caption for Threads",
  "firstComment": "first comment with full sermon/source link",
  "hashtags": "#YearningForGod #ChristianTikTok #YouTubeShorts #Faith #Prayer #Jesus",
  "bestTime": "7:00 AM / 12:00 PM / 7:00 PM"
}`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Caption generation prompt copied - paste it into Claude to create the full caption set.')
    } catch {
      alert('Copy failed. Open manually and copy the item details.')
    }
  }


  async function copyMusicCaptionPrompt(item) {
    const platform = item.platform || 'Instagram / Facebook / YouTube Shorts / TikTok'
    const prompt = `You are a Christian music content strategist for Yearning for God.

Turn this music production brief into a publish-ready music post.

Platform: ${platform}
Music item: ${item.content_type || 'Music Post'}
Campaign stage: ${item.campaign_stage || 'Weekly Music Plan'}

Brief:
${item.content_text || ''}

Rules:
- Keep it worshipful, biblical, and simple for one person using a phone.
- Do not recommend uploading copyrighted full songs without permission.
- Use platform-approved audio, original music, licensed music, or safe background tracks.
- First line must be a strong hook.
- Include a short caption, poster/video text, CTA, hashtags, and tracking note.
- Do not copy long song lyrics.

Return in this format:
PUBLIC MUSIC CAPTION:
[caption]

POSTER / VIDEO TEXT:
[text]

SAFE AUDIO NOTE:
[note]

HASHTAGS:
[hashtags]

NEXT ACTION:
[design/video/upload instruction]`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Music caption prompt copied - paste it into Claude/ChatGPT.')
    } catch {
      alert('Copy failed. Open manually and copy the item details.')
    }
  }

  async function copyWeeklyRecapPrompt(item) {
    const prompt = `You are a Christian media editor for Yearning for God.

Create a weekly recap music post from this brief.

Brief:
${item.content_text || ''}

Goal:
Combine the strongest posts from the week into one worshipful recap.

Rules:
- One person using a phone.
- Use 3 to 5 best screenshots or short clips.
- Use platform-approved audio or licensed/original background music.
- Do not upload copyrighted full songs directly.
- Make the caption summarize the spiritual message of the week.
- Include a CTA asking which post blessed people most.

Return:
1. Recap video structure
2. Caption
3. On-screen text
4. Safe audio direction
5. Hashtags
6. What to track after posting`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Weekly recap prompt copied.')
    } catch {
      alert('Copy failed. Open manually and copy the item details.')
    }
  }

  function draftReadyMusicCaption(item) {
    const title = item.content_type || 'Music Post'
    const text = `PUBLIC MUSIC CAPTION:
This week, let every sound, message, and moment draw your heart back to God.

Take a moment to pause, worship, and remember that the Lord is still working through every season.

Which post or message blessed you most this week?

POSTER / VIDEO TEXT:
Worship. Reflect. Return to God.

SAFE AUDIO NOTE:
Use platform-approved audio, original music, licensed music, or safe background tracks. Do not upload copyrighted full songs directly.

HASHTAGS:
#YearningForGod #ChristianMusic #Worship #Faith #Jesus #ChristianContent

NEXT ACTION:
Create the design/video asset, then mark this item Ready/Scheduled after final review.

Original brief:
${item.content_text || title}`
    setEditingPostId(item.id)
    setEditedContent(text)
    alert('Publish-ready music caption draft inserted. Review it, then tap Save Edit.')
  }

  function markReadyMusicPost(item) {
    if (!item.scheduled_at) {
      alert('Please choose a schedule date/time first. Then click Ready Music Post again.')
      return
    }
    if (isMusicBrief(item)) {
      const ok = confirm('This still looks like a music brief. Generate/save a public music caption first?')
      if (!ok) return
    }
    updateStatus(item.id, 'scheduled')
  }


  async function copyQuoteCaptionPrompt(item) {
    const platform = item.platform || 'Facebook / Instagram / Threads'
    const prompt = `You are a Christian quote editor for Yearning for God.

Turn this quote draft into a publish-ready daily quote post.

Platform: ${platform}
Minister / Author: ${item.minister_name || 'Unknown'}
Content type: ${item.content_type || 'Daily Quote Post'}
Campaign stage: ${item.campaign_stage || 'Independent Daily Quote'}

Quote draft / source details:
${item.content_text || ''}

Rules:
- Keep the quote short and properly attributed.
- Do not invent the source, book title, page number, or exact wording.
- If the source is uncertain, clearly mark it as: Source needs verification.
- Add a short 2 to 4 line Christian reflection after the quote.
- Add a simple CTA such as: Save this, share this, or meditate on this today.
- Do not copy long copyrighted passages from a book.
- Keep it independent from the normal 25 posts/day content plan.

Return in this format:
PUBLIC QUOTE CAPTION:
[caption]

POSTER TEXT:
[short quote text]

SOURCE NOTE:
[verified / needs source review]

HASHTAGS:
[hashtags]

NEXT ACTION:
[design/upload instruction]`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Quote caption prompt copied - paste it into Claude/ChatGPT.')
    } catch {
      alert('Copy failed. Open manually and copy the quote details.')
    }
  }

  function draftReadyQuoteCaption(item) {
    const raw = item.content_text || ''
    const minister = item.minister_name || 'the minister'
    const text = `PUBLIC QUOTE CAPTION:
"${truncate(raw.replace(/^Daily Christian Quote\s*/i, '').replace(/Source:.*/is, ''), 220)}"

- ${minister}

A short word can become a daily reminder when it leads the heart back to God.
Take this as a call to pause, reflect, and realign your heart with the Lord today.

Save this quote and share it with someone who needs encouragement.

POSTER TEXT:
A quote for your walk with God.

SOURCE NOTE:
Needs source review before final public posting. Confirm exact wording, book/title/page if available.

HASHTAGS:
#YearningForGod #ChristianQuotes #Faith #Jesus #ChristianLiving #DailyQuote

NEXT ACTION:
Create a simple quote design asset, confirm the source, then mark this item Ready Quote Post.

Original quote/source details:
${raw}`
    setEditingPostId(item.id)
    setEditedContent(text)
    alert('Publish-ready quote caption draft inserted. Review it, verify source, then tap Save Edit.')
  }

  function markQuoteNeedsSourceReview(item) {
    const text = `SOURCE REVIEW NEEDED:
Please verify the exact wording, minister/author, book title, chapter/page/location before publishing.

${item.content_text || ''}`
    setEditingPostId(item.id)
    setEditedContent(text)
    alert('Source review note inserted. Tap Save Edit to keep it.')
  }

  function markReadyQuotePost(item) {
    if (!item.scheduled_at) {
      alert('Please choose a schedule date/time first. Then click Ready Quote Post again.')
      return
    }
    if (isQuoteNeedsSourceReview(item)) {
      const ok = confirm('This quote still needs source review. Continue only if you have verified it.')
      if (!ok) return
    }
    if (isQuoteBrief(item)) {
      const ok = confirm('This still looks like a quote draft. Generate/save a public quote caption first?')
      if (!ok) return
    }
    updateStatus(item.id, 'scheduled')
  }




  async function markQuoteManuallyPosted(item) {
    if (!updateQueueItemContent) {
      updateStatus(item.id, 'published')
      return
    }

    const liveUrl = clean(quoteLiveUrls[item.id] || extractLiveUrl(item))
    if (!liveUrl) {
      const ok = confirm('No live URL was pasted yet. Mark quote as posted without URL? You can add the URL later.')
      if (!ok) return
    }

    const now = new Date().toISOString()
    const trackingBlock = [
      '',
      '---',
      'QUOTE PUBLISHING TRACKING V1',
      `Manual posting status: Posted`,
      `Posted at: ${now}`,
      `Live URL: ${liveUrl || 'Needs live URL'}`,
      `24h stats due: ${addDaysIsoString(1)}`,
      `7d stats due: ${addDaysIsoString(7)}`,
      '24h stats status: Due',
      '7d stats status: Due',
      'Tracking note: This quote post is independent from the normal 25 posts/day plan.',
    ].join('\n')

    const nextText = hasQuoteTrackingBlock(item)
      ? item.content_text
      : `${item.content_text || ''}
${trackingBlock}`

    await updateQueueItemContent(item.id, {
      content_text: nextText,
      status: 'published',
      campaign_stage: item.campaign_stage || 'Independent Daily Quote - Posted',
    })
  }

  async function saveQuoteLiveUrl(item) {
    if (!updateQueueItemContent) return alert('Queue update helper is not available.')
    const liveUrl = clean(quoteLiveUrls[item.id] || extractLiveUrl(item))
    if (!liveUrl) return alert('Paste the live post URL first.')

    const now = new Date().toISOString()
    const trackingBlock = [
      '',
      '---',
      'QUOTE PUBLISHING TRACKING V1',
      `Manual posting status: URL Saved`,
      `URL saved at: ${now}`,
      `Live URL: ${liveUrl}`,
      `24h stats due: ${addDaysIsoString(1)}`,
      `7d stats due: ${addDaysIsoString(7)}`,
      '24h stats status: Due',
      '7d stats status: Due',
    ].join('\n')

    const nextText = hasQuoteTrackingBlock(item)
      ? `${item.content_text || ''}
Live URL Updated: ${liveUrl}
URL update time: ${now}`
      : `${item.content_text || ''}
${trackingBlock}`

    await updateQueueItemContent(item.id, { content_text: nextText })
  }

  async function saveQuotePerformanceStats(item) {
    if (!updateQueueItemContent) return alert('Queue update helper is not available.')
    const draft = quoteStatsDrafts[item.id] || {}
    const reach = parseNumber(draft.reach)
    const likes = parseNumber(draft.likes)
    const comments = parseNumber(draft.comments)
    const shares = parseNumber(draft.shares)
    const saves = parseNumber(draft.saves)
    const follows = parseNumber(draft.follows)
    const stage = draft.stage || '24h'

    if (!reach && !likes && !comments && !shares && !saves && !follows) {
      alert('Enter at least one stat before saving.')
      return
    }

    const repeatCandidate = shares >= 10 || saves >= 10 || follows >= 3 || reach >= 1000
    const now = new Date().toISOString()
    const statsBlock = [
      '',
      '---',
      'QUOTE PERFORMANCE TRACKING V1',
      `Stats stage: ${stage}`,
      `Stats recorded at: ${now}`,
      `Reach / Views: ${reach}`,
      `Likes: ${likes}`,
      `Comments: ${comments}`,
      `Shares: ${shares}`,
      `Saves: ${saves}`,
      `Follows gained: ${follows}`,
      `${stage === '24h' ? '24h stats recorded: Yes' : '24h stats recorded: Pending or previously recorded'}`,
      `${stage === '7d' ? '7d stats recorded: Yes' : '7d stats recorded: Pending'}`,
      `Repeat candidate: ${repeatCandidate ? 'Yes' : 'No'}`,
      `Quote winner: ${repeatCandidate ? 'Yes' : 'No'}`,
      repeatCandidate ? 'Repeat this quote style: Use same author/theme/design tone/caption angle.' : 'Review note: Keep learning. Do not repeat this style yet unless it supports the weekly theme.',
    ].join('\n')

    await updateQueueItemContent(item.id, { content_text: `${item.content_text || ''}
${statsBlock}` })
  }

  function updateQuoteStatsDraft(itemId, field, value) {
    setQuoteStatsDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [field]: value,
      },
    }))
  }

  async function copyRepeatQuoteStylePrompt(item) {
    const prompt = `You are a Christian social media growth strategist for Yearning for God.

Create 5 new quote post ideas similar to this winning quote post.

Original queue item:
${item.content_text || ''}

Rules:
- Keep the content as independent daily quote posts, separate from the normal 25 posts/day plan.
- Do not invent false attributions, book titles, page numbers, or exact quotes.
- Use verified quotes only, or clearly mark source needs verification.
- Keep each quote short enough for a clean image design.
- Include author/ministry/source note, caption direction, poster text, Canva design direction, and platform suggestion.
- Prioritize shares, saves, spiritual reflection, and simple mobile production.

Return:
1. Five similar quote post ideas
2. Canva prompt for each
3. Caption angle for each
4. Tracking note for what to measure after posting`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Repeat Quote Style prompt copied.')
    } catch {
      alert('Copy failed. Open manually and copy the post details.')
    }
  }

  async function copyTodayHonourPrompt(item) {
    const minister = item.minister_name || 'the minister'
    const platform = item.platform || 'Facebook, Instagram, TikTok, YouTube Shorts and Threads'
    const prompt = `You are a Christian social media content editor for "Yearning for God".

The birthday is today, so do NOT write a countdown post. Turn this queue item into a publish-ready birthday honour post.

Minister: ${minister}
Platform: ${platform}

Original queue item:
${item.content_text || ''}

Rules:
- First line must be a scroll-stopping hook.
- Honour the minister without inventing unverified facts.
- Make the tone biblical, warm, and emotionally strong.
- Include a short prayer/blessing.
- Include a clear CTA: Amen, share, save, or tag someone.
- Include poster text and hashtags.
- Do not mention internal workflow, checklist, source review, or countdown.

Return only:
1. Improved post text
2. Poster text
3. Hashtag set`

    try {
      await navigator.clipboard.writeText(prompt)
      alert('Today honour prompt copied - paste it into Claude/ChatGPT.')
    } catch {
      alert('Copy failed. Open manually and copy the item details.')
    }
  }

  function convertToTodayHonourPost(item) {
    setEditingPostId(item.id)
    setEditedContent(buildTodayHonourPost(item))
    alert('Converted into a Birthday Today Honour Post draft. Review it, then tap Save Edit.')
  }

  function markReady(item) {
    if (!item.scheduled_at) {
      alert('Please choose a schedule date/time first. Then click Ready/Scheduled again.')
      return
    }
    const quality = getContentQuality(item)
    if (!quality.skip && quality.score < 70) {
      const ok = confirm(`This post quality score is ${quality.score}/100 (${quality.label}). Mark ready anyway?`)
      if (!ok) return
    }
    updateStatus(item.id, 'scheduled')
  }


  function readMediaAssets() {
    try {
      const saved = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '[]')
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  }

  function writeMediaAssets(nextAssets) {
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(nextAssets))
  }

  function getSuggestedAssetTitle(item, assetType) {
    const minister = clean(item.minister_name) || 'Yearning for God'
    const stage = clean(item.campaign_stage || item.content_type) || 'Campaign Asset'
    return `${minister} - ${stage} - ${assetType}`
  }

  function createLinkedAsset(item, assetType) {
    const assets = readMediaAssets()
    const title = getSuggestedAssetTitle(item, assetType)
    const duplicate = assets.find((asset) => String(asset.related_queue_id || '') === String(item.id) && asset.asset_type === assetType)

    if (duplicate) {
      alert(`${assetType} already exists in Media Library for this queue item.`)
      if (setActiveTab) setActiveTab('media-library')
      return
    }

    const status = assetType.includes('Caption') ? 'In Progress' : 'Needed'
    const notes = [
      `Created from Queue item ID: ${item.id}`,
      `Queue status: ${item.status || 'draft'}`,
      `Campaign stage: ${item.campaign_stage || item.content_type || 'N/A'}`,
      '',
      'Production checklist:',
      '- Create or locate the asset',
      '- Save the file location / Google Drive link / CapCut export name',
      '- Mark asset Ready when finished',
      '- Return to Queue and move item to Ready/Scheduled or Published after manual upload.',
    ].join('\n')

    const newAsset = {
      id: `asset_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      title,
      asset_type: assetType,
      related_minister: item.minister_name || '',
      related_campaign: item.campaign_stage || item.content_type || 'Queue Campaign',
      related_queue_id: String(item.id || ''),
      file_location: '',
      status,
      platform: item.platform || '',
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'queue',
    }

    writeMediaAssets([newAsset, ...assets])
    alert(`${assetType} request created in Media Library.`)
    if (setActiveTab) setActiveTab('media-library')
  }

  function getLinkedAssetCount(item) {
    return readMediaAssets().filter((asset) => String(asset.related_queue_id || '') === String(item.id)).length
  }

  function openMediaLibrary() {
    if (setActiveTab) setActiveTab('media-library')
    else alert('Open the Media Library tab from the navigation menu.')
  }

  const statusButtons = [
    { key: 'all', label: `All (${queue.length})` },
    { key: 'draft', label: `Draft (${draftCount})` },
    { key: 'scheduled', label: `Scheduled (${scheduledCount})` },
    { key: 'published', label: `Published (${publishedCount})` },
  ]

  const productionButtons = [
    { key: 'all', label: 'All Work' },
    { key: 'birthday', label: `Birthday Pack (${birthdayPackCount})` },
    { key: 'design', label: `Needs Design (${designCount})` },
    { key: 'video', label: `Needs Video (${videoCount})` },
    { key: 'checklist', label: `Checklist (${checklistCount})` },
    { key: 'music', label: `Music (${musicCount})` },
    { key: 'music-brief', label: `Music Briefs (${musicBriefCount})` },
    { key: 'ready-music', label: `Ready Music (${readyMusicCount})` },
    { key: 'quotes', label: `Quotes (${quoteCount})` },
    { key: 'quote-brief', label: `Quote Drafts (${quoteBriefCount})` },
    { key: 'quote-source-review', label: `Source Review (${quoteSourceReviewCount})` },
    { key: 'ready-quote', label: `Ready Quotes (${readyQuoteCount})` },
    { key: 'quote-needs-url', label: `Quote Needs URL (${quoteNeedsUrlCount})` },
    { key: 'quote-needs-stats', label: `Quote Stats Due (${quoteNeedsStatsCount})` },
    { key: 'quote-winners', label: `Quote Winners (${quoteWinnerCount})` },
    { key: 'ready', label: `Ready (${readyCount})` },
    { key: 'repurposed', label: `Repurposed (${repurposedPackCount})` },
    { key: 'weekly-theme', label: `Weekly Theme (${weeklyThemeCount})` },
    { key: 'weekly-calendar', label: `Weekly Calendar (${weeklyCalendarCount})` },
    { key: 'this-week', label: `This Week (${thisWeekCount})` },
    { key: 'hide-old-drafts', label: `Hide Old Drafts (${oldDraftCount})` },
    { key: 'manual', label: 'Manual Workflow' },
    { key: 'urgent', label: `Urgent Today (${urgentBirthdayCount})` },
    { key: 'timing-fix', label: `Timing Fix (${timingFixCount})` },
    { key: 'quality-ready', label: `Quality Ready (${strongQualityCount})` },
    { key: 'needs-polish', label: `Needs Polish (${needsPolishCount + rewriteCount})` },
    { key: 'internal', label: `Internal (${internalWorkflowCount})` },
  ]

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 6 }}>Content Queue Production Center</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Review, design, schedule, and manually publish every saved post. Online auto-publishing remains disabled/safe.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Total Items', value: queue.length, color: '#f8fafc' },
          { label: 'Birthday Pack', value: birthdayPackCount, color: '#f472b6' },
          { label: 'Needs Design', value: designCount, color: '#f472b6' },
          { label: 'Needs Video', value: videoCount, color: '#a78bfa' },
          { label: 'Music Briefs', value: musicBriefCount, color: '#38bdf8' },
          { label: 'Ready Music', value: readyMusicCount, color: '#22c55e' },
          { label: 'Quote Drafts', value: quoteBriefCount, color: '#38bdf8' },
          { label: 'Ready Quotes', value: readyQuoteCount, color: '#22c55e' },
          { label: 'Quote URLs Needed', value: quoteNeedsUrlCount, color: '#f97316' },
          { label: 'Quote Stats Due', value: quoteNeedsStatsCount, color: '#facc15' },
          { label: 'Quote Winners', value: quoteWinnerCount, color: '#22c55e' },
          { label: 'Ready/Scheduled', value: readyCount, color: '#facc15' },
          { label: 'Repurposed', value: repurposedPackCount, color: '#38bdf8' },
          { label: 'Weekly Plans', value: weeklyThemeCount + weeklyCalendarCount, color: '#a78bfa' },
          { label: 'This Week', value: thisWeekCount, color: '#22c55e' },
          { label: 'Quality Ready', value: strongQualityCount, color: '#22c55e' },
          { label: 'Rewrite', value: rewriteCount, color: '#ef4444' },
          { label: 'Timing Fix', value: timingFixCount, color: '#f97316' },
          { label: 'Internal Items', value: internalWorkflowCount, color: '#38bdf8' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: 11, fontWeight: 900, letterSpacing: 1 }}>{stat.label}</div>
            <div style={{ color: stat.color, fontSize: 30, fontWeight: 900, marginTop: 6 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, background: 'linear-gradient(135deg, #0f172a, #111827)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <button style={queueView === 'list' ? activeButton : smallButton} onClick={() => setQueueView('list')}>List View</button>
          <button style={queueView === 'calendar' ? activeButton : smallButton} onClick={() => setQueueView('calendar')}>Calendar View</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {statusButtons.map((btn) => (
            <button key={btn.key} style={queueFilter === btn.key ? activeButton : smallButton} onClick={() => setQueueFilter(btn.key)}>{btn.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {productionButtons.map((btn) => (
            <button key={btn.key} style={productionFilter === btn.key ? activeButton : smallButton} onClick={() => setProductionFilter(btn.key)}>{btn.label}</button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search queue by minister, platform, campaign stage, content type..."
          value={queueSearch}
          onChange={(e) => setQueueSearch(e.target.value)}
          style={search}
        />

        <div style={{ marginTop: 12 }}>
          <select value={queueSort} onChange={(e) => setQueueSort(e.target.value)} style={dateInput}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="schedule">Schedule Date</option>
          </select>
        </div>

        <p style={{ color: '#94a3b8', marginBottom: 0 }}>
          Showing {productionFilteredQueue.length} posts - Birthday campaign items visible: {productionFilteredQueue.filter(isBirthdayPack).length}
        </p>
      </div>


      <div style={{ ...card, background: 'linear-gradient(135deg, rgba(34,197,94,.10), rgba(56,189,248,.08))', borderColor: '#14532d' }}>
        <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Queue Smart Groups</h3>
        <p style={{ color: '#94a3b8', marginTop: 0 }}>
          Use these groups to manage 200+ queue items on mobile without scrolling endlessly.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {[
            { label: 'Repurposed Packs', key: 'repurposed', value: repurposedPackCount },
            { label: 'Weekly Theme', key: 'weekly-theme', value: weeklyThemeCount },
            { label: 'Weekly Calendar', key: 'weekly-calendar', value: weeklyCalendarCount },
            { label: 'Music Items', key: 'music', value: musicCount },
            { label: 'Quote Items', key: 'quotes', value: quoteCount },
            { label: 'Source Review', key: 'quote-source-review', value: quoteSourceReviewCount },
            { label: 'Quote Needs URL', key: 'quote-needs-url', value: quoteNeedsUrlCount },
            { label: 'Quote Stats Due', key: 'quote-needs-stats', value: quoteNeedsStatsCount },
            { label: 'Quote Winners', key: 'quote-winners', value: quoteWinnerCount },
            { label: 'Birthday Campaigns', key: 'birthday', value: birthdayPackCount },
            { label: 'Ready Upload', key: 'ready', value: readyCount },
            { label: 'Needs Design', key: 'design', value: designCount },
            { label: 'Needs Video', key: 'video', value: videoCount },
          ].map((group) => (
            <button
              key={group.key}
              style={{ ...smallButton, textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 8 }}
              onClick={() => setProductionFilter(group.key)}
            >
              <span>{group.label}</span>
              <strong>{group.value}</strong>
            </button>
          ))}
        </div>
      </div>

      {queueView === 'list' && (
        <>
          {productionFilteredQueue.length === 0 && (
            <div style={card}>
              <p style={{ color: '#94a3b8', margin: 0 }}>No queue items match this filter.</p>
            </div>
          )}

          {productionFilteredQueue.map((item) => {
            const workflow = getWorkflowLabel(item)
            const expanded = expandedId === item.id
            const isEditing = editingPostId === item.id
            const birthdayPack = isBirthdayPack(item)
            const quality = getContentQuality(item)
            const birthdayTiming = getBirthdayTiming(item)
            return (
              <div key={item.id} style={{ ...card, borderColor: birthdayPack ? '#f472b6' : '#24324a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <h3 style={{ color: '#f8fafc', marginTop: 0, marginBottom: 8 }}>{item.content_type || 'Untitled Content'}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      <span style={{ background: '#1e293b', color: '#e2e8f0', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 800 }}>{getPlatformBadge(item.platform)}</span>
                      <span style={{ background: workflow.bg, color: workflow.color, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>{workflow.label}</span>
                      <span style={{ background: 'rgba(56,189,248,.12)', color: '#7dd3fc', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>{getSmartGroupLabel(item)}</span>
                      {birthdayPack && <span style={{ background: 'rgba(244,114,182,.14)', color: '#f472b6', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>Birthday Pack</span>}
                      <span style={{ background: '#020617', color: '#94a3b8', borderRadius: 999, padding: '4px 10px', fontSize: 12 }}>Status: {item.status || 'draft'}</span>
                      {(isUrgentBirthdayItem(item) || isBirthdayToday(item)) && <span style={{ background: 'rgba(239,68,68,.15)', color: '#fca5a5', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>Urgent Today</span>}
                      {needsBirthdayTimingFix(item) && <span style={{ background: 'rgba(249,115,22,.15)', color: '#fdba74', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>Timing Fix Needed</span>}
                      {birthdayTiming.hasBirthday && birthdayTiming.label && !needsBirthdayTimingFix(item) && <span style={{ background: 'rgba(14,165,233,.12)', color: '#7dd3fc', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>{birthdayTiming.label}</span>}
                      {quality.skip ? (
                        <span style={{ background: quality.bg, color: quality.color, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>No Viral Score Needed</span>
                      ) : (
                        <span style={{ background: quality.bg, color: quality.color, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>Quality: {quality.score}/100</span>
                      )}
                    </div>
                    <p style={{ color: '#cbd5e1', margin: '4px 0' }}><strong>Minister:</strong> {item.minister_name || 'Yearning for God'}</p>
                    {item.campaign_stage && <p style={{ color: '#94a3b8', margin: '4px 0' }}><strong>Campaign Stage:</strong> {item.campaign_stage}</p>}
                    <p style={{ color: '#94a3b8', margin: '4px 0' }}><strong>Scheduled:</strong> {getDateLabel(item.scheduled_at)}</p>
                  </div>
                  <button style={smallButton} onClick={() => setExpandedId(expanded ? null : item.id)}>{expanded ? 'Collapse' : 'Open'}</button>
                </div>

                {!expanded && (
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 10 }}>{truncate(item.content_text, 180)}</p>
                    {!quality.skip && (
                      <div style={{ height: 6, background: '#1e293b', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
                        <div style={{ height: '100%', width: `${quality.score}%`, background: quality.color }} />
                      </div>
                    )}
                    {quality.skip && (
                      <p style={{ color: '#7dd3fc', fontSize: 12, margin: '8px 0 0' }}>Production brief - generate the public caption before scoring.</p>
                    )}
                  </div>
                )}

                {expanded && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 800 }}>Schedule date/time</label>
                    <input
                      type="datetime-local"
                      value={formatLocalDatetimeString(item.scheduled_at)}
                      onChange={(e) => updateScheduleDate(item.id, e.target.value)}
                      style={{ ...dateInput, marginTop: 6, marginBottom: 10 }}
                      disabled={busy}
                    />

                    {isEditing ? (
                      <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} style={textarea} />
                    ) : (
                      <textarea value={item.content_text || ''} readOnly style={textarea} />
                    )}

                    {needsBirthdayTimingFix(item) && (
                      <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: '1px solid rgba(249,115,22,.45)', background: 'rgba(249,115,22,.10)' }}>
                        <strong style={{ color: '#fdba74' }}>Birthday Timing Fix Needed</strong>
                        <p style={{ color: '#cbd5e1', fontSize: 12, margin: '6px 0 10px' }}>
                          This item is a countdown or preparation note, but the birthday timing has changed. Do not publish it as-is.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <button style={activeButton} onClick={() => convertToTodayHonourPost(item)}>Convert to Today Honour Post</button>
                          <button style={smallButton} onClick={() => copyTodayHonourPrompt(item)}>Copy Today Honour Prompt</button>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: `1px solid ${quality.color}`, background: quality.bg }}>
                      {quality.skip ? (
                        <div>
                          <strong style={{ color: quality.color }}>{quality.label}</strong>
                          <p style={{ color: '#cbd5e1', fontSize: 12, margin: '6px 0 10px' }}>{quality.recommendation}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button style={activeButton} onClick={() => copyCaptionGenerationPrompt(item)}>Generate Caption From Brief</button>
                            <button style={smallButton} onClick={() => copyContent(item)}>Copy Internal Details</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                              <strong style={{ color: quality.color }}>Content Quality Score: {quality.score}/100</strong>
                              <p style={{ color: '#cbd5e1', fontSize: 12, margin: '4px 0 0' }}>{quality.label} - {quality.recommendation}</p>
                            </div>
                            <button style={smallButton} onClick={() => copyQualityRewritePrompt(item)}>Copy AI Rewrite Prompt</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginTop: 10 }}>
                            {quality.breakdown.map((part) => (
                              <div key={part.label} style={{ background: 'rgba(2,6,23,.55)', border: '1px solid rgba(51,65,85,.7)', borderRadius: 12, padding: 9 }}>
                                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 800 }}>{part.label}</div>
                                <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 900 }}>{part.score}/{part.max}</div>
                              </div>
                            ))}
                          </div>
                          <p style={{ color: '#94a3b8', fontSize: 12, margin: '10px 0 0' }}><strong>Detected hook:</strong> {quality.hook || 'No clear hook detected.'}</p>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {isEditing ? (
                        <>
                          <button style={activeButton} disabled={busy} onClick={() => saveEditedPost(item.id)}>Save Edit</button>
                          <button style={smallButton} onClick={() => { setEditingPostId(null); setEditedContent('') }}>Cancel</button>
                        </>
                      ) : (
                        <button style={smallButton} onClick={() => { setEditingPostId(item.id); setEditedContent(item.content_text || '') }}>Edit</button>
                      )}
                      <button style={smallButton} onClick={() => copyContent(item)}>Copy Text</button>
                      <button style={smallButton} disabled={busy} onClick={() => duplicateQueueItem(item)}>Duplicate</button>
                      <button style={smallButton} disabled={busy} onClick={() => updateStatus(item.id, 'draft')}>Back to Draft</button>
                      <button style={smallButton} disabled={busy} onClick={() => markReady(item)}>Ready/Scheduled</button>
                      <button style={activeButton} disabled={busy} onClick={() => updateStatus(item.id, 'published')}>Mark Published</button>
                      <button style={deleteButton} disabled={busy} onClick={() => deleteQueueItem(item.id)}>Delete</button>
                    </div>


                    {isMusicItem(item) && (
                      <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: '1px solid rgba(34,197,94,.35)', background: 'rgba(34,197,94,.08)' }}>
                        <strong style={{ color: '#86efac' }}>Music Production Workflow</strong>
                        <p style={{ color: '#cbd5e1', fontSize: 12, margin: '6px 0 10px' }}>
                          Music briefs are not scored as viral posts until a public caption/video brief is created. Use safe audio only.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <button style={activeButton} onClick={() => copyMusicCaptionPrompt(item)}>Copy Music Caption Prompt</button>
                          <button style={smallButton} onClick={() => draftReadyMusicCaption(item)}>Draft Ready Music Caption</button>
                          <button style={smallButton} onClick={() => copyWeeklyRecapPrompt(item)}>Copy Weekly Recap Prompt</button>
                          <button style={smallButton} onClick={() => createLinkedAsset(item, 'Music Poster Image')}>Create Music Design Asset</button>
                          <button style={smallButton} onClick={() => createLinkedAsset(item, 'Music Short Video')}>Create Music Video Asset</button>
                          <button style={activeButton} disabled={busy} onClick={() => markReadyMusicPost(item)}>Ready Music Post</button>
                        </div>
                      </div>
                    )}

                    {isQuoteItem(item) && (
                      <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: '1px solid rgba(250,204,21,.35)', background: 'rgba(250,204,21,.08)' }}>
                        <strong style={{ color: '#fde68a' }}>Quote Production Workflow</strong>
                        <p style={{ color: '#cbd5e1', fontSize: 12, margin: '6px 0 10px' }}>
                          Quote drafts are independent daily posts. Verify the source, create a simple design, then mark ready.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <button style={activeButton} onClick={() => copyQuoteCaptionPrompt(item)}>Copy Quote Caption Prompt</button>
                          <button style={smallButton} onClick={() => draftReadyQuoteCaption(item)}>Draft Ready Quote Caption</button>
                          <button style={smallButton} onClick={() => markQuoteNeedsSourceReview(item)}>Mark Needs Source Review</button>
                          <button style={smallButton} onClick={() => createLinkedAsset(item, 'Quote Poster Image')}>Create Quote Design Asset</button>
                          <button style={activeButton} disabled={busy} onClick={() => markReadyQuotePost(item)}>Ready Quote Post</button>
                        </div>

                        <div style={{ marginTop: 14, padding: 12, borderRadius: 14, border: '1px solid rgba(34,197,94,.35)', background: 'rgba(2,6,23,.35)' }}>
                          <strong style={{ color: '#86efac' }}>Quote Publishing Tracking v1</strong>
                          <p style={{ color: '#cbd5e1', fontSize: 12, margin: '6px 0 10px' }}>
                            After manual posting, paste the live URL, mark posted, and record 24-hour / 7-day stats.
                          </p>
                          <input
                            type="url"
                            placeholder="Paste live post URL after upload"
                            value={quoteLiveUrls[item.id] ?? extractLiveUrl(item)}
                            onChange={(e) => setQuoteLiveUrls((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            style={{ ...dateInput, marginBottom: 10 }}
                          />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            <button style={smallButton} disabled={busy} onClick={() => saveQuoteLiveUrl(item)}>Save Live URL</button>
                            <button style={activeButton} disabled={busy} onClick={() => markQuoteManuallyPosted(item)}>Mark Quote Posted</button>
                            <button style={smallButton} onClick={() => copyRepeatQuoteStylePrompt(item)}>Copy Repeat Style Prompt</button>
                            {extractLiveUrl(item) && <a href={extractLiveUrl(item)} target="_blank" rel="noreferrer" style={{ ...smallButton, textDecoration: 'none', display: 'inline-block' }}>Open Live Post</a>}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                            <select
                              value={(quoteStatsDrafts[item.id] || {}).stage || '24h'}
                              onChange={(e) => updateQuoteStatsDraft(item.id, 'stage', e.target.value)}
                              style={dateInput}
                            >
                              <option value="24h">24-hour stats</option>
                              <option value="7d">7-day stats</option>
                            </select>
                            {[
                              ['reach', 'Reach / Views'],
                              ['likes', 'Likes'],
                              ['comments', 'Comments'],
                              ['shares', 'Shares'],
                              ['saves', 'Saves'],
                              ['follows', 'Follows gained'],
                            ].map(([field, label]) => (
                              <input
                                key={field}
                                type="number"
                                min="0"
                                placeholder={label}
                                value={(quoteStatsDrafts[item.id] || {})[field] || ''}
                                onChange={(e) => updateQuoteStatsDraft(item.id, field, e.target.value)}
                                style={dateInput}
                              />
                            ))}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                            <button style={activeButton} disabled={busy} onClick={() => saveQuotePerformanceStats(item)}>Save Quote Stats</button>
                          </div>
                          <p style={{ color: '#94a3b8', fontSize: 12, margin: '10px 0 0' }}>
                            Current tracking: URL {extractLiveUrl(item) ? 'saved' : 'needed'} - Stats {hasQuotePerformanceBlock(item) ? 'recorded' : 'not recorded yet'} - Winner {isQuoteWinner(item) ? 'yes' : 'not yet'}.
                          </p>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: '1px solid rgba(56,189,248,.35)', background: 'rgba(56,189,248,.08)' }}>
                      <strong style={{ color: '#7dd3fc' }}>Linked Media Assets</strong>
                      <p style={{ color: '#cbd5e1', fontSize: 12, margin: '6px 0 10px' }}>
                        Create asset requests from this queue item, then complete them inside Media Library. Linked assets found: {getLinkedAssetCount(item)}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button style={smallButton} onClick={() => createLinkedAsset(item, 'Poster Image')}>Create Poster Asset</button>
                        <button style={smallButton} onClick={() => createLinkedAsset(item, 'Short Video')}>Create Video Asset</button>
                        <button style={smallButton} onClick={() => createLinkedAsset(item, 'Thumbnail')}>Create Thumbnail Asset</button>
                        <button style={smallButton} onClick={() => createLinkedAsset(item, 'Caption File')}>Create Caption Asset</button>
                        <button style={activeButton} onClick={openMediaLibrary}>View Media Library</button>
                      </div>
                    </div>

                    {birthdayPack && (
                      <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: '1px solid rgba(244,114,182,.35)', background: 'rgba(244,114,182,.08)' }}>
                        <strong style={{ color: '#f9a8d4' }}>Birthday Pack Workflow</strong>
                        <p style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 0 }}>
                          Review text, create poster/video where needed, set schedule, then mark as Ready/Scheduled. After manual upload, mark Published.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {queueView === 'calendar' && (
        <div>
          {Object.keys(groupedCalendar).length === 0 && <div style={card}><p style={{ color: '#94a3b8', margin: 0 }}>No scheduled posts yet.</p></div>}
          {Object.keys(groupedCalendar).map((date) => (
            <div key={date} style={card}>
              <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Calendar: {date}</h3>
              {groupedCalendar[date].map((item) => {
                const workflow = getWorkflowLabel(item)
                return (
                  <div key={item.id} style={styles.calendarItem || { padding: 12, border: '1px solid #334155', borderRadius: 12, marginBottom: 10, background: '#0b1220' }}>
                    <strong style={{ color: '#f8fafc' }}>{item.minister_name || 'Yearning for God'}</strong>
                    <p style={{ color: '#94a3b8', margin: '4px 0' }}>{item.platform} - {item.campaign_stage || item.content_type}</p>
                    <p style={{ color: '#94a3b8', margin: '4px 0' }}>{item.scheduled_at ? new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}</p>
                    <span style={{ background: workflow.bg, color: workflow.color, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>{workflow.label}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}