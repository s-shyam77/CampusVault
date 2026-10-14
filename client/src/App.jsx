import { useEffect, useMemo, useState } from 'react';
import { BookOpen, LayoutDashboard, Search, Bookmark, MessageCircle, UploadCloud, LogOut, Menu, X, Sun, Moon, FileText, Download, ExternalLink, Plus, GraduationCap, Sparkles, Clock3, Users, ShieldCheck, ChevronRight, Send, Filter, LibraryBig, CheckCircle2, AlertCircle, LoaderCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const demoResources = [
 {id:'d1',title:'DSA: Arrays & Complexity',description:'Beginner-friendly notes on arrays, time complexity and common patterns.',subject:'Data Structures',category:'Notes',semester:'Semester 3',downloads:128,bookmarked:false,external_url:'https://www.geeksforgeeks.org/array-data-structure/',uploader:'CampusVault'},
 {id:'d2',title:'Object-Oriented Programming Revision',description:'Classes, objects, inheritance, polymorphism and encapsulation.',subject:'OOPS',category:'Revision',semester:'Semester 3',downloads:94,bookmarked:false,external_url:'https://docs.oracle.com/javase/tutorial/java/concepts/',uploader:'CampusVault'},
 {id:'d3',title:'Digital Electronics: Number Systems',description:'Binary, octal, decimal, hexadecimal and conversions.',subject:'Digital Electronics',category:'Notes',semester:'Semester 3',downloads:76,bookmarked:false,external_url:'https://www.geeksforgeeks.org/number-system-and-base-conversions/',uploader:'CampusVault'},
 {id:'d4',title:'Software Engineering: Waterfall Model',description:'A quick overview of phases, strengths and limitations.',subject:'Software Engineering',category:'Revision',semester:'Semester 3',downloads:68,bookmarked:false,external_url:'https://www.geeksforgeeks.org/software-engineering-waterfall-model/',uploader:'CampusVault'},
 {id:'d5',title:'Probability: Random Variables',description:'Introductory learning resource for random variables.',subject:'Advanced Mathematics',category:'Reference',semester:'Semester 3',downloads:51,bookmarked:false,external_url:'https://www.khanacademy.org/math/statistics-probability/random-variables-stats-library',uploader:'CampusVault'},
 {id:'d6',title:'MEFA: Micro & Macro Economics',description:'A concise introduction to microeconomics and macroeconomics.',subject:'MEFA',category:'Notes',semester:'Semester 3',downloads:42,bookmarked:false,external_url:'https://www.economicshelp.org/',uploader:'CampusVault'}
];
const initialQuestions = [
 {id:'q1',title:'What is the difference between a process and a thread?',body:'Can someone explain it with a simple real-life example for Operating Systems?',subject:'Computer Science',author:'Aarav',answer_count:3},
 {id:'q2',title:'How do I approach DSA problems when I get stuck?',body:'I understand the question but struggle to build the logic. What routine should I follow?',subject:'Data Structures',author:'Priya',answer_count:5},
 {id:'q3',title:'Any tips for preparing Digital Electronics before exams?',body:'Looking for a simple plan to revise number systems and logic gates.',subject:'Digital Electronics',author:'Rohan',answer_count:2}
];
const subjects=['All subjects','Data Structures','OOPS','Digital Electronics','Software Engineering','Advanced Mathematics','MEFA','Computer Science'];
const categories=['All types','Notes','Previous Year Paper','Revision','Reference','Assignment'];
function App(){
 const [token,setToken]=useState(localStorage.getItem('cv_token')||'');
 const [user,setUser]=useState(JSON.parse(localStorage.getItem('cv_user')||'null'));
 const [page,setPage]=useState('Overview');
 const [resources,setResources]=useState(demoResources);
 const [questions,setQuestions]=useState(initialQuestions);
 const [bookmarks,setBookmarks]=useState([]);
 const [query,setQuery]=useState('');
 const [subject,setSubject]=useState('All subjects');
 const [category,setCategory]=useState('All types');
 const [dark,setDark]=useState(true);
 const [sidebar,setSidebar]=useState(false);
 const [authMode,setAuthMode]=useState('login');
 const [authForm,setAuthForm]=useState({name:'',email:'',password:''});
 const [uploadForm,setUploadForm]=useState({title:'',description:'',subject:'Data Structures',category:'Notes',semester:'Semester 3',url:''});
 const [questionForm,setQuestionForm]=useState({title:'',body:'',subject:'Computer Science'});
 const [notice,setNotice]=useState(null);
 const [busy,setBusy]=useState(false);
 const [apiOnline,setApiOnline]=useState(false);
 const [answers,setAnswers]=useState({});
 const [answerInputs,setAnswerInputs]=useState({});
 const [showUpload,setShowUpload]=useState(false);
 const [showQuestion,setShowQuestion]=useState(false);
 const [file,setFile]=useState(null);
 const [mobileSearch,setMobileSearch]=useState(false);
 const [pageInfo,setPageInfo]=useState({resources:0,questions:0,bookmarks:0,myUploads:0});
 const [adminResources,setAdminResources]=useState([]);
 const [activeQuestion,setActiveQuestion]=useState(null);
 const [answerBusy,setAnswerBusy]=useState(false);

 const tell=(text,type='success')=>{setNotice({text,type});window.setTimeout(()=>setNotice(null),3500)};
 async function api(path,opts={}){
   const headers={...(opts.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{}) ,...(opts.headers||{})};
   const res=await fetch(`${API}${path}`,{...opts,headers});
   const data=await res.json().catch(()=>({}));
   if(!res.ok) throw new Error(data.error||`Request failed (${res.status})`);
   return data;
 }
 useEffect(()=>{fetch(`${API}/health`).then(r=>r.json()).then(()=>setApiOnline(true)).catch(()=>setApiOnline(false));},[]);
 useEffect(()=>{if(!token)return;refresh();},[token]);
 async function refresh(){
   try{
    const [r,q,b,d]=await Promise.all([api('/resources'),api('/questions'),api('/bookmarks'),api('/dashboard')]);
    setResources(r.resources);setQuestions(q.questions);setBookmarks(b.resources);setPageInfo(d.stats);
    if(user?.role==='admin'){const a=await api('/admin/resources');setAdminResources(a.resources);}
   }catch(e){if(e.message.includes('Session expired')||e.message.includes('sign in'))logout(false);}
 }
 function logout(show=true){setToken('');setUser(null);localStorage.removeItem('cv_token');localStorage.removeItem('cv_user');if(show)tell('You have been signed out.');}
 async function submitAuth(e){
  e.preventDefault();setBusy(true);
  try{
   const data=await api(`/auth/${authMode}`,{method:'POST',body:JSON.stringify(authForm)});
   setToken(data.token);setUser(data.user);localStorage.setItem('cv_token',data.token);localStorage.setItem('cv_user',JSON.stringify(data.user));tell(authMode==='login'?'Welcome back!':'Account created successfully.');setPage('Overview');
  }catch(e){tell(e.message,'error');}finally{setBusy(false);}
 }
 const visibleResources=useMemo(()=>resources.filter(r=>{
  const q=query.toLowerCase();
  return (!q||`${r.title} ${r.description} ${r.subject} ${r.category}`.toLowerCase().includes(q))&&(subject==='All subjects'||r.subject===subject)&&(category==='All types'||r.category===category);
 }),[resources,query,subject,category]);
 async function toggleBookmark(r){
  if(!token){tell('Sign in to save resources.','error');setPage('Account');return;}
  if(String(r.id).startsWith('d')){tell('Connect the backend to save demo resources.','error');return;}
  try{await api(`/resources/${r.id}/bookmark`,{method:'POST'});const b=await api('/bookmarks');setBookmarks(b.resources);await refresh();tell('Saved list updated.');}catch(e){tell(e.message,'error');}
 }
 async function submitResource(e){
  e.preventDefault();
  if(!token){tell('Sign in before submitting a resource.','error');setPage('Account');return;}
  setBusy(true);
  try{
   if(file){
    const fd=new FormData();Object.entries(uploadForm).forEach(([k,v])=>{if(k!=='url')fd.append(k,v)});fd.append('file',file);
    await api('/resources',{method:'POST',body:fd});
   }else{
    await api('/resources',{method:'POST',body:JSON.stringify({...uploadForm,external_url:uploadForm.url})});
   }
   setShowUpload(false);setFile(null);setUploadForm({title:'',description:'',subject:'Data Structures',category:'Notes',semester:'Semester 3',url:''});await refresh();tell('Resource submitted! New uploads are reviewed before publication.');
  }catch(e){tell(e.message,'error');}finally{setBusy(false);}
 }
 async function submitQuestion(e){
  e.preventDefault();if(!token){tell('Sign in to ask a question.','error');setPage('Account');return;}setBusy(true);
  try{await api('/questions',{method:'POST',body:JSON.stringify(questionForm)});setShowQuestion(false);setQuestionForm({title:'',body:'',subject:'Computer Science'});await refresh();tell('Question posted to the community.');}
  catch(e){tell(e.message,'error');}finally{setBusy(false);}
 }
 async function openAnswers(q){
  setActiveQuestion(q);setAnswers({});
  if(String(q.id).startsWith('q'))return;
  try{const data=await api(`/questions/${q.id}/answers`);setAnswers(prev=>({...prev,[q.id]:data.answers}));}catch(e){tell(e.message,'error');}
 }
 async function postAnswer(q){
  if(!token){tell('Sign in to answer.','error');setPage('Account');return;}
  const body=(answerInputs[q.id]||'').trim();if(!body)return;
  setAnswerBusy(true);try{await api(`/questions/${q.id}/answers`,{method:'POST',body:JSON.stringify({body})});setAnswerInputs(p=>({...p,[q.id]:''}));await openAnswers(q);await refresh();tell('Answer posted.');}catch(e){tell(e.message,'error');}finally{setAnswerBusy(false);}
 }
 async function moderate(id,approved){
  try{await api(`/admin/resources/${id}`,{method:'PATCH',body:JSON.stringify({approved})});await refresh();tell(approved?'Resource approved.':'Resource hidden.');}catch(e){tell(e.message,'error');}
 }
 const nav=[['Overview',LayoutDashboard],['Explore resources',BookOpen],['Saved resources',Bookmark],['Community Q&A',MessageCircle],['Upload resource',UploadCloud],...(user?.role==='admin'?[['Moderation',ShieldCheck]]:[])];
 const iconFor=(name)=>{const I=name;return <I size={18} strokeWidth={1.8}/>};
 const initials=(user?.name||'Student').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
 const statCards=[{label:'Resources available',value:token?(pageInfo.resources||resources.length):resources.length,icon:LibraryBig,delta:'Notes, papers & guides'},{label:'Community questions',value:token?(pageInfo.questions||questions.length):questions.length,icon:MessageCircle,delta:'Learn from your peers'},{label:'Your bookmarks',value:token?pageInfo.bookmarks:0,icon:Bookmark,delta:'Keep essentials close'},{label:'Your uploads',value:token?pageInfo.myUploads:0,icon:UploadCloud,delta:'Share knowledge'}];
 function resourceCard(r){
  const saved=bookmarks.some(b=>b.id===r.id)||r.bookmarked;
  return <article className="resource-card" key={r.id}>
   <div className="resource-top"><span className="file-icon"><FileText size={20}/></span><button className={`icon-btn save ${saved?'saved':''}`} onClick={()=>toggleBookmark(r)} title="Save resource"><Bookmark size={17} fill={saved?'currentColor':'none'}/></button></div>
   <div className="tag-row"><span className="tag">{r.category}</span><span className="tag muted">{r.semester||'All semesters'}</span></div>
   <h3>{r.title}</h3><p>{r.description||'Student-contributed academic resource.'}</p>
   <div className="resource-meta"><span><BookOpen size={14}/>{r.subject}</span><span><Download size={14}/>{r.downloads||0}</span></div>
   <div className="resource-foot"><span className="uploader"><span className="tiny-avatar">{(r.uploader||'C')[0]}</span>{r.uploader||'Community'}</span>
   <a className="download-btn" href={String(r.id).startsWith('d')?r.external_url:`${API}/resources/${r.id}/download`} target="_blank" rel="noreferrer" onClick={e=>{if(!String(r.id).startsWith('d')&&!token){e.preventDefault();tell('Sign in for downloads.','error');setPage('Account')}}}>Open <ExternalLink size={14}/></a></div>
  </article>
 }
 function Header(){return <header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setSidebar(!sidebar)}>{sidebar?<X/>:<Menu/>}</button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{page}</strong></div><div className="top-actions"><button className="icon-btn search-mobile" onClick={()=>setMobileSearch(!mobileSearch)}><Search size={18}/></button><span className={`api-status ${apiOnline?'online':'offline'}`}><span/>{apiOnline?'API connected':'Demo preview'}</span><button className="icon-btn" onClick={()=>setDark(!dark)} title="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>{user?<button className="profile-chip" onClick={()=>setPage('Account')}><span className="avatar">{initials}</span><span className="profile-name">{user.name.split(' ')[0]}</span></button>:<button className="btn btn-primary btn-small" onClick={()=>setPage('Account')}>Sign in</button>}</div></header>}
 return <div className={`app ${dark?'dark':'light'}`}>
  <aside className={`sidebar ${sidebar?'show':''}`}>
   <div className="brand"><div className="brand-mark"><GraduationCap size={24}/></div><div><strong>CampusVault</strong><small>LEARN. SHARE. GROW.</small></div><button className="icon-btn close-sidebar" onClick={()=>setSidebar(false)}><X size={18}/></button></div>
   <div className="workspace-label">WORKSPACE</div><nav>{nav.map(([label,I])=><button key={label} className={`nav-item ${page===label?'active':''}`} onClick={()=>{if(label==='Upload resource'){setShowUpload(true)}else setPage(label);setSidebar(false)}}>{iconFor(I)}<span>{label}</span>{label==='Community Q&A'&&<span className="nav-count">{questions.length}</span>}</button>)}</nav>
   <div className="sidebar-bottom"><div className="study-card"><div className="study-icon"><Sparkles size={17}/></div><strong>Small steps, big progress.</strong><p>One useful resource today can help your future self tomorrow.</p><button onClick={()=>setPage('Explore resources')}>Explore library <ChevronRight size={14}/></button></div><div className="sidebar-user">{user?<><span className="avatar">{initials}</span><div className="user-copy"><strong>{user.name}</strong><small>{user.role}</small></div><button className="icon-btn" onClick={()=>logout()}><LogOut size={17}/></button></>:<><span className="avatar"><Users size={16}/></span><div className="user-copy"><strong>Guest learner</strong><small>Preview mode</small></div><button className="icon-btn" onClick={()=>setPage('Account')}><ChevronRight size={17}/></button></>}</div></div>
  </aside>
  {sidebar&&<div className="scrim" onClick={()=>setSidebar(false)}/>}
  <main className="main"><Header/>
   {mobileSearch&&<div className="mobile-search"><Search size={17}/><input value={query} onChange={e=>{setQuery(e.target.value);setPage('Explore resources')}} placeholder="Search resources..."/></div>}
   <div className="content">
    {page==='Overview'&&<><section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR ACADEMIC SPACE</div><h1>{user?`Welcome back, ${user.name.split(' ')[0]}.`:'Your campus knowledge hub.'}</h1><p className="lead">Find the right notes, share what you know, and make learning a little easier — together.</p></div><button className="btn btn-primary" onClick={()=>setShowUpload(true)}><Plus size={17}/> Share a resource</button></section>
      <section className="hero"><div className="hero-content"><div className="hero-pill"><Sparkles size={14}/> BUILT FOR STUDENT SUCCESS</div><h2>Good notes. Better<br/><span>semesters.</span></h2><p>A calmer place for notes, revision guides and questions — made for students, by students.</p><div className="hero-actions"><button className="btn btn-light" onClick={()=>setPage('Explore resources')}>Explore library <ChevronRight size={16}/></button><button className="btn btn-ghost-light" onClick={()=>setPage('Community Q&A')}>Ask the community</button></div></div><div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="floating-card fc-one"><div className="mini-icon violet"><BookOpen size={17}/></div><div><strong>Study smarter</strong><small>Curated resources</small></div><CheckCircle2 className="mini-check" size={18}/></div><div className="floating-card fc-two"><div className="mini-icon green"><Bookmark size={17}/></div><div><strong>Save for later</strong><small>Your own library</small></div></div><div className="book-stack"><div className="book b1"/><div className="book b2"/><div className="book b3"/><div className="book-pages"/></div></div></section>
      <section className="stats-grid">{statCards.map((s,i)=><div className="stat-card" key={s.label}><div className={`stat-icon stat-${i}`}>{iconFor(s.icon)}</div><div className="stat-label">{s.label}</div><div className="stat-bottom"><strong>{s.value}</strong><span>{s.delta}</span></div></div>)}</section>
      <section className="section-block"><div className="section-heading"><div><div className="eyebrow">HANDPICKED FOR YOU</div><h2>Popular resources</h2><p>Start with a useful guide from the community.</p></div><button className="text-btn" onClick={()=>setPage('Explore resources')}>View all <ChevronRight size={16}/></button></div><div className="resource-grid">{resources.slice(0,3).map(resourceCard)}</div></section>
      <section className="bottom-cta"><div className="cta-symbol"><MessageCircle size={21}/></div><div><strong>Stuck on a topic?</strong><p>Ask your question and learn from students who have been there.</p></div><button className="btn btn-outline" onClick={()=>setPage('Community Q&A')}>Visit community <ChevronRight size={16}/></button></section>
    </>}
    {page==='Explore resources'&&<><div className="page-title-row"><div><div className="eyebrow">THE RESOURCE LIBRARY</div><h1>Explore resources</h1><p className="lead">Find notes, revision guides and helpful references.</p></div><button className="btn btn-primary" onClick={()=>setShowUpload(true)}><Plus size={17}/> Add resource</button></div><div className="filter-bar"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by title, topic or subject..."/>{query&&<button className="icon-btn" onClick={()=>setQuery('')}><X size={15}/></button>}</div><div className="filter-select"><Filter size={16}/><select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select></div><div className="filter-select"><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(s=><option key={s}>{s}</option>)}</select></div></div><div className="results-line"><span>{visibleResources.length} resources found</span><span>Curated for campus life</span></div>{visibleResources.length?<div className="resource-grid">{visibleResources.map(resourceCard)}</div>:<div className="empty-state"><BookOpen size={32}/><h3>No resources found</h3><p>Try another search or clear your filters.</p><button className="btn btn-outline" onClick={()=>{setQuery('');setSubject('All subjects');setCategory('All types')}}>Clear filters</button></div>}</>}
    {page==='Saved resources'&&<><div className="page-title-row"><div><div className="eyebrow">YOUR PERSONAL LIBRARY</div><h1>Saved resources</h1><p className="lead">Keep the most useful material close at hand.</p></div></div>{!token?<div className="empty-state"><Bookmark size={34}/><h3>Sign in to see your bookmarks</h3><p>Your saved notes and revision guides will appear here.</p><button className="btn btn-primary" onClick={()=>setPage('Account')}>Sign in</button></div>:bookmarks.length?<div className="resource-grid">{bookmarks.map(resourceCard)}</div>:<div className="empty-state"><Bookmark size={34}/><h3>Your library is waiting</h3><p>Bookmark any resource to find it here later.</p><button className="btn btn-outline" onClick={()=>setPage('Explore resources')}>Explore resources</button></div>}</>}
    {page==='Community Q&A'&&<><div className="page-title-row"><div><div className="eyebrow">LEARN TOGETHER</div><h1>Community Q&amp;A</h1><p className="lead">Ask clearly. Share what helped you. Everyone grows.</p></div><button className="btn btn-primary" onClick={()=>setShowQuestion(true)}><Plus size={17}/> Ask a question</button></div><div className="qa-layout"><div className="question-list">{questions.map(q=><article className="question-card" key={q.id}><div className="question-icon"><MessageCircle size={19}/></div><div className="question-content"><span className="tag">{q.subject}</span><button className="question-title" onClick={()=>openAnswers(q)}>{q.title}</button><p>{q.body}</p><div className="question-meta"><span>{q.author||'Student'} · {q.answer_count||0} answers</span><button className="text-btn" onClick={()=>openAnswers(q)}>View discussion <ChevronRight size={14}/></button></div></div></article>)}</div><aside className="qa-side"><div className="tip-card"><div className="mini-icon violet"><Sparkles size={18}/></div><h3>Ask a great question</h3><ul><li>Use a clear, specific title.</li><li>Share what you have tried.</li><li>Add the subject or topic.</li><li>Be kind and constructive.</li></ul></div><div className="community-card"><Users size={22}/><strong>Learning is better together.</strong><p>Every helpful answer makes campus a little more connected.</p></div></aside></div></>}
    {page==='Moderation'&&<><div className="page-title-row"><div><div className="eyebrow">KEEP IT TRUSTWORTHY</div><h1>Resource moderation</h1><p className="lead">Review student submissions before they appear in the public library.</p></div></div>{user?.role!=='admin'?<div className="empty-state"><ShieldCheck size={32}/><h3>Admin access required</h3><p>Configure ADMIN_EMAIL in the backend environment and sign in with that address.</p></div>:<div className="moderation-list">{adminResources.map(r=><article className="moderation-item" key={r.id}><FileText/><div><strong>{r.title}</strong><p>{r.subject} · submitted by {r.uploader||'Student'}</p><span className={`tag ${r.approved?'':'pending'}`}>{r.approved?'Approved':'Pending review'}</span></div><div className="moderation-actions">{!r.approved&&<button className="btn btn-primary btn-small" onClick={()=>moderate(r.id,true)}>Approve</button>}<button className="btn btn-outline btn-small" onClick={()=>moderate(r.id,false)}>Hide</button></div></article>)}</div>}</>}
    {page==='Upload resource'&&<><div className="page-title-row"><div><div className="eyebrow">SHARE YOUR KNOWLEDGE</div><h1>Upload resource</h1><p className="lead">Contribute a resource that could help another student.</p></div></div><div className="inline-form-card"><form onSubmit={submitResource} className="form-grid"><label>Resource title<input required value={uploadForm.title} onChange={e=>setUploadForm({...uploadForm,title:e.target.value})} placeholder="e.g. DSA Unit 1 concise notes"/></label><label>Subject<select value={uploadForm.subject} onChange={e=>setUploadForm({...uploadForm,subject:e.target.value})}>{subjects.slice(1).map(s=><option key={s}>{s}</option>)}</select></label><label>Resource type<select value={uploadForm.category} onChange={e=>setUploadForm({...uploadForm,category:e.target.value})}>{categories.slice(1).map(s=><option key={s}>{s}</option>)}</select></label><label>Semester<select value={uploadForm.semester} onChange={e=>setUploadForm({...uploadForm,semester:e.target.value})}>{['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6','Semester 7','Semester 8','Any'].map(s=><option key={s}>{s}</option>)}</select></label><label className="span-two">Description<textarea value={uploadForm.description} onChange={e=>setUploadForm({...uploadForm,description:e.target.value})} rows="3" placeholder="What will students learn from this?"/></label><label className="span-two">Attach file (PDF, DOC, DOCX, PPT, PPTX · max 10 MB)<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><label className="span-two">Or link to an external resource<input type="url" value={uploadForm.url} onChange={e=>setUploadForm({...uploadForm,url:e.target.value})} placeholder="https://..."/></label><div className="span-two form-note"><ShieldCheck size={17}/> Student submissions are reviewed before being published.</div><div className="span-two form-actions"><button className="btn btn-primary" disabled={busy}>{busy?<LoaderCircle className="spin" size={16}/>:<UploadCloud size={16}/>} Submit resource</button><button type="button" className="btn btn-outline" onClick={()=>setPage('Explore resources')}>Cancel</button></div></form></div></>}
    {page==='Account'&&<div className="account-layout"><div className="account-intro"><div className="brand-mark large"><GraduationCap size={30}/></div><div className="eyebrow">YOUR CAMPUS, CONNECTED</div><h1>{user?'Your account':'Make learning a shared journey.'}</h1><p className="lead">{user?'Manage your session and explore your learning space.':'Sign in to save resources, upload notes and take part in community discussions.'}</p><div className="account-benefit"><CheckCircle2/><span>Save your favourite study resources</span></div><div className="account-benefit"><CheckCircle2/><span>Share notes and useful references</span></div><div className="account-benefit"><CheckCircle2/><span>Ask questions and help your peers</span></div></div>{user?<div className="auth-card"><span className="avatar xl">{initials}</span><h2>{user.name}</h2><p>{user.email}</p><span className="tag">{user.role}</span><div className="account-details"><div><span>Resources saved</span><strong>{pageInfo.bookmarks}</strong></div><div><span>Resources uploaded</span><strong>{pageInfo.myUploads}</strong></div></div><button className="btn btn-outline full-width" onClick={()=>logout()}>Sign out <LogOut size={16}/></button></div>:<form className="auth-card" onSubmit={submitAuth}><div className="auth-tabs"><button type="button" className={authMode==='login'?'selected':''} onClick={()=>setAuthMode('login')}>Sign in</button><button type="button" className={authMode==='register'?'selected':''} onClick={()=>setAuthMode('register')}>Create account</button></div><h2>{authMode==='login'?'Welcome back':'Join CampusVault'}</h2><p>{authMode==='login'?'Continue your learning journey.':'Create a student account in a moment.'}</p>{authMode==='register'&&<label>Full name<input required value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Your name"/></label>}<label>Email address<input type="email" required value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@college.edu"/></label><label>Password<input type="password" minLength="8" required value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="At least 8 characters"/></label><button className="btn btn-primary full-width" disabled={busy}>{busy?<LoaderCircle className="spin" size={16}/>:null}{authMode==='login'?'Sign in':'Create account'} <ChevronRight size={16}/></button><small className="auth-legal">Your password is securely hashed before storage.</small></form>}</div>}
   </div>
   <footer className="footer"><span>© 2026 CampusVault</span><span>Made for students, by students <span className="footer-heart">♥</span></span><span className="footer-status"><span className={`status-dot ${apiOnline?'online':'offline'}`}/>{apiOnline?'Connected to API':'Showing demo resources'}</span></footer>
  </main>
  {showUpload&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowUpload(false)}}><div className="modal"><div className="modal-head"><div><div className="eyebrow">CONTRIBUTE</div><h2>Share a resource</h2></div><button className="icon-btn" onClick={()=>setShowUpload(false)}><X/></button></div><form onSubmit={submitResource} className="form-grid"><label>Title<input required value={uploadForm.title} onChange={e=>setUploadForm({...uploadForm,title:e.target.value})} placeholder="Resource title"/></label><label>Subject<select value={uploadForm.subject} onChange={e=>setUploadForm({...uploadForm,subject:e.target.value})}>{subjects.slice(1).map(s=><option key={s}>{s}</option>)}</select></label><label>Type<select value={uploadForm.category} onChange={e=>setUploadForm({...uploadForm,category:e.target.value})}>{categories.slice(1).map(s=><option key={s}>{s}</option>)}</select></label><label>Semester<select value={uploadForm.semester} onChange={e=>setUploadForm({...uploadForm,semester:e.target.value})}>{['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6','Semester 7','Semester 8','Any'].map(s=><option key={s}>{s}</option>)}</select></label><label className="span-two">Description<textarea rows="3" value={uploadForm.description} onChange={e=>setUploadForm({...uploadForm,description:e.target.value})} placeholder="Short description"/></label><label className="span-two">File<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><label className="span-two">External URL<input type="url" value={uploadForm.url} onChange={e=>setUploadForm({...uploadForm,url:e.target.value})} placeholder="https://..."/></label><div className="span-two form-actions"><button className="btn btn-primary" disabled={busy}><UploadCloud size={16}/> Submit resource</button><button type="button" className="btn btn-outline" onClick={()=>setShowUpload(false)}>Cancel</button></div></form></div></div>}
  {showQuestion&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowQuestion(false)}}><div className="modal"><div className="modal-head"><div><div className="eyebrow">COMMUNITY Q&amp;A</div><h2>Ask a question</h2></div><button className="icon-btn" onClick={()=>setShowQuestion(false)}><X/></button></div><form onSubmit={submitQuestion} className="form-grid"><label className="span-two">Question title<input required value={questionForm.title} onChange={e=>setQuestionForm({...questionForm,title:e.target.value})} placeholder="What do you need help with?"/></label><label>Subject<select value={questionForm.subject} onChange={e=>setQuestionForm({...questionForm,subject:e.target.value})}>{subjects.slice(1).map(s=><option key={s}>{s}</option>)}</select></label><label className="span-two">Details<textarea required rows="4" value={questionForm.body} onChange={e=>setQuestionForm({...questionForm,body:e.target.value})} placeholder="Explain the topic and what you have tried..."/></label><div className="span-two form-actions"><button className="btn btn-primary" disabled={busy}><Send size={16}/> Post question</button><button type="button" className="btn btn-outline" onClick={()=>setShowQuestion(false)}>Cancel</button></div></form></div></div>}
  {activeQuestion&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setActiveQuestion(null)}}><div className="modal discussion-modal"><div className="modal-head"><div><div className="eyebrow">{activeQuestion.subject}</div><h2>{activeQuestion.title}</h2></div><button className="icon-btn" onClick={()=>setActiveQuestion(null)}><X/></button></div><p className="discussion-body">{activeQuestion.body}</p><h3>Answers</h3><div className="answers-list">{(answers[activeQuestion.id]||[]).map(a=><div className="answer-item" key={a.id}><span className="tiny-avatar">{(a.author||'S')[0]}</span><div><strong>{a.author||'Student'}</strong><p>{a.body}</p></div></div>)}{String(activeQuestion.id).startsWith('q')&&<p className="muted-text">Connect the backend to load live answers.</p>}{!String(activeQuestion.id).startsWith('q')&&!(answers[activeQuestion.id]||[]).length&&<p className="muted-text">No answers yet. Be the first to help.</p>}</div><form className="answer-form" onSubmit={e=>{e.preventDefault();postAnswer(activeQuestion)}}><textarea rows="3" value={answerInputs[activeQuestion.id]||''} onChange={e=>setAnswerInputs(p=>({...p,[activeQuestion.id]:e.target.value}))} placeholder="Write a helpful answer..." required/><button className="btn btn-primary" disabled={answerBusy}><Send size={15}/> Post answer</button></form></div></div>}
  {notice&&<div className={`toast ${notice.type}`}><span className="toast-icon">{notice.type==='error'?<AlertCircle size={18}/>:<CheckCircle2 size={18}/>}</span>{notice.text}<button className="icon-btn" onClick={()=>setNotice(null)}><X size={15}/></button></div>}
 </div>
}
export default App;
