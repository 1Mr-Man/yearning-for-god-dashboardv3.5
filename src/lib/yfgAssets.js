// YFG PHASE 2D — shared asset / publishing model
// Origin-generic by design: research today, Book Journey / quote / music later.
// No auto-publishing logic lives here. Nothing here touches the 25-post/day
// system, the Daily Quote workflow or content_queue_main scheduling.

export const ORIGIN_TYPES = [
  'research',
  'book_journey',
  'quote',
  'music',
  'minister',
  'event',
  'scripture',
  'manual',
]

export const ORIGIN_LABELS = {
  research: 'Research Content',
  book_journey: 'Book Journey Episode',
  quote: 'Quote Post',
  music: 'Music Post',
  minister: 'Minister Content',
  event: 'Event Content',
  scripture: 'Scripture Post',
  manual: 'Manual Content',
}

// Asset lifecycle — deliberately separate from production status and from
// publishing status.
export const ASSET_STATUSES = [
  'missing', 'planned', 'uploaded', 'ready', 'approved', 'attached', 'published', 'failed',
]

export const ASSET_TYPES = [
  'video', 'short_video', 'image', 'carousel', 'thumbnail', 'audio',
  'captions', 'script', 'description', 'title', 'tags', 'document',
  'quote_image', 'on_screen_text',
]

export const ASSET_ROLES = ['long_form', 'short', 'social', 'quote', 'supporting']

export const PACKAGE_STATUSES = ['draft', 'needs_assets', 'ready', 'queued', 'published']

const SATISFIED = new Set(['uploaded', 'ready', 'approved', 'attached', 'published'])
export const assetSatisfies = a => !!a && SATISFIED.has(a.status)

// Platform requirements. Different platforms deliberately require different
// things — nothing is forced on every platform.
export const PLATFORMS = [
  {
    key: 'youtube', label: 'YouTube', queuePlatform: 'YouTube', contentType: 'Long-form Teaching',
    requires: [
      { key: 'video', kind: 'asset', assetTypes: ['video'], label: 'Video file' },
      { key: 'thumbnail', kind: 'asset', assetTypes: ['thumbnail', 'image'], label: 'Thumbnail' },
      { key: 'script', kind: 'meta', field: 'script', label: 'Script' },
      { key: 'main_title', kind: 'meta', field: 'main_title', label: 'Title' },
      { key: 'description', kind: 'meta', field: 'description', label: 'Description' },
      { key: 'keywords', kind: 'meta', field: 'keywords', label: 'Tags / keywords' },
    ],
  },
  {
    key: 'facebook', label: 'Facebook', queuePlatform: 'Facebook', contentType: 'Social Post',
    requires: [
      { key: 'visual', kind: 'asset', assetTypes: ['image', 'video', 'short_video'], label: 'Image or video' },
      { key: 'caption', kind: 'meta', field: 'caption', label: 'Caption' },
    ],
  },
  {
    key: 'instagram', label: 'Instagram', queuePlatform: 'Instagram', contentType: 'Social Post',
    requires: [
      { key: 'image', kind: 'asset', assetTypes: ['image', 'carousel', 'quote_image'], label: 'Image' },
      { key: 'caption', kind: 'meta', field: 'caption', label: 'Caption' },
      { key: 'hashtags', kind: 'meta', field: 'hashtags', label: 'Hashtags' },
    ],
  },
  {
    key: 'tiktok', label: 'TikTok', queuePlatform: 'TikTok', contentType: 'Short Video',
    requires: [
      { key: 'short_video', kind: 'asset', assetTypes: ['short_video', 'video'], label: 'Short video' },
      { key: 'caption', kind: 'meta', field: 'caption', label: 'Caption' },
    ],
  },
  {
    key: 'threads', label: 'Threads', queuePlatform: 'Threads', contentType: 'Social Post',
    requires: [
      { key: 'caption', kind: 'meta', field: 'caption', label: 'Caption' },
    ],
  },
]

export const platformByKey = key => PLATFORMS.find(p => p.key === key)

const filled = v => String(v == null ? '' : v).trim().length > 0

export function requirementMet(req, pkg, assets) {
  if (req.kind === 'meta') return filled(pkg?.[req.field])
  return (assets || []).some(a => req.assetTypes.includes(a.asset_type) && assetSatisfies(a))
}

export function platformReadiness(platform, pkg, assets) {
  const items = platform.requires.map(r => ({ ...r, ok: requirementMet(r, pkg, assets) }))
  const missing = items.filter(i => !i.ok)
  return { platform, items, missing, ready: missing.length === 0 }
}

// Overall readiness across the selected target platforms only.
export function computeReadiness(pkg, assets) {
  const targets = Array.isArray(pkg?.platform_targets) && pkg.platform_targets.length
    ? pkg.platform_targets : ['youtube']
  const rows = targets.map(k => platformByKey(k)).filter(Boolean)
    .map(p => platformReadiness(p, pkg, assets))
  const total = rows.reduce((n, r) => n + r.items.length, 0)
  const met = rows.reduce((n, r) => n + r.items.filter(i => i.ok).length, 0)
  const score = total ? Math.round((met / total) * 100) : 0
  const missingCount = total - met
  return { rows, total, met, score, missingCount, ready: total > 0 && missingCount === 0 }
}

// Deterministic mapping: production package -> publishing metadata.
// Nothing is invented; empty production fields stay empty.
export function packageFromProduction(prod, idea) {
  const s = v => (v == null ? '' : String(v))
  const shorts = Array.isArray(prod?.shorts_package) ? prod.shorts_package : []
  const social = Array.isArray(prod?.social_package) ? prod.social_package : []
  const firstSocial = social.find(p => s(p.caption).trim()) || social[0] || {}
  const visual = prod?.visual_package && typeof prod.visual_package === 'object' ? prod.visual_package : {}
  const description = [
    s(prod?.main_promise), s(prod?.introduction), s(prod?.primary_scripture),
    s(prod?.suggested_cta),
  ].filter(x => x.trim()).join('\n\n')
  const script = [
    prod?.opening_hook && `HOOK\n${prod.opening_hook}`,
    prod?.introduction && `INTRODUCTION\n${prod.introduction}`,
    prod?.main_teaching_points && `TEACHING POINTS\n${prod.main_teaching_points}`,
    prod?.scripture_integration && `SCRIPTURE\n${prod.scripture_integration}`,
    prod?.story_opportunity && `STORY\n${prod.story_opportunity}`,
    prod?.practical_application && `APPLICATION\n${prod.practical_application}`,
    prod?.prayer_section && `PRAYER\n${prod.prayer_section}`,
    prod?.conclusion && `CONCLUSION\n${prod.conclusion}`,
    prod?.suggested_cta && `CTA\n${prod.suggested_cta}`,
  ].filter(Boolean).join('\n\n')
  return {
    main_title: s(prod?.production_title || idea?.suggested_title || idea?.title),
    alternative_titles: s(prod?.alternative_title || idea?.title),
    description,
    script,
    caption: s(firstSocial.caption || prod?.main_promise),
    hashtags: s(firstSocial.hashtags),
    keywords: [s(idea?.pillar), s(idea?.type), s(prod?.main_topic)].filter(x => x.trim()).join(', '),
    chapters: s(prod?.main_teaching_points),
    captions_subtitles: '',
    platform_metadata: {
      youtube: { title: s(prod?.production_title), description },
      facebook: { caption: s(firstSocial.caption) },
      instagram: { caption: s(firstSocial.caption), hashtags: s(firstSocial.hashtags) },
      tiktok: { caption: s(shorts[0]?.caption || firstSocial.caption) },
      threads: { caption: s(firstSocial.caption) },
    },
    _visualHint: s(visual.thumbnail || visual.primary_image),
  }
}
