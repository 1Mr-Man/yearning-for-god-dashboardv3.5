import React, { useEffect, useMemo, useState } from 'react'
import { supabase as defaultSupabase } from '../utils/supabase'
import defaultStyles from '../styles/styles'
import ResearchWorkspace from './ResearchWorkspace'
import ProductionWorkspace, { researchIsComplete } from './ProductionWorkspace'

const SEEDS = [
 {title:"The Thirst That Won't Go Away: Recovering Holy Longing in a Distracted Age",type:"YFG Signature + Evergreen + Bible Teaching",pillar:"Hunger & Pursuit of God",priority_score:96,suggested_title:"As the Deer Pants: What Your Spiritual Thirst Is Really Telling You"},
 {title:"How to Pray When God Feels Silent",type:"Prayer/Spiritual-Growth + Evergreen",pillar:"Relationship & Pursuit",priority_score:94,suggested_title:"How to Keep Praying When Heaven Feels Closed"},
 {title:"Why Does God Allow Suffering? (Honest Biblical Answer)",type:"Bible Teaching + Evergreen",pillar:"Knowledge of God",priority_score:93,suggested_title:"Why Does a Good God Allow So Much Pain?"},
 {title:"“Follow Your Heart” — Why That Advice Is Dangerous",type:"Evergreen + Bible Teaching / Misconception",pillar:"Knowledge & Love of God",priority_score:90,suggested_title:"Why “Follow Your Heart” Is One of the Most Dangerous Pieces of Advice"},
 {title:"Building a Daily Hunger for God’s Word",type:"Spiritual-Growth + Evergreen",pillar:"Knowledge & Hunger",priority_score:92,suggested_title:"How to Grow a Real Hunger for the Bible"},
 {title:"Is God Real? The Questions Gen Z Is Actually Asking",type:"Trending + Bible Teaching + Evergreen",pillar:"Knowledge & Relationship",priority_score:91,suggested_title:"The Questions Gen Z Is Asking About God (And Honest Answers)"},
 {title:"The Fruit of the Spirit Is Not a Personality Upgrade",type:"Bible Teaching + Evergreen",pillar:"Relationship & Growth",priority_score:88,suggested_title:"The Fruit of the Spirit Grows in the Soil of Dependence"},
 {title:"Learning to Lament: The Missing Practice in Modern Christianity",type:"Prayer/Spiritual-Growth + YFG Signature + Evergreen",pillar:"Pursuit & Relationship",priority_score:95,suggested_title:"How to Lament Like the Bible Actually Teaches"},
 {title:"What Happens After Death? Clear Biblical Teaching",type:"Bible Teaching + Evergreen",pillar:"Knowledge of God",priority_score:89,suggested_title:"What the Bible Actually Says Happens After You Die"},
 {title:"Slow Faithfulness in a Culture of Quick Wins",type:"Evergreen + YFG Signature",pillar:"Pursuit of God",priority_score:87,suggested_title:"Why God Often Works Slowly (And Why That’s Good News)"}
]

const SOURCE_NOTES = 'From the current YFG Content Research Engine output. Search/trend claims still require fresh verification.'

const fallbackStyles = {
 card:{background:'#0f172a',border:'1px solid #334155',borderRadius:14,padding:16,marginBottom:12},
 input:{width:'100%',padding:10,borderRadius:8,border:'1px solid #334155',background:'#111827',color:'#e5e7eb'},
 smallButton:{padding:'7px 10px',borderRadius:8,border:'1px solid #334155',background:'#111827',color:'#e5e7eb'},
 filterBox:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16},
 missionGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:16},
 missionCard:{background:'#1e293b',border:'1px solid #334155',borderRadius:12,padding:14,textAlign:'center'},
 missionLabel:{color:'#94a3b8',fontSize:12,textTransform:'uppercase'},
 missionValue:{fontSize:22,fontWeight:800}
}

const norm = v => String(v || '').trim().toLowerCase()
const fmtDate = v => { if (!v) return '—'; const d = new Date(v); return isNaN(d) ? '—' : d.toLocaleDateString() }

export default function ContentResearch({ ctx = {} }) {
  const supabase = ctx.supabase || defaultSupabase
  const styles = ctx.styles || defaultStyles || fallbackStyles
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [filter,setFilter]=useState('all')
  const [search,setSearch]=useState('')
  const [selected,setSelected]=useState(null)
  const [workspace,setWorkspace]=useState(null)
  const [production,setProduction]=useState(null)
  const [prodMap,setProdMap]=useState({})
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')

  async function loadProductions(){
    try{
      const {data,error}=await supabase.from('yfg_content_production').select('*')
      if(error) return
      const m={}; (data||[]).forEach(p=>{m[p.research_id]=p}); setProdMap(m)
    }catch{ /* production table optional until migration is applied */ }
  }

  async function load(){
    setLoading(true)
    try{
      const {data,error}=await supabase.from('yfg_content_research').select('*').order('priority_score',{ascending:false}).order('created_at',{ascending:false})
      if(error) setError('Could not load research library: '+error.message)
      else {setError('');setItems(data||[])}
    }catch(e){ setError('Could not load research library: '+(e?.message||String(e))) }
    await loadProductions()
    setLoading(false)
  }
  useEffect(()=>{load()},[])


  async function seed(){
    if(busy) return
    setBusy(true); setMessage(''); setError('')
    try{
      const {data:existing,error:readErr}=await supabase.from('yfg_content_research').select('title')
      if(readErr){ setError('Could not check existing ideas: '+readErr.message); setBusy(false); return }
      const have=new Set((existing||[]).map(r=>norm(r.title)))
      const missing=SEEDS.filter(s=>!have.has(norm(s.title)))
      if(missing.length===0){ setMessage('0 new ideas added. Existing ideas were skipped.'); setBusy(false); return }
      const payload=missing.map(s=>({...s,status:'idea',source_notes:SOURCE_NOTES}))
      const {data,error}=await supabase.from('yfg_content_research').insert(payload).select()
      if(error){ setError('Could not add ideas: '+error.message); setBusy(false); return }
      const added=data?.length||missing.length
      setMessage(added===SEEDS.length?'10 YFG research ideas added successfully.':`${added} new ideas added. Existing ideas were skipped.`)
      await load()
    }catch(e){ setError('Could not add ideas: '+(e?.message||String(e))) }
    setBusy(false)
  }

  async function changeStatus(id,status){
    setMessage(''); setError('')
    try{
      const {data,error}=await supabase.from('yfg_content_research').update({status,updated_at:new Date().toISOString()}).eq('id',id).select().single()
      if(error) setError('Could not update status: '+error.message)
      else {setItems(p=>p.map(x=>x.id===id?data:x)); if(selected?.id===id) setSelected(data)}
    }catch(e){ setError('Could not update status: '+(e?.message||String(e))) }
  }

  async function remove(id){
    if(!window.confirm('Delete this research idea?')) return
    setMessage(''); setError('')
    try{
      const {error}=await supabase.from('yfg_content_research').delete().eq('id',id)
      if(error) setError('Could not delete: '+error.message)
      else {setItems(p=>p.filter(x=>x.id!==id));setSelected(null)}
    }catch(e){ setError('Could not delete: '+(e?.message||String(e))) }
  }

  const list=useMemo(()=>{const q=search.toLowerCase().trim();return items.filter(x=>(filter==='all'||x.status===filter)&&(!q||[x.title,x.type,x.pillar,x.suggested_title].some(v=>String(v||'').toLowerCase().includes(q))))},[items,filter,search])
  const hasResearch = x => !!(x.research_notes || x.primary_scripture || x.suggested_hook || x.research_intent || (Array.isArray(x.content_angles) && x.content_angles.length))
  const fmtAngles = x => Array.isArray(x.content_angles) && x.content_angles.length
    ? x.content_angles.map((a,i)=>`  ${i+1}. ${a.title||'(untitled)'}\n     ${a.description||''}${a.why?`\n     Why it matters: ${a.why}`:''}${a.format?`\n     Format: ${a.format}`:''}`).join('\n')
    : ''
  const fmtSources = list => (list||[]).length
    ? list.map(s=>`  - ${s.source_name||'(untitled)'} [${s.source_type||'Other'}]${s.source_url?` ${s.source_url}`:''}${s.notes?` — ${s.notes}`:''}`).join('\n')
    : ''
  const brief=(x, srcs)=>`YFG CONTENT RESEARCH BRIEF

Title:
${x.title||''}

Content Pillar:
${x.pillar||''}

Content Type:
${x.type||''}

Priority:
${x.priority_score||0}/100

Target Audience:
${x.target_audience||''}

Viewer Problem:
${x.viewer_problem||''}

Viewer Question:
${x.viewer_question||''}

Suggested YouTube Title:
${x.suggested_title||''}

Search Intent:
${x.research_intent||''}

Main Search Query:
${x.main_search_query||''}

Related Queries:
${x.related_search_queries||''}

Frequently Asked Questions:
${x.faqs||''}

Content Gaps:
${x.content_gaps||''}

Biblical Foundation:
${x.primary_scripture||''}

Supporting Scriptures:
${x.supporting_scriptures||''}

Key Biblical Truth:
${x.key_biblical_truth||''}

Content Angles:
${fmtAngles(x)}

Suggested Hook:
${x.suggested_hook||''}

Main Promise:
${x.main_promise||''}

Key Teaching Points:
${x.key_teaching_points||''}

YFG Differentiation:
${x.yfg_differentiation||''}

Sources:
${fmtSources(srcs)}

Research Notes:
${x.research_notes||''}
`
  async function copyBrief(x){
    let srcs=[]
    try{ const {data}=await supabase.from('yfg_research_sources').select('*').eq('research_id',x.id); srcs=data||[] }catch{}
    await copy(brief(x,srcs))
  }
  const copy=async text=>{try{await navigator.clipboard.writeText(text);setMessage('Copied to clipboard.')}catch{setError('Copy failed.')}}
  const count=s=>items.filter(x=>x.status===s).length
  const prodCount=s=>Object.values(prodMap).filter(p=>p.status===s).length
  const badge=(text,color,bg,border)=><span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:999,background:bg,border:`1px solid ${border}`,color,fontSize:12,fontWeight:800,marginRight:6,marginBottom:8}}>{text}</span>
  function openProduction(x){
    const existing=prodMap[x.id]
    if(!existing&&!researchIsComplete(x)){
      setError('Research must be completed before production can begin. Open Research, fill the brief, then Mark Research Complete.')
      setMessage('')
      return
    }
    setError('')
    if(existing) setMessage('Production package already exists — opening it.')
    setProduction({idea:x,row:existing||null})
  }

  return <div>
    <h2 style={{marginTop:0}}>🔎 YFG Content Research Library</h2>
    <p style={{color:'#94a3b8',lineHeight:1.6}}>Strategic content opportunities for YFG. Independent from the 25-post/day system.</p>
    {error&&<div style={{...fallbackStyles.card,color:'#fecaca',border:'1px solid #7f1d1d'}}>{error}</div>}
    {message&&<div style={{...fallbackStyles.card,color:'#bbf7d0',border:'1px solid #14532d'}}>{message}</div>}
    <div style={styles.missionGrid||fallbackStyles.missionGrid}>
      {[['Total',items.length],['Ideas',count('idea')],['Researched',count('researched')],['Production',count('production')],['Published',count('published')]].map(([label,value])=><div key={label} style={styles.missionCard||fallbackStyles.missionCard}><div style={styles.missionLabel||fallbackStyles.missionLabel}>{label}</div><div style={styles.missionValue||fallbackStyles.missionValue}>{value}</div></div>)}
    </div>
    <div style={styles.missionGrid||fallbackStyles.missionGrid}>
      {[['Prod Drafts',prodCount('draft')],['Needs Review',prodCount('needs_review')],['Approved',prodCount('approved')],['Queued',prodCount('queued')]].map(([label,value])=><div key={label} style={styles.missionCard||fallbackStyles.missionCard}><div style={styles.missionLabel||fallbackStyles.missionLabel}>{label}</div><div style={styles.missionValue||fallbackStyles.missionValue}>{value}</div></div>)}
    </div>
    <div style={styles.filterBox||fallbackStyles.filterBox}>
      <button style={styles.smallButton||fallbackStyles.smallButton} onClick={load}>Refresh</button>
      <button style={styles.smallButton||fallbackStyles.smallButton} onClick={seed} disabled={busy}>{busy?'Adding...':'Add Current 10 Ideas'}</button>
      <select value={filter} onChange={e=>setFilter(e.target.value)} style={styles.input||fallbackStyles.input}><option value="all">All Statuses</option><option value="idea">Idea</option><option value="researched">Researched</option><option value="production">Production</option><option value="published">Published</option></select>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ideas..." style={{...(styles.input||fallbackStyles.input),minWidth:220}} />
    </div>
    {loading?<div style={styles.card||fallbackStyles.card}>Loading Research Library...</div>:list.length===0?<div style={styles.card||fallbackStyles.card}><h3>No research ideas yet</h3><p style={{color:'#94a3b8'}}>Tap “Add Current 10 Ideas” to load today's research.</p></div>:list.map(x=><div key={x.id} style={styles.card||fallbackStyles.card}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12}}><div><strong style={{fontSize:16}}>{x.title}</strong><div style={{color:'#94a3b8',fontSize:12,marginTop:4}}>{x.type} · {x.pillar}</div></div><div style={{textAlign:'right'}}><strong style={{fontSize:20}}>{x.priority_score}/100</strong><div style={{color:'#94a3b8',fontSize:11}}>{x.status}</div></div></div>
      {x.suggested_title&&<p style={{color:'#cbd5e1'}}><strong>Suggested title:</strong> {x.suggested_title}</p>}
      <div style={{color:'#64748b',fontSize:11,marginBottom:8}}>Added {fmtDate(x.created_at)}</div>
      <div>
        {hasResearch(x)&&badge('✓ Research available','#34d399','rgba(16,185,129,0.10)','rgba(16,185,129,0.3)')}
        {researchIsComplete(x)&&badge('✓ Research Complete','#34d399','rgba(16,185,129,0.10)','rgba(16,185,129,0.3)')}
        {prodMap[x.id]&&badge('✓ Production Ready','#93c5fd','rgba(59,130,246,0.10)','rgba(59,130,246,0.35)')}
        {prodMap[x.id]?.status==='approved'&&badge('✓ Production Approved','#D4AF37','rgba(212,175,55,0.10)','rgba(212,175,55,0.35)')}
        {prodMap[x.id]?.status==='queued'&&badge('✓ Queued','#fcd34d','rgba(245,158,11,0.10)','rgba(245,158,11,0.35)')}
      </div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}><button style={styles.smallButton||fallbackStyles.smallButton} onClick={()=>changeStatus(x.id,'researched')}>Research</button><button style={styles.smallButton||fallbackStyles.smallButton} onClick={()=>setWorkspace(x)}>Open Research</button><button style={styles.smallButton||fallbackStyles.smallButton} onClick={()=>copyBrief(x)}>Copy Research Brief</button><button style={styles.smallButton||fallbackStyles.smallButton} onClick={()=>openProduction(x)}>{prodMap[x.id]?'Open Production':'Move to Production'}</button><button style={styles.smallButton||fallbackStyles.smallButton} onClick={()=>changeStatus(x.id,'published')}>Mark Published</button><button style={styles.smallButton||fallbackStyles.smallButton} onClick={()=>remove(x.id)}>Delete</button></div>
    </div>)}
    {workspace&&<ResearchWorkspace idea={workspace} supabase={supabase} onClose={()=>setWorkspace(null)} onSaved={row=>{setItems(p=>p.map(i=>i.id===row.id?row:i));setWorkspace(row)}} />}
    {production&&<ProductionWorkspace
      idea={production.idea}
      production={production.row}
      supabase={supabase}
      onClose={()=>setProduction(null)}
      onSaved={row=>{
        setProdMap(p=>({...p,[row.research_id]:row}))
        setProduction(p=>p?{...p,row}:p)
        if(row.status==='queued'||row.status==='approved') changeStatus(row.research_id,'production')
      }}
    />}
  </div>

}
