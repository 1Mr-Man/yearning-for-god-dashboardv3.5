import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { supabase } from './utils/supabase'
import Navigation from './components/Navigation'
import styles from './styles/styles'
import Dashboard from './tabs/Dashboard'

const Analytics = lazy(() => import('./tabs/Analytics'))
const GrowthTracker = lazy(() => import('./tabs/GrowthTracker'))
const Monetization = lazy(() => import('./tabs/Monetization'))
const ContentCalendar = lazy(() => import('./tabs/ContentCalendar'))
const Profile = lazy(() => import('./tabs/Profile'))
const PrayerEngine = lazy(() => import('./tabs/PrayerEngine'))
const SermonEngine = lazy(() => import('./tabs/SermonEngine'))
const Birthdays = lazy(() => import('./tabs/Birthdays'))
const Queue = lazy(() => import('./tabs/Queue'))
const WeeklyPlanner = lazy(() => import('./tabs/WeeklyPlanner'))
const DailyPlanner = lazy(() => import('./tabs/DailyPlanner'))
const SundayWorkflow = lazy(() => import('./tabs/SundayWorkflow'))
const CampaignPlanner = lazy(() => import('./tabs/CampaignPlanner'))
const MinisterUpdates = lazy(() => import('./tabs/MinisterUpdates'))
const Ministers = lazy(() => import('./tabs/Ministers'))
const Publishing = lazy(() => import('./tabs/Publishing'))
const YouTubeSermons = lazy(() => import('./tabs/YouTubeSermons'))
const SocialAccounts = lazy(() => import('./tabs/SocialAccounts'))
const MediaLibrary = lazy(() => import('./tabs/MediaLibrary'))
const PlatformReadiness = lazy(() => import('./tabs/PlatformReadiness'))
const PostingPlan = lazy(() => import('./tabs/PostingPlan'))
const ProductionSprint = lazy(() => import('./tabs/ProductionSprint'))
const StatsFollowUp = lazy(() => import('./tabs/StatsFollowUp'))
const MusicPlanner = lazy(() => import('./tabs/MusicPlanner'))
const QuotesPlanner = lazy(() => import('./tabs/QuotesPlanner'))
const WeeklyThemePlanner = lazy(() => import('./tabs/WeeklyThemePlanner'))
const WeeklyCalendar = lazy(() => import('./tabs/WeeklyCalendar'))
const RepurposingEngine = lazy(() => import('./tabs/RepurposingEngine'))
const DailyCommandCenter = lazy(() => import('./tabs/DailyCommandCenter'))
const LaunchReadinessCenter = lazy(() => import('./tabs/LaunchReadinessCenter'))
const LaunchWeekStarterPack = lazy(() => import('./tabs/LaunchWeekStarterPack'))
export default function App() {
 const [ministers, setMinisters] = useState([])
 const [queue, setQueue] = useState([])
 const [birthdayOpportunities, setBirthdayOpportunities] = useState([])
 const [birthdayEvents, setBirthdayEvents] = useState([])
 const [queueFilter, setQueueFilter] = useState('all')
 const [queueSearch, setQueueSearch] = useState('')
 const [queueSort, setQueueSort] = useState('newest')
 const [queueView, setQueueView] = useState('list')
 const [editingPostId, setEditingPostId] = useState(null)
 const [editedContent, setEditedContent] = useState('')
 const [activeTab, setActiveTab] = useState('dashboard')
 const [search, setSearch] = useState('')
 const [loading, setLoading] = useState(true)
 const [selectedMinister, setSelectedMinister] = useState(null)
 const [generatedPost, setGeneratedPost] = useState(null)
 const [prayerTheme, setPrayerTheme] = useState('Divine Help')
 const [generatedPrayer, setGeneratedPrayer] = useState(null)
 const [ministerTones, setMinisterTones] = useState([])
 const [selectedTone, setSelectedTone] = useState('')
 const [todayPrayerPackExists, setTodayPrayerPackExists] = useState(false)
 const [todayPrayerPostCount, setTodayPrayerPostCount] = useState(0)
 const [nextScheduledPost, setNextScheduledPost] = useState(null)
 const [nextPosts, setNextPosts] = useState([])
 const [sermonTitle, setSermonTitle] = useState('')
 const [sermonMinister, setSermonMinister] = useState('')
 const [sermonNotes, setSermonNotes] = useState('')
 const [todayScheduledCount, setTodayScheduledCount] = useState(0)
 const [todayPublishedCount, setTodayPublishedCount] = useState(0)
 const [todayDraftCount, setTodayDraftCount] = useState(0)
 const [todayPrayerCount, setTodayPrayerCount] = useState(0)
 const [todaySermonCount, setTodaySermonCount] = useState(0)
 const [todayBirthdayCount, setTodayBirthdayCount] = useState(0)
 const [autoPublishEnabled, setAutoPublishEnabled] = useState(false)
 const [publishingInterval, setPublishingInterval] = useState(30)
 const [publishingPaused, setPublishingPaused] = useState(false)
 const [publishingTimezone] = useState('Africa/Lagos')
 const [todayTimeline, setTodayTimeline] = useState([])
 const [calendarViewMode, setCalendarViewMode] = useState('today')
 const [calendarStats, setCalendarStats] = useState({
 todayPosts: [],
 weekPosts: [],
 todayCounts: { scheduled: 0, published: 0, draft: 0, failed: 0 },
 weekCounts: [],
 campaignPosts: [],
 prayerPosts: [],
 sermonPosts: [],
 birthdayPosts: [],
 emptyDaysThisWeek: [],
 heavyDaysThisWeek: [],
 nextWeekPosts: [],
 nextWeekCounts: [],
 emptyDaysNextWeek: [],
 heavyDaysNextWeek: [],
 })
 const [campaignPlannerStats, setCampaignPlannerStats] = useState({
 campaigns: [],
 total: 0,
 planned: 0,
 active: 0,
 completed: 0,
 paused: 0,
 })
 const [campaignForm, setCampaignForm] = useState({
 campaign_name: '',
 campaign_type: 'New Month Campaign',
 theme: '',
 scripture_reference: '',
 start_date: '',
 end_date: '',
 target_platforms: '',
 content_goal: '',
 notes: '',
 status: 'planned',
 })
 const [ministerUpdateStats, setMinisterUpdateStats] = useState({
 events: [],
 missingBirthday: 0,
 missingMinistry: 0,
 missingCountry: 0,
 missingBio: 0,
 needsVerification: 0,
 upcoming7: [],
 upcoming14: [],
 upcoming30: [],
 upcoming60: [],
 upcoming90: [],
 })
 const [ministerUpdateForm, setMinisterUpdateForm] = useState({
 minister_name: '',
 ministry_name: '',
 country: '',
 birthday: '',
 date_of_birth: '',
 birthday_text: '',
 biography: '',
 status: '',
 verification_status: 'unverified',
 source_note: '',
 })
 const [ministerEventForm, setMinisterEventForm] = useState({
 minister_name: '',
 event_name: '',
 event_type: 'Birthday',
 event_date: '',
 recurring_yearly: true,
 source_note: '',
 verification_status: 'unverified',
 notes: '',
 })
 const [selectedUpdateMinister, setSelectedUpdateMinister] = useState(null)
 const [ministerUpdateSearch, setMinisterUpdateSearch] = useState('')
 const [publishingStats, setPublishingStats] = useState({
 waiting: 0,
 publishingToday: 0,
 publishedToday: 0,
 failed: 0,
 })
 const [weeklySermons, setWeeklySermons] = useState([
 { title: '', minister: '', notes: '' },
 { title: '', minister: '', notes: '' },
 { title: '', minister: '', notes: '' },
 { title: '', minister: '', notes: '' },
 { title: '', minister: '', notes: '' },
 { title: '', minister: '', notes: '' },
 { title: '', minister: '', notes: '' },
 ])
 const autoPublishLock = useRef(false)
 const remainingDaysLock = useRef(false)
 const [busy, setBusy] = useState(false)
 const [publisherDebug, setPublisherDebug] = useState('')
 const [duePostsCount, setDuePostsCount] = useState(0)
 const [publisherLog, setPublisherLog] = useState([])

 const [lastPublishedPost, setLastPublishedPost] = useState(null)
 const [nextPostCountdown, setNextPostCountdown] = useState('')
 const [sessionPublishedCount, setSessionPublishedCount] = useState(0)
 const sessionPublishedRef = useRef(0)
 const countdownRef = useRef(null)

 const [sundayWorkflowSummary, setSundayWorkflowSummary] = useState(null)

 const [nextWeekCoverage, setNextWeekCoverage] = useState(0)
 const [missingCoverageDays, setMissingCoverageDays] = useState([])
 const [nextWeekDayCounts, setNextWeekDayCounts] = useState({})
 const [coverageLastUpdated, setCoverageLastUpdated] = useState(null)
 const [coverageRefreshing, setCoverageRefreshing] = useState(false)
 const [remainingDaysGenerating, setRemainingDaysGenerating] = useState(false)

 const [weeklyOverload, setWeeklyOverload] = useState([])
 const [loadBalancing, setLoadBalancing] = useState(false)

 const [analyticsStats, setAnalyticsStats] = useState({
 publishedToday: 0,
 publishedThisWeek: 0,
 scheduledThisWeek: 0,
 failedPosts: 0,
 totalScheduled: 0,
 totalPublished: 0,
 platformCounts: {},
 contentTypeCounts: {},
 categoryCounts: { 'Prayer Posts': 0, 'Sermon Posts': 0, 'Birthday Posts': 0, 'Other Posts': 0 },
 sevenDayPublishingData: [],
 })

 const [performanceStats, setPerformanceStats] = useState({
 totalViews: 0,
 totalLikes: 0,
 totalComments: 0,
 totalShares: 0,
 totalSaves: 0,
 followersGained: 0,
 platformPerformance: {},
 contentTypePerformance: {},
 bestPost: null,
 weeklyTotals: { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followersGained: 0 },
 records: [],
 })
 const [performanceForm, setPerformanceForm] = useState({
 content_queue_id: '',
 views: '',
 likes: '',
 comments: '',
 shares: '',
 saves: '',
 followers_gained: '',
 notes: '',
 })
 const [savingPerformance, setSavingPerformance] = useState(false)

 useEffect(() => {
 if (countdownRef.current) clearInterval(countdownRef.current)
 countdownRef.current = setInterval(() => {
 if (nextPosts.length > 0) {
 const next = nextPosts[0]
 const diff = new Date(next.scheduled_at) - new Date()
 if (diff <= 0) {
 setNextPostCountdown('Due now')
 } else {
 const h = Math.floor(diff / 3600000)
 const m = Math.floor((diff % 3600000) / 60000)
 const s = Math.floor((diff % 60000) / 1000)
 setNextPostCountdown(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`)
 }
 } else {
 setNextPostCountdown('No upcoming posts')
 }
 }, 1000)
 return () => clearInterval(countdownRef.current)
 }, [nextPosts])

 async function loadLastPublishedPost() {
 const { data, error } = await supabase
 .from('content_queue_main')
 .select('*')
 .eq('status', 'published')
 .not('last_auto_published_at', 'is', null)
 .order('last_auto_published_at', { ascending: false })
 .limit(1)

 if (!error && data && data.length > 0) {
 setLastPublishedPost(data[0])
 } else {
 const { data: d2 } = await supabase
 .from('content_queue_main')
 .select('*')
 .eq('status', 'published')
 .order('published_at', { ascending: false })
 .limit(1)
 if (d2 && d2.length > 0) setLastPublishedPost(d2[0])
 }
 }

 async function refreshDuePostsCount() {
 const nowIso = new Date().toISOString()
 const { data, error } = await supabase
 .from('content_queue_main')
 .select('id')
 .eq('status', 'scheduled')
 .lte('scheduled_at', nowIso)
 if (!error) setDuePostsCount((data || []).length)
 }

 async function calculateNextWeekCoverage() {
 setCoverageRefreshing(true)
 const today = new Date()
 const nextMonday = new Date(today)
 const day = nextMonday.getDay()
 const daysUntilNextMonday = day === 0 ? 1 : 8 - day
 nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday)
 nextMonday.setHours(0, 0, 0, 0)
 const nextSunday = new Date(nextMonday)
 nextSunday.setDate(nextMonday.getDate() + 6)
 nextSunday.setHours(23, 59, 59, 999)

 const { data, error } = await supabase
 .from('content_queue_main')
 .select('scheduled_at')
 .in('status', ['scheduled', 'published'])
 .gte('scheduled_at', nextMonday.toISOString())
 .lte('scheduled_at', nextSunday.toISOString())

 if (error) {
 console.log(error)
 setCoverageRefreshing(false)
 return { missingDays: [], coveredCount: 0, dayCounts: {}, error }
 }

 const posts = data || []
 const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
 const coveredDays = new Set()
 const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }

 posts.forEach((post) => {
 const postDate = new Date(post.scheduled_at)
 const dayOfWeek = postDate.getDay()
 const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
 coveredDays.add(dayIndex)
 dayCounts[dayIndex] = (dayCounts[dayIndex] || 0) + 1
 })

 setNextWeekCoverage(coveredDays.size)
 setNextWeekDayCounts(dayCounts)
 const missing = dayNames.filter((_, index) => !coveredDays.has(index))
 setMissingCoverageDays(missing)
 setCoverageLastUpdated(new Date())
 setCoverageRefreshing(false)

 return { missingDays: missing, coveredCount: coveredDays.size, dayCounts }
 }

 async function checkWeeklyOverload() {
 const today = new Date()
 const nextMonday = new Date(today)
 const day = nextMonday.getDay()
 const daysUntilNextMonday = day === 0 ? 1 : 8 - day
 nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday)
 nextMonday.setHours(0, 0, 0, 0)
 const nextSunday = new Date(nextMonday)
 nextSunday.setDate(nextMonday.getDate() + 6)
 nextSunday.setHours(23, 59, 59, 999)

 const { data, error } = await supabase
 .from('content_queue_main')
 .select('scheduled_at, ministry_name')
 .in('status', ['scheduled', 'published'])
 .gte('scheduled_at', nextMonday.toISOString())
 .lte('scheduled_at', nextSunday.toISOString())

 if (error) { console.log(error); return [] }

 const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
 const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }

 const posts = data || []
 posts.forEach((post) => {
 if (!(post.ministry_name || '').includes('Weekly Sermon Planner')) return
 const postDate = new Date(post.scheduled_at)
 const dayOfWeek = postDate.getDay()
 const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
 dayCounts[dayIndex] = (dayCounts[dayIndex] || 0) + 1
 })

 const overload = []
 for (let i = 0; i < 7; i++) {
 if (dayCounts[i] > 25) {
 overload.push({ dayName: dayNames[i], dayIndex: i, count: dayCounts[i], excess: dayCounts[i] - 25 })
 }
 }

 setWeeklyOverload(overload)
 return overload
 }

 function isProtectedPost(post) {
 const contentType = (post.content_type || '').toLowerCase()
 const ministryName = (post.ministry_name || '').toLowerCase()
 const hasCampaignStage = post.campaign_stage !== null && post.campaign_stage !== undefined && post.campaign_stage !== ''

 if (contentType.includes('birthday')) return true
 if (hasCampaignStage) return true
 if (!ministryName.includes('weekly sermon planner')) return true

 return false
 }

 async function balanceWeeklyLoad() {
 const confirmed = window.confirm(
 'This will keep the first 25 scheduled Weekly Sermon Planner posts per overloaded day and move excess posts to draft.\n\nBirthday campaigns and special posts are protected and will NOT be moved.\n\nContinue?'
 )
 if (!confirmed) return

 setLoadBalancing(true)
 try {
 const today = new Date()
 const nextMonday = new Date(today)
 const day = nextMonday.getDay()
 const daysUntilNextMonday = day === 0 ? 1 : 8 - day
 nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday)
 nextMonday.setHours(0, 0, 0, 0)

 let totalMoved = 0

 for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
 const dayStart = new Date(nextMonday)
 dayStart.setDate(nextMonday.getDate() + dayIndex)
 dayStart.setHours(0, 0, 0, 0)
 const dayEnd = new Date(dayStart)
 dayEnd.setHours(23, 59, 59, 999)

 const { data, error } = await supabase
 .from('content_queue_main')
 .select('id, content_type, campaign_stage, ministry_name')
 .eq('status', 'scheduled')
 .gte('scheduled_at', dayStart.toISOString())
 .lte('scheduled_at', dayEnd.toISOString())
 .order('scheduled_at', { ascending: true })

 if (error) { console.log(error); continue }

 const posts = data || []
 const moveablePosts = posts.filter((p) => !isProtectedPost(p))

 if (moveablePosts.length <= 25) continue

 const excessPosts = moveablePosts.slice(25)
 const excessIds = excessPosts.map((p) => p.id)

 const { error: updateError } = await supabase
 .from('content_queue_main')
 .update({ status: 'draft', scheduled_at: null, updated_at: new Date().toISOString() })
 .in('id', excessIds)

 if (updateError) {
 console.log(updateError)
 } else {
 totalMoved += excessIds.length
 }
 }

 await refreshAllQueueViews()
 await calculateNextWeekCoverage()
 await checkWeeklyOverload()

 alert(`Load balancing complete.\n\nMoved ${totalMoved} excess Weekly Sermon Planner posts to draft.\nBirthday campaigns and special posts were protected.`)
 } finally {
 setLoadBalancing(false)
 }
 }

 function getNextMondayDate() {
 const today = new Date()
 const nextMonday = new Date(today)
 const day = nextMonday.getDay()
 const daysUntilNextMonday = day === 0 ? 1 : 8 - day
 nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday)
 nextMonday.setHours(0, 0, 0, 0)
 return nextMonday
 }

 function buildWeeklyContentPieces(sermon) {
 const contentPieces = []
 for (let i = 1; i <= 5; i++) {
 contentPieces.push({ type: 'Image Quote', platform: 'AI Poster', text: `IMAGE QUOTE ${i}\n\nCreate a premium Christian social media quote graphic inspired by the sermon "${sermon.title}" by ${sermon.minister}.\n\nUse deep navy and gold colors, soft glowing light rays, Bible-inspired atmosphere, elegant church media design, and a powerful faith-based quote drawn from this message:\n\n${sermon.notes.slice(0, 250)}\n\nMake it suitable for Instagram, Facebook, and YouTube Community posts.` })
 contentPieces.push({ type: "Let's Pray", platform: 'Facebook', text: `LET'S PRAY ${i}\n\nSermon: ${sermon.title}\nMinister: ${sermon.minister}\n\nFather, in the name of Jesus, let the truth of Your Word from this message become a living reality in my life.\n\nStrengthen my faith.\nRenew my mind.\nOrder my steps.\nHelp me obey Your instructions.\n\nLet my life produce fruit that glorifies You.\n\nIn Jesus' name, Amen.\n\n#YearningForGod #LetsPray #PrayerPost` })
 contentPieces.push({ type: "Let's Prophesy", platform: 'Instagram', text: `LET'S PROPHESY ${i}\n\nI declare that the Word of God is producing results in my life.\n\nI walk in light.\nI walk in wisdom.\nI walk in divine direction.\nI walk in favour.\nI walk in spiritual strength.\n\nEvery delay is broken.\nEvery confusion is cleared.\nEvery closed door opens by mercy.\n\nIn Jesus' name, Amen.\n\n#YearningForGod #LetsProphesy #PropheticDeclaration` })
 contentPieces.push({ type: 'Shorts Script', platform: 'Video', text: `SHORTS SCRIPT ${i}\n\nHOOK:\nWhat if one truth from God's Word could change your entire week?\n\nBODY:\nIn the sermon "${sermon.title}", ${sermon.minister} reminds us that God's Word is not just information. It is light, power, direction, and life.\n\nKEY LINE:\nDo not only hear the Word. Believe it, declare it, and live by it.\n\nCTA:\nType AMEN if you receive this today.\n\n#YearningForGod #ChristianShorts #FaithVideo` })
 contentPieces.push({ type: 'Christian Lifestyle Post', platform: 'Facebook', text: `CHRISTIAN LIFESTYLE POST ${i}\n\nSermon: ${sermon.title}\nMinister: ${sermon.minister}\n\nChristian life is not only what we believe; it is how we live.\n\nThis message reminds us to align our mindset, speech, decisions, relationships, discipline, and daily actions with the Word of God.\n\nToday, ask yourself:\n\nWhat truth from God's Word should I obey?\nWhat habit needs to change?\nWhat decision should reflect Christ?\n\nFaith must become lifestyle.\n\n#YearningForGod #ChristianLiving #SpiritualGrowth` })
 }
 return contentPieces
 }

 function buildSmartWeeklySchedule(validSermons, nextMonday) {
 const POSTS_PER_DAY = 25
 const INTERVAL_MINUTES = 25
 const START_HOUR = 6
 const contentTypes = ['Image Quote', "Let's Pray", "Let's Prophesy", 'Shorts Script', 'Christian Lifestyle Post']
 const platforms = { 'Image Quote': 'AI Poster', "Let's Pray": 'Facebook', "Let's Prophesy": 'Instagram', 'Shorts Script': 'Video', 'Christian Lifestyle Post': 'Facebook' }

 const allPosts = []

 for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
 const dayStart = new Date(nextMonday)
 dayStart.setDate(nextMonday.getDate() + dayIndex)
 dayStart.setHours(START_HOUR, 0, 0, 0)

 for (let postIndex = 0; postIndex < POSTS_PER_DAY; postIndex++) {
 const sermon = validSermons[(postIndex + dayIndex) % validSermons.length]
 const contentType = contentTypes[postIndex % contentTypes.length]
 const platform = platforms[contentType]
 const repetitionIndex = Math.floor(postIndex / contentTypes.length) + 1
 const scheduledTime = new Date(dayStart)
 scheduledTime.setMinutes(postIndex * INTERVAL_MINUTES)
 const text = buildPostText(sermon, contentType, repetitionIndex)
 allPosts.push({ minister_name: sermon.minister, ministry_name: 'Weekly Sermon Planner v2', content_type: contentType, platform, content_text: text, status: 'scheduled', scheduled_at: scheduledTime.toISOString() })
 }
 }

 return allPosts
 }

 function buildPostText(sermon, contentType, index) {
 switch (contentType) {
 case 'Image Quote':
 return `IMAGE QUOTE ${index}\n\nCreate a premium Christian social media quote graphic inspired by the sermon "${sermon.title}" by ${sermon.minister}.\n\nUse deep navy and gold colors, soft glowing light rays, Bible-inspired atmosphere, elegant church media design, and a powerful faith-based quote drawn from this message:\n\n${sermon.notes.slice(0, 250)}\n\nMake it suitable for Instagram, Facebook, and YouTube Community posts.`
 case "Let's Pray":
 return `LET'S PRAY ${index}\n\nSermon: ${sermon.title}\nMinister: ${sermon.minister}\n\nFather, in the name of Jesus, let the truth of Your Word from this message become a living reality in my life.\n\nStrengthen my faith.\nRenew my mind.\nOrder my steps.\nHelp me obey Your instructions.\n\nLet my life produce fruit that glorifies You.\n\nIn Jesus' name, Amen.\n\n#YearningForGod #LetsPray #PrayerPost`
 case "Let's Prophesy":
 return `LET'S PROPHESY ${index}\n\nI declare that the Word of God is producing results in my life.\n\nI walk in light.\nI walk in wisdom.\nI walk in divine direction.\nI walk in favour.\nI walk in spiritual strength.\n\nEvery delay is broken.\nEvery confusion is cleared.\nEvery closed door opens by mercy.\n\nIn Jesus' name, Amen.\n\n#YearningForGod #LetsProphesy #PropheticDeclaration`
 case 'Shorts Script':
 return `SHORTS SCRIPT ${index}\n\nHOOK:\nWhat if one truth from God's Word could change your entire week?\n\nBODY:\nIn the sermon "${sermon.title}", ${sermon.minister} reminds us that God's Word is not just information. It is light, power, direction, and life.\n\nKEY LINE:\nDo not only hear the Word. Believe it, declare it, and live by it.\n\nCTA:\nType AMEN if you receive this today.\n\n#YearningForGod #ChristianShorts #FaithVideo`
 case 'Christian Lifestyle Post':
 return `CHRISTIAN LIFESTYLE POST ${index}\n\nSermon: ${sermon.title}\nMinister: ${sermon.minister}\n\nChristian life is not only what we believe; it is how we live.\n\nThis message reminds us to align our mindset, speech, decisions, relationships, discipline, and daily actions with the Word of God.\n\nToday, ask yourself:\n\nWhat truth from God's Word should I obey?\nWhat habit needs to change?\nWhat decision should reflect Christ?\n\nFaith must become lifestyle.\n\n#YearningForGod #ChristianLiving #SpiritualGrowth`
 default:
 return `${contentType} ${index}\n\nSermon: ${sermon.title}\nMinister: ${sermon.minister}\n\n${sermon.notes.slice(0, 300)}`
 }
 }

 async function generateRemainingDaysOnly() {
 if (remainingDaysLock.current || busy || remainingDaysGenerating) return
 remainingDaysLock.current = true

 try {
 const validSermons = weeklySermons.filter((sermon) => sermon.title.trim() && sermon.minister.trim() && sermon.notes.trim())

 if (validSermons.length === 0) {
 alert('Please add at least one complete sermon (title, minister, notes) in the Weekly Planner.')
 return
 }

 setBusy(true)
 setRemainingDaysGenerating(true)

 const nextMonday = getNextMondayDate()
 const plannerCoverage = []
 let totalNeeded = 0

 for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
 const dayStart = new Date(nextMonday)
 dayStart.setDate(nextMonday.getDate() + dayIndex)
 dayStart.setHours(0, 0, 0, 0)
 const dayEnd = new Date(dayStart)
 dayEnd.setHours(23, 59, 59, 999)

 const { data: existingPosts, error: existingError } = await supabase
 .from('content_queue_main')
 .select('id, ministry_name')
 .in('status', ['scheduled', 'published'])
 .gte('scheduled_at', dayStart.toISOString())
 .lte('scheduled_at', dayEnd.toISOString())

 if (existingError) continue

 const plannerCount = (existingPosts || []).filter((p) =>
 (p.ministry_name || '').includes('Weekly Sermon Planner')
 ).length

 if (plannerCount < 25) {
 plannerCoverage.push({
 dayIndex,
 dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex],
 allowed: 25 - plannerCount,
 existing: plannerCount
 })
 totalNeeded += (25 - plannerCount)
 }
 }

 if (plannerCoverage.length === 0) {
 alert('Hard Daily Capacity Guard: All next-week days already have max 25 Weekly Sermon Planner posts. Nothing to fill.')
 return
 }

 const daysToFill = plannerCoverage.map(d => d.dayName).join(', ')

 const proceed = window.confirm(
 `Capacity Guard: Fill missing slots up to 25 posts/day?\n\nDays needing content: ${daysToFill}\nTotal posts to insert: ${totalNeeded}`
 )
 if (!proceed) return

 const INTERVAL_MINUTES = 25
 const START_HOUR = 6
 const contentTypes = ['Image Quote', "Let's Pray", "Let's Prophesy", 'Shorts Script', 'Christian Lifestyle Post']
 const platforms = { 'Image Quote': 'AI Poster', "Let's Pray": 'Facebook', "Let's Prophesy": 'Instagram', 'Shorts Script': 'Video', 'Christian Lifestyle Post': 'Facebook' }

 let insertedCount = 0
 let generatedDays = 0
 let partialDaysFilled = 0

 for (const coverageDay of plannerCoverage) {
 const generationDayStart = new Date(nextMonday)
 generationDayStart.setDate(nextMonday.getDate() + coverageDay.dayIndex)
 generationDayStart.setHours(START_HOUR, 0, 0, 0)

 if (coverageDay.existing > 0) {
 partialDaysFilled++
 }

 for (let postIndex = 0; postIndex < coverageDay.allowed; postIndex++) {
 const indexShift = coverageDay.existing + postIndex
 const sermon = validSermons[(indexShift + coverageDay.dayIndex) % validSermons.length]
 const contentType = contentTypes[indexShift % contentTypes.length]
 const platform = platforms[contentType]
 const repetitionIndex = Math.floor(indexShift / contentTypes.length) + 1
 const scheduledTime = new Date(generationDayStart)
 scheduledTime.setMinutes(indexShift * INTERVAL_MINUTES)

 const { error } = await supabase.from('content_queue_main').insert([{
 minister_name: sermon.minister,
 ministry_name: 'Weekly Sermon Planner v2',
 content_type: contentType,
 platform,
 content_text: buildPostText(sermon, contentType, repetitionIndex),
 status: 'scheduled',
 scheduled_at: scheduledTime.toISOString(),
 }])

 if (error) { console.log(error) } else { insertedCount++ }
 }

 generatedDays++
 }

 const skippedDays = 7 - generatedDays

 await refreshAllQueueViews()
 alert(`Generation complete.\n\nHard Daily Capacity Guard Result:\n- Posts inserted: ${insertedCount}\n- Full days skipped: ${skippedDays}\n- Partial days filled: ${partialDaysFilled}`)
 setActiveTab('queue')
 } finally {
 remainingDaysLock.current = false
 setRemainingDaysGenerating(false)
 setBusy(false)
 }
 }

 async function clearOldDuePosts() {
 const confirmed = window.confirm('This will mark ALL overdue scheduled posts as FAILED.\n\nAre you sure?')
 if (!confirmed) return
 setBusy(true)
 try {
 const nowIso = new Date().toISOString()
 const { data, error } = await supabase.from('content_queue_main').select('id').eq('status', 'scheduled').lte('scheduled_at', nowIso)
 if (error) { alert(error.message); return }
 if (!data || data.length === 0) { alert('No overdue posts found'); return }
 const ids = data.map((p) => p.id)
 const { error: updateError } = await supabase.from('content_queue_main').update({ status: 'failed', updated_at: new Date().toISOString() }).in('id', ids)
 if (updateError) { alert(updateError.message) } else {
 alert(`${ids.length} overdue post(s) marked as failed`)
 await refreshAllQueueViews()
 await loadLastPublishedPost()
 await refreshDuePostsCount()
 }
 } finally { setBusy(false) }
 }

 function addLog(message) {
 const timestamp = new Date().toLocaleTimeString()
 setPublisherLog((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50))
 }

 async function loadPublishingSettings() {
 const { data, error } = await supabase.from('publishing_settings').select('*').eq('setting_key', 'main').single()
 if (error && error.code !== 'PGRST116') { console.log(error); return }
 const settings = data?.setting_value || data?.settingvalue || {}
 setAutoPublishEnabled(Boolean(settings.autoPublishEnabled))
 setPublishingPaused(Boolean(settings.publishingPaused))
 setPublishingInterval(Number(settings.publishingInterval || 30))
 }

 async function savePublishingSettings(newSettings) {
 const settings = { autoPublishEnabled, publishingPaused, publishingInterval, publishingTimezone, ...newSettings }
 const { error } = await supabase.from('publishing_settings').upsert({ setting_key: 'main', setting_value: settings, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' })
 if (error) { alert(error.message) }
 }

 useEffect(() => {
 ;(async () => {
 await loadPublishingSettings()
 await initializeData()
 await getMinisterTones()
 await checkTodayPrayerPack()
 await getDashboardAutomationStats()
 await getDailyContentPlannerStats()
 await getPublishingStats()
 await getTodayTimeline()
 await getNextPosts()
 await loadLastPublishedPost()
 await refreshDuePostsCount()
 await calculateNextWeekCoverage()
 await checkWeeklyOverload()
 await getAnalyticsStats()
 await getPerformanceStats()
 await getContentCalendarStats()
 await getCampaignPlannerStats()
 await getCampaignPlannerStats()
 await getMinisterUpdateStats()
 const refreshedEvents = await getBirthdayEvents()
 setBirthdayOpportunities(detectBirthdayOpportunities(ministers, refreshedEvents || birthdayEvents))
 })()
 }, [])

 useEffect(() => {
 const interval = setInterval(() => { refreshDuePostsCount() }, 30000)
 return () => clearInterval(interval)
 }, [])

 useEffect(() => {
 if (!autoPublishEnabled) return
 if (publishingPaused) return
 const timer = setInterval(async () => { await runAutomaticPublisher() }, 10000)
 return () => clearInterval(timer)
 }, [autoPublishEnabled, publishingPaused, publishingInterval])

 async function refreshAllQueueViews() {
 await getQueue()
 await getDashboardAutomationStats()
 await getDailyContentPlannerStats()
 await getPublishingStats()
 await getTodayTimeline()
 await getNextPosts()
 await checkTodayPrayerPack()
 await loadLastPublishedPost()
 await refreshDuePostsCount()
 await calculateNextWeekCoverage()
 await checkWeeklyOverload()
 await getAnalyticsStats()
 await getPerformanceStats()
 await getContentCalendarStats()
 }

 async function getContentCalendarStats() {
 const { data, error } = await supabase
 .from('content_queue_main')
 .select('id, minister_name, ministry_name, content_type, platform, content_text, status, scheduled_at, published_at, updated_at, campaign_stage')
 if (error) { console.log(error); return }
 const posts = data || []

 const now = new Date()
 const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0)
 const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999)

 // Monday to Sunday for the current week
 const dayOfWeek = now.getDay() // 0=Sun..6=Sat
 const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
 const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() + mondayOffset); startOfWeek.setHours(0, 0, 0, 0)
 const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999)

 const effectiveDate = (p) => {
 if (p.status === 'published') {
 return p.published_at || p.last_auto_published_at || p.updated_at || p.scheduled_at
 }
 return p.scheduled_at || p.updated_at || p.published_at
 }

 const inRange = (p, start, end) => {
 const d = effectiveDate(p)
 if (!d) return false
 const t = new Date(d).getTime()
 return t >= start.getTime() && t <= end.getTime()
 }

 const todayPosts = posts.filter((p) => inRange(p, startOfToday, endOfToday))
 const weekPosts = posts.filter((p) => inRange(p, startOfWeek, endOfWeek))

 const todayCounts = {
 scheduled: todayPosts.filter((p) => p.status === 'scheduled').length,
 published: todayPosts.filter((p) => p.status === 'published').length,
 draft: todayPosts.filter((p) => p.status === 'draft').length,
 failed: todayPosts.filter((p) => p.status === 'failed').length,
 }

 const weekCounts = []
 for (let i = 0; i < 7; i++) {
 const dayStart = new Date(startOfWeek); dayStart.setDate(startOfWeek.getDate() + i); dayStart.setHours(0, 0, 0, 0)
 const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999)
 const dayPosts = posts.filter((p) => inRange(p, dayStart, dayEnd))
 const scheduled = dayPosts.filter((p) => p.status === 'scheduled').length
 const published = dayPosts.filter((p) => p.status === 'published').length
 const failed = dayPosts.filter((p) => p.status === 'failed').length
 const draft = dayPosts.filter((p) => p.status === 'draft').length
 const campaignOrBirthday = dayPosts.filter((p) => p.campaign_stage || (p.content_type || '').toLowerCase().includes('birthday')).length
 const activeTotal = scheduled + published
 weekCounts.push({
 date: new Date(dayStart),
 label: dayStart.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
 total: dayPosts.length,
 scheduled,
 published,
 failed,
 draft,
 campaignOrBirthday,
 heavy: activeTotal > 25,
 empty: activeTotal === 0,
 })
 }

 const isBirthday = (p) => (p.content_type || '').toLowerCase().includes('birthday')
 const isPrayer = (p) => {
 const m = (p.ministry_name || '').toLowerCase()
 const c = (p.content_type || '').toLowerCase()
 return m.includes('daily prayer') || c.includes('prayer') || c.includes('prophesy')
 }
 const isSermon = (p) => {
 const m = (p.ministry_name || '').toLowerCase()
 return m.includes('weekly sermon planner') || m.includes('sermon intelligence')
 }

 const campaignPosts = posts.filter((p) => p.campaign_stage || isBirthday(p))
 const prayerPosts = posts.filter(isPrayer)
 const sermonPosts = posts.filter(isSermon)
 const birthdayPosts = posts.filter(isBirthday)

 const emptyDaysThisWeek = weekCounts.filter((d) => d.empty)
 const heavyDaysThisWeek = weekCounts.filter((d) => d.heavy)

 // ---- Next Week (Mon闂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸ゅ嫰鏌涢锝嗙缁炬儳顭烽弻鏇熺箾閻愵剚鐝旂紒鐐劤濞硷繝寮婚妶澶嬪殞闁规鍠栭悧姘箾鐎涙鐭婃繝鈧柆宥呯劦妞ゆ帒鍊归崵鈧梺纭咁嚋缁绘繈骞冩导瀛樻櫢闁跨噦鎷� after current week) ----
const _now = new Date()
const _dow = _now.getDay() // 0=Sun..6=Sat
const _daysToNextMon = ((8 - _dow) % 7) || 7 // always next Monday

const nextWeekStart = new Date(_now)
nextWeekStart.setDate(_now.getDate() + _daysToNextMon)
nextWeekStart.setHours(0, 0, 0, 0)

const nextWeekEnd = new Date(nextWeekStart)
nextWeekEnd.setDate(nextWeekStart.getDate() + 7)

const inNextWeek = (p) => {
  const raw = p.scheduled_at || p.published_at || p.updated_at
  if (!raw) return false

  const d = new Date(raw)
  return d >= nextWeekStart && d < nextWeekEnd
}

const nextWeekPosts = posts.filter(inNextWeek)

const nextWeekCounts = Array.from({ length: 7 }, (_, i) => {
  const dayStart = new Date(nextWeekStart)
  dayStart.setDate(nextWeekStart.getDate() + i)

  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayStart.getDate() + 1)

  const dayPosts = nextWeekPosts.filter((p) => {
    const raw = p.scheduled_at || p.published_at || p.updated_at
    if (!raw) return false

    const d = new Date(raw)
    return d >= dayStart && d < dayEnd
  })

  const scheduled = dayPosts.filter((p) => p.status === 'scheduled').length
  const published = dayPosts.filter((p) => p.status === 'published').length
  const failed = dayPosts.filter((p) => p.status === 'failed').length
  const draft = dayPosts.filter((p) => p.status === 'draft').length

  const campaignOrBirthday = dayPosts.filter(
    (p) =>
      p.campaign_stage ||
      (p.content_type || '').toLowerCase().includes('birthday')
  ).length

  const activeTotal = scheduled + published

  return {
    date: new Date(dayStart),
    label: dayStart.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    total: dayPosts.length,
    scheduled,
    published,
    failed,
    draft,
    campaignOrBirthday,
    empty: activeTotal === 0,
    heavy: activeTotal > 25,
  }
})

const emptyDaysNextWeek = nextWeekCounts.filter((d) => d.empty)
const heavyDaysNextWeek = nextWeekCounts.filter((d) => d.heavy)
 setCalendarStats({
 todayPosts,
 weekPosts,
 todayCounts,
 weekCounts,
 campaignPosts,
 prayerPosts,
 sermonPosts,
 birthdayPosts,
 emptyDaysThisWeek,
 heavyDaysThisWeek,

 nextWeekPosts,
nextWeekCounts,
emptyDaysNextWeek,
heavyDaysNextWeek,
 })
 }

 async function getCampaignPlannerStats() {
 const { data, error } = await supabase
 .from('campaign_planner_main')
 .select('*')
 .order('start_date', { ascending: false })
 if (error) { console.log(error); return }
 const campaigns = data || []
 setCampaignPlannerStats({
 campaigns,
 total: campaigns.length,
 planned: campaigns.filter((c) => c.status === 'planned').length,
 active: campaigns.filter((c) => c.status === 'active').length,
 completed: campaigns.filter((c) => c.status === 'completed').length,
 paused: campaigns.filter((c) => c.status === 'paused').length,
 })
 }

 async function saveCampaignPlan() {
 if (!campaignForm.campaign_name.trim()) { alert('Campaign Name is required'); return }
 const payload = {
 campaign_name: campaignForm.campaign_name.trim(),
 campaign_type: campaignForm.campaign_type,
 theme: campaignForm.theme || null,
 scripture_reference: campaignForm.scripture_reference || null,
 start_date: campaignForm.start_date || null,
 end_date: campaignForm.end_date || null,
 target_platforms: campaignForm.target_platforms || null,
 content_goal: campaignForm.content_goal || null,
 notes: campaignForm.notes || null,
 status: campaignForm.status || 'planned',
 updated_at: new Date().toISOString(),
 }
 const { error } = await supabase.from('campaign_planner_main').insert(payload)
 if (error) { alert(error.message); return }
 alert('Campaign plan saved')
 setCampaignForm({
 campaign_name: '',
 campaign_type: 'New Month Campaign',
 theme: '',
 scripture_reference: '',
 start_date: '',
 end_date: '',
 target_platforms: '',
 content_goal: '',
 notes: '',
 status: 'planned',
 })
 await getCampaignPlannerStats()
 }

 async function updateCampaignStatus(id, status) {
 const { error } = await supabase
 .from('campaign_planner_main')
 .update({ status, updated_at: new Date().toISOString() })
 .eq('id', id)
 if (error) { alert(error.message); return }
 await getCampaignPlannerStats()
 }

 async function generateCampaignPosts(campaign) {
 if (!campaign || !campaign.id) { alert('Invalid campaign'); return }

 // Duplicate check
 const { data: existing, error: checkErr } = await supabase
 .from('content_queue_main')
 .select('id, campaign_stage')
 .eq('ministry_name', campaign.campaign_name)
 .ilike('campaign_stage', `%${campaign.campaign_type || ''}%`)
 if (checkErr) { alert(checkErr.message); return }
 if (existing && existing.length > 0) {
 const ok = confirm(`${existing.length} posts already exist for "${campaign.campaign_name}". Generate again?`)
 if (!ok) return
 }

 const hasStart = !!campaign.start_date
 const startDate = hasStart ? new Date(campaign.start_date) : new Date()
 const endDate = campaign.end_date ? new Date(campaign.end_date) : new Date(startDate)
 if (endDate < startDate) { alert('end_date is before start_date'); return }

 const status = hasStart ? 'scheduled' : 'draft'
 const platforms = ['Facebook', 'Instagram', 'YouTube', 'TikTok', 'Threads']
 const contentTypes = ['Scripture Reflection', 'Prayer Post', 'Prophetic Declaration', 'Caption', 'Short Video Script']
 const times = [[6,0],[9,0],[12,0],[15,0],[18,0]]
 const theme = campaign.theme || 'God\'s presence'
 const scripture = campaign.scripture_reference || ''
 const cType = campaign.campaign_type || 'Campaign'

 const reflections = [
 `Beloved, dwell on ${theme} today. The Lord is calling you deeper into His heart, where every fear melts before His perfect love.`,
 `Lift your eyes ${theme} is not a distant promise but a present reality. Heaven leans toward those who yearn for God.`,
 `Today the Spirit whispers over ${theme}: "I am with you, I am for you, and I am working all things for your good."`,
 `Position yourself in worship around ${theme}. As you yield, the Lord pours fresh oil, fresh fire, and fresh vision.`,
 `Let ${theme} reshape your prayers. The kingdom of God advances when His sons and daughters agree with heaven.`,
 ]

 const rows = []
 let dayNumber = 1
 let cursor = new Date(startDate)
 while (cursor <= endDate) {
 for (let i = 0; i < 5; i++) {
 const [hh, mm] = times[i]
 const when = new Date(cursor)
 when.setHours(hh, mm, 0, 0)
 const ct = contentTypes[i % contentTypes.length]
 const platform = platforms[(dayNumber + i - 1) % platforms.length]
 const reflection = reflections[(dayNumber + i) % reflections.length]
 const text =
` ${campaign.campaign_name} Day ${dayNumber}
Type: ${cType} | ${ct}
Theme: ${theme}${scripture ? `\nScripture: ${scripture}` : ''}

${reflection}

#YearningForGod #${(cType || '').replace(/\s+/g,'')} #${(theme || '').replace(/\s+/g,'')}`
 rows.push({
 minister_name: 'Yearning for God',
 ministry_name: campaign.campaign_name,
 content_type: ct,
 platform,
 content_text: text,
 status,
 scheduled_at: hasStart ? when.toISOString() : null,
 campaign_stage: `${cType} - Day ${dayNumber}`,
 })
 }
 dayNumber += 1
 cursor.setDate(cursor.getDate() + 1)
 }

 const { error: insErr } = await supabase.from('content_queue_main').insert(rows)
 if (insErr) { alert(insErr.message); return }

 await refreshAllQueueViews()
 await getCampaignPlannerStats()
 alert(`Generated ${rows.length} posts for "${campaign.campaign_name}"`)
 }

 function applyCampaignTemplate(tpl) {
 setCampaignForm((f) => ({ ...f, ...tpl }))
 }

 async function getMinisterUpdateStats() {
 const { data: profiles, error: pErr } = await supabase
 .from('minister_profiles_main')
 .select('*')
 if (pErr) { console.log(pErr) }
 const allMinisters = profiles || []

 const { data: eventsData, error: eErr } = await supabase
 .from('minister_events_main')
 .select('*')
 .order('event_date', { ascending: true })
 if (eErr) { console.log(eErr) }
 const events = eventsData || []

 const isEmpty = (v) => v === null || v === undefined || String(v).trim() === ''
 const missingBirthday = allMinisters.filter((m) => isEmpty(m.birthday) && isEmpty(m.date_of_birth)).length
 const missingMinistry = allMinisters.filter((m) => isEmpty(m.ministry_name)).length
 const missingCountry = allMinisters.filter((m) => isEmpty(m.country)).length
 const missingBio = allMinisters.filter((m) => isEmpty(m.biography)).length
 const needsVerification = allMinisters.filter((m) => {
 const v = (m.verification_status || '').toLowerCase()
 return v === '' || v === 'unverified' || v === 'needs review'
 }).length

 const today = new Date(); today.setHours(0, 0, 0, 0)
 const daysUntilBirthday = (m) => {
 const raw = m.birthday || m.date_of_birth
 if (!raw) return null
 const d = new Date(raw)
 if (isNaN(d.getTime())) return null
 const next = new Date(today.getFullYear(), d.getMonth(), d.getDate())
 if (next < today) next.setFullYear(today.getFullYear() + 1)
 return Math.ceil((next - today) / 86400000)
 }

 const ministersWithDays = allMinisters
 .map((m) => ({ ...m, _days: daysUntilBirthday(m) }))
 .filter((m) => m._days !== null)

 const upcoming30 = ministersWithDays.filter((m) => m._days <= 30).sort((a, b) => a._days - b._days)
 const upcoming60 = ministersWithDays.filter((m) => m._days <= 60).sort((a, b) => a._days - b._days)
 const upcoming90 = ministersWithDays.filter((m) => m._days <= 90).sort((a, b) => a._days - b._days)

 const daysUntilEvent = (e) => {
 if (!e.event_date) return null
 const d = new Date(e.event_date)
 if (isNaN(d.getTime())) return null
 let next = new Date(d)
 if (e.recurring_yearly) {
 next = new Date(today.getFullYear(), d.getMonth(), d.getDate())
 if (next < today) next.setFullYear(today.getFullYear() + 1)
 }
 return Math.ceil((next - today) / 86400000)
 }
 const eventsWithDays = events.map((e) => ({ ...e, _days: daysUntilEvent(e) }))
 const upcoming7 = eventsWithDays.filter((e) => e._days !== null && e._days >= 0 && e._days <= 7)
 const upcoming14 = eventsWithDays.filter((e) => e._days !== null && e._days >= 0 && e._days <= 14)
 const upcomingEvents30 = eventsWithDays.filter((e) => e._days !== null && e._days >= 0 && e._days <= 30)
 const upcomingEvents60 = eventsWithDays.filter((e) => e._days !== null && e._days >= 0 && e._days <= 60)
 const upcomingEvents90 = eventsWithDays.filter((e) => e._days !== null && e._days >= 0 && e._days <= 90)

 setMinisterUpdateStats({
 events: eventsWithDays,
 missingBirthday,
 missingMinistry,
 missingCountry,
 missingBio,
 needsVerification,
 upcoming30,
 upcoming60,
 upcoming90,
 upcoming7,
 upcoming14,
 upcomingEvents30,
 upcomingEvents60,
 upcomingEvents90,
 })
 }

 function selectMinisterForUpdate(m) {
 setSelectedUpdateMinister(m)
 setMinisterUpdateForm({
 minister_name: m.minister_name || '',
 ministry_name: m.ministry_name || '',
 country: m.country || '',
 birthday: m.birthday || '',
 date_of_birth: m.date_of_birth || '',
 birthday_text: m.birthday_text || '',
 biography: m.biography || '',
 status: m.status || '',
 verification_status: m.verification_status || 'unverified',
 source_note: m.source_note || '',
 })
 setMinisterEventForm((f) => ({ ...f, minister_name: m.minister_name || '' }))
 }

 async function updateMinisterProfileInfo() {
 if (!selectedUpdateMinister || !selectedUpdateMinister.id) { alert('Select a minister first'); return }
 const payload = {
 minister_name: ministerUpdateForm.minister_name || null,
 ministry_name: ministerUpdateForm.ministry_name || null,
 country: ministerUpdateForm.country || null,
 birthday: ministerUpdateForm.birthday || null,
 date_of_birth: ministerUpdateForm.date_of_birth || null,
 birthday_text: ministerUpdateForm.birthday_text || null,
 biography: ministerUpdateForm.biography || null,
 status: ministerUpdateForm.status || null,
 verification_status: ministerUpdateForm.verification_status || null,
 source_note: ministerUpdateForm.source_note || null,
 }
 const { error } = await supabase
 .from('minister_profiles_main')
 .update(payload)
 .eq('id', selectedUpdateMinister.id)
 if (error) { alert(error.message); return }
 alert('Minister profile updated')
 const refreshedMinisters = await getMinisters()
 const refreshedEvents = await getBirthdayEvents()
 setBirthdayOpportunities(detectBirthdayOpportunities(refreshedMinisters || ministers, refreshedEvents || birthdayEvents))
 await getMinisterUpdateStats()
 }

 async function saveMinisterEvent() {
 if (!ministerEventForm.minister_name.trim()) { alert('Minister is required'); return }
 if (!ministerEventForm.event_name.trim()) { alert('Event name is required'); return }
 const payload = {
 minister_name: ministerEventForm.minister_name.trim(),
 event_name: ministerEventForm.event_name.trim(),
 event_type: ministerEventForm.event_type,
 event_date: ministerEventForm.event_date || null,
 recurring_yearly: !!ministerEventForm.recurring_yearly,
 source_note: ministerEventForm.source_note || null,
 verification_status: ministerEventForm.verification_status || 'unverified',
 notes: ministerEventForm.notes || null,
 updated_at: new Date().toISOString(),
 }
 const { error } = await supabase.from('minister_events_main').insert(payload)
 if (error) { alert(error.message); return }
 alert('Event saved')
 setMinisterEventForm({
 minister_name: selectedUpdateMinister ? (selectedUpdateMinister.minister_name || '') : '',
 event_name: '',
 event_type: 'Birthday',
 event_date: '',
 recurring_yearly: true,
 source_note: '',
 verification_status: 'unverified',
 notes: '',
 })
 await getMinisterUpdateStats()
 const refreshedEvents = await getBirthdayEvents()
 setBirthdayOpportunities(detectBirthdayOpportunities(ministers, refreshedEvents || birthdayEvents))
 }

 async function updateMinisterEventStatus(id, verification_status) {
 const { error } = await supabase
 .from('minister_events_main')
 .update({ verification_status, updated_at: new Date().toISOString() })
 .eq('id', id)
 if (error) { alert(error.message); return }
 await getMinisterUpdateStats()
 const refreshedEvents = await getBirthdayEvents()
 setBirthdayOpportunities(detectBirthdayOpportunities(ministers, refreshedEvents || birthdayEvents))
 }

 async function deleteMinisterEvent(id) {
 if (!confirm('Delete this event?')) return
 const { error } = await supabase.from('minister_events_main').delete().eq('id', id)
 if (error) { alert(error.message); return }
 await getMinisterUpdateStats()
 const refreshedEvents = await getBirthdayEvents()
 setBirthdayOpportunities(detectBirthdayOpportunities(ministers, refreshedEvents || birthdayEvents))
 }

 async function getAnalyticsStats() {
 const { data, error } = await supabase.from('content_queue_main').select('*')
 if (error) { console.log(error); return }
 const posts = data || []

 const now = new Date()
 const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0)
 const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999)

 const startOfWeek = new Date(now)
 const dayOfWeek = startOfWeek.getDay()
 const diffToMonday = (dayOfWeek + 6) % 7
 startOfWeek.setDate(startOfWeek.getDate() - diffToMonday)
 startOfWeek.setHours(0, 0, 0, 0)
 const endOfWeek = new Date(startOfWeek)
 endOfWeek.setDate(startOfWeek.getDate() + 6)
 endOfWeek.setHours(23, 59, 59, 999)

 function publishedDate(post) {
 const src = post.published_at || post.last_auto_published_at || post.updated_at
 return src ? new Date(src) : null
 }

 const publishedPosts = posts.filter((p) => p.status === 'published')
 const scheduledPosts = posts.filter((p) => p.status === 'scheduled')
 const failedPostsList = posts.filter((p) => p.status === 'failed')

 const publishedToday = publishedPosts.filter((p) => {
 const d = publishedDate(p); return d && d >= startOfToday && d <= endOfToday
 }).length

 const publishedThisWeek = publishedPosts.filter((p) => {
 const d = publishedDate(p); return d && d >= startOfWeek && d <= endOfWeek
 }).length

 const scheduledThisWeek = scheduledPosts.filter((p) => {
 if (!p.scheduled_at) return false
 const d = new Date(p.scheduled_at)
 return d >= startOfWeek && d <= endOfWeek
 }).length

 const failedPosts = failedPostsList.length
 const totalScheduled = scheduledPosts.length
 const totalPublished = publishedPosts.length

 const platformCounts = {}
 const contentTypeCounts = {}
 posts.forEach((p) => {
 const platform = p.platform || 'Unknown'
 const ctype = p.content_type || 'Unknown'
 platformCounts[platform] = (platformCounts[platform] || 0) + 1
 contentTypeCounts[ctype] = (contentTypeCounts[ctype] || 0) + 1
 })

 const categoryCounts = { 'Prayer Posts': 0, 'Sermon Posts': 0, 'Birthday Posts': 0, 'Other Posts': 0 }
 posts.forEach((p) => {
 const ct = (p.content_type || '').toLowerCase()
 const mn = (p.ministry_name || '').toLowerCase()
 const hasStage = p.campaign_stage !== null && p.campaign_stage !== undefined && p.campaign_stage !== ''

 const isPrayer = ct.includes('prayer') || ct.includes('prophesy') || mn.includes('daily prayer')
 const isSermon = mn.includes('sermon intelligence') || mn.includes('weekly sermon planner')
 const isBirthday = ct.includes('birthday') || hasStage

 if (isPrayer) categoryCounts['Prayer Posts']++
 else if (isSermon) categoryCounts['Sermon Posts']++
 else if (isBirthday) categoryCounts['Birthday Posts']++
 else categoryCounts['Other Posts']++
 })

 const sevenDayPublishingData = []
 for (let i = 6; i >= 0; i--) {
 const day = new Date(now)
 day.setDate(now.getDate() - i)
 const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0)
 const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999)
 const count = publishedPosts.filter((p) => {
 const d = publishedDate(p); return d && d >= dayStart && d <= dayEnd
 }).length
 sevenDayPublishingData.push({
 date: day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
 shortLabel: day.toLocaleDateString(undefined, { weekday: 'short' }),
 count,
 })
 }

 setAnalyticsStats({
 publishedToday,
 publishedThisWeek,
 scheduledThisWeek,
 failedPosts,
 totalScheduled,
 totalPublished,
 platformCounts,
 contentTypeCounts,
 categoryCounts,
 sevenDayPublishingData,
 })
 }

 async function runAutomaticPublisher() {
 if (!autoPublishEnabled || publishingPaused) return
 if (autoPublishLock.current) return
 autoPublishLock.current = true
 try {
 const now = new Date()
 const nowIso = now.toISOString()
 const { data: lastAuto, error: lastErr } = await supabase.from('content_queue_main').select('last_auto_published_at').not('last_auto_published_at', 'is', null).order('last_auto_published_at', { ascending: false }).limit(1)
 if (!lastErr && lastAuto && lastAuto.length > 0) {
 const last = new Date(lastAuto[0].last_auto_published_at)
 if (now.getTime() - last.getTime() < publishingInterval * 60 * 1000) return
 }
 const { data, error } = await supabase.from('content_queue_main').select('id').eq('status', 'scheduled').lte('scheduled_at', nowIso).order('scheduled_at', { ascending: true }).limit(5)
 if (error || !data || data.length === 0) return
 const ids = data.map((p) => p.id)
 await supabase.from('content_queue_main').update({ status: 'published', updated_at: nowIso, published_at: nowIso, last_auto_published_at: nowIso }).in('id', ids)
 sessionPublishedRef.current += ids.length
 setSessionPublishedCount(sessionPublishedRef.current)
 addLog(`Auto-published ${ids.length} post(s). IDs: ${ids.join(', ')}`)
 await refreshAllQueueViews()
 } finally {
 autoPublishLock.current = false
 }
 }

 async function getPerformanceStats() {
 const { data, error } = await supabase.from('post_performance_main').select('*').order('created_at', { ascending: false })
 if (error) { console.log(error); return }
 const records = data || []

 const toNum = (v) => Number(v || 0)
 let totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0, totalSaves = 0, followersGained = 0
 const platformPerformance = {}
 const contentTypePerformance = {}

 records.forEach((r) => {
 const v = toNum(r.views), l = toNum(r.likes), c = toNum(r.comments), s = toNum(r.shares), sv = toNum(r.saves), f = toNum(r.followers_gained)
 totalViews += v; totalLikes += l; totalComments += c; totalShares += s; totalSaves += sv; followersGained += f

 const platform = r.platform || 'Unknown'
 if (!platformPerformance[platform]) platformPerformance[platform] = { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, posts: 0 }
 platformPerformance[platform].views += v
 platformPerformance[platform].likes += l
 platformPerformance[platform].comments += c
 platformPerformance[platform].shares += s
 platformPerformance[platform].saves += sv
 platformPerformance[platform].posts += 1

 const ctype = r.content_type || 'Unknown'
 if (!contentTypePerformance[ctype]) contentTypePerformance[ctype] = { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, posts: 0 }
 contentTypePerformance[ctype].views += v
 contentTypePerformance[ctype].likes += l
 contentTypePerformance[ctype].comments += c
 contentTypePerformance[ctype].shares += s
 contentTypePerformance[ctype].saves += sv
 contentTypePerformance[ctype].posts += 1
 })

 function engagementScore(r) {
 return toNum(r.views) + toNum(r.likes) * 2 + toNum(r.comments) * 3 + toNum(r.shares) * 4 + toNum(r.saves) * 4
 }
 const bestPost = records.length === 0 ? null : records.reduce((best, r) => engagementScore(r) > engagementScore(best) ? r : best, records[0])

 const now = new Date()
 const startOfWeek = new Date(now)
 const dayOfWeek = startOfWeek.getDay()
 const diffToMonday = (dayOfWeek + 6) % 7
 startOfWeek.setDate(startOfWeek.getDate() - diffToMonday)
 startOfWeek.setHours(0, 0, 0, 0)
 const endOfWeek = new Date(startOfWeek)
 endOfWeek.setDate(startOfWeek.getDate() + 6)
 endOfWeek.setHours(23, 59, 59, 999)

 const weeklyTotals = { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followersGained: 0 }
 records.forEach((r) => {
 const ts = r.created_at ? new Date(r.created_at) : null
 if (ts && ts >= startOfWeek && ts <= endOfWeek) {
 weeklyTotals.views += toNum(r.views)
 weeklyTotals.likes += toNum(r.likes)
 weeklyTotals.comments += toNum(r.comments)
 weeklyTotals.shares += toNum(r.shares)
 weeklyTotals.saves += toNum(r.saves)
 weeklyTotals.followersGained += toNum(r.followers_gained)
 }
 })

 setPerformanceStats({
 totalViews, totalLikes, totalComments, totalShares, totalSaves, followersGained,
 platformPerformance, contentTypePerformance, bestPost, weeklyTotals, records,
 })
 }

 async function savePostPerformance() {
 if (!performanceForm.content_queue_id) { alert('Please select a published post'); return }
 setSavingPerformance(true)
 try {
 const selectedPost = queue.find((q) => String(q.id) === String(performanceForm.content_queue_id))
 if (!selectedPost) { alert('Selected post not found in queue'); return }

 const toNum = (v) => v === '' || v === null || v === undefined ? 0 : Number(v)
 const nowIso = new Date().toISOString()

 const { error } = await supabase.from('post_performance_main').insert([{
 content_queue_id: selectedPost.id,
 platform: selectedPost.platform,
 content_type: selectedPost.content_type,
 minister_name: selectedPost.minister_name,
 views: toNum(performanceForm.views),
 likes: toNum(performanceForm.likes),
 comments: toNum(performanceForm.comments),
 shares: toNum(performanceForm.shares),
 saves: toNum(performanceForm.saves),
 followers_gained: toNum(performanceForm.followers_gained),
 notes: performanceForm.notes || null,
 created_at: nowIso,
 updated_at: nowIso,
 }])

 if (error) { alert(error.message); return }
 alert('Performance recorded successfully')
 setPerformanceForm({ content_queue_id: '', views: '', likes: '', comments: '', shares: '', saves: '', followers_gained: '', notes: '' })
 await getPerformanceStats()
 } finally {
 setSavingPerformance(false)
 }
 }

 async function getPublishingStats() {
 const today = new Date()
 const start = new Date(today); start.setHours(0, 0, 0, 0)
 const end = new Date(today); end.setHours(23, 59, 59, 999)
 const { data, error } = await supabase.from('content_queue_main').select('*')
 if (error) { console.log(error); return }
 const posts = data || []
 setPublishingStats({
 waiting: posts.filter((p) => p.status === 'scheduled').length,
 publishingToday: posts.filter((p) => { if (!p.scheduled_at) return false; const date = new Date(p.scheduled_at); return p.status === 'scheduled' && date >= start && date <= end }).length,
 publishedToday: posts.filter((p) => { const dateSource = p.last_auto_published_at || p.updated_at || p.published_at; if (!dateSource) return false; const date = new Date(dateSource); return p.status === 'published' && date >= start && date <= end }).length,
 failed: posts.filter((p) => p.status === 'failed').length,
 })
 }

 async function getTodayTimeline() {
 const today = new Date()
 const start = new Date(today); start.setHours(0, 0, 0, 0)
 const end = new Date(today); end.setHours(23, 59, 59, 999)
 const { data, error } = await supabase.from('content_queue_main').select('*').gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString()).order('scheduled_at', { ascending: true })
 if (error) { console.log(error); return }
 setTodayTimeline(data || [])
 }

 async function getNextPosts() {
 const now = new Date().toISOString()
 const { data, error } = await supabase.from('content_queue_main').select('*').eq('status', 'scheduled').gte('scheduled_at', now).order('scheduled_at', { ascending: true }).limit(5)
 if (error) { console.log(error); return }
 setNextPosts(data || [])
 }

 async function getDailyContentPlannerStats() {
 const today = new Date()
 const start = new Date(today); start.setHours(0, 0, 0, 0)
 const end = new Date(today); end.setHours(23, 59, 59, 999)
 const { data, error } = await supabase.from('content_queue_main').select('*').gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString())
 if (error) { console.log(error); return }
 const posts = data || []
 setTodayScheduledCount(posts.filter((p) => p.status === 'scheduled').length)
 setTodayPublishedCount(posts.filter((p) => p.status === 'published').length)
 setTodayDraftCount(posts.filter((p) => p.status === 'draft').length)
 setTodayPrayerCount(posts.filter((p) => (p.content_type || '').toLowerCase().includes('prayer') || (p.content_type || '').toLowerCase().includes('prophesy') || (p.ministry_name || '').toLowerCase().includes('daily prayer')).length)
 setTodaySermonCount(posts.filter((p) => (p.ministry_name || '').toLowerCase().includes('sermon intelligence') || (p.ministry_name || '').toLowerCase().includes('weekly sermon planner')).length)
 setTodayBirthdayCount(posts.filter((p) => (p.content_type || '').toLowerCase().includes('birthday')).length)
 }

 function updateWeeklySermon(index, field, value) {
 const updated = [...weeklySermons]
 updated[index][field] = value
 setWeeklySermons(updated)
 }

 async function weeklyPlanAlreadyExists() {
 const today = new Date()
 const nextMonday = new Date(today)
 const day = nextMonday.getDay()
 const daysUntilNextMonday = day === 0 ? 1 : 8 - day
 nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday)
 nextMonday.setHours(0, 0, 0, 0)
 const nextSunday = new Date(nextMonday)
 nextSunday.setDate(nextMonday.getDate() + 6)
 nextSunday.setHours(23, 59, 59, 999)
 const { data, error } = await supabase.from('content_queue_main').select('id').in('ministry_name', ['Weekly Sermon Planner v1', 'Weekly Sermon Planner v1.5', 'Weekly Sermon Planner v2']).gte('scheduled_at', nextMonday.toISOString()).lte('scheduled_at', nextSunday.toISOString()).limit(1)
 if (error) { console.log(error); return false }
 return (data || []).length > 0
 }

 async function generateWeeklySermonPlanner() {
 const validSermons = weeklySermons.filter((sermon) => sermon.title.trim() && sermon.minister.trim() && sermon.notes.trim())
 if (validSermons.length === 0) { alert('Please add at least one complete sermon'); return }
 const exists = await weeklyPlanAlreadyExists()
 if (exists) {
 const proceed = window.confirm('Weekly content already exists for this week.\n\nGenerate another weekly plan anyway?')
 if (!proceed) return
 }
 setBusy(true)
 try {
 const today = new Date()
 const monday = new Date(today)
 const day = monday.getDay()
 const diffToMonday = (day + 6) % 7
 monday.setDate(monday.getDate() - diffToMonday)
 monday.setHours(6, 0, 0, 0)
 let postNumber = 0
 for (const sermon of validSermons) {
 const contentPieces = buildWeeklyContentPieces(sermon)
 for (const piece of contentPieces) {
 const scheduledTime = new Date(monday)
 scheduledTime.setMinutes(monday.getMinutes() + postNumber * 25)
 const { error } = await supabase.from('content_queue_main').insert([{ minister_name: sermon.minister, ministry_name: 'Weekly Sermon Planner v2', content_type: piece.type, platform: piece.platform, content_text: piece.text, status: 'scheduled', scheduled_at: scheduledTime.toISOString() }])
 if (error) console.log(error)
 postNumber++
 }
 }
 alert(`${validSermons.length * 25} diversified weekly posts generated and scheduled`)
 await refreshAllQueueViews()
 setActiveTab('queue')
 } finally {
 setBusy(false)
 }
 }

 async function generateSundayWorkflowPlan() {
 const validSermons = weeklySermons.filter((sermon) => sermon.title.trim() && sermon.minister.trim() && sermon.notes.trim())
 if (validSermons.length === 0) { alert('Please add at least one complete sermon (title, minister, notes) before running the Sunday Workflow.'); return }
 const exists = await weeklyPlanAlreadyExists()
 if (exists) {
 const proceed = window.confirm('A Weekly Sermon Plan already exists for NEXT WEEK.\n\nRunning the Sunday Workflow will fill top-up to maximum daily capacity.\n\nDo you want to continue?')
 if (!proceed) return
 }
 setBusy(true)
 try {
 const today = new Date()
 const nextMonday = new Date(today)
 const day = nextMonday.getDay()
 const daysUntilNextMonday = day === 0 ? 1 : 8 - day
 nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday)
 nextMonday.setHours(6, 0, 0, 0)

 const allPosts = buildSmartWeeklySchedule(validSermons, nextMonday)

 let insertedCount = 0
 let skippedDays = 0
 let partialDaysFilled = 0

 for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
 const dayStart = new Date(nextMonday)
 dayStart.setDate(nextMonday.getDate() + dayIndex)
 dayStart.setHours(0, 0, 0, 0)
 const dayEnd = new Date(dayStart)
 dayEnd.setHours(23, 59, 59, 999)

 const { data: existingPosts, error: existingError } = await supabase
 .from('content_queue_main')
 .select('id, ministry_name')
 .in('status', ['scheduled', 'published'])
 .gte('scheduled_at', dayStart.toISOString())
 .lte('scheduled_at', dayEnd.toISOString())

 let existingCount = 0
 if (!existingError && existingPosts) {
 existingCount = existingPosts.filter((p) => (p.ministry_name || '').includes('Weekly Sermon Planner')).length
 }

 if (existingCount >= 25) {
 skippedDays++
 continue
 }

 if (existingCount > 0) {
 partialDaysFilled++
 }

 const allowedToGenerate = 25 - existingCount
 const dayPosts = allPosts.slice(dayIndex * 25, dayIndex * 25 + allowedToGenerate)

 for (const post of dayPosts) {
 const { error } = await supabase.from('content_queue_main').insert([post])
 if (error) { console.log(error) } else { insertedCount++ }
 }
 }

 const weekEnd = new Date(nextMonday)
 weekEnd.setDate(nextMonday.getDate() + 6)
 const summary = {
 sermonsCount: validSermons.length,
 totalPosts: insertedCount,
 skippedDays: skippedDays,
 partialDays: partialDaysFilled,
 coverageDays: 7 - skippedDays,
 from: new Date(nextMonday).toDateString(),
 to: weekEnd.toDateString()
 }
 setSundayWorkflowSummary(summary)

 alert(`Sunday Workflow complete.\n\nHard Daily Capacity Guard Result:\n- Posts inserted: ${insertedCount}\n- Full days skipped: ${skippedDays}\n- Partial days filled: ${partialDaysFilled}\n\nSmart Distributed across available slots.`)
 await refreshAllQueueViews()
 setActiveTab('publishing')
 } finally {
 setBusy(false)
 }
 }

 async function initializeData() {
 const loadedMinisters = await getMinisters()
 const loadedBirthdayEvents = await getBirthdayEvents()
 await getQueue()
 setBirthdayOpportunities(detectBirthdayOpportunities(loadedMinisters || [], loadedBirthdayEvents || []))
 }

 async function getMinisters() {
 const { data, error } = await supabase.from('minister_profiles_main').select('*').order('id', { ascending: true })
 if (error) { console.log(error); setLoading(false); return [] }
 const loadedMinisters = data || []
 setMinisters(loadedMinisters)
 setLoading(false)
 return loadedMinisters
 }

 async function getQueue() {
 const { data, error } = await supabase.from('content_queue_main').select('*').order('id', { ascending: false })
 if (error) { console.log(error); return [] }
 const loadedQueue = data || []
 setQueue(loadedQueue)
 return loadedQueue
 }

async function getBirthdayEvents() {
 const { data, error } = await supabase
 .from('minister_events_main')
 .select('*')
 .eq('event_type', 'Birthday')
 .not('event_date', 'is', null)
 .order('event_date', { ascending: true })
 if (error) { console.log(error); setBirthdayEvents([]); return [] }
 const loadedEvents = data || []
 setBirthdayEvents(loadedEvents)
 return loadedEvents
 }

 async function getMinisterTones() {
 const { data, error } = await supabase.from('minister_tones').select('*').eq('status', 'active').order('minister_name')
 if (!error) {
 setMinisterTones(data || [])
 if (data && data.length > 0) setSelectedTone(data[0].minister_name)
 }
 }

 async function checkTodayPrayerPack() {
 const today = new Date()
 const start = new Date(today); start.setHours(0, 0, 0, 0)
 const end = new Date(today); end.setHours(23, 59, 59, 999)
 const { data, error } = await supabase.from('content_queue_main').select('id').eq('content_type', "Let's Pray").gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString())
 if (!error && data && data.length > 0) { setTodayPrayerPackExists(true); return true }
 setTodayPrayerPackExists(false)
 return false
 }

 async function getDashboardAutomationStats() {
 const today = new Date()
 const start = new Date(today); start.setHours(0, 0, 0, 0)
 const end = new Date(today); end.setHours(23, 59, 59, 999)
 const { data: prayerPosts } = await supabase.from('content_queue_main').select('*').gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString()).in('content_type', ["Let's Pray", "Let's Prophesy", 'Prayer Caption', 'Prayer Voice-over Script', 'Prayer Image Prompt'])
 setTodayPrayerPostCount(prayerPosts ? prayerPosts.length : 0)
 const { data: nextPostsData } = await supabase.from('content_queue_main').select('*').eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(1)
 setNextScheduledPost(nextPostsData && nextPostsData.length > 0 ? nextPostsData[0] : null)
 }

 const filteredMinisters = ministers.filter((minister) =>
 (minister.name || minister.minister_name || '').toLowerCase().includes(search.toLowerCase())
 )

 function getMinisterName(minister) { return minister.name || minister.minister_name || 'Unnamed Minister' }
 function getMinisterMinistry(minister) { return minister.ministry || minister.ministry_name || 'No ministry added' }

 function getBirthday(minister) {
 if (minister.birthday) return minister.birthday
 if (minister.date_of_birth) return minister.date_of_birth
 if (minister.birthday_text) return minister.birthday_text
 const biography = minister.biography || minister.bio || ''
 const match = biography.match(/Birthday text:\s*([^;]+)/i)
 if (match && match[1]) return match[1].trim()
 return 'Birthday not added'
 }

 function getBirthdayColor(days) {
 if (days <= 3) return '#22c55e'
 if (days <= 7) return '#eab308'
 return '#3b82f6'
 }

 function parseBirthdayDate(raw) {
 if (!raw) return null
 const value = String(raw).trim()
 if (!value || value.toLowerCase() === 'birthday not added') return null

 const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
 if (isoMatch) {
 const month = Number(isoMatch[2])
 const day = Number(isoMatch[3])
 if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return { month, day }
 }

 const withYear = new Date(`${value} 2000`)
 if (!Number.isNaN(withYear.getTime())) {
 return { month: withYear.getMonth() + 1, day: withYear.getDate() }
 }

 const plain = new Date(value)
 if (!Number.isNaN(plain.getTime())) {
 return { month: plain.getMonth() + 1, day: plain.getDate() }
 }

 return null
 }

 function getNextAnnualBirthday(raw) {
 const parsed = parseBirthdayDate(raw)
 if (!parsed) return null

 const today = new Date()
 today.setHours(0, 0, 0, 0)

 let next = new Date(today.getFullYear(), parsed.month - 1, parsed.day)
 next.setHours(0, 0, 0, 0)

 if (next < today) {
 next = new Date(today.getFullYear() + 1, parsed.month - 1, parsed.day)
 next.setHours(0, 0, 0, 0)
 }

 const daysRemaining = Math.ceil((next - today) / (1000 * 60 * 60 * 24))
 return { nextBirthday: next, daysRemaining }
 }

 function detectBirthdayOpportunities(ministersList = [], birthdayEventsList = []) {
 const opportunitiesByName = new Map()

 const addOpportunity = (minister, rawDate, event = null) => {
 if (!minister || !rawDate) return
 const nextInfo = getNextAnnualBirthday(rawDate)
 if (!nextInfo) return
 if (nextInfo.daysRemaining < 0 || nextInfo.daysRemaining > 30) return

 const name = getMinisterName(minister)
 const current = opportunitiesByName.get(name)
 const candidate = {
 minister: {
 ...minister,
 birthday: rawDate,
 birthday_text: minister.birthday_text || event?.event_name || rawDate,
 },
 daysRemaining: nextInfo.daysRemaining,
 nextBirthday: nextInfo.nextBirthday.toISOString().slice(0, 10),
 birthdayEvent: event,
 }
 if (!current || candidate.daysRemaining < current.daysRemaining) {
 opportunitiesByName.set(name, candidate)
 }
 }

 const ministerByName = new Map()
 ministersList.forEach((minister) => {
 const name = getMinisterName(minister)
 ministerByName.set(name, minister)
 addOpportunity(minister, getBirthday(minister))
 })

 birthdayEventsList.forEach((event) => {
 const name = event.minister_name || ''
 if (!name) return
 const linkedMinister = ministerByName.get(name) || {
 minister_name: name,
 ministry_name: event.ministry_name || '',
 birthday: event.event_date,
 birthday_text: event.event_name || 'Birthday',
 status: event.verification_status || 'needs review',
 }
 addOpportunity(linkedMinister, event.event_date, event)
 })

 return Array.from(opportunitiesByName.values()).sort((a, b) => a.daysRemaining - b.daysRemaining)
 }

 function campaignAlreadyGenerated(minister, daysRemaining, queueList = queue) {
 const name = getMinisterName(minister)
 return queueList.some((item) => {
 const stage = String(item.campaign_stage || '')
 const type = String(item.content_type || '').toLowerCase()
 return item.minister_name === name && (stage.includes('Birthday Pack') || type.includes('birthday campaign'))
 })
 }

 async function generateAllUpcomingCampaigns() {
 if (birthdayOpportunities.length === 0) { alert('No birthday opportunities found'); return }
 setBusy(true)
 try {
 for (const item of birthdayOpportunities) {
 if (!campaignAlreadyGenerated(item.minister, item.daysRemaining)) {
 await generateBirthdayCampaign(item.minister, false)
 }
 }
 await refreshAllQueueViews()
 setBirthdayOpportunities(detectBirthdayOpportunities(ministers, birthdayEvents))
 alert('All upcoming birthday campaigns generated and scheduled')
 } finally {
 setBusy(false)
 }
 }

 function openMinisterProfile(minister) { setSelectedMinister(minister); setGeneratedPost(null); setActiveTab('profile') }

 function generateBirthdayPost(minister) {
 const name = getMinisterName(minister)
 const ministry = getMinisterMinistry(minister)
 const birthday = getBirthday(minister)
 setGeneratedPost({
 name, ministry, birthday,
 facebookPost: ` HAPPY BIRTHDAY ${name.toUpperCase()}!\n\nToday, we celebrate a servant of God whose life, ministry, and assignment have been a blessing to many across the nations.\n\n${name} of ${ministry}, we honour God's grace upon your life and celebrate your contribution to the Body of Christ.\n\nMay the Lord continue to strengthen you, preserve you, increase His grace upon your life, and cause your impact to speak across generations.\n\nHappy Birthday, God's servant.\n\nBirthday: ${birthday}\n\n#YearningForGod #ChristianLeaders #BirthdayHonour #KingdomVoices`,
 instagramCaption: ` Happy Birthday ${name}\n\nToday, we honour the grace of God upon your life and ministry.\n\nYour impact continues to bless lives, strengthen faith, and point many hearts back to God.\n\nMay this new season bring greater strength, fresh oil, divine preservation, and multiplied impact.\n\n${ministry}\n\n#YearningForGod #ChristianContent #ChristianLeaders #FaithPost #BirthdayPost`,
 youtubeCommunityPost: `Happy Birthday ${name} \nToday we celebrate a voice and vessel God has used to bless many lives.\n\nWe thank God for the impact of ${ministry} and pray for greater grace, strength, wisdom, and divine preservation in this new season.\n\nJoin us in celebrating God's servant today.`,
 imagePrompt: `Create a clean, premium Christian birthday celebration poster for ${name}. Use a royal deep navy and gold color theme, elegant lighting, soft glowing background, modern church media design, respectful and honouring tone. Include the text: "Happy Birthday ${name}". Add subtle Christian visual elements such as light rays, elegant gold accents, and a refined celebration atmosphere. Make it suitable for Instagram, Facebook, and YouTube Community posts.`,
 })
 setActiveTab('birthday-generator')
 }

 function getCampaignSchedule(birthdayText) {
 const currentYear = new Date().getFullYear()
 const birthdayDate = new Date(`${birthdayText} ${currentYear}`)
 if (isNaN(birthdayDate.getTime())) return { sevenDays: null, threeDays: null, oneDay: null, birthdayMorning: null, birthdayEvening: null }
 const makeDate = (daysBefore, hour) => { const date = new Date(birthdayDate); date.setDate(date.getDate() - daysBefore); date.setHours(hour, 0, 0, 0); return date.toISOString() }
 const makeSameDay = (hour) => { const date = new Date(birthdayDate); date.setHours(hour, 0, 0, 0); return date.toISOString() }
 return { sevenDays: makeDate(7, 8), threeDays: makeDate(3, 8), oneDay: makeDate(1, 8), birthdayMorning: makeSameDay(7), birthdayEvening: makeSameDay(18) }
 }

 async function generateBirthdayCampaign(minister, showAlert = true) {
 const name = getMinisterName(minister)
 const ministry = getMinisterMinistry(minister)
 const birthday = getBirthday(minister)
 const bio = minister.biography || minister.bio || minister.description || ''
 const nextInfo = getNextAnnualBirthday(birthday)

 if (!nextInfo) {
 alert('This minister does not have a usable birthday/date of birth yet.')
 return
 }

 const nextBirthday = nextInfo.nextBirthday
 const daysRemaining = nextInfo.daysRemaining
 const birthdayDateText = nextBirthday.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
 const birthdayMonthDay = nextBirthday.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
 const sourceNote = minister.source_note || minister.source_url || minister.official_website || 'Needs source review before public date-based posting.'

 const makeSchedule = (daysBefore, hour) => {
 const date = new Date(nextBirthday)
 date.setDate(date.getDate() - daysBefore)
 date.setHours(hour, 0, 0, 0)
 return date
 }

 const makeSameDay = (hour) => {
 const date = new Date(nextBirthday)
 date.setHours(hour, 0, 0, 0)
 return date
 }

 const now = new Date()
 const toIsoOrNull = (date) => date && date.getTime() >= now.getTime() ? date.toISOString() : null
 const statusFor = (date) => date && date.getTime() >= now.getTime() ? 'scheduled' : 'draft'

 const campaignId = `${name} Birthday ${nextBirthday.getFullYear()}`
 const shortBio = bio && bio.length > 40 ? bio : `${name} is connected with ${ministry}. Add a stronger verified biography before publishing this post.`

 const campaignPosts = [
 {
 platform: 'Facebook',
 content_type: 'Birthday Campaign - Countdown',
 stage: 'Birthday Pack - 7 Days Countdown',
 scheduled_at: makeSchedule(7, 8),
 text: `7 DAYS TO GO\n\nIn 7 days, we celebrate ${name}.\n\n${ministry}\n\nThis is a reminder to prepare the birthday graphics, caption, short video, and honour post early.\n\nBirthday: ${birthdayMonthDay}\n\nSource note: ${sourceNote}\n\n#YearningForGod #BirthdayCountdown #ChristianLeaders #KingdomVoices`,
 },
 {
 platform: 'Instagram',
 content_type: 'Birthday Campaign - Prayer Post',
 stage: 'Birthday Pack - Prayer Post',
 scheduled_at: makeSchedule(3, 8),
 text: `BIRTHDAY PRAYER FOR ${name.toUpperCase()}\n\nFather, we thank You for Your grace upon the life and ministry of ${name}.\n\nWe pray for fresh strength, deeper wisdom, divine preservation, renewed oil, and greater kingdom impact in this new season.\n\nMay ${ministry} continue to be a blessing to many lives.\n\nBirthday: ${birthdayMonthDay}\n\n#YearningForGod #ChristianPrayer #BirthdayPrayer #KingdomImpact`,
 },
 {
 platform: 'Facebook',
 content_type: 'Birthday Campaign - Biography Honour',
 stage: 'Birthday Pack - Biography Honour',
 scheduled_at: makeSchedule(1, 8),
 text: `TOMORROW WE HONOUR ${name.toUpperCase()}\n\n${shortBio}\n\nAs the birthday approaches, we thank God for the life, labour, sacrifice, teaching, service, and kingdom contribution of this vessel.\n\nBirthday: ${birthdayDateText}\n\nResearch reminder: confirm biography and dates before publishing.\n\n#YearningForGod #ChristianLeaders #KingdomLegacy #BirthdayHonour`,
 },
 {
 platform: 'Facebook',
 content_type: 'Birthday Campaign - Celebration Post',
 stage: 'Birthday Pack - Birthday Morning',
 scheduled_at: makeSameDay(7),
 text: `HAPPY BIRTHDAY ${name.toUpperCase()}\n\nToday, we celebrate a servant of God whose life, ministry, and assignment have been a blessing to many.\n\n${name} of ${ministry}, we honour the grace of God upon your life.\n\nMay the Lord strengthen you, preserve you, increase His wisdom upon you, and cause your impact to speak across generations.\n\nBirthday: ${birthdayDateText}\n\n#YearningForGod #HappyBirthday #ChristianLeaders #BirthdayPost`,
 },
 {
 platform: 'AI Poster',
 content_type: 'Birthday Campaign - Poster Prompt',
 stage: 'Birthday Pack - Poster Prompt',
 scheduled_at: makeSchedule(2, 10),
 text: `POSTER DESIGN PROMPT\n\nCreate a premium vertical Christian birthday celebration poster for ${name}.\n\nText on design: Happy Birthday ${name}\nSubtext: We honour God's grace upon your life\nMinistry reference: ${ministry}\n\nStyle: royal deep navy and gold, elegant soft light rays, clean church media design, respectful honour tone, premium typography, subtle celebration atmosphere, suitable for Instagram/Facebook/YouTube Community.\n\nAvoid: exaggerated celebrity style, fake awards, wrong ministry logo, unverified claims.`,
 },
 {
 platform: 'TikTok / YouTube Shorts',
 content_type: 'Birthday Campaign - Short Video Script',
 stage: 'Birthday Pack - Short Video Script',
 scheduled_at: makeSchedule(2, 12),
 text: `SHORT VIDEO SCRIPT FOR ${name.toUpperCase()}\n\nDuration: 30-45 seconds\nFormat: audio-first birthday honour short\n\nOpening hook:\nToday, we honour a life God has used to bless many.\n\nVoiceover:\nHappy birthday to ${name}. We thank God for the grace, wisdom, sacrifice, and kingdom impact upon your life. Through ${ministry}, many lives have been strengthened, encouraged, and pointed back to God.\n\nPrayer close:\nMay this new season bring fresh oil, divine preservation, greater wisdom, and multiplied impact.\n\nOn-screen text:\nHappy Birthday ${name}\nWe honour God's grace upon your life\n${birthdayMonthDay}\n\nProduction note: Use one respectful minister image/poster, soft motion, worship bed, and clean subtitles.`,
 },
 {
 platform: 'Manual Publishing Checklist',
 content_type: 'Birthday Campaign - Checklist',
 stage: 'Birthday Pack - Manual Checklist',
 scheduled_at: makeSchedule(2, 9),
 text: `MANUAL PUBLISHING CHECKLIST FOR ${name.toUpperCase()}\n\nCampaign: ${campaignId}\nBirthday: ${birthdayDateText}\nDays remaining: ${daysRemaining}\n\nBefore publishing:\n1. Confirm date of birth / birthday from reliable source.\n2. Confirm current ministry name and status.\n3. Prepare poster image.\n4. Prepare short video if needed.\n5. Review caption tone: honouring, biblical, respectful.\n6. Upload manually to Facebook, Instagram, TikTok, YouTube Shorts, and Threads.\n7. Mark the queue item as published after posting.\n\nSource note: ${sourceNote}`,
 },
 ]

 setBusy(true)
 try {
 const existing = queue.filter((item) => item.minister_name === name && String(item.campaign_stage || '').includes('Birthday Pack'))
 if (existing.length > 0 && showAlert) {
 const ok = confirm(`${existing.length} birthday campaign pack items already exist for ${name}. Generate again?`)
 if (!ok) return
 }

 const rows = campaignPosts.map((post) => ({
 minister_name: name,
 ministry_name: ministry,
 content_type: post.content_type,
 platform: post.platform,
 content_text: post.text,
 campaign_stage: post.stage,
 status: statusFor(post.scheduled_at),
 scheduled_at: toIsoOrNull(post.scheduled_at),
 approved_for_publishing: false,
 published_by: 'manual-review',
 }))

 const { error } = await supabase.from('content_queue_main').insert(rows)
 if (error) {
 alert(error.message)
 return
 }

 await refreshAllQueueViews()
 const refreshedEvents = await getBirthdayEvents()
 setBirthdayOpportunities(detectBirthdayOpportunities(ministers, refreshedEvents || birthdayEvents))
 if (showAlert) {
 alert(`Birthday campaign pack created for ${name}.\n\nCreated ${rows.length} queue items. Items with future dates were scheduled; missed countdown items were saved as drafts.`)
 setActiveTab('queue')
 }
 } finally {
 setBusy(false)
 }
 }



 async function updateManualPublishingStatus(id, action, payload = {}) {
 setBusy(true)
 try {
 const now = new Date().toISOString()
 const updates = { updated_at: now }

 if (action === 'uploaded' || action === 'published') {
 updates.status = 'published'
 updates.published_at = now
 updates.last_auto_published_at = now
 updates.published_by = 'manual-upload'
 if (payload.liveUrl) updates.external_post_url = payload.liveUrl
 if (payload.platform) updates.platform = payload.platform
 if (payload.note) updates.external_post_id = payload.note
 }

 if (action === 'ready') {
 updates.status = 'scheduled'
 if (payload.scheduledAt) updates.scheduled_at = new Date(payload.scheduledAt).toISOString()
 updates.published_by = 'manual-review'
 }

 if (action === 'rework') {
 updates.status = 'failed'
 updates.last_publish_error = payload.note || 'Needs rework after manual publishing review'
 updates.published_by = 'manual-review'
 }

 if (action === 'draft') {
 updates.status = 'draft'
 updates.published_by = 'manual-review'
 }

 if (action === 'needs-video') {
 updates.status = 'draft'
 updates.campaign_stage = 'Needs Video'
 updates.published_by = 'manual-review'
 updates.published_at = null
 updates.last_auto_published_at = null
 updates.external_post_url = null
 updates.last_publish_error = payload.note || 'Moved from published/missing URL cleanup to Needs Video.'
 }

 if (action === 'needs-design') {
 updates.status = 'draft'
 updates.campaign_stage = 'Needs Design'
 updates.published_by = 'manual-review'
 updates.published_at = null
 updates.last_auto_published_at = null
 updates.external_post_url = null
 updates.last_publish_error = payload.note || 'Moved from published/missing URL cleanup to Needs Design.'
 }

 if (action === 'internal') {
 updates.status = 'draft'
 updates.campaign_stage = 'Internal/Test - Ignored'
 updates.published_by = 'manual-review'
 updates.published_at = null
 updates.last_auto_published_at = null
 updates.external_post_url = null
 updates.last_publish_error = payload.note || 'Marked internal/test during live URL cleanup.'
 }

 const { error } = await supabase.from('content_queue_main').update(updates).eq('id', id)
 if (error) {
 alert(error.message)
 } else {
 await refreshAllQueueViews()
 await getPublishingStats()
 await getTodayTimeline()
 await getNextPosts()
 }
 } finally {
 setBusy(false)
 }
 }


 function generatePrayerPost() {
 setGeneratedPrayer({
 date: new Date().toLocaleDateString(),
 theme: prayerTheme,
 tone: selectedTone,
 prayerText: ` LET'S PRAY\n\nFather, in the name of Jesus, I thank You for today.\n\nLord, release divine help upon my life, my family, my work, my ministry, and everything You have committed into my hands.\n\nEvery closed door assigned to delay me, let it open by mercy.\n\nEvery burden that is too heavy for me, Father, carry it by Your power.\n\nThis week, let help arise for me from expected and unexpected places.\n\nIn Jesus' name, Amen.`,
 prophecyText: ` LET'S PROPHESY\n\nI declare that this week, help will locate me.\n\nDoors of favour are opening before me.\n\nEvery delay is broken.\n\nEvery confusion is cleared.\n\nThe Lord orders my steps, strengthens my hands, and gives me testimonies.\n\nI will not be stranded.\n\nI will not be ashamed.\n\nThis week, I walk in divine help, divine speed, and divine favour.\n\nIn Jesus' name, Amen.`,
 caption: `LET'S PRAY, LET'S PROPHESY\n\nTheme: ${prayerTheme}\nTone: ${selectedTone}\n\nDeclare this by faith today.\n\n#YearningForGod #LetsPray #LetsProphesy #PrayerPost #ChristianContent`,
 imagePrompt: `Create a clean Christian prayer graphic titled "Let's Pray, Let's Prophesy". Theme: ${prayerTheme}. Use a deep navy and gold design, soft glowing light rays, peaceful worship atmosphere, Bible and prayer visual elements, premium church media style, suitable for Facebook, Instagram, and YouTube Community posts.`,
 voiceoverScript: `Today, let's pray and prophesy.\n\nFather, in the name of Jesus, release divine help over my life this week.\n\nLet doors open. Let burdens be lifted. Let confusion clear. Let favour answer.\n\nI declare that I will not be stranded. I will not be ashamed. The Lord is helping me, guiding me, strengthening me, and giving me testimonies.\n\nIn Jesus' name, Amen.`,
 })
 }

 async function generateAndSchedulePrayerPack() {
 const alreadyExists = await checkTodayPrayerPack()
 if (alreadyExists) { alert("Today's Prayer Pack is already scheduled"); return }
 setBusy(true)
 try {
 const today = new Date()
 const makeTime = (hour) => { const date = new Date(today); date.setHours(hour, 0, 0, 0); return date.toISOString() }
 generatePrayerPost()
 const theme = prayerTheme
 const tone = selectedTone || 'Prophetic'
 const prayerPack = [
 { platform: 'Facebook', content_type: "Let's Pray", scheduled_at: makeTime(6), content_text: `LET'S PRAY\n\nTheme: ${theme}\nTone: ${tone}\n\nFather, in the name of Jesus, I thank You for today.\n\nLord, release divine help upon my life, my family, my work, my ministry, and everything You have committed into my hands.\n\nEvery closed door assigned to delay me, let it open by mercy.\n\nEvery burden that is too heavy for me, Father, carry it by Your power.\n\nThis week, let help arise for me from expected and unexpected places.\n\nIn Jesus' name, Amen.` },
 { platform: 'Facebook', content_type: "Let's Prophesy", scheduled_at: makeTime(12), content_text: `LET'S PROPHESY\n\nTheme: ${theme}\nTone: ${tone}\n\nI declare that this week, help will locate me.\n\nDoors of favour are opening before me.\n\nEvery delay is broken.\n\nEvery confusion is cleared.\n\nThe Lord orders my steps, strengthens my hands, and gives me testimonies.\n\nI will not be stranded.\n\nI will not be ashamed.\n\nThis week, I walk in divine help, divine speed, and divine favour.\n\nIn Jesus' name, Amen.` },
 { platform: 'Instagram', content_type: 'Prayer Caption', scheduled_at: makeTime(15), content_text: `LET'S PRAY, LET'S PROPHESY\n\nTheme: ${theme}\n\nToday, we declare divine help, open doors, favour, strength, and testimonies.\n\nType AMEN if this is your prayer.\n\n#YearningForGod #LetsPray #LetsProphesy #PrayerPost #ChristianContent` },
 { platform: 'Video', content_type: 'Prayer Voice-over Script', scheduled_at: makeTime(18), content_text: `Today, let's pray and prophesy.\n\nFather, in the name of Jesus, release divine help over my life this week.\n\nLet doors open. Let burdens be lifted. Let confusion clear. Let favour answer.\n\nI declare that I will not be stranded. I will not be ashamed.\n\nThe Lord is helping me, guiding me, strengthening me, and giving me testimonies.\n\nIn Jesus' name, Amen.` },
 { platform: 'AI Poster', content_type: 'Prayer Image Prompt', scheduled_at: makeTime(20), content_text: `Create a clean Christian prayer graphic titled "Let's Pray, Let's Prophesy". Theme: ${theme}. Use deep navy and gold colors, soft glowing light rays, peaceful worship atmosphere, Bible and prayer visual elements, premium church media style, suitable for Facebook, Instagram, and YouTube Community posts.` },
 ]
 for (const item of prayerPack) {
 const { error } = await supabase.from('content_queue_main').insert([{ minister_name: 'Yearning for God', ministry_name: 'Daily Prayer Engine', content_type: item.content_type, platform: item.platform, content_text: item.content_text, status: 'scheduled', scheduled_at: item.scheduled_at }])
 if (error) console.log(error)
 }
 alert("Today's Prayer Pack generated and scheduled")
 await refreshAllQueueViews()
 setTodayPrayerPackExists(true)
 setActiveTab('queue')
 } finally {
 setBusy(false)
 }
 }

 async function generateSermonDailyPosts() {
 if (!sermonTitle.trim() || !sermonMinister.trim() || !sermonNotes.trim()) { alert('Please add sermon title, minister name, and sermon notes'); return }
 setBusy(true)
 try {
 const pillars = ['Faith', 'Prayer', 'Prophecy', 'Mind Renewal', 'Holy Spirit', 'Healing', 'Deliverance', 'Wisdom', 'Marriage', 'Family', 'Youth', 'Finance', 'Obedience', 'Character', 'Purpose', 'Leadership', 'Evangelism', 'Worship', 'Hope', 'Scripture', 'Thanksgiving', 'Spiritual Growth', 'Encouragement', 'Discipline', 'Kingdom Service']
 const today = new Date(); today.setHours(6, 0, 0, 0)
 for (let i = 0; i < pillars.length; i++) {
 const scheduledTime = new Date(today); scheduledTime.setMinutes(today.getMinutes() + i * 25)
 const pillar = pillars[i]
 const contentText = `SERMON INTELLIGENCE POST\n\nPillar: ${pillar}\n\nSermon: ${sermonTitle}\nMinister: ${sermonMinister}\n\nKey Thought:\n${sermonNotes.slice(0, 350)}\n\nPost:\nToday, reflect on this area of Christian life: ${pillar}.\n\nGod's Word has power to shape our thinking, strengthen our faith, and align our lives with His purpose.\n\nPrayer:\nLord, help me apply Your truth in the area of ${pillar}. Let my life produce fruit that glorifies You.\n\n#YearningForGod #ChristianLife #${pillar.replaceAll(' ', '')}`
 const { error } = await supabase.from('content_queue_main').insert([{ minister_name: sermonMinister, ministry_name: 'Sermon Intelligence Engine', content_type: `Sermon Post - ${pillar}`, platform: 'Facebook', content_text: contentText, status: 'scheduled', scheduled_at: scheduledTime.toISOString() }])
 if (error) console.log(error)
 }
 alert('25 sermon-based posts generated and scheduled')
 await refreshAllQueueViews(); setActiveTab('queue')
 } finally { setBusy(false) }
 }

 async function sermonPackAlreadyExists() {
 const { data, error } = await supabase.from('content_queue_main').select('id').eq('minister_name', sermonMinister).eq('ministry_name', 'Sermon Intelligence Engine v1.5').limit(1)
 if (error) { console.log(error); return false }
 return data && data.length > 0
 }

 async function generateSermonIntelligenceV15() {
 if (!sermonTitle.trim() || !sermonMinister.trim() || !sermonNotes.trim()) { alert('Please add sermon title, minister name, and sermon notes'); return }
 const alreadyExists = await sermonPackAlreadyExists()
 if (alreadyExists) { alert('This sermon intelligence pack already exists in the Queue'); return }
 setBusy(true)
 try {
 const today = new Date(); today.setHours(6, 0, 0, 0)
 const contentPieces = []
 for (let i = 1; i <= 5; i++) {
 contentPieces.push({ type: 'Sermon Quote', platform: 'Facebook', text: `SERMON QUOTE ${i}\n\n"${sermonNotes.slice(0, 220)}..."\n\nFrom: ${sermonTitle}\nMinister: ${sermonMinister}\n\nReflection:\nLet this truth strengthen your faith and renew your mind today.\n\n#YearningForGod #SermonQuote #ChristianContent` })
 contentPieces.push({ type: 'Prayer Point', platform: 'Facebook', text: `PRAYER POINT ${i}\n\nFather, in the name of Jesus, let the truth from this message become a living reality in my life.\n\nSermon: ${sermonTitle}\nMinister: ${sermonMinister}\n\nLord, strengthen my faith, renew my mind, and help me walk in obedience to Your Word.\n\nIn Jesus' name, Amen.\n\n#YearningForGod #PrayerPoint #LetsPray` })
 contentPieces.push({ type: 'Prophetic Declaration', platform: 'Instagram', text: `PROPHETIC DECLARATION ${i}\n\nI declare that the Word of God is producing results in my life.\n\nEvery delay is broken.\nEvery confusion is cleared.\nEvery closed door opens by divine mercy.\nI walk in light, favour, wisdom, and spiritual strength.\n\nIn Jesus' name, Amen.\n\n#YearningForGod #PropheticDeclaration #Faith` })
 contentPieces.push({ type: 'Shorts Script', platform: 'Video', text: `SHORTS SCRIPT ${i}\n\nHOOK:\nWhat if one truth from God's Word could shift your entire week?\n\nBODY:\nIn the sermon "${sermonTitle}", ${sermonMinister} reminds us that God's Word is not just information; it is life, power, and direction.\n\nKEY LINE:\nDo not only hear the Word. Believe it, declare it, and live by it.\n\nCTA:\nType AMEN if you receive this today.\n\n#YearningForGod #ChristianShorts #FaithVideo` })
 contentPieces.push({ type: 'Image Prompt', platform: 'AI Poster', text: `Create a premium Christian social media graphic inspired by the sermon "${sermonTitle}" by ${sermonMinister}. Use deep navy and gold colors, glowing light rays, Bible-inspired atmosphere, elegant church media design, and a powerful faith-based message. Make it suitable for Instagram, Facebook, and YouTube Community posts.` })
 }
 for (let i = 0; i < contentPieces.length; i++) {
 const scheduledTime = new Date(today); scheduledTime.setMinutes(today.getMinutes() + i * 25)
 const piece = contentPieces[i]
 const { error } = await supabase.from('content_queue_main').insert([{ minister_name: sermonMinister, ministry_name: 'Sermon Intelligence Engine v1.5', content_type: piece.type, platform: piece.platform, content_text: piece.text, status: 'scheduled', scheduled_at: scheduledTime.toISOString() }])
 if (error) console.log(error)
 }
 alert('Sermon Intelligence v1.5 generated 25 diverse posts')
 await refreshAllQueueViews(); setActiveTab('queue')
 } finally { setBusy(false) }
 }

 async function saveToQueue(platform, contentType, contentText, campaignStage = null, scheduledAt = null) {
 setBusy(true)
 try {
 const { error } = await supabase.from('content_queue_main').insert([{ minister_name: generatedPost.name, ministry_name: generatedPost.ministry, content_type: contentType, platform, content_text: contentText, campaign_stage: campaignStage, status: 'draft', scheduled_at: scheduledAt }])
 if (error) { alert(error.message) } else { alert('Saved to Content Queue'); await refreshAllQueueViews() }
 } finally { setBusy(false) }
 }

 async function savePrayerToQueue(platform, contentType, contentText) {
 setBusy(true)
 try {
 const { error } = await supabase.from('content_queue_main').insert([{ minister_name: 'Yearning for God', ministry_name: 'Daily Prayer Engine', content_type: contentType, platform, content_text: contentText, status: 'draft', scheduled_at: null }])
 if (error) { alert(error.message) } else { alert('Prayer content saved to Queue'); await refreshAllQueueViews() }
 } finally { setBusy(false) }
 }

 async function updateStatus(id, status) {
 setBusy(true)
 try {
 const updates = { status }
 if (status === 'published') {
 const now = new Date().toISOString()
 updates.updated_at = now
 updates.published_at = now
 updates.last_auto_published_at = now
 }
 const { error } = await supabase.from('content_queue_main').update(updates).eq('id', id)
 if (error) { alert(error.message) } else { await refreshAllQueueViews() }
 } finally { setBusy(false) }
 }

 async function updateScheduleDate(id, scheduledAt) {
 setBusy(true)
 try {
 if (!scheduledAt) { alert('Please select date and time'); return }
 const dt = new Date(scheduledAt)
 if (isNaN(dt.getTime())) { alert('Invalid date/time'); return }
 const normalizedDate = dt.toISOString()
 const { error } = await supabase.from('content_queue_main').update({ status: 'scheduled', scheduled_at: normalizedDate, updated_at: new Date().toISOString() }).eq('id', id)
 if (error) { alert(error.message) } else { alert('Schedule saved and post set to scheduled'); await refreshAllQueueViews() }
 } finally { setBusy(false) }
 }

 async function deleteQueueItem(id) {
 const confirmDelete = window.confirm('Delete this post from the queue?')
 if (!confirmDelete) return
 setBusy(true)
 try {
 const { error } = await supabase.from('content_queue_main').delete().eq('id', id)
 if (error) { alert(error.message) } else { alert('Deleted from Content Queue'); await refreshAllQueueViews(); setBirthdayOpportunities(detectBirthdayOpportunities(ministers, birthdayEvents)) }
 } finally { setBusy(false) }
 }

 async function saveEditedPost(id) {
 setBusy(true)
 try {
 const { error } = await supabase.from('content_queue_main').update({ content_text: editedContent }).eq('id', id)
 if (error) { alert(error.message) } else {
 alert('Post updated')
 setQueue((prev) => prev.map((item) => item.id === id ? { ...item, content_text: editedContent } : item))
 await getDailyContentPlannerStats(); await getPublishingStats(); await getTodayTimeline(); await getNextPosts()
 setEditingPostId(null); setEditedContent('')
 }
 } finally { setBusy(false) }
 }

 async function updateQueueItemContent(id, updates = {}) {
 setBusy(true)
 try {
 const safeUpdates = {
 ...(updates.content_type !== undefined ? { content_type: updates.content_type } : {}),
 ...(updates.campaign_stage !== undefined ? { campaign_stage: updates.campaign_stage } : {}),
 ...(updates.content_text !== undefined ? { content_text: updates.content_text } : {}),
 ...(updates.status !== undefined ? { status: updates.status } : {}),
 updated_at: new Date().toISOString(),
 }
 const { error } = await supabase.from('content_queue_main').update(safeUpdates).eq('id', id)
 if (error) {
 alert(error.message)
 } else {
 alert('Queue item updated')
 setQueue((prev) => prev.map((item) => item.id === id ? { ...item, ...safeUpdates } : item))
 await refreshAllQueueViews()
 }
 } finally {
 setBusy(false)
 }
 }

 async function duplicateQueueItem(item) {
 setBusy(true)
 try {
 const { error } = await supabase.from('content_queue_main').insert([{ minister_name: item.minister_name, ministry_name: item.ministry_name, content_type: item.content_type, platform: item.platform, content_text: item.content_text, campaign_stage: item.campaign_stage, status: 'draft', scheduled_at: null }])
 if (error) { alert(error.message) } else { alert('Post duplicated'); await refreshAllQueueViews() }
 } finally { setBusy(false) }
 }

 async function copyText(text) {
 try { await navigator.clipboard.writeText(text); alert('Copied successfully') }
 catch { alert('Copy failed. Long-press the text and copy manually.') }
 }

 async function publishNextPostNow() {
 if (publishingPaused) { alert('Publishing is paused'); return }
 setBusy(true)
 try {
 const nowIso = new Date().toISOString()
 const { data, error } = await supabase.from('content_queue_main').select('*').eq('status', 'scheduled').lte('scheduled_at', nowIso).order('scheduled_at', { ascending: true }).limit(1)
 if (error) { alert('Fetch error: ' + error.message); return }
 if (!data || data.length === 0) { alert('No due scheduled post found'); return }
 const nextPost = data[0]
 const { data: updatedRows, error: updateError } = await supabase.from('content_queue_main').update({ status: 'published', updated_at: nowIso, published_at: nowIso, last_auto_published_at: nowIso }).eq('id', nextPost.id).select()
 if (updateError) { alert('Update error: ' + updateError.message); return }
 if (!updatedRows || updatedRows.length === 0) { alert('Update ran but no row was changed. Check RLS or table permissions.'); return }
 sessionPublishedRef.current += 1
 setSessionPublishedCount(sessionPublishedRef.current)
 addLog(`Manual publish: ID ${nextPost.id} - ${nextPost.platform} / ${nextPost.content_type}`)
 alert('Post published successfully: ID ' + nextPost.id)
 await refreshAllQueueViews()
 } finally { setBusy(false) }
 }

 async function publishAllDuePostsNow() {
 if (publishingPaused) { alert('Publishing is paused'); return }
 setBusy(true)
 try {
 const nowIso = new Date().toISOString()
 const { data, error } = await supabase.from('content_queue_main').select('id').eq('status', 'scheduled').lte('scheduled_at', nowIso)
 if (error) { alert(error.message); return }
 if (!data || data.length === 0) { alert('No due posts found'); return }
 const ids = data.map((post) => post.id)
 const { data: updatedRows, error: updateError } = await supabase.from('content_queue_main').update({ status: 'published', updated_at: nowIso, published_at: nowIso, last_auto_published_at: nowIso }).in('id', ids).select()
 if (updateError) { alert(updateError.message); return }
 sessionPublishedRef.current += updatedRows.length
 setSessionPublishedCount(sessionPublishedRef.current)
 addLog(`Bulk publish: ${updatedRows.length} due post(s) published`)
 alert(`Published ${updatedRows.length} due post(s)`)
 await refreshAllQueueViews()
 } finally { setBusy(false) }
 }

 async function markNextPostFailed() {
 setBusy(true)
 try {
 const now = new Date().toISOString()
 const { data, error } = await supabase.from('content_queue_main').select('*').eq('status', 'scheduled').lte('scheduled_at', now).order('scheduled_at', { ascending: true }).limit(1)
 if (error) { alert(error.message); return }
 if (!data || data.length === 0) { alert('No due scheduled post found'); return }
 const nextPost = data[0]
 const { error: updateError } = await supabase.from('content_queue_main').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', nextPost.id)
 if (updateError) { alert(updateError.message) } else {
 addLog(`Marked failed: ID ${nextPost.id} - ${nextPost.platform} / ${nextPost.content_type}`)
 alert('Post marked as failed')
 await refreshAllQueueViews()
 }
 } finally { setBusy(false) }
 }

 async function retryFailedPosts() {
 setBusy(true)
 try {
 const { error } = await supabase.from('content_queue_main').update({ status: 'scheduled', updated_at: new Date().toISOString() }).eq('status', 'failed')
 if (error) { alert(error.message) } else {
 addLog('Retry: All failed posts moved back to scheduled')
 alert('Failed posts moved back to scheduled')
 await refreshAllQueueViews()
 }
 } finally { setBusy(false) }
 }

 async function checkDuePostsNow() {
 const nowIso = new Date().toISOString()
 const { data, error } = await supabase.from('content_queue_main').select('id, status, scheduled_at, platform, content_type').eq('status', 'scheduled').lte('scheduled_at', nowIso).order('scheduled_at', { ascending: true })
 if (error) { setPublisherDebug(error.message); return }
 setDuePostsCount(data.length)
 if (data.length === 0) { setPublisherDebug(`No due posts found. Current time: ${nowIso}`) }
 else { setPublisherDebug(`Due posts found: ${data.length}. First due post ID: ${data[0].id}`) }
 }

 function formatLocalDatetimeString(isoDateObj) {
 if (!isoDateObj) return ''
 const dt = new Date(isoDateObj)
 if (isNaN(dt.getTime())) return ''
 const offsetDt = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
 return offsetDt.toISOString().slice(0, 16)
 }

 const draftCount = queue.filter((item) => item.status === 'draft').length
 const scheduledCount = queue.filter((item) => item.status === 'scheduled').length
 const publishedCount = queue.filter((item) => item.status === 'published').length

 const filteredQueue = queue
 .filter((item) => (queueFilter === 'all' ? true : item.status === queueFilter))
 .filter((item) => `${item.minister_name || ''} ${item.platform || ''} ${item.content_type || ''} ${item.campaign_stage || ''}`.toLowerCase().includes(queueSearch.toLowerCase()))
 .sort((a, b) => {
 if (queueSort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
 if (queueSort === 'schedule') return new Date(a.scheduled_at || '9999-12-31').getTime() - new Date(b.scheduled_at || '9999-12-31').getTime()
 return new Date(b.created_at) - new Date(a.created_at)
 })

 const scheduledQueue = queue.filter((item) => item.scheduled_at).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
 const groupedCalendar = scheduledQueue.reduce((groups, item) => {
 const dateKey = new Date(item.scheduled_at).toLocaleDateString()
 if (!groups[dateKey]) groups[dateKey] = []
 groups[dateKey].push(item)
 return groups
 }, {})

 const weeklySermonsFilled = weeklySermons.filter((s) => s.title && s.minister && s.notes).length
 const weeklyPostCount = weeklySermonsFilled * 25
 const weeklyCoverageDays = Math.min(weeklySermonsFilled, 7)

 function getWeeklyPreview() {
 const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
 return days.map((day, i) => ({ day, posts: i < weeklySermonsFilled ? 25 : 0 }))
 }

 const readinessScore = Math.round((nextWeekCoverage / 7) * 100)

 function getReadinessColor(score) {
 if (score >= 100) return '#22c55e'
 if (score >= 57) return '#eab308'
 return '#ef4444'
 }

 function getReadinessLabel(score) {
 if (score >= 100) return ' Fully Ready'
 if (score >= 71) return ' Almost There'
 if (score >= 43) return ' Partially Ready'
 return ' Not Ready'
 }

 function getNextWeekDates() {
 const today = new Date()
 const nextMonday = new Date(today)
 const day = nextMonday.getDay()
 const daysUntilNextMonday = day === 0 ? 1 : 8 - day
 nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday)
 nextMonday.setHours(0, 0, 0, 0)
 const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
 return dayNames.map((name, i) => {
 const date = new Date(nextMonday)
 date.setDate(nextMonday.getDate() + i)
 return { name, dateLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), dayIndex: i }
 })
 }

 const monetizationChannels = [
 { icon: '', title: 'YouTube Growth', status: 'Planning', nextAction: 'Post Shorts consistently from Sermon Clips to grow subscriber base.', color: '#ef4444' },
 { icon: '', title: 'Facebook Monetization', status: 'Planning', nextAction: 'Reach 10,000 followers and meet in-stream ad eligibility requirements.', color: '#3b82f6' },
 { icon: '', title: 'Instagram Growth', status: 'Planning', nextAction: 'Post daily Reels and Quote Graphics to grow engaged audience.', color: '#a855f7' },
 { icon: '', title: 'TikTok Growth', status: 'Planning', nextAction: 'Repurpose Sermon Shorts and Prayer Videos to build TikTok following.', color: '#06b6d4' },
 { icon: '', title: 'Affiliate / Digital Products', status: 'Planning', nextAction: 'Create and promote a Christian devotional or prayer guide as a digital product.', color: '#f59e0b' },
 { icon: '', title: 'Donations / Support', status: 'Planning', nextAction: 'Set up a donations page and share the link with the community monthly.', color: '#22c55e' },
 ]

 return (
 <div style={styles.app}>
 <h1 style={styles.title}>Yearning for God</h1>
 <h2 style={styles.subtitle}>Christian Media Growth Dashboard</h2>

 <Navigation activeTab={activeTab} setActiveTab={setActiveTab} styles={styles} />


 <Suspense fallback={<div style={styles.card}>Loading tab...</div>}>



{activeTab === 'launch-week-starter' && (
  <LaunchWeekStarterPack
    queue={queue}
    refreshAllQueueViews={refreshAllQueueViews}
    setActiveTab={setActiveTab}
    styles={styles}
  />
)}

{activeTab === 'launch-readiness' && (
  <LaunchReadinessCenter
    queue={queue}
    performanceStats={performanceStats}
    autoPublishEnabled={autoPublishEnabled}
    publishingPaused={publishingPaused}
    setActiveTab={setActiveTab}
    styles={styles}
  />
)}

{activeTab === 'daily-command' && (
  <DailyCommandCenter
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    styles={styles}
  />
)}

 {activeTab === 'dashboard' && (
 <Dashboard
 loading={loading}
 ministers={ministers}
 queue={queue}
 todayPrayerPackExists={todayPrayerPackExists}
 todayPrayerPostCount={todayPrayerPostCount}
 nextScheduledPost={nextScheduledPost}
 birthdayOpportunities={birthdayOpportunities}
 busy={busy}
 setActiveTab={setActiveTab}
 generateAllUpcomingCampaigns={generateAllUpcomingCampaigns}
 generateBirthdayCampaign={generateBirthdayCampaign}
 getMinisterName={getMinisterName}
 getBirthdayColor={getBirthdayColor}
 campaignAlreadyGenerated={campaignAlreadyGenerated}
 performanceStats={performanceStats}
 styles={styles}
 />
)}
 

 {activeTab === 'planner' && (
 <DailyPlanner
 todayScheduledCount={todayScheduledCount}
 todayPublishedCount={todayPublishedCount}
 todayDraftCount={todayDraftCount}
 todayPrayerCount={todayPrayerCount}
 todaySermonCount={todaySermonCount}
 todayBirthdayCount={todayBirthdayCount}
 styles={styles}
 />
)}
 {activeTab === 'weekly' && (
 <WeeklyPlanner
 weeklySermons={weeklySermons}
 weeklySermonsFilled={weeklySermonsFilled}
 weeklyPostCount={weeklyPostCount}
 weeklyCoverageDays={weeklyCoverageDays}
 updateWeeklySermon={updateWeeklySermon}
 getWeeklyPreview={getWeeklyPreview}
 generateSundayWorkflowPlan={generateSundayWorkflowPlan}
 busy={busy}
 styles={styles}
 />
)}

{activeTab === 'sunday-workflow' && (
 <SundayWorkflow
 coverageRefreshing={coverageRefreshing}
 readinessScore={readinessScore}
 nextWeekCoverage={nextWeekCoverage}
 missingCoverageDays={missingCoverageDays}
 nextWeekDayCounts={nextWeekDayCounts}
 coverageLastUpdated={coverageLastUpdated}
 weeklyOverload={weeklyOverload}
 loadBalancing={loadBalancing}
 remainingDaysGenerating={remainingDaysGenerating}
 sundayWorkflowSummary={sundayWorkflowSummary}
 weeklySermonsFilled={weeklySermonsFilled}
 busy={busy}
 setActiveTab={setActiveTab}
 calculateNextWeekCoverage={calculateNextWeekCoverage}
 getReadinessColor={getReadinessColor}
 getReadinessLabel={getReadinessLabel}
 getNextWeekDates={getNextWeekDates}
 checkWeeklyOverload={checkWeeklyOverload}
 balanceWeeklyLoad={balanceWeeklyLoad}
 generateSundayWorkflowPlan={generateSundayWorkflowPlan}
 generateRemainingDaysOnly={generateRemainingDaysOnly}
 styles={styles}
 />
)}
 

 
{activeTab === 'ministers' && (
 <Ministers
 ministers={ministers}
 search={search}
 setSearch={setSearch}
 filteredMinisters={filteredMinisters}
 openMinisterProfile={openMinisterProfile}
 getMinisterName={getMinisterName}
 getMinisterMinistry={getMinisterMinistry}
 styles={styles}
 />
)}
 {activeTab === 'profile' && selectedMinister && (
 <Profile
 selectedMinister={selectedMinister}
 setActiveTab={setActiveTab}
 getMinisterName={getMinisterName}
 getMinisterMinistry={getMinisterMinistry}
 getBirthday={getBirthday}
 busy={busy}
 generateBirthdayPost={generateBirthdayPost}
 generateBirthdayCampaign={generateBirthdayCampaign}
 styles={styles}
 />
)}

 {activeTab === 'birthdays' && (
 <Birthdays
 birthdayOpportunities={birthdayOpportunities}
 campaignAlreadyGenerated={campaignAlreadyGenerated}
 busy={busy}
 generateAllUpcomingCampaigns={generateAllUpcomingCampaigns}
 getBirthdayColor={getBirthdayColor}
 getMinisterName={getMinisterName}
 getMinisterMinistry={getMinisterMinistry}
 generateBirthdayCampaign={generateBirthdayCampaign}
 styles={styles}
 />
)} 

{activeTab === 'prayer' && (
 <PrayerEngine
 todayPrayerPackExists={todayPrayerPackExists}
 prayerTheme={prayerTheme}
 setPrayerTheme={setPrayerTheme}
 selectedTone={selectedTone}
 setSelectedTone={setSelectedTone}
 ministerTones={ministerTones}
 busy={busy}
 generatePrayerPost={generatePrayerPost}
 generateAndSchedulePrayerPack={generateAndSchedulePrayerPack}
 generatedPrayer={generatedPrayer}
 copyText={copyText}
 savePrayerToQueue={savePrayerToQueue}
 styles={styles}
 />
)}

{activeTab === 'sermon' && (
 <SermonEngine
 sermonTitle={sermonTitle}
 setSermonTitle={setSermonTitle}
 sermonMinister={sermonMinister}
 setSermonMinister={setSermonMinister}
 sermonNotes={sermonNotes}
 setSermonNotes={setSermonNotes}
 busy={busy}
 generateSermonDailyPosts={generateSermonDailyPosts}
 generateSermonIntelligenceV15={generateSermonIntelligenceV15}
 styles={styles}
 />
)}

{activeTab === 'queue' && (
 <Queue
 queue={queue}
 queueView={queueView}
 setQueueView={setQueueView}
 queueFilter={queueFilter}
 setQueueFilter={setQueueFilter}
 draftCount={draftCount}
 scheduledCount={scheduledCount}
 publishedCount={publishedCount}
 queueSearch={queueSearch}
 setQueueSearch={setQueueSearch}
 queueSort={queueSort}
 setQueueSort={setQueueSort}
 filteredQueue={filteredQueue}
 groupedCalendar={groupedCalendar}
 editingPostId={editingPostId}
 setEditingPostId={setEditingPostId}
 editedContent={editedContent}
 setEditedContent={setEditedContent}
 busy={busy}
 formatLocalDatetimeString={formatLocalDatetimeString}
 updateScheduleDate={updateScheduleDate}
 saveEditedPost={saveEditedPost}
 duplicateQueueItem={duplicateQueueItem}
 updateStatus={updateStatus}
 deleteQueueItem={deleteQueueItem}
 updateQueueItemContent={updateQueueItemContent}
 setActiveTab={setActiveTab}
 styles={styles}
 />
)}

{activeTab === 'publishing' && (
 <Publishing
 queue={queue}
 setActiveTab={setActiveTab}
 updateManualPublishingStatus={updateManualPublishingStatus}
 nextPostCountdown={nextPostCountdown}
 nextPosts={nextPosts}
 lastPublishedPost={lastPublishedPost}
 sessionPublishedCount={sessionPublishedCount}
 duePostsCount={duePostsCount}
 publishingStats={publishingStats}
 autoPublishEnabled={autoPublishEnabled}
 setAutoPublishEnabled={setAutoPublishEnabled}
 publishingPaused={publishingPaused}
 setPublishingPaused={setPublishingPaused}
 publishingTimezone={publishingTimezone}
 publishingInterval={publishingInterval}
 setPublishingInterval={setPublishingInterval}
 publisherDebug={publisherDebug}
 publisherLog={publisherLog}
 setPublisherLog={setPublisherLog}
 todayTimeline={todayTimeline}
 busy={busy}
 savePublishingSettings={savePublishingSettings}
 checkDuePostsNow={checkDuePostsNow}
 refreshDuePostsCount={refreshDuePostsCount}
 publishNextPostNow={publishNextPostNow}
 publishAllDuePostsNow={publishAllDuePostsNow}
 clearOldDuePosts={clearOldDuePosts}
 markNextPostFailed={markNextPostFailed}
 retryFailedPosts={retryFailedPosts}
 styles={styles}
 />
)}

{activeTab === 'monetization' && (
 <Monetization monetizationChannels={monetizationChannels} styles={styles} />
)}

 {activeTab === 'analytics' && <Analytics analyticsStats={analyticsStats} styles={styles} />}



 {activeTab === 'growth-tracker' && (
 <GrowthTracker
 performanceForm={performanceForm}
 setPerformanceForm={setPerformanceForm}
 queue={queue}
 savePostPerformance={savePostPerformance}
 savingPerformance={savingPerformance}
 performanceStats={performanceStats}
 styles={styles}
 />
)}

 {activeTab === 'content-calendar' && (
 <ContentCalendar
 calendarStats={calendarStats}
 calendarViewMode={calendarViewMode}
 setCalendarViewMode={setCalendarViewMode}
 getContentCalendarStats={getContentCalendarStats}
 styles={styles}
 />
)} 

{activeTab === 'campaign-planner' && (
 <CampaignPlanner
 campaignPlannerStats={campaignPlannerStats}
 campaignForm={campaignForm}
 setCampaignForm={setCampaignForm}
 saveCampaignPlan={saveCampaignPlan}
 applyCampaignTemplate={applyCampaignTemplate}
 updateCampaignStatus={updateCampaignStatus}
 generateCampaignPosts={generateCampaignPosts}
 styles={styles}
 />
)}

 
{activeTab === 'minister-updates' && (
 <MinisterUpdates
 ministers={ministers}
 ministerUpdateStats={ministerUpdateStats}
 ministerUpdateSearch={ministerUpdateSearch}
 setMinisterUpdateSearch={setMinisterUpdateSearch}
 selectedUpdateMinister={selectedUpdateMinister}
 ministerUpdateForm={ministerUpdateForm}
 setMinisterUpdateForm={setMinisterUpdateForm}
 ministerEventForm={ministerEventForm}
 setMinisterEventForm={setMinisterEventForm}
 selectMinisterForUpdate={selectMinisterForUpdate}
 updateMinisterProfileInfo={updateMinisterProfileInfo}
 saveMinisterEvent={saveMinisterEvent}
 updateMinisterEventStatus={updateMinisterEventStatus}
 deleteMinisterEvent={deleteMinisterEvent}
 styles={styles}
 />
)}

{activeTab === 'youtube-sermons' && (
  <YouTubeSermons
  supabase={supabase}
  weeklySermons={weeklySermons}
  setWeeklySermons={setWeeklySermons}
  setActiveTab={setActiveTab}
  refreshAllQueueViews={refreshAllQueueViews}
  styles={styles}
/>
)}



{activeTab === 'media-library' && (
  <MediaLibrary
    queue={queue}
    ministers={ministers}
    styles={styles}
  />
)}





{activeTab === 'stats-follow-up' && (
  <StatsFollowUp
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    styles={styles}
  />
)}

{activeTab === 'production-sprint' && (
  <ProductionSprint
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    styles={styles}
  />
)}

{activeTab === 'posting-plan' && (
  <PostingPlan
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    styles={styles}
  />
)}




{activeTab === 'quotes-planner' && (
  <QuotesPlanner
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    refreshAllQueueViews={refreshAllQueueViews}
    styles={styles}
  />
)}

{activeTab === 'music-planner' && (
  <MusicPlanner
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    refreshAllQueueViews={refreshAllQueueViews}
    styles={styles}
  />
)}

{activeTab === 'weekly-theme' && (
  <WeeklyThemePlanner
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    refreshAllQueueViews={refreshAllQueueViews}
    styles={styles}
  />
)}

{activeTab === 'weekly-calendar' && (
  <WeeklyCalendar
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    refreshAllQueueViews={refreshAllQueueViews}
    styles={styles}
  />
)}


{activeTab === 'repurposing-engine' && (
  <RepurposingEngine
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    refreshAllQueueViews={refreshAllQueueViews}
    styles={styles}
  />
)}

{activeTab === 'platform-readiness' && (
  <PlatformReadiness
    queue={queue}
    performanceStats={performanceStats}
    setActiveTab={setActiveTab}
    styles={styles}
  />
)}

{activeTab === 'social-accounts' && (
  <SocialAccounts
    supabase={supabase}
    styles={styles}
  />
)}
 </Suspense>
 </div>
 )
}