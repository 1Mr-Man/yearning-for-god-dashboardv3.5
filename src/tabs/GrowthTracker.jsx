import { useMemo, useState } from 'react'

function toNum(value) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function compact(value) {
  return toNum(value).toLocaleString()
}

function getEngagementRate(record) {
  const views = toNum(record.views)
  if (views <= 0) return 0
  const engagement = toNum(record.likes) + toNum(record.comments) + toNum(record.shares) + toNum(record.saves)
  return Math.round((engagement / views) * 1000) / 10
}

function getPerformanceScore(record) {
  const views = toNum(record.views)
  const engagementRate = getEngagementRate(record)
  const shares = toNum(record.shares)
  const saves = toNum(record.saves)
  const followers = toNum(record.followers_gained)

  let score = 0
  if (views >= 100000) score += 35
  else if (views >= 50000) score += 30
  else if (views >= 10000) score += 25
  else if (views >= 3000) score += 18
  else if (views >= 1000) score += 12
  else if (views > 0) score += 6

  if (engagementRate >= 20) score += 30
  else if (engagementRate >= 10) score += 24
  else if (engagementRate >= 5) score += 18
  else if (engagementRate >= 2) score += 10
  else if (engagementRate > 0) score += 5

  if (shares >= 1000 || saves >= 1000) score += 20
  else if (shares >= 300 || saves >= 300) score += 15
  else if (shares >= 100 || saves >= 100) score += 10
  else if (shares > 0 || saves > 0) score += 5

  if (followers >= 100) score += 15
  else if (followers >= 30) score += 10
  else if (followers > 0) score += 5

  return Math.min(100, score)
}

function scoreLabel(score) {
  if (score >= 80) return 'Repeat This'
  if (score >= 60) return 'Strong'
  if (score >= 35) return 'Average'
  if (score > 0) return 'Weak'
  return 'No Signal'
}

function scoreColor(score) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#84cc16'
  if (score >= 35) return '#f59e0b'
  if (score > 0) return '#f97316'
  return '#64748b'
}

function postLabel(post) {
  const text = String(post?.content_text || '').replace(/\n/g, ' ').slice(0, 70)
  const publishedDate = post?.published_at || post?.last_auto_published_at || post?.updated_at
  const dateLabel = publishedDate ? new Date(publishedDate).toLocaleDateString() : 'Unknown date'
  return `#${post?.id} - ${post?.platform || 'N/A'} - ${post?.content_type || 'N/A'} - ${dateLabel} - ${text}`
}


function isTestPost(post) {
  const text = `${post?.id || ''} ${post?.platform || ''} ${post?.content_type || ''} ${post?.campaign_stage || ''} ${post?.minister_name || ''} ${post?.content_text || ''} ${post?.notes || ''}`.toLowerCase()
  const testSignals = [
    'dry run',
    'test post',
    'real facebook test',
    'controlled publishing test',
    'should not go live',
    'do not publish',
    'dummy post',
    'sample post',
    'buffer test',
    'buffer-test',
    'tiktok buffer test',
    'publishing test',
    'integration test',
  ]
  return testSignals.some((signal) => text.includes(signal)) || String(post?.published_by || '').toLowerCase().includes('test')
}

function isTestRecord(record, postMap = new Map()) {
  const linkedPost = postMap.get(String(record?.content_queue_id || ''))
  if (linkedPost && isTestPost(linkedPost)) return true
  const text = `${record?.platform || ''} ${record?.content_type || ''} ${record?.minister_name || ''} ${record?.notes || ''}`.toLowerCase()
  return ['dry run', 'test post', 'real facebook test', 'facebook real test', 'controlled publishing test', 'should not go live', 'dummy post', 'sample post', 'buffer test', 'buffer-test', 'tiktok buffer test', 'publishing test', 'integration test'].some((signal) => text.includes(signal))
}


function postText(post) {
  return `${post?.platform || ''} ${post?.content_type || ''} ${post?.campaign_stage || ''} ${post?.minister_name || ''} ${post?.content_text || ''} ${post?.notes || ''}`.toLowerCase()
}

function isInternalWorkflowPost(post) {
  const text = postText(post)
  return (
    text.includes('manual publishing checklist') ||
    text.includes('checklist') ||
    text.includes('poster design prompt') ||
    text.includes('image prompt') ||
    text.includes('design prompt') ||
    text.includes('production note') ||
    text.includes('asset request') ||
    text.includes('media asset') ||
    text.includes('caption file') ||
    text.includes('shorts script') ||
    text.includes('internal workflow') ||
    text.includes('source note: needs source review') ||
    text.includes('this is a reminder to prepare')
  )
}

function isRealPublicPublishedPost(post) {
  if (!post || post.status !== 'published') return false
  if (isTestPost(post)) return false
  if (isInternalWorkflowPost(post)) return false
  const text = String(post.content_text || '').trim()
  return text.length >= 20
}

function isInternalRecord(record, postMap = new Map()) {
  const linkedPost = postMap.get(String(record?.content_queue_id || ''))
  if (linkedPost && isInternalWorkflowPost(linkedPost)) return true
  const text = `${record?.platform || ''} ${record?.content_type || ''} ${record?.minister_name || ''} ${record?.notes || ''}`.toLowerCase()
  return [
    'manual publishing checklist',
    'poster design prompt',
    'image prompt',
    'production note',
    'asset request',
    'media asset',
    'internal workflow',
  ].some((signal) => text.includes(signal))
}

function getRecordDate(record) {
  const raw = record.created_at || record.recorded_at || record.published_at || record.updated_at
  const d = raw ? new Date(raw) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
}

function inLastDays(record, days) {
  if (days === 'all') return true
  const d = getRecordDate(record)
  if (!d) return false
  const diffMs = Date.now() - d.getTime()
  return diffMs <= Number(days) * 24 * 60 * 60 * 1000
}

function buildGroupedStats(records, key) {
  return records.reduce((acc, record) => {
    const label = record[key] || 'Unknown'
    if (!acc[label]) acc[label] = { posts: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers_gained: 0 }
    acc[label].posts += 1
    acc[label].views += toNum(record.views)
    acc[label].likes += toNum(record.likes)
    acc[label].comments += toNum(record.comments)
    acc[label].shares += toNum(record.shares)
    acc[label].saves += toNum(record.saves)
    acc[label].followers_gained += toNum(record.followers_gained)
    return acc
  }, {})
}

function formatRecordForReview(record) {
  return {
    id: record.id,
    content_queue_id: record.content_queue_id,
    platform: record.platform,
    content_type: record.content_type,
    minister_name: record.minister_name,
    views: toNum(record.views),
    likes: toNum(record.likes),
    comments: toNum(record.comments),
    shares: toNum(record.shares),
    saves: toNum(record.saves),
    followers_gained: toNum(record.followers_gained),
    engagement_rate: getEngagementRate(record),
    performance_score: getPerformanceScore(record),
    notes: record.notes || '',
    recorded_at: record.created_at || record.recorded_at || record.updated_at || '',
  }
}

export default function GrowthTracker({
  performanceForm,
  setPerformanceForm,
  queue = [],
  savePostPerformance,
  savingPerformance,
  performanceStats = {},
  styles = {},
}) {
  const [platformFilter, setPlatformFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [reviewWindow, setReviewWindow] = useState('30')
  const [reviewFocus, setReviewFocus] = useState('growth-plan')
  const [showTestPosts, setShowTestPosts] = useState(false)

  const card = styles.card || { background: '#0f172a', border: '1px solid #334155', borderRadius: 18, padding: 18, marginBottom: 14 }
  const input = styles.search || { width: '100%', padding: 12, borderRadius: 12, border: '1px solid #334155' }
  const actionButton = styles.actionButton || { padding: 12, borderRadius: 12, border: 0, background: '#22c55e', color: '#0f172a', fontWeight: 900 }
  const smallButton = styles.smallButton || { padding: '8px 10px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e5e7eb' }

  const publishedPostsRaw = useMemo(() => queue.filter((q) => q.status === 'published'), [queue])
  const realPublishedPostsRaw = useMemo(() => publishedPostsRaw.filter(isRealPublicPublishedPost), [publishedPostsRaw])
  const internalPublishedPosts = useMemo(() => publishedPostsRaw.filter((post) => !isTestPost(post) && isInternalWorkflowPost(post)), [publishedPostsRaw])
  const queuePostMap = useMemo(() => new Map(queue.map((post) => [String(post.id), post])), [queue])
  const testPublishedPosts = useMemo(() => publishedPostsRaw.filter(isTestPost), [publishedPostsRaw])
  const publishedPosts = useMemo(() => {
    return showTestPosts ? publishedPostsRaw : realPublishedPostsRaw
  }, [publishedPostsRaw, realPublishedPostsRaw, showTestPosts])
  const selectedPost = publishedPosts.find((p) => String(p.id) === String(performanceForm.content_queue_id))
  const allRawRecords = useMemo(() => performanceStats.records || [], [performanceStats.records])
  const allRecords = useMemo(() => {
    return showTestPosts
      ? allRawRecords
      : allRawRecords.filter((r) => !isTestRecord(r, queuePostMap) && !isInternalRecord(r, queuePostMap))
  }, [allRawRecords, queuePostMap, showTestPosts])
  const hiddenUncleanRecords = Math.max(0, allRawRecords.length - allRecords.length)
  const recordedIds = new Set(allRecords.map((r) => String(r.content_queue_id)))
  const postsNeedingStats = publishedPosts.filter((p) => !recordedIds.has(String(p.id)))

  const records = useMemo(() => {
    const q = search.toLowerCase()
    return allRecords
      .filter((r) => platformFilter === 'All' || r.platform === platformFilter)
      .filter((r) => {
        if (!q) return true
        return `${r.platform || ''} ${r.content_type || ''} ${r.minister_name || ''} ${r.notes || ''}`.toLowerCase().includes(q)
      })
      .map((r) => ({ ...r, _score: getPerformanceScore(r), _engagementRate: getEngagementRate(r) }))
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  }, [allRecords, platformFilter, search])

  const platforms = ['All', ...Array.from(new Set(allRecords.map((r) => r.platform).filter(Boolean)))]

  const strongest = [...records].sort((a, b) => b._score - a._score)[0]
  const cleanPlatformPerformance = useMemo(() => buildGroupedStats(allRecords, 'platform'), [allRecords])
  const cleanContentTypePerformance = useMemo(() => buildGroupedStats(allRecords, 'content_type'), [allRecords])
  const topPlatform = Object.entries(cleanPlatformPerformance || {}).sort((a, b) => (b[1]?.views || 0) - (a[1]?.views || 0))[0]
  const topContentType = Object.entries(cleanContentTypePerformance || {}).sort((a, b) => (b[1]?.views || 0) - (a[1]?.views || 0))[0]

  const reviewRecords = useMemo(() => {
    return allRecords
      .filter((r) => inLastDays(r, reviewWindow))
      .map((r) => ({ ...r, _score: getPerformanceScore(r), _engagementRate: getEngagementRate(r) }))
      .sort((a, b) => b._score - a._score)
  }, [allRecords, reviewWindow])

  const reviewSummary = useMemo(() => {
    const totals = reviewRecords.reduce((acc, r) => {
      acc.views += toNum(r.views)
      acc.likes += toNum(r.likes)
      acc.comments += toNum(r.comments)
      acc.shares += toNum(r.shares)
      acc.saves += toNum(r.saves)
      acc.followers_gained += toNum(r.followers_gained)
      return acc
    }, { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers_gained: 0 })

    const topRecords = [...reviewRecords].sort((a, b) => b._score - a._score).slice(0, 5)
    const weakRecords = [...reviewRecords].filter((r) => r._score > 0).sort((a, b) => a._score - b._score).slice(0, 5)
    const platformStats = buildGroupedStats(reviewRecords, 'platform')
    const contentTypeStats = buildGroupedStats(reviewRecords, 'content_type')
    const ministerStats = buildGroupedStats(reviewRecords, 'minister_name')

    return { totals, topRecords, weakRecords, platformStats, contentTypeStats, ministerStats }
  }, [reviewRecords])

  const recommendation = (() => {
    if (!showTestPosts && hiddenUncleanRecords > 0 && postsNeedingStats.length === 0 && reviewRecords.length === 0) return `${hiddenUncleanRecords} test/internal stat record(s) hidden. Publish real content, then record performance here.`
    if (postsNeedingStats.length > 0) return `Record performance for ${postsNeedingStats.length} real published post(s) without stats.`
    if (topContentType) return `Create more "${topContentType[0]}" posts and compare the next 3 results.`
    if (publishedPosts.length === 0) return 'Publish manually first, then return here to record views and engagement.'
    return 'Record performance daily so the app can learn your strongest topics and platforms.'
  })()


  function copyGrowthAssistantPrompt(kind = reviewFocus) {
    const windowLabel = reviewWindow === 'all' ? 'all recorded time' : `the last ${reviewWindow} days`
    const payload = {
      review_window: windowLabel,
      totals: reviewSummary.totals,
      top_posts: reviewSummary.topRecords.map(formatRecordForReview),
      weak_posts: reviewSummary.weakRecords.map(formatRecordForReview),
      platform_stats: reviewSummary.platformStats,
      content_type_stats: reviewSummary.contentTypeStats,
      minister_stats: reviewSummary.ministerStats,
      recent_records_count: reviewRecords.length,
      hidden_test_posts: showTestPosts ? 0 : testPublishedPosts.length,
    }

    const taskMap = {
      'growth-plan': 'Give me a practical 7-day growth plan. Tell me what to post, where to post, what to repeat, and what to reduce.',
      'content-ideas': 'Generate 10 new content ideas based on the strongest performing posts and formats. Include hook, format, platform, and CTA for each idea.',
      'platform-focus': 'Analyze which platform deserves the most attention next. Give reasons and a simple posting strategy for each platform.',
      'quality-review': 'Review why the top posts worked and why the weak posts underperformed. Give specific editing lessons for future posts.',
    }

    const prompt = `You are a Christian social media growth strategist for Yearning for God, a Psalm 42-inspired Christian media channel.

Task: ${taskMap[kind] || taskMap['growth-plan']}

Use the data below to produce clear recommendations. Keep the tone practical, Kingdom-focused, and growth-oriented.

Please return:
1. What worked best
2. What performed weakly
3. The best platform to focus on next
4. The best content formats to repeat
5. What to post in the next 7 days
6. 10 specific post ideas with hooks and CTAs
7. One warning or mistake to avoid

DATA:
${JSON.stringify(payload, null, 2)}`

    navigator.clipboard?.writeText(prompt)
    alert('Growth Review Assistant prompt copied.')
  }

  function copyGrowthReviewPrompt() {
    const payload = {
      totals: {
        views: toNum(performanceStats.totalViews),
        likes: toNum(performanceStats.totalLikes),
        comments: toNum(performanceStats.totalComments),
        shares: toNum(performanceStats.totalShares),
        saves: toNum(performanceStats.totalSaves),
        followers_gained: toNum(performanceStats.followersGained),
      },
      top_platform: topPlatform ? { platform: topPlatform[0], ...topPlatform[1] } : null,
      top_content_type: topContentType ? { content_type: topContentType[0], ...topContentType[1] } : null,
      strongest_post: strongest || null,
      recent_records: records.slice(0, 10),
    }

    const prompt = `You are a Christian social media growth strategist for Yearning for God. Review this performance data and tell me:
1. What content should I repeat?
2. What platform should I focus on?
3. What should I stop or reduce?
4. What should I post tomorrow?
5. Give me 5 practical growth actions.

DATA:
${JSON.stringify(payload, null, 2)}`
    navigator.clipboard?.writeText(prompt)
    alert('Growth review prompt copied.')
  }

  return (
    <div>
      <h2 style={{ color: '#f8fafc', marginBottom: 8 }}>Growth Tracker v4</h2>
      <p style={{ color: '#94a3b8', marginTop: 0, marginBottom: 20 }}>
        Record manual post results, review performance patterns, and generate AI growth guidance for the next publishing cycle.
      </p>

      <div style={{ ...card, borderLeft: '4px solid #22c55e' }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Growth Recommendation</h3>
        <p style={{ color: '#e2e8f0', fontWeight: 800, marginTop: 0 }}>{recommendation}</p>
        {!showTestPosts && testPublishedPosts.length > 0 && (
          <p style={{ color: '#fbbf24', fontSize: 12, marginTop: 0 }}>
            Hidden test posts: {testPublishedPosts.length}. These are ignored in growth intelligence and missing-stats lists.
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button style={smallButton} onClick={copyGrowthReviewPrompt}>Copy AI Growth Review Prompt</button>
          <button style={smallButton} onClick={() => setShowTestPosts(!showTestPosts)}>
            {showTestPosts ? 'Hide Test Posts' : 'Show Test Posts'}
          </button>
        </div>
      </div>

      <div style={{ ...card, borderLeft: '4px solid #a78bfa' }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Growth Review Assistant</h3>
        <p style={{ color: '#94a3b8', marginTop: 0 }}>
          Copy one smart review prompt for AI to analyze your recent results and tell you what to post next.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 800 }}>Review window</label>
            <select value={reviewWindow} onChange={(e) => setReviewWindow(e.target.value)} style={{ ...input, marginTop: 6, background: '#0f172a', color: '#f1f5f9' }}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All recorded time</option>
            </select>
          </div>
          <div>
            <label style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 800 }}>Assistant focus</label>
            <select value={reviewFocus} onChange={(e) => setReviewFocus(e.target.value)} style={{ ...input, marginTop: 6, background: '#0f172a', color: '#f1f5f9' }}>
              <option value="growth-plan">7-Day Growth Plan</option>
              <option value="content-ideas">Next 10 Content Ideas</option>
              <option value="platform-focus">Platform Focus</option>
              <option value="quality-review">Content Quality Lessons</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'Records Reviewed', value: reviewRecords.length, color: '#c084fc' },
            { label: 'Views', value: reviewSummary.totals.views, color: '#60a5fa' },
            { label: 'Shares', value: reviewSummary.totals.shares, color: '#22d3ee' },
            { label: 'Saves', value: reviewSummary.totals.saves, color: '#facc15' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 12, padding: 12 }}>
              <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: 900 }}>{item.label}</div>
              <div style={{ color: item.color, fontSize: 22, fontWeight: 900, marginTop: 4 }}>{compact(item.value)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button style={actionButton} onClick={() => copyGrowthAssistantPrompt(reviewFocus)}>Copy Growth Review Assistant Prompt</button>
          <button style={smallButton} onClick={() => copyGrowthAssistantPrompt('content-ideas')}>Copy 10 Ideas Prompt</button>
          <button style={smallButton} onClick={() => copyGrowthAssistantPrompt('platform-focus')}>Copy Platform Focus Prompt</button>
        </div>
      </div>

      {postsNeedingStats.length > 0 && (
        <div style={{ ...card, borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Published Posts Missing Stats</h3>
          <p style={{ color: '#94a3b8', marginTop: 0 }}>These posts are published, but no performance has been recorded yet.</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {postsNeedingStats.slice(0, 8).map((post) => (
              <div key={post.id} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: '#0b1220', border: '1px solid #334155', borderRadius: 12, padding: 12 }}>
                <span style={{ color: '#cbd5e1', fontSize: 13 }}>{postLabel(post)}</span>
                <button style={smallButton} onClick={() => setPerformanceForm({ ...performanceForm, content_queue_id: String(post.id) })}>Record Stats</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...card, borderLeft: '4px solid #3b82f6' }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Record Post Performance</h3>

        <label style={{ display: 'block', marginBottom: 6, color: '#cbd5e1', fontSize: 13, fontWeight: 'bold' }}>Select a Published Post</label>
        <select
          value={performanceForm.content_queue_id}
          onChange={(e) => setPerformanceForm({ ...performanceForm, content_queue_id: e.target.value })}
          style={{ ...input, marginBottom: 10, background: '#0f172a', color: '#f1f5f9' }}
        >
          <option value="">Choose a published post</option>
          {publishedPosts.slice(0, 250).map((p) => (
            <option key={p.id} value={p.id}>{postLabel(p)}</option>
          ))}
        </select>

        {selectedPost && (
          <div style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ color: '#f1f5f9', fontWeight: 900 }}>{selectedPost.minister_name || 'No minister'} - {selectedPost.platform || 'No platform'}</div>
            {selectedPost.external_post_url && (
              <a href={selectedPost.external_post_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 13 }}>Open live post</a>
            )}
            <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 0 }}>{String(selectedPost.content_text || '').slice(0, 220)}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
          {[
            { key: 'views', label: 'Views' },
            { key: 'likes', label: 'Likes' },
            { key: 'comments', label: 'Comments' },
            { key: 'shares', label: 'Shares' },
            { key: 'saves', label: 'Saves' },
            { key: 'followers_gained', label: 'Followers Gained' },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ display: 'block', marginBottom: 6, color: '#cbd5e1', fontSize: 13 }}>{field.label}</label>
              <input
                type="number"
                min="0"
                value={performanceForm[field.key] || ''}
                onChange={(e) => setPerformanceForm({ ...performanceForm, [field.key]: e.target.value })}
                placeholder="0"
                style={{ width: '100%', padding: 10, borderRadius: 10, fontSize: 14, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155' }}
              />
            </div>
          ))}
        </div>

        <label style={{ display: 'block', marginBottom: 6, color: '#cbd5e1', fontSize: 13 }}>Notes</label>
        <textarea
          value={performanceForm.notes || ''}
          onChange={(e) => setPerformanceForm({ ...performanceForm, notes: e.target.value })}
          placeholder="Example: strong hook, many comments, good prayer response, weak retention..."
          style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 10, fontSize: 14, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', marginBottom: 12 }}
        />

        <button onClick={savePostPerformance} disabled={savingPerformance} style={{ ...actionButton, cursor: savingPerformance ? 'not-allowed' : 'pointer', opacity: savingPerformance ? 0.6 : 1 }}>
          {savingPerformance ? 'Saving...' : 'Save Performance'}
        </button>
      </div>

      <h3 style={{ marginTop: 24, marginBottom: 12, color: '#f1f5f9' }}>Growth Snapshot</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Views', value: performanceStats.totalViews, color: '#60a5fa' },
          { label: 'Likes', value: performanceStats.totalLikes, color: '#f87171' },
          { label: 'Comments', value: performanceStats.totalComments, color: '#c084fc' },
          { label: 'Shares', value: performanceStats.totalShares, color: '#22d3ee' },
          { label: 'Saves', value: performanceStats.totalSaves, color: '#facc15' },
          { label: 'Followers', value: performanceStats.followersGained, color: '#22c55e' },
        ].map((item) => (
          <div key={item.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 16, borderLeft: `4px solid ${item.color}` }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</p>
            <p style={{ margin: 0, fontSize: 25, fontWeight: 900, color: item.color }}>{compact(item.value)}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 14 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Top Platforms</h3>
          {Object.keys(performanceStats.platformPerformance || {}).length === 0 ? (
            <p style={{ color: '#64748b', margin: 0 }}>No platform data yet.</p>
          ) : (
            Object.entries(performanceStats.platformPerformance || {})
              .sort((a, b) => (b[1].views || 0) - (a[1].views || 0))
              .map(([platform, stats]) => (
                <div key={platform} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ color: '#f1f5f9' }}>{platform}</strong>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{stats.posts} post(s)</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 5 }}>
                    {compact(stats.views)} views - {compact(stats.likes)} likes - {compact(stats.shares)} shares - {compact(stats.saves)} saves
                  </div>
                </div>
              ))
          )}
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Top Content Formats</h3>
          {Object.keys(performanceStats.contentTypePerformance || {}).length === 0 ? (
            <p style={{ color: '#64748b', margin: 0 }}>No content-type data yet.</p>
          ) : (
            Object.entries(performanceStats.contentTypePerformance || {})
              .sort((a, b) => (b[1].views || 0) - (a[1].views || 0))
              .slice(0, 10)
              .map(([ctype, stats]) => (
                <div key={ctype} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ color: '#f1f5f9' }}>{ctype}</strong>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{stats.posts} post(s)</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 5 }}>
                    {compact(stats.views)} views - {compact(stats.likes)} likes - {compact(stats.shares)} shares - {compact(stats.saves)} saves
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div style={{ ...card, marginTop: 14, borderLeft: `4px solid ${scoreColor(strongest?._score || 0)}` }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Strongest Recorded Post</h3>
        {!strongest ? (
          <p style={{ color: '#64748b', margin: 0 }}>No performance data recorded yet.</p>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ background: '#0f172a', color: '#60a5fa', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 900 }}>{strongest.platform || 'N/A'}</span>
              <span style={{ background: '#0f172a', color: '#a78bfa', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 900 }}>{strongest.content_type || 'N/A'}</span>
              <span style={{ background: '#0f172a', color: scoreColor(strongest._score), padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 900 }}>{strongest._score}/100 - {scoreLabel(strongest._score)}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              {compact(strongest.views)} views - {strongest._engagementRate}% engagement - {compact(strongest.shares)} shares - {compact(strongest.saves)} saves - +{compact(strongest.followers_gained)} followers
            </div>
            {strongest.notes && <p style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 0 }}>{strongest.notes}</p>}
          </div>
        )}
      </div>

      <div style={{ ...card, marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#f1f5f9' }}>Recent Records</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} style={{ ...input, width: 'auto', margin: 0, background: '#0f172a', color: '#f1f5f9' }}>
              {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." style={{ ...input, width: 220, margin: 0, background: '#0f172a', color: '#f1f5f9' }} />
          </div>
        </div>

        {records.length === 0 ? (
          <p style={{ color: '#64748b' }}>No records match this filter.</p>
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto', marginTop: 12 }}>
            {records.slice(0, 40).map((r) => (
              <div key={r.id || `${r.content_queue_id}-${r.created_at}`} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  <strong style={{ color: '#f1f5f9', fontSize: 13 }}>#{r.content_queue_id} - {r.platform || 'N/A'} - {r.content_type || 'N/A'}</strong>
                  <span style={{ color: scoreColor(r._score), fontSize: 12, fontWeight: 900 }}>{r._score}/100 - {scoreLabel(r._score)}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#94a3b8' }}>
                  <span>{compact(r.views)} views</span>
                  <span>{compact(r.likes)} likes</span>
                  <span>{compact(r.comments)} comments</span>
                  <span>{compact(r.shares)} shares</span>
                  <span>{compact(r.saves)} saves</span>
                  <span>{r._engagementRate}% engagement</span>
                  <span>+{compact(r.followers_gained)} followers</span>
                </div>
                {r.notes && <p style={{ margin: '7px 0 0', fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}