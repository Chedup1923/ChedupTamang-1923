/* === THREE.JS PARTICLES === */
(function(){
  const cvs=document.getElementById('bg-canvas');
  const rdr=new THREE.WebGLRenderer({canvas:cvs,alpha:true,antialias:false});
  rdr.setPixelRatio(Math.min(devicePixelRatio,1.5));
  const sc=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(60,1,.1,1000);
  cam.position.z=80;
  const N=350,geo=new THREE.BufferGeometry();
  const pos=new Float32Array(N*3),vel=new Float32Array(N*3);
  for(let i=0;i<N;i++){
    pos[i*3]=(Math.random()-.5)*160;pos[i*3+1]=(Math.random()-.5)*120;pos[i*3+2]=(Math.random()-.5)*80;
    vel[i*3]=(Math.random()-.5)*.012;vel[i*3+1]=Math.random()*.018+.005;vel[i*3+2]=(Math.random()-.5)*.008;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({color:0x7c8fff,size:.65,transparent:true,opacity:.72,sizeAttenuation:true});
  window._particleMat=mat;
  const pts=new THREE.Points(geo,mat);sc.add(pts);
  function resize(){const W=innerWidth,H=innerHeight;rdr.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();}
  resize();window.addEventListener('resize',resize);
  let t=0;
  (function loop(){requestAnimationFrame(loop);t+=.003;
    const a=geo.attributes.position.array;
    for(let i=0;i<N;i++){a[i*3+1]+=vel[i*3+1];a[i*3]+=vel[i*3]+Math.sin(t+i*.1)*.003;a[i*3+2]+=vel[i*3+2];if(a[i*3+1]>65)a[i*3+1]=-65;}
    geo.attributes.position.needsUpdate=true;pts.rotation.y+=.0006;rdr.render(sc,cam);
  })();
})();

/* === ADMIN PASSWORD === */
let ADMIN_PASSWORD=(()=>{try{return localStorage.getItem('_adminPw')||'pelsung2026';}catch(e){return 'pelsung2026';}})();

/* =====================================================================
   INDEXEDDB — unlimited file storage
   All base64 file data stored here. localStorage only holds tiny metadata.
   ===================================================================== */
const DB_NAME='PortfolioDB', DB_VER=1, DB_STORE='files';
let _db=null;

function openDB(){
  return new Promise((res,rej)=>{
    if(_db){res(_db);return;}
    const req=indexedDB.open(DB_NAME,DB_VER);
    req.onupgradeneeded=e=>{e.target.result.createObjectStore(DB_STORE);};
    req.onsuccess=e=>{_db=e.target.result;res(_db);};
    req.onerror=e=>rej(e);
  });
}
function dbSet(key,value){
  return openDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).put(value,key);
    tx.oncomplete=()=>res();tx.onerror=e=>rej(e);
  }));
}
function dbGet(key){
  return openDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(DB_STORE,'readonly');
    const req=tx.objectStore(DB_STORE).get(key);
    req.onsuccess=()=>res(req.result||null);req.onerror=e=>rej(e);
  }));
}
function dbDel(key){
  if(!key)return Promise.resolve();
  return openDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).delete(key);
    tx.oncomplete=()=>res();tx.onerror=e=>rej(e);
  }));
}
function uid(){return '_f'+Date.now()+'_'+Math.random().toString(36).slice(2,7);}

/* =====================================================================
   METADATA PERSISTENCE (localStorage — text + filenames only)
   ===================================================================== */
const META_KEY='_portfolioMeta';
const TEXT_KEY='_textFields';

function buildMeta(){
  return {
    avatarKey:S.avatarKey||null,
    cvFile:{name:S.cvFile.name,key:S.cvFile.key||null},
    resFile:{name:S.resFile.name,key:S.resFile.key||null},
    certs:S.certs.map(c=>({name:c.name,key:c.key||null})),
    exps:S.exps.map(e=>({name:e.name,key:e.key||null})),
    eduCerts:S.eduCerts.map(c=>({name:c.name,key:c.key||null})),
    projects:S.projects.map(p=>({
      tag:p.tag,title:p.title,desc:p.desc,
      docs:{
        spec:{name:p.docs.spec.name,key:p.docs.spec.key||null},
        prototype:{name:p.docs.prototype.name,key:p.docs.prototype.key||null},
        report:{name:p.docs.report.name,key:p.docs.report.key||null},
      },
      customDocs:(p.customDocs||[]).map(d=>({label:d.label,name:d.name,key:d.key||null}))
    })),
    education:S.education,
    skills:S.skills,
    langs:S.langs,
  };
}

function saveMeta(){
  try{localStorage.setItem(META_KEY,JSON.stringify(buildMeta()));}catch(e){console.warn('Meta save failed',e);}
}
function saveTextFields(){
  const data={};
  ['sb-name','sb-role','p-name','p-tag','f-name','f-cid','f-dob','f-phone','f-email','f-nat','f-addr1','f-addr2','f-about','s-exp','s-proj','s-cert','c-email','c-wa','c-fb','c-li'].forEach(id=>{
    const el=document.getElementById(id);if(el)data[id]=el.textContent;
  });
  try{localStorage.setItem(TEXT_KEY,JSON.stringify(data));}catch(e){}
}
function loadTextFields(){
  try{
    const raw=localStorage.getItem(TEXT_KEY);if(!raw)return;
    const data=JSON.parse(raw);
    Object.entries(data).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=val;});
    const syncLink=(valId,linkId,fn)=>{const el=document.getElementById(valId);if(el){const lnk=document.getElementById(linkId);if(lnk)lnk.href=fn(el.textContent.trim());}};
    syncLink('c-email','c-email-link',v=>'mailto:'+v);
    syncLink('c-wa','c-wa-link',v=>'https://wa.me/'+v.replace(/[^0-9]/g,''));
    syncLink('c-fb','c-fb-link',v=>v.startsWith('http')?v:'https://'+v);
    syncLink('c-li','c-li-link',v=>v.startsWith('http')?v:'https://'+v);
  }catch(e){}
}

let _saveTimer=null;
function scheduleSave(){
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(()=>{saveMeta();saveTextFields();},800);
}

function applyCVBox(boxId,lblId,fnId,dlId,file){
  if(!file||!file.b64)return;
  document.getElementById(boxId)?.classList.add('has-file');
  const lbl=document.getElementById(lblId);if(lbl)lbl.textContent='';
  const fn=document.getElementById(fnId);if(fn){fn.textContent=file.name;fn.style.display='block';}
  const dl=document.getElementById(dlId);if(dl){dl.setAttribute('href',file.b64);dl.setAttribute('download',file.name);dl.style.display='inline-block';}
}

async function loadAllData(){
  try{
    const raw=localStorage.getItem(META_KEY);if(!raw)return;
    const m=JSON.parse(raw);
    if(Array.isArray(m.education)&&m.education.length) S.education=m.education;
    if(Array.isArray(m.skills)&&m.skills.length)       S.skills=m.skills;
    if(Array.isArray(m.langs)&&m.langs.length)         S.langs=m.langs;

    if(Array.isArray(m.projects)&&m.projects.length){
      S.projects=m.projects.map(p=>({
        tag:p.tag,title:p.title,desc:p.desc,
        docs:{
          spec:{name:p.docs.spec.name,key:p.docs.spec.key,b64:null},
          prototype:{name:p.docs.prototype.name,key:p.docs.prototype.key,b64:null},
          report:{name:p.docs.report.name,key:p.docs.report.key,b64:null},
        },
        customDocs:(p.customDocs||[]).map(d=>({label:d.label,name:d.name,key:d.key,b64:null}))
      }));
    }

    if(m.avatarKey){
      S.avatarKey=m.avatarKey;
      const b64=await dbGet(m.avatarKey);
      if(b64){S.avatarB64=b64;document.getElementById('main-av').src=b64;document.getElementById('sb-av').src=b64;}
    }
    if(m.cvFile&&m.cvFile.key){
      const b64=await dbGet(m.cvFile.key);
      if(b64){S.cvFile={name:m.cvFile.name,key:m.cvFile.key,b64};applyCVBox('cv-box','cv-lbl','cv-fname','cv-dl',S.cvFile);}
    }
    if(m.resFile&&m.resFile.key){
      const b64=await dbGet(m.resFile.key);
      if(b64){S.resFile={name:m.resFile.name,key:m.resFile.key,b64};applyCVBox('res-box','res-lbl','res-fname','res-dl',S.resFile);}
    }

    if(Array.isArray(m.certs)){
      S.certs=await Promise.all(m.certs.map(async c=>({name:c.name,key:c.key,b64:c.key?await dbGet(c.key):null})));
      if(S.certs.length) renderDocs('cert');
    }
    if(Array.isArray(m.exps)){
      S.exps=await Promise.all(m.exps.map(async e=>({name:e.name,key:e.key,b64:e.key?await dbGet(e.key):null})));
      if(S.exps.length) renderDocs('exp');
    }

    if(Array.isArray(m.eduCerts)){
      S.eduCerts=await Promise.all(m.eduCerts.map(async c=>({name:c.name,key:c.key,b64:c.key?await dbGet(c.key):null})));
      if(S.eduCerts.length) renderEduCerts();
    }

    for(let i=0;i<S.projects.length;i++){
      const p=S.projects[i];
      for(const slot of ['spec','prototype','report']){
        if(p.docs[slot].key){const b64=await dbGet(p.docs[slot].key);if(b64)p.docs[slot].b64=b64;}
      }
      for(let ci=0;ci<p.customDocs.length;ci++){
        if(p.customDocs[ci].key){const b64=await dbGet(p.customDocs[ci].key);if(b64)p.customDocs[ci].b64=b64;}
      }
    }

    renderAll(false);
    loadTextFields();
  }catch(e){console.warn('loadAllData error',e);}
}

/* =====================================================================
   STATE
   ===================================================================== */
let adminMode=false,flagClicks=0,flagTimer=null;
let _pendingDocUpload=null;

const S={
  avatarB64:null,avatarKey:null,
  cvFile:{name:null,key:null,b64:null},
  resFile:{name:null,key:null,b64:null},
  certs:[],exps:[],
  eduCerts:[],
  projects:[
    {tag:'Featured',title:'Project Title One',
     desc:'Brief description of this project, your role, technologies used, and the outcome or impact achieved.',
     docs:{spec:{name:null,key:null,b64:null},prototype:{name:null,key:null,b64:null},report:{name:null,key:null,b64:null}},
     customDocs:[]},
    {tag:'Work',title:'Project Title Two',
     desc:'Brief description of this project, your role, technologies used, and the outcome or impact achieved.',
     docs:{spec:{name:null,key:null,b64:null},prototype:{name:null,key:null,b64:null},report:{name:null,key:null,b64:null}},
     customDocs:[]},
    {tag:'Community',title:'Project Title Three',
     desc:'Brief description of this project, your role, technologies used, and the outcome or impact achieved.',
     docs:{spec:{name:null,key:null,b64:null},prototype:{name:null,key:null,b64:null},report:{name:null,key:null,b64:null}},
     customDocs:[]},
  ],
  education:[
    {yr:'2020 – 2024',school:'University / College Name',deg:'Degree / Program Name'},
    {yr:'2018 – 2020',school:'Higher Secondary School',deg:'Class XII · Science / Arts / Commerce'},
    {yr:'2016 – 2018',school:'Middle Secondary School',deg:'Class X'},
  ],
  skills:['Skill One','Skill Two','Skill Three','Skill Four','Skill Five','Skill Six','Skill Seven','Skill Eight'],
  langs:['Dzongkha','English','Hindi'],
};

/* === THEME === */
const THEME_COLORS={slate:'#7c8fff',dark:'#d4af37',light:'#a07818',forest:'#4caf50',crimson:'#e63946',ocean:'#38bdf8'};
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme',theme);
  document.getElementById('theme-btn').textContent=(theme==='light')?'🌙':'☀️';
  if(window._particleMat){window._particleMat.color.set(THEME_COLORS[theme]||'#7c8fff');}
  document.querySelectorAll('.theme-swatch').forEach(s=>s.classList.toggle('active',s.dataset.themeId===theme));
  try{localStorage.setItem('_theme',theme);}catch(e){}
}
(function(){let saved='slate';try{saved=localStorage.getItem('_theme')||'slate';}catch(e){}applyTheme(saved);})();
document.getElementById('theme-btn').onclick=()=>{
  const themes=Object.keys(THEME_COLORS);
  const current=document.documentElement.getAttribute('data-theme')||'slate';
  applyTheme(themes[(themes.indexOf(current)+1)%themes.length]);
};

/* === TAB SWITCHING === */
const TITLES={profile:'Profile Overview',projects:'Projects & Work',education:'Education',skills:'Skills & Competencies',cv:'CV & Resume',certs:'Certificates',exp:'Work Experience','admin-settings':'Admin Settings'};
document.querySelectorAll('.nb[data-tab]').forEach(btn=>{btn.addEventListener('click',()=>switchTab(btn.dataset.tab));});
function switchTab(id){
  const lid=id.toLowerCase();
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('on'));
  const pane=document.getElementById('pane-'+lid);
  if(pane){pane.classList.add('active');pane.scrollTop=0;gsap.fromTo(pane,{opacity:0,y:12},{opacity:1,y:0,duration:.28,ease:'power2.out'});}
  document.querySelector(`.nb[data-tab="${id}"]`)?.classList.add('on');
  document.getElementById('hdr-title').textContent=TITLES[lid]||lid;
}

/* === ADMIN LOGIN === */
document.getElementById('flag-btn').addEventListener('click',()=>{
  flagClicks++;clearTimeout(flagTimer);flagTimer=setTimeout(()=>{flagClicks=0;},4000);
  if(flagClicks>=10){flagClicks=0;clearTimeout(flagTimer);promptAdmin();}
});
function promptAdmin(){
  if(adminMode){toggleAdmin();return;}
  const pw=prompt('🔐 Enter admin password:');
  if(pw===null)return;
  if(pw===ADMIN_PASSWORD){toggleAdmin();}else{toast('❌ Wrong password');}
}
function toggleAdmin(){
  adminMode=!adminMode;
  const fl=document.getElementById('s-flash');fl.classList.add('on');setTimeout(()=>fl.classList.remove('on'),600);
  if(adminMode){enableAdmin();toast('🔓 Admin Mode Unlocked');}
  else{disableAdmin();toast('🔒 Admin Mode Locked');}
}

const EDIT_IDS=['sb-name','sb-role','p-name','p-tag','f-name','f-cid','f-dob','f-phone','f-email','f-nat','f-addr1','f-addr2','f-about','s-exp','s-proj','s-cert','c-email','c-wa','c-fb','c-li'];

function enableAdmin(){
  document.getElementById('admin-badge').style.display='inline-block';
  document.getElementById('gen-btn').classList.add('show');
  EDIT_IDS.forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    el.contentEditable='true';
    if(!el._saveHooked){el._saveHooked=true;el.addEventListener('blur',()=>scheduleSave());el.addEventListener('input',()=>scheduleSave());}
  });
  document.getElementById('hero-av-over').style.display='flex';
  document.getElementById('sb-av-over').classList.add('on');
  ['add-proj-btn','add-edu-btn','add-skill-btn','add-lang-btn','add-cert-btn','add-exp-btn','add-edu-cert-btn'].forEach(id=>document.getElementById(id)?.classList.add('show'));
  document.querySelectorAll('.del-btn').forEach(b=>b.classList.add('show'));
  document.getElementById('cv-box').classList.add('clickable');
  document.getElementById('res-box').classList.add('clickable');
  document.querySelectorAll('.edu-cert-grid .cv-box').forEach(box => box.classList.add('clickable'));
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display='');
  renderAll(true);
  renderEduCerts();
}
function disableAdmin(){
  document.getElementById('admin-badge').style.display='none';
  document.getElementById('gen-btn').classList.remove('show');
  EDIT_IDS.forEach(id=>{const el=document.getElementById(id);if(el)el.contentEditable='false';});
  document.getElementById('hero-av-over').style.display='none';
  document.getElementById('sb-av-over').classList.remove('on');
  ['add-proj-btn','add-edu-btn','add-skill-btn','add-lang-btn','add-cert-btn','add-exp-btn','add-edu-cert-btn'].forEach(id=>document.getElementById(id)?.classList.remove('show'));
  document.querySelectorAll('.del-btn').forEach(b=>b.classList.remove('show'));
  document.getElementById('cv-box').classList.remove('clickable');
  document.getElementById('res-box').classList.remove('clickable');
  document.querySelectorAll('.edu-cert-grid .cv-box').forEach(box => box.classList.remove('clickable'));
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display='none');
  renderAll(false);
  renderEduCerts();
}

/* === RENDER ALL === */
function renderAll(edit){renderProjects(edit);renderEducation(edit);renderSkills(edit);renderLangs(edit);}

/* ============================================================
   PROJECT DOCUMENT SLOTS
   ============================================================ */
const SLOT_META={
  spec:{icon:'📋',label:'Specification'},
  prototype:{icon:'🎨',label:'Prototype / Mockup'},
  report:{icon:'📊',label:'Report / Findings'},
};

function renderProjects(edit){
  const g=document.getElementById('proj-grid');g.innerHTML='';
  S.projects.forEach((p,i)=>{
    if(!p.docs) p.docs={spec:{name:null,key:null,b64:null},prototype:{name:null,key:null,b64:null},report:{name:null,key:null,b64:null}};
    if(!p.customDocs) p.customDocs=[];
    const c=document.createElement('div');c.className='proj-card';

    const slotsHtml=Object.entries(SLOT_META).map(([key,meta])=>{
      const doc=p.docs[key]||{name:null,key:null,b64:null};
      const hasFile=!!doc.name;
      return `<div class="proj-doc-slot" id="slot-${i}-${key}">
        <span class="slot-icon">${meta.icon}</span>
        <span class="slot-label">
          <span class="slot-type">${meta.label}</span>
          <span class="slot-name ${hasFile?'has-file':''}" id="slot-name-${i}-${key}">${hasFile?esc(doc.name):'No file attached'}</span>
        </span>
        <span class="slot-actions">
          ${hasFile&&doc.b64?`<a class="slot-dl show" href="${doc.b64}" download="${esc(doc.name)}" title="Download">⬇</a>`:''}
          <button class="slot-upload-btn${edit?' show':''}" onclick="triggerSlotUpload(${i},'${key}')" title="Upload">Upload</button>
          ${key==='prototype'?`<button class="slot-upload-btn${edit?' show':''}" onclick="triggerFolderUpload(${i})" title="Upload Folder">📁</button>`:''}
          ${hasFile?`<button class="slot-del${edit?' show':''}" onclick="clearSlotDoc(${i},'${key}')" title="Remove">✕</button>`:''}
        </span>
      </div>`;
    }).join('');

    const customHtml=p.customDocs.map((doc,ci)=>`
      <div class="proj-doc-slot">
        <span class="slot-icon">📎</span>
        <span class="slot-label">
          <span class="slot-type" id="custom-type-${i}-${ci}" contenteditable="${edit}" style="outline:none;text-transform:uppercase;font-size:.62rem;letter-spacing:.09em;color:var(--text-dim);font-weight:700">${esc(doc.label||'Custom Document')}</span>
          <span class="slot-name ${doc.name?'has-file':''}" id="custom-name-${i}-${ci}">${doc.name?esc(doc.name):'No file attached'}</span>
        </span>
        <span class="slot-actions">
          ${doc.name&&doc.b64?`<a class="slot-dl show" href="${doc.b64}" download="${esc(doc.name)}" title="Download">⬇</a>`:''}
          <button class="slot-upload-btn${edit?' show':''}" onclick="triggerCustomUpload(${i},${ci})" title="Upload">Upload</button>
          <button class="slot-del${edit?' show':''}" onclick="delCustomDoc(${i},${ci})" title="Remove">✕</button>
        </span>
      </div>`).join('');

    const docsCount=Object.values(p.docs).filter(d=>d&&d.name).length+p.customDocs.filter(d=>d.name).length;
    const totalDocs=Object.keys(SLOT_META).length+p.customDocs.length;

    c.innerHTML=`
      <button class="del-btn proj-del${edit?' show':''}" onclick="delProject(${i})">✕</button>
      <div class="proj-tag" contenteditable="${edit}">${esc(p.tag)}</div>
      <div class="proj-title" contenteditable="${edit}">${esc(p.title)}</div>
      <div class="proj-desc" contenteditable="${edit}">${esc(p.desc)}</div>
      <div class="proj-docs">
        <div class="proj-docs-header" onclick="toggleDocs(this)">
          <span class="proj-docs-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            Project Documents
            <span style="background:var(--gold-dim);color:var(--gold);padding:1px 7px;border-radius:10px;font-size:.58rem;font-weight:700">${docsCount}/${totalDocs}</span>
          </span>
          <span class="proj-docs-toggle">▸ expand</span>
        </div>
        <div class="proj-docs-body" id="proj-docs-${i}">
          <div class="proj-doc-slots">
            ${slotsHtml}
            <div class="proj-custom-docs" id="proj-custom-${i}">${customHtml}</div>
            <button class="proj-add-doc-btn${edit?' show':''}" onclick="addCustomDoc(${i})">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Another Document
            </button>
          </div>
        </div>
      </div>
      <div class="proj-view-link" style="margin-top:11px;font-size:.72rem;color:var(--teal);text-transform:uppercase;letter-spacing:.08em;font-weight:600">View Details →</div>`;

    const tag=c.querySelector('.proj-tag'),title=c.querySelector('.proj-title'),desc=c.querySelector('.proj-desc');
    tag.addEventListener('blur',()=>{if(S.projects[i]){S.projects[i].tag=tag.textContent.trim();scheduleSave();}});
    title.addEventListener('blur',()=>{if(S.projects[i]){S.projects[i].title=title.textContent.trim();scheduleSave();}});
    desc.addEventListener('blur',()=>{if(S.projects[i]){S.projects[i].desc=desc.textContent.trim();scheduleSave();}});
    g.appendChild(c);

    p.customDocs.forEach((_,ci)=>{
      const lbl=document.getElementById(`custom-type-${i}-${ci}`);
      if(lbl) lbl.addEventListener('blur',()=>{if(S.projects[i]&&S.projects[i].customDocs[ci]){S.projects[i].customDocs[ci].label=lbl.textContent.trim();scheduleSave();}});
    });
  });
}

function toggleDocs(header){
  const body=header.nextElementSibling;
  const toggle=header.querySelector('.proj-docs-toggle');
  const isOpen=body.classList.contains('open');
  body.classList.toggle('open',!isOpen);
  toggle.textContent=isOpen?'▸ expand':'▾ collapse';
}

function triggerSlotUpload(projIdx,slotKey){if(!adminMode)return;_pendingDocUpload={type:'slot',projIdx,slotKey};document.getElementById('fi-proj-doc').click();}
function triggerCustomUpload(projIdx,customIdx){if(!adminMode)return;_pendingDocUpload={type:'custom',projIdx,customIdx};document.getElementById('fi-proj-doc').click();}
function triggerFolderUpload(projIdx){if(!adminMode)return;_pendingDocUpload={type:'folder',projIdx};document.getElementById('fi-proj-folder').click();}

document.getElementById('fi-proj-doc').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const pending=_pendingDocUpload;_pendingDocUpload=null;if(!pending)return;
  const r=new FileReader();
  r.onload=async ev=>{
    const b64=ev.target.result;
    const key=uid();
    await dbSet(key,b64);
    const {projIdx}=pending;
    if(pending.type==='slot'){
      const old=S.projects[projIdx].docs[pending.slotKey];
      if(old&&old.key) dbDel(old.key);
      S.projects[projIdx].docs[pending.slotKey]={name:f.name,key,b64};
    }else{
      const old=S.projects[projIdx].customDocs[pending.customIdx];
      if(old&&old.key) dbDel(old.key);
      S.projects[projIdx].customDocs[pending.customIdx]={
        label:S.projects[projIdx].customDocs[pending.customIdx]?.label||'Custom Document',
        name:f.name,key,b64
      };
    }
    scheduleSave();toast('✅ '+f.name+' attached');renderProjects(adminMode);
  };
  r.readAsDataURL(f);e.target.value='';
});

document.getElementById('fi-proj-folder').addEventListener('change',e=>{
  const files=e.target.files;if(!files.length)return;
  const pending=_pendingDocUpload;_pendingDocUpload=null;if(!pending||pending.type!=='folder')return;
  const projIdx=pending.projIdx;
  let uploadedCount=0;
  Array.from(files).forEach(async f=>{
    const r=new FileReader();
    r.onload=async ev=>{
      const b64=ev.target.result;
      const key=uid();
      await dbSet(key,b64);
      S.projects[projIdx].customDocs.push({
        label:'Prototype - '+f.name,
        name:f.name,key,b64
      });
      uploadedCount++;
      if(uploadedCount===files.length){
        scheduleSave();toast('✅ Folder uploaded: '+files.length+' files');renderProjects(adminMode);
      }
    };
    r.readAsDataURL(f);
  });
  e.target.value='';
});

function clearSlotDoc(projIdx,slotKey){
  const doc=S.projects[projIdx].docs[slotKey];
  if(doc&&doc.key) dbDel(doc.key);
  S.projects[projIdx].docs[slotKey]={name:null,key:null,b64:null};
  renderProjects(adminMode);scheduleSave();toast('🗑️ Document removed');
}
function addCustomDoc(projIdx){
  S.projects[projIdx].customDocs.push({label:'Custom Document',name:null,key:null,b64:null});
  renderProjects(adminMode);scheduleSave();
  const body=document.getElementById('proj-docs-'+projIdx);
  if(body&&!body.classList.contains('open')) body.classList.add('open');
}
function delCustomDoc(projIdx,customIdx){
  const doc=S.projects[projIdx].customDocs[customIdx];
  if(doc&&doc.key) dbDel(doc.key);
  S.projects[projIdx].customDocs.splice(customIdx,1);
  renderProjects(adminMode);scheduleSave();toast('🗑️ Removed');
}
function addProject(){
  S.projects.push({tag:'New',title:'Project Title',desc:'Describe this project here.',
    docs:{spec:{name:null,key:null,b64:null},prototype:{name:null,key:null,b64:null},report:{name:null,key:null,b64:null}},
    customDocs:[]});
  renderProjects(true);scheduleSave();
}
function delProject(i){
  const p=S.projects[i];
  if(p){
    ['spec','prototype','report'].forEach(s=>{if(p.docs[s]&&p.docs[s].key)dbDel(p.docs[s].key);});
    (p.customDocs||[]).forEach(d=>{if(d.key)dbDel(d.key);});
  }
  S.projects.splice(i,1);renderProjects(adminMode);scheduleSave();
}

/* === EDUCATION === */
function renderEducation(edit){
  const tl=document.getElementById('edu-tl');tl.innerHTML='';
  S.education.forEach((e,i)=>{
    const item=document.createElement('div');item.className='tl-item';
    item.innerHTML=`
      <div class="tl-dot"></div>
      <div class="tl-row">
        <div class="tl-content">
          <div class="tl-yr" contenteditable="${edit}">${esc(e.yr)}</div>
          <div class="tl-school" contenteditable="${edit}">${esc(e.school)}</div>
          <div class="tl-deg" contenteditable="${edit}">${esc(e.deg)}</div>
        </div>
        <button class="del-btn${edit?' show':''}" onclick="delEdu(${i})">✕</button>
      </div>`;
    const yr=item.querySelector('.tl-yr'),sc=item.querySelector('.tl-school'),dg=item.querySelector('.tl-deg');
    yr.addEventListener('blur',()=>{if(S.education[i]){S.education[i].yr=yr.textContent.trim();scheduleSave();}});
    sc.addEventListener('blur',()=>{if(S.education[i]){S.education[i].school=sc.textContent.trim();scheduleSave();}});
    dg.addEventListener('blur',()=>{if(S.education[i]){S.education[i].deg=dg.textContent.trim();scheduleSave();}});
    tl.appendChild(item);
  });
}
function addEducation(){S.education.unshift({yr:'Year – Year',school:'School / College Name',deg:'Degree / Program'});renderEducation(true);scheduleSave();}
function delEdu(i){S.education.splice(i,1);renderEducation(adminMode);scheduleSave();}

/* === SKILLS === */
function renderSkills(edit){
  const w=document.getElementById('skills-wrap');w.innerHTML='';
  S.skills.forEach((s,i)=>{
    const c=document.createElement('div');c.className='skill-chip';
    c.innerHTML=`<span class="skill-text" contenteditable="${edit}">${esc(s)}</span>${edit?`<button class="del-btn show" onclick="delSkill(${i})" style="padding:0 2px;font-size:.7rem;margin-left:3px">✕</button>`:''}`;
    c.querySelector('.skill-text').addEventListener('blur',ev=>{if(S.skills[i]!==undefined){S.skills[i]=ev.target.textContent.trim();scheduleSave();}});
    w.appendChild(c);
  });
}
function addSkill(){S.skills.push('New Skill');renderSkills(true);scheduleSave();}
function delSkill(i){S.skills.splice(i,1);renderSkills(adminMode);scheduleSave();}

function renderLangs(edit){
  const w=document.getElementById('lang-wrap');w.innerHTML='';
  S.langs.forEach((l,i)=>{
    const c=document.createElement('div');c.className='skill-chip';
    c.innerHTML=`<span class="skill-text" contenteditable="${edit}">${esc(l)}</span>${edit?`<button class="del-btn show" onclick="delLang(${i})" style="padding:0 2px;font-size:.7rem;margin-left:3px">✕</button>`:''}`;
    c.querySelector('.skill-text').addEventListener('blur',ev=>{if(S.langs[i]!==undefined){S.langs[i]=ev.target.textContent.trim();scheduleSave();}});
    w.appendChild(c);
  });
}
function addLang(){S.langs.push('Language');renderLangs(true);scheduleSave();}
function delLang(i){S.langs.splice(i,1);renderLangs(adminMode);scheduleSave();}

/* === AVATAR === */
document.getElementById('hero-av-over').onclick=()=>{if(adminMode)document.getElementById('fi-avatar').click();};
document.getElementById('sb-av-wrap').onclick=()=>{if(adminMode)document.getElementById('fi-avatar').click();};
document.getElementById('fi-avatar').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=async ev=>{
    const b64=ev.target.result;
    const key=S.avatarKey||uid();
    await dbSet(key,b64);
    S.avatarB64=b64;S.avatarKey=key;
    document.getElementById('main-av').src=b64;
    document.getElementById('sb-av').src=b64;
    scheduleSave();toast('✅ Profile photo updated');
  };r.readAsDataURL(f);
});

/* === CV/RESUME === */
function cvClick(type){if(!adminMode)return;document.getElementById(type==='cv'?'fi-cv':'fi-resume').click();}
document.getElementById('fi-cv').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=async ev=>{
    const b64=ev.target.result;const key=S.cvFile.key||uid();
    await dbSet(key,b64);
    S.cvFile={name:f.name,key,b64};
    applyCVBox('cv-box','cv-lbl','cv-fname','cv-dl',S.cvFile);
    scheduleSave();toast('✅ CV: '+f.name);
  };r.readAsDataURL(f);
});
document.getElementById('fi-resume').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=async ev=>{
    const b64=ev.target.result;const key=S.resFile.key||uid();
    await dbSet(key,b64);
    S.resFile={name:f.name,key,b64};
    applyCVBox('res-box','res-lbl','res-fname','res-dl',S.resFile);
    scheduleSave();toast('✅ Resume: '+f.name);
  };r.readAsDataURL(f);
});

/* === CERTS & EXP === */
document.getElementById('fi-cert').addEventListener('change',e=>{
  Array.from(e.target.files).forEach(f=>{
    const r=new FileReader();
    r.onload=async ev=>{
      const b64=ev.target.result;const key=uid();
      await dbSet(key,b64);
      S.certs.push({name:f.name,key,b64});
      renderDocs('cert');scheduleSave();
    };r.readAsDataURL(f);
  });e.target.value='';
});
document.getElementById('fi-exp').addEventListener('change',e=>{
  Array.from(e.target.files).forEach(f=>{
    const r=new FileReader();
    r.onload=async ev=>{
      const b64=ev.target.result;const key=uid();
      await dbSet(key,b64);
      S.exps.push({name:f.name,key,b64});
      renderDocs('exp');scheduleSave();
    };r.readAsDataURL(f);
  });e.target.value='';
});

function renderDocs(type){
  const list=document.getElementById(type+'-list');
  const empty=document.getElementById(type+'-empty');
  const arr=type==='cert'?S.certs:S.exps;
  list.innerHTML='';empty.style.display=arr.length===0?'block':'none';
  arr.forEach((item,i)=>{
    const row=document.createElement('div');row.className='uitem';
    const dlHtml=item.b64?`<a class="uitem-dl" href="${item.b64}" download="${esc(item.name)}">⬇</a>`:'';
    row.innerHTML=`<span class="uitem-icon">📄</span><span class="uitem-name">${esc(item.name)}</span>${dlHtml}<button class="del-btn${adminMode?' show':''}" onclick="delDoc('${type}',${i})">✕</button>`;
    list.appendChild(row);
  });
}

/* === EDUCATION CERTIFICATES === */
document.getElementById('fi-edu-cert').addEventListener('change',e=>{
  Array.from(e.target.files).forEach(f=>{
    const r=new FileReader();
    r.onload=async ev=>{
      const b64=ev.target.result;const key=uid();
      await dbSet(key,b64);
      S.eduCerts.push({name:f.name,key,b64});
      renderEduCerts();scheduleSave();
    };r.readAsDataURL(f);
  });e.target.value='';
});

function renderEduCerts(){
  const list=document.getElementById('edu-cert-list');
  const empty=document.getElementById('edu-cert-empty');
  list.innerHTML='';empty.style.display=S.eduCerts.length===0?'block':'none';
  S.eduCerts.forEach((item,i)=>{
    const row=document.createElement('div');row.className='uitem';
    const dlHtml=item.b64?`<a class="uitem-dl" href="${item.b64}" download="${esc(item.name)}">⬇</a>`:'';
    row.innerHTML=`<span class="uitem-icon">📄</span><span class="uitem-name">${esc(item.name)}</span>${dlHtml}<button class="del-btn${adminMode?' show':''}" onclick="delEduCert(${i})">✕</button>`;
    list.appendChild(row);
  });
}

function delEduCert(i){
  if(!adminMode)return;
  const item=S.eduCerts[i];
  if(item&&item.key)dbDel(item.key);
  S.eduCerts.splice(i,1);
  renderEduCerts();scheduleSave();
}
function delDoc(type,i){
  const arr=type==='cert'?S.certs:S.exps;
  if(arr[i]&&arr[i].key) dbDel(arr[i].key);
  arr.splice(i,1);renderDocs(type);scheduleSave();toast('🗑️ Removed');
}

/* === CONTACT LINKS === */
(function(){
  function setupContact(valId,linkId,buildHref){
    const val=document.getElementById(valId),link=document.getElementById(linkId);
    if(!val||!link)return;
    val.addEventListener('blur',()=>{link.href=buildHref(val.textContent.trim());});
  }
  setupContact('c-email','c-email-link',v=>'mailto:'+v);
  setupContact('c-wa','c-wa-link',v=>'https://wa.me/'+v.replace(/[^0-9]/g,''));
  setupContact('c-fb','c-fb-link',v=>v.startsWith('http')?v:'https://'+v);
  setupContact('c-li','c-li-link',v=>v.startsWith('http')?v:'https://'+v);
})();

/* === TOAST === */
let toastT;
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2800);}

/* === ESCAPE HTML === */
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* === GENERATE FINAL SITE === */
function generateSite(){
  toast('⏳ Building your site…');
  setTimeout(()=>{
    const doc=document.documentElement.cloneNode(true);
    const currentTheme=document.documentElement.getAttribute('data-theme')||'slate';
    doc.setAttribute('data-theme',currentTheme);
    doc.style.fontSize=currentFontSize+'%';

    if(S.avatarB64){doc.querySelectorAll('#main-av,#sb-av').forEach(img=>img.setAttribute('src',S.avatarB64));}

    function bakeCV(boxId,lblId,fnId,dlId,file){
      if(!file||!file.b64)return;
      doc.getElementById(boxId)?.classList.add('has-file');
      const lbl=doc.getElementById(lblId);if(lbl)lbl.textContent='';
      const fn=doc.getElementById(fnId);if(fn){fn.textContent=file.name;fn.style.display='block';}
      const dl=doc.getElementById(dlId);if(dl){dl.setAttribute('href',file.b64);dl.setAttribute('download',file.name);dl.style.display='inline-block';}
    }
    bakeCV('cv-box','cv-lbl','cv-fname','cv-dl',S.cvFile);
    bakeCV('res-box','res-lbl','res-fname','res-dl',S.resFile);

    const cl=doc.getElementById('cert-list');
    if(cl)cl.innerHTML=S.certs.filter(c=>c.b64).map(c=>`<div class="uitem"><span class="uitem-icon">📄</span><span class="uitem-name">${esc(c.name)}</span><a class="uitem-dl" href="${c.b64}" download="${esc(c.name)}">⬇</a></div>`).join('');
    const ce=doc.getElementById('cert-empty');if(ce)ce.style.display=S.certs.length?'none':'block';

    const el2=doc.getElementById('exp-list');
    if(el2)el2.innerHTML=S.exps.filter(e=>e.b64).map(e=>`<div class="uitem"><span class="uitem-icon">📄</span><span class="uitem-name">${esc(e.name)}</span><a class="uitem-dl" href="${e.b64}" download="${esc(e.name)}">⬇</a></div>`).join('');
    const ee=doc.getElementById('exp-empty');if(ee)ee.style.display=S.exps.length?'none':'block';

    // Bake all project cards with embedded download links
    const projGrid=doc.getElementById('proj-grid');
    if(projGrid){
      projGrid.innerHTML='';
      S.projects.forEach(p=>{
        if(!p.docs)return;
        const c=document.createElement('div');c.className='proj-card';
        const sH=Object.entries(SLOT_META).map(([key,meta])=>{
          const d=p.docs[key]||{};const hf=!!(d.name&&d.b64);
          return `<div class="proj-doc-slot"><span class="slot-icon">${meta.icon}</span><span class="slot-label"><span class="slot-type">${meta.label}</span><span class="slot-name ${hf?'has-file':''}">${hf?esc(d.name):'No file attached'}</span></span><span class="slot-actions">${hf?`<a class="slot-dl show" href="${d.b64}" download="${esc(d.name)}">⬇</a>`:''}</span></div>`;
        }).join('');
        const cH=(p.customDocs||[]).map(d=>{const hf=!!(d.name&&d.b64);
          return `<div class="proj-doc-slot"><span class="slot-icon">📎</span><span class="slot-label"><span class="slot-type" style="text-transform:uppercase;font-size:.62rem;letter-spacing:.09em;color:var(--text-dim);font-weight:700">${esc(d.label||'Document')}</span><span class="slot-name ${hf?'has-file':''}">${hf?esc(d.name):'No file attached'}</span></span><span class="slot-actions">${hf?`<a class="slot-dl show" href="${d.b64}" download="${esc(d.name)}">⬇</a>`:''}</span></div>`;
        }).join('');
        const dc=Object.values(p.docs).filter(d=>d&&d.name&&d.b64).length+(p.customDocs||[]).filter(d=>d.name&&d.b64).length;
        const dt=Object.keys(SLOT_META).length+(p.customDocs||[]).length;
        c.innerHTML=`<div class="proj-tag">${esc(p.tag)}</div><div class="proj-title">${esc(p.title)}</div><div class="proj-desc">${esc(p.desc)}</div>
          <div class="proj-docs">
            <div class="proj-docs-header" onclick="toggleDocs(this)">
              <span class="proj-docs-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>Project Documents<span style="background:var(--gold-dim);color:var(--gold);padding:1px 7px;border-radius:10px;font-size:.58rem;font-weight:700">${dc}/${dt}</span></span>
              <span class="proj-docs-toggle">▸ expand</span>
            </div>
            <div class="proj-docs-body"><div class="proj-doc-slots">${sH}<div class="proj-custom-docs">${cH}</div></div></div>
          </div>
          <div class="proj-view-link" style="margin-top:11px;font-size:.72rem;color:var(--teal);text-transform:uppercase;letter-spacing:.08em;font-weight:600">View Details →</div>`;
        projGrid.appendChild(c);
      });
    }

    ['admin-badge','gen-btn','add-proj-btn','add-edu-btn','add-skill-btn','add-lang-btn','add-cert-btn','add-exp-btn','pane-admin-settings','fi-proj-doc'].forEach(id=>{
      const el=doc.getElementById(id);if(el){el.style.display='none';el.classList.remove('show','active');}
    });
    doc.querySelectorAll('.admin-only').forEach(el=>el.style.display='none');
    doc.querySelectorAll('[contenteditable]').forEach(el=>el.setAttribute('contenteditable','false'));
    doc.querySelectorAll('.del-btn,.slot-del,.slot-upload-btn,.proj-add-doc-btn').forEach(b=>{b.style.display='none';b.classList.remove('show');});
    const ho=doc.getElementById('hero-av-over');if(ho)ho.style.display='none';
    const so=doc.getElementById('sb-av-over');if(so)so.style.display='none';
    ['fi-avatar','fi-cv','fi-resume','fi-cert','fi-exp','fi-proj-doc','fi-edu-cert','fi-proj-folder'].forEach(id=>{doc.getElementById(id)?.remove();});

    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['<!DOCTYPE html>\n'+doc.outerHTML],{type:'text/html'}));
    a.download='index.html';a.click();URL.revokeObjectURL(a.href);
    toast('✅ Downloaded! Replace index.html on GitHub.');
  },300);
}

/* === ADMIN SETTINGS — THEME SWATCHES === */
document.addEventListener('click',e=>{
  const swatch=e.target.closest('.theme-swatch');
  if(swatch&&adminMode){applyTheme(swatch.dataset.themeId);toast('🎨 Theme: '+swatch.title);}
});

/* === ADMIN SETTINGS — FONT SIZE === */
let currentFontSize=100;
try{currentFontSize=parseInt(localStorage.getItem('_fontSize')||'100');}catch(e){}
function applyFontSize(pct){
  currentFontSize=pct;
  document.documentElement.style.fontSize=pct+'%';
  const lbl=document.getElementById('font-size-label');
  const slider=document.getElementById('font-size-slider');
  if(lbl)lbl.textContent=pct+'%';
  if(slider)slider.value=pct;
  try{localStorage.setItem('_fontSize',pct);}catch(e){}
}
applyFontSize(currentFontSize);
document.getElementById('font-size-slider')?.addEventListener('input',e=>{applyFontSize(parseInt(e.target.value));});
document.querySelectorAll('.sz-preset').forEach(btn=>{btn.addEventListener('click',()=>applyFontSize(parseInt(btn.dataset.size)));});

/* === ADMIN SETTINGS — CHANGE PASSWORD === */
function changePassword(){
  const cur=document.getElementById('pw-current').value;
  const nw=document.getElementById('pw-new').value;
  const cf=document.getElementById('pw-confirm').value;
  const msg=document.getElementById('pw-msg');
  if(cur!==ADMIN_PASSWORD){msg.style.color='#e63946';msg.textContent='❌ Current password is incorrect.';return;}
  if(nw.length<6){msg.style.color='#e63946';msg.textContent='❌ New password must be at least 6 characters.';return;}
  if(nw!==cf){msg.style.color='#e63946';msg.textContent='❌ Passwords do not match.';return;}
  ADMIN_PASSWORD=nw;try{localStorage.setItem('_adminPw',nw);}catch(e){}
  document.getElementById('pw-current').value='';document.getElementById('pw-new').value='';document.getElementById('pw-confirm').value='';
  msg.style.color='#4caf50';msg.textContent='✅ Password changed successfully!';
  toast('🔑 Admin password updated');setTimeout(()=>{msg.textContent='';},4000);
}

/* === INIT === */
renderAll(false);
loadTextFields();
switchTab('Profile');

// Async: load all persisted data from IndexedDB + localStorage
loadAllData().catch(e=>console.warn('Load error:',e));

setTimeout(()=>{gsap.to('#bot-bubble',{opacity:0,y:8,duration:.4,onComplete:()=>{document.getElementById('bot-bubble').style.display='none';}});},12000);
