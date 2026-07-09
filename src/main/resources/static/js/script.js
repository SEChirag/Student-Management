    const AUTH_BASE = "http://localhost:8081/auth";
    const BASE_URL  = "http://localhost:8081/API";
    const USER_URL  = "http://localhost:8081/student";

    let allStudents       = [];
    let displayedStudents = [];
    let assignments       = [];
    let completionMap     = {};
    let bChart, dChart, dashDChart;
    let currentSort   = 'id';
    let lightMode     = false;
let authToken = null;
let loggedInUser = localStorage.getItem('loggedInUser') || 'Admin';
let loggedInRole = localStorage.getItem('userRole') || 'ADMIN';
try {
  const stored = localStorage.getItem('jwt');
  if(stored) {
    const payload = JSON.parse(atob(stored.split('.')[1]));
    if(Date.now() < payload.exp * 1000) {
      authToken = stored;
      loggedInUser = localStorage.getItem('loggedInUser') || 'User';
    } else {
      localStorage.removeItem('jwt');
      localStorage.removeItem('loggedInUser');
    }
  }
} catch(e) {
  localStorage.removeItem('jwt');
  localStorage.removeItem('loggedInUser');
}
    let backendOnline = false;
    let dupGroups     = [];

    const DEMO_STUDENTS = [
      {id:1,name:'null',marks:0,section:'A',result:'pass',status:'Active'},
      {id:2,name:'null',marks:0,section:'B',result:'pass',status:'Active'},
      {id:3,name:'null',marks:0,section:'A',result:'pass',status:'Active'},
      {id:4,name:'null',marks:0,section:'C',result:'pass',status:'Active'},
      {id:5,name:'null',marks:0,section:'B',result:'fail',status:'Active'},
      {id:6,name:'null',marks:0,section:'C',result:'pass',status:'Active'},
      {id:7,name:'null',marks:0,section:'A',result:'pass',status:'Active'},
      {id:8,name:'null',marks:0,section:'D',result:'fail',status:'Inactive'},
      {id:9,name:'null',marks:0,section:'A',result:'pass',status:'Active'},
      {id:10,name:'null',marks:0,section:'B',result:'pass',status:'Active'},
    ];

    function authHeaders(extra) {
      const h = Object.assign({}, extra||{});
      if (authToken) h['Authorization'] = 'Bearer ' + authToken;
      return h;
    }
    /* ── Universal sync/refresh animation wrapper ── */
    async function runSync(btnEl, asyncFn, successMsg){
      if(!btnEl) { await asyncFn(); return; }
      btnEl.disabled = true;
      btnEl.classList.remove('done');
      btnEl.classList.add('syncing');
      try{
        await asyncFn();
        if(successMsg) showToast(successMsg);
        btnEl.classList.remove('syncing');
        btnEl.classList.add('done');
        setTimeout(()=>btnEl.classList.remove('done'), 500);
      }catch(e){
        showToast('Refresh failed','warn');
        btnEl.classList.remove('syncing');
      }finally{
        setTimeout(()=>{ btnEl.disabled=false; }, 300);
      }
    }

    async function refreshStudentPortal(){
      const btn = document.getElementById('spSyncBtn');
      await runSync(btn, async () => {
        const cached = localStorage.getItem('studentProfile');
        const profile = cached ? JSON.parse(cached) : null;
        if(!profile) throw new Error('no profile');
        await loadStudentAssignments(profile);
        await loadStudentMarks(profile);
      }, 'Synced!');
    }
async function loadPending(){
  // Load pending users
  try{
    const res = await fetch(`${AUTH_BASE}/pending`, {headers:authHeaders()});
    if(res.ok){
      const users = await res.json();
      document.getElementById('pendingCount').textContent = users.length;
      const tb = document.getElementById('pendingTable');
      if(!users.length){
        tb.innerHTML=`<tr><td colspan="4"><div class="empty"><div class="eico">🔔</div><p>No pending users</p></div></td></tr>`;
      } else {
        tb.innerHTML = users.map(u=>`<tr>
          <td><strong>#${u.id}</strong></td>
          <td><strong>${u.username}</strong></td>
          <td><span class="badge gc">${u.role}</span></td>
          <td style="display:flex;gap:6px">
            <button class="btn btn-green btn-sm" onclick="approveUser(${u.id})">✓ Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectUser(${u.id})">✕ Reject</button>
          </td>
        </tr>`).join('');
      }
    }
  }catch(e){ showToast('Failed to load pending users','warn'); }

  // Load all users stats + table
  try{
    const res2 = await fetch(`${AUTH_BASE}/users`, {headers:authHeaders()});
    if(res2.ok){
      const all = await res2.json();
      const admins   = all.filter(u=>u.role==='ADMIN').length;
      const users    = all.filter(u=>u.role==='USER').length;
      const approved = all.filter(u=>u.status==='APPROVED').length;
      const pending2 = all.filter(u=>u.status==='PENDING').length;
      const rejected = all.filter(u=>u.status==='REJECTED').length;

      document.getElementById('userStats').innerHTML = `
        <div style="padding:12px 18px;background:rgba(177,76,255,.08);border:1px solid rgba(177,76,255,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--purple)">${admins}</div>
          <div style="font-size:11px;color:var(--muted)">Admins</div>
        </div>
        <div style="padding:12px 18px;background:rgba(0,245,212,.08);border:1px solid rgba(0,245,212,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--cyan)">${users}</div>
          <div style="font-size:11px;color:var(--muted)">Users</div>
        </div>
        <div style="padding:12px 18px;background:rgba(34,211,122,.08);border:1px solid rgba(34,211,122,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--green)">${approved}</div>
          <div style="font-size:11px;color:var(--muted)">Approved</div>
        </div>
        <div style="padding:12px 18px;background:rgba(255,228,77,.08);border:1px solid rgba(255,228,77,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--yellow)">${pending2}</div>
          <div style="font-size:11px;color:var(--muted)">Pending</div>
        </div>
        <div style="padding:12px 18px;background:rgba(255,45,120,.08);border:1px solid rgba(255,45,120,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--pink)">${rejected}</div>
          <div style="font-size:11px;color:var(--muted)">Rejected</div>
        </div>`;
allUsersCache = all;
      renderAllUsersTable();

    }
  }catch(e){}
}
    /* ── GRADE UTILS ── */
    function getGrade(m){ m=parseInt(m); if(m>=90)return'A+'; if(m>=80)return'A'; if(m>=70)return'B'; if(m>=60)return'C'; if(m>=33)return'D'; return'F'; }
    function gradeCls(g){ return({A:'ga','A+':'ga',B:'gb',C:'gc',D:'gd',F:'gf'}[g]||'gf'); }
    function gradeColor(g){ return({'A+':'var(--green)',A:'var(--cyan)',B:'var(--purple)',C:'var(--yellow)',D:'#ff9100',F:'var(--pink)'}[g]||'var(--muted)'); }
    function gradeDesc(g){ return({'A+':'Outstanding! 🌟',A:'Excellent! 🎉',B:'Good work! 👍',C:'Satisfactory 📚',D:'Needs improvement 📖',F:'Failed ❌'}[g]||''); }
    function gradeFeedback(g){ return({'A+':'Top of the class!',A:'Great performance.',B:'Solid effort — aim higher!',C:'Passing but room to grow.',D:'Barely passing — study harder.',F:'Failed — keep trying!'}[g]||''); }
    function ftime(){ return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }
    function isOverdue(due){ if(!due)return false; return new Date(due)<new Date()&&new Date(due).toDateString()!==new Date().toDateString(); }

    /* ── TOPBAR DATE/GREETING ── */
    function initTopbar() {
      const now = new Date();
      document.getElementById('topbarDate').textContent = now.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
      const h = now.getHours();

      const name = loggedInUser.charAt(0).toUpperCase() + loggedInUser.slice(1);
      document.getElementById('topbarGreeting').textContent = (h<12?'Good morning':h<17?'Good afternoon':'Good evening')+', '+name+' 👋';
    }

    /* ── TOAST ── */
    let toasts=[];
    function showToast(msg,type='success'){
      const t=document.createElement('div');
      t.className=`toast${type==='error'?' error':type==='warn'?' warn':''}`;
      t.innerHTML=`<span>${type==='success'?'✓':type==='warn'?'⚠':'✕'}</span>${msg}`;
      t.style.bottom=(22+toasts.length*56)+'px';
      document.body.appendChild(t);
      toasts.push(t);
      setTimeout(()=>{t.style.animation='toastOut .3s ease forwards';setTimeout(()=>{t.remove();toasts=toasts.filter(x=>x!==t);toasts.forEach((x,i)=>x.style.bottom=(22+i*56)+'px');},300);},3000);
    }

    /* ── ACTIVITY LOG ── */
    function addLog(txt){
      const list=document.getElementById('logList');
      const d=document.createElement('div');
      d.className='log-item';
      d.innerHTML=`${txt}<br><span class="log-time">${ftime()}</span>`;
      list.insertBefore(d,list.firstChild);
      while(list.children.length>7)list.removeChild(list.lastChild);
    }

    /* ── CONNECTION ── */
    function setConnStatus(online){
      backendOnline=online;
      const pill=document.getElementById('connPill');
      const txt=document.getElementById('connText');
      pill.className='conn-pill'+(online?'':' offline');
      txt.textContent=online?'connected':'Connected';
    }
async function checkBackend(){
  if(authToken && loggedInUser === 'superadmin'){
    document.getElementById('pendingNavBtn').style.display='flex';
    loadPending();
  }
  const checkUrl = (loggedInRole === 'USER') ? `${USER_URL}/my-profile` : `${BASE_URL}/profile`;
  try{
    const res=await fetch(checkUrl,{headers:authHeaders(),signal:AbortSignal.timeout(3000)});
    setConnStatus(res.ok);
  }catch(e){setConnStatus(false);}
}

    /* ── THEME ── */
    function toggleTheme(){
      lightMode=!lightMode;
      document.documentElement.setAttribute('data-theme',lightMode?'light':'');
      document.getElementById('themeLabel').textContent=lightMode?'Dark mode':'Light mode';
      addLog(lightMode?'Switched to Light mode':'Switched to Dark mode');
    }

    /* ── LOGIN ── */
    async function login(){
      const u=document.getElementById('username').value.trim();
      const p=document.getElementById('password').value;
      const err=document.getElementById('loginError');
      const btn=document.getElementById('loginBtn');
      err.innerText=''; btn.disabled=true; btn.innerText='Signing in…';
      try{
        const res=await fetch(`${AUTH_BASE}/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p}),signal:AbortSignal.timeout(5000)});
        const text=await res.text();
    if(res.ok&&text&&!text.toLowerCase().includes('invalid')&&!text.toLowerCase().includes('not found')){
    authToken = text;
    localStorage.setItem('jwt', text);
    loggedInUser = u;
    localStorage.setItem('loggedInUser', u);
    const payload = JSON.parse(atob(authToken.split('.')[1]));
const userRole = payload.role || 'ADMIN';
localStorage.setItem('userRole', userRole);
if(userRole === 'USER') {
  enterStudentFlow();
} else {
  enterDashboard(false);
}
return;
        }
        throw new Error('invalid_credentials');
      }catch(e){
        if(e.message==='invalid_credentials'){
          err.innerText='⚠️ Invalid credentials — try again!';
          err.style.animation='none'; requestAnimationFrame(()=>{err.style.animation='shake .4s ease';});
          btn.disabled=false; btn.innerText='Sign In →'; return;
        }
        if(u==='admin'&&p==='1234'){
         loggedInUser = u;
         localStorage.setItem('loggedInUser', u)
        authToken=null; localStorage.removeItem('jwt'); enterDashboard(true); return; }
        if(e.message==='Invalid credential'){
        }
<!--        err.innerText='⚠️ Could not reach server. Try demo: admin / 1234';-->
      }finally{ btn.disabled=false; btn.innerText='Sign In →'; }
    }
<!--    async function loadMyProfile() {-->
<!--    const msg = document.getElementById('profMsg');-->
<!--    try {-->
<!--        const res = await fetch('http://localhost:8081/student/my-profile', {-->
<!--            headers: authHeaders()-->
<!--        });-->
<!--        if (!res.ok) throw new Error('Not found');-->
<!--        const profile = await res.json();-->

<!--        document.getElementById('profFullName').textContent   = profile.fullName   || '—';-->
<!--        document.getElementById('profUsername').textContent   = profile.username   || '—';-->
<!--        document.getElementById('profRollNumber').textContent = profile.rollNumber || '—';-->
<!--        document.getElementById('profSection').textContent    = profile.section    || '—';-->

<!--        // Keep localStorage in sync-->
<!--        localStorage.setItem('studentProfile', JSON.stringify(profile));-->
<!--        msg.textContent = '';-->
<!--    } catch(e) {-->
<!--        // Fallback to localStorage if API fails-->
<!--        const cached = localStorage.getItem('studentProfile');-->
<!--        if (cached) {-->
<!--            const p = JSON.parse(cached);-->
<!--            document.getElementById('profFullName').textContent   = p.fullName   || '—';-->
<!--            document.getElementById('profUsername').textContent   = p.username   || '—';-->
<!--            document.getElementById('profRollNumber').textContent = p.rollNumber || '—';-->
<!--            document.getElementById('profSection').textContent    = p.section    || '—';-->
<!--        }-->
<!--        msg.style.color = 'var(&#45;&#45;pink)';-->
<!--        msg.textContent = '⚠ Could not refresh from server';-->
<!--    }-->
<!--}-->




let allUsersCache = [];
let activeRoleTab = 'all';

function setRoleTab(role) {
    activeRoleTab = role;
    document.querySelectorAll('[id^="roleTab-"]').forEach(b => b.classList.remove('active'));
    document.getElementById('roleTab-' + role).classList.add('active');
    renderAllUsersTable();
}

function renderAllUsersTable() {
    const statusFilter = document.getElementById('statusFilterTab')?.value || 'all';

    const filtered = allUsersCache.filter(u => {
        if (activeRoleTab !== 'all' && u.role !== activeRoleTab) return false;
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
        return true;
    });

    const tb = document.getElementById('allUsersTable');
    if (!filtered.length) {
        tb.innerHTML = `<tr><td colspan="5"><div class="empty"><div class="eico">👥</div>
            <p>No users found for this filter</p></div></td></tr>`;
        return;
    }

    tb.innerHTML = filtered.map(u => `<tr>
        <td><strong>#${u.id}</strong></td>
        <td><strong>${u.username}</strong></td>
        <td><span class="badge gc">${u.role}</span></td>
        <td><span class="badge ${u.status==='APPROVED'?'bp':u.status==='REJECTED'?'bf':'gc'}">${u.status}</span></td>
        <td style="display:flex;gap:6px;">
            ${u.status!=='APPROVED'?`<button class="btn btn-green btn-sm" onclick="approveUser(${u.id})">✓ Approve</button>`:''}
            ${u.status!=='REJECTED'?`<button class="btn btn-danger btn-sm" onclick="rejectUser(${u.id})">✕ Reject</button>`:''}
        </td>
    </tr>`).join('');
}

/* ── STUDENT PROFILE (USER role) ── */
async function loadMyProfile() {
    const msg = document.getElementById('profMsg');
    try {
        const res = await fetch(`${USER_URL}/my-profile`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Not found');
        const profile = await res.json();

        document.getElementById('profFullName').textContent   = profile.fullName   || '—';
        document.getElementById('profUsername').textContent   = profile.username   || '—';
        document.getElementById('profRollNumber').textContent = profile.rollNumber || '—';
        document.getElementById('profSection').textContent    = profile.section    || '—';

        localStorage.setItem('studentProfile', JSON.stringify(profile));
        msg.textContent = '';
    } catch(e) {
        const cached = localStorage.getItem('studentProfile');
        if (cached) {
            const p = JSON.parse(cached);
            document.getElementById('profFullName').textContent   = p.fullName   || '—';
            document.getElementById('profUsername').textContent   = p.username   || '—';
            document.getElementById('profRollNumber').textContent = p.rollNumber || '—';
            document.getElementById('profSection').textContent    = p.section    || '—';
        }
        msg.style.color = 'var(--pink)';
        msg.textContent = '⚠ Could not refresh from server';
    }
}

/* ── ADMIN PROFILE (ADMIN role) ── */
async function loadAdminProfile() {
    try {
        const res = await fetch(`${BASE_URL}/profile`, { headers: authHeaders() });
        if (res.status === 404) {
            // No AdminProfile row created yet — show blank state, let them save one
            document.getElementById('adminProfUsername').textContent = loggedInUser || '—';
            document.getElementById('adminProfRole').textContent     = loggedInRole || '—';
            document.getElementById('adminProfStatus').textContent   = '—';
            document.getElementById('adminProfName').textContent     = loggedInUser  || '—';
            document.getElementById('adminProfDeptInput').value      = '';
            document.getElementById('adminProfMsg').style.color      = 'var(--warn)';
            document.getElementById('adminProfMsg').textContent      = 'No profile yet — set your department and save';
            return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        document.getElementById('adminProfUsername').textContent = data.username || '—';
        document.getElementById('adminProfRole').textContent     = data.role     || '—';
        document.getElementById('adminProfStatus').textContent   = data.status   || '—';
        document.getElementById('adminProfName').textContent     = loggedInUser  || '—';
        document.getElementById('adminProfDeptInput').value      = data.department || '';
        document.getElementById('adminProfMsg').textContent      = '';
    } catch(e) {
        document.getElementById('adminProfUsername').textContent = loggedInUser || '—';
        document.getElementById('adminProfRole').textContent     = loggedInRole || '—';
        document.getElementById('adminProfMsg').style.color      = 'var(--pink)';
        document.getElementById('adminProfMsg').textContent      = '⚠ Could not refresh from server';
    }
}

async function saveAdminProfile() {
    const department = document.getElementById('adminProfDeptInput').value.trim();
    const msg = document.getElementById('adminProfMsg');
    if (!department) {
        msg.style.color = 'var(--pink)'; msg.textContent = 'Department cannot be empty'; return;
    }
    try {
        const res = await fetch(`${AUTH_BASE}/profile`, {
            method: 'POST',
            headers: authHeaders({'Content-Type':'application/json'}),
            body: JSON.stringify({ username: loggedInUser, section: department })
        });
        if (!res.ok) throw new Error();
        showToast('Department saved!');
        addLog('Updated admin profile');
        loadAdminProfile();
    } catch(e) {
        msg.style.color = 'var(--pink)'; msg.textContent = '⚠ Failed to save. Try again.';
    }
}

    function enterDashboard(isDemo){
  document.getElementById('loginPage').style.display='none';
  document.getElementById('mainPage').style.display='block';
  allStudents=[...DEMO_STUDENTS];
  initTopbar();
  updateCount();
  _showSection('dashSection',document.querySelector('.nav-btn'));
  loadDashboard();
  addLog('Admin logged in'+(isDemo?' (demo)':''));
  if(isDemo) showToast('Offline demo mode','warn');
  checkBackend();
if(loggedInUser === 'superadmin') {
  document.getElementById('mainPage').style.display = 'none';
  document.getElementById('superAdminPage').style.display = 'flex';
  loadSuperAdminPage();
  return;
}
  // LOAD COMPLETION MAP ON STARTUP
  fetch(`${BASE_URL}/StuentAssignment/all`, {headers:authHeaders()})
    .then(r => r.json())
    .then(records => {
      completionMap = {};
      records.forEach(r => {
        if(!completionMap[r.studentId]) completionMap[r.studentId] = {};
        completionMap[r.studentId][r.assignmentId] = r.status;
      });
    })
    .catch(()=>{});
}
async function enterStudentFlow() {
  document.getElementById('loginPage').style.display = 'none';

  try {
    // Always fetch fresh profile from server
    const res = await fetch(`${AUTH_BASE}/profile/${loggedInUser}`, {headers: authHeaders()});
    if(res.ok) {
      const profile = await res.json();
      localStorage.setItem('studentProfile', JSON.stringify(profile));

      // Also fetch fresh marks and sync to localStorage
      try {
        const marksRes = await fetch('http://localhost:8081/student/my-marks', {headers: authHeaders()});
        if(marksRes.ok) {
          const marks = await marksRes.json();
          localStorage.setItem('studentMarks', JSON.stringify(marks));
        } else {
          localStorage.removeItem('studentMarks');
        }
      } catch(e) { localStorage.removeItem('studentMarks'); }

      enterStudentPortal(profile);
    } else {
      // No profile yet — check localStorage as fallback
      const cached = localStorage.getItem('studentProfile');
      if(cached) {
        // Profile exists locally but not on server — clear and re-setup
        localStorage.removeItem('studentProfile');
      }
      showProfileSetup();
    }
  } catch(e) {
    // Network error — use cached profile if available
    const cached = localStorage.getItem('studentProfile');
    if(cached) {
      enterStudentPortal(JSON.parse(cached));
    } else {
      showProfileSetup();
    }
  }
}
function showProfileSetup() {
  document.getElementById('profileSetupPage').style.display = 'flex';
}

async function submitProfile() {
  const fullName   = document.getElementById('psFullName').value.trim();
  const rollNumber = document.getElementById('psRollNumber').value.trim();
  const section    = document.getElementById('psSection').value.trim().toUpperCase();
  const msg        = document.getElementById('psMsg');

  if(!fullName || !rollNumber || !section) {
    msg.style.color = 'var(--pink)'; msg.textContent = 'All fields required'; return;
  }

  try {
    const res = await fetch(`${AUTH_BASE}/profile`, {
      method: 'POST',
      headers: authHeaders({'Content-Type':'application/json'}),
      body: JSON.stringify({ username: loggedInUser, fullName, rollNumber, section })
    });
    if(!res.ok) throw new Error();
    const profile = await res.json();
    localStorage.setItem('studentProfile', JSON.stringify(profile));
    document.getElementById('profileSetupPage').style.display = 'none';
    enterStudentPortal(profile);
  } catch(e) {
    msg.style.color = 'var(--pink)'; msg.textContent = '⚠ Failed to save. Try again.';
  }
}

async function enterStudentPortal(profile) {
  document.getElementById('profileSetupPage').style.display = 'none';
  document.getElementById('studentPortalPage').style.display = 'block';

  // Set greeting
  const h = new Date().getHours();
  document.getElementById('spGreeting').textContent =
    (h<12?'Good morning':h<17?'Good afternoon':'Good evening') + ', ' + profile.fullName + ' 👋';
  document.getElementById('spSub').textContent =
    `Section ${profile.section} · Roll No. ${profile.rollNumber}`;
    document.getElementById('spDate').textContent = new Date().toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
document.getElementById('spSectionBadge').textContent = 'Section ' + profile.section;

  // Load data
  await loadStudentAssignments(profile);
  await loadStudentMarks(profile);
}
async function loadStudentAssignments(profile) {
  try {
    const res = await fetch(`http://localhost:8081/student/my-assignments`, {headers: authHeaders()});
    if(!res.ok) throw new Error();
    const data = await res.json();

    // Normalize
    const assigns = data.map(a => ({
      id: a.id,
      title: a.assignments || a.title,
      subject: a.subjects || a.subject || '—',
      due: a.dueDate ? a.dueDate.split('T')[0] : null,
      section: a.section || '—'
    }));

    // Load my completion statuses
    const compRes = await fetch(`http://localhost:8081/student/my-completion`, {headers: authHeaders()});
    const compRecords = compRes.ok ? await compRes.json() : [];
    const myMap = {};
    compRecords.forEach(r => myMap[r.assignmentId] = r.status);

    renderStudentAssignments(assigns, myMap);
  } catch(e) {
    document.getElementById('spAssignList').innerHTML =
      `<div class="empty"><div class="eico">📝</div><p>Could not load assignments</p></div>`;
  }
}

function renderStudentAssignments(assigns, myMap) {
  let done=0, pending=0, missed=0;
  assigns.forEach(a => {
    const s = myMap[a.id] || 'pending';
    if(s==='completed') done++;
    else if(s==='incompleted') missed++;
    else pending++;
  });

  document.getElementById('spDone').textContent   = done;
  document.getElementById('spPending').textContent = pending;
  document.getElementById('spMissed').textContent  = missed;

  if(!assigns.length) {
    document.getElementById('spAssignList').innerHTML =
      `<div class="empty"><div class="eico">📝</div><p>No assignments yet</p></div>`;
    return;
  }

  document.getElementById('spAssignList').innerHTML = assigns.map(a => {
    const status  = myMap[a.id] || 'pending';
    const icon    = status==='completed'?'✓':status==='incompleted'?'✕':'⏳';
    const color   = status==='completed'?'var(--green)':status==='incompleted'?'var(--pink)':'var(--yellow)';
    const bg      = status==='completed'?'rgba(34,211,122,.08)':status==='incompleted'?'rgba(255,45,120,.08)':'rgba(255,228,77,.06)';
    const border  = status==='completed'?'rgba(34,211,122,.2)':status==='incompleted'?'rgba(255,45,120,.2)':'rgba(255,228,77,.15)';
   const overdue = isOverdue(a.due) && status !== 'completed';
    return `<div style="display:flex;align-items:center;justify-content:space-between;
        padding:12px 16px;background:${bg};border:1px solid ${border};border-radius:11px;
        cursor:pointer;transition:all .2s;" onclick="studentToggle(${a.id},this)"
        data-assign-id="${a.id}" data-status="${status}">
      <div>
        <div style="font-size:13px;font-weight:600;">${a.title}
          ${overdue?'<span style="font-size:10px;color:var(--pink);margin-left:6px">⚠ Overdue</span>':''}
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">
          ${a.subject} · ${a.due ? new Date(a.due).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : 'No due date'}
        </div>
      </div>
      <div style="width:30px;height:30px;border-radius:8px;background:${color};
          display:flex;align-items:center;justify-content:center;font-size:14px;
          font-weight:700;color:#000;flex-shrink:0;">${icon}</div>
    </div>`;
  }).join('');
}

//async function studentToggle(assignId, el) {
//  const cur  = el.dataset.status || 'pending';
//  const next = cur==='pending'?'completed':cur==='completed'?'incompleted':'pending';
//  try {
//    await fetch(`http://localhost:8081/student/toggle/${assignId}?status=${next}`, {
//      method: 'PATCH', headers: authHeaders()
//    });
//    // Reload
//    const profile = JSON.parse(localStorage.getItem('studentProfile'));
//    await loadStudentAssignments(profile);
//  } catch(e) { showToast('Update failed','warn'); }
//}

async function loadStudentMarks(profile) {
  try {
    // Always fetch fresh from server — never use stale cache
    const res = await fetch('http://localhost:8081/student/my-marks', {headers: authHeaders()});
    if(!res.ok) {
      document.getElementById('spMarks').textContent  = '0/100';
      document.getElementById('spGrade').textContent  = 'F';
       document.getElementById('spGrade').style.color  = gradeColor('F');
      document.getElementById('spResult').textContent = 'Pending';
      document.getElementById('spResult').className   = 'badge gc';
      return;
    }
    const s = await res.json();

    // Update localStorage with fresh data
    localStorage.setItem('studentMarks', JSON.stringify(s));

    const g = getGrade(s.marks);
    document.getElementById('spMarks').textContent  = s.marks + '/100';
    document.getElementById('spGrade').textContent  = g;
    document.getElementById('spGrade').style.color  = gradeColor(g);
    document.getElementById('spResult').textContent = s.result || '—';
    document.getElementById('spResult').className   = 'badge ' + ((s.result||'').toLowerCase()==='pass'?'bp':'bf');
  } catch(e) {
    document.getElementById('spMarks').textContent = '—';
  }
}
/* ── TOPBAR ···  MENU ── */
    function toggleTopbarMenu(e){
      e.stopPropagation();
      document.getElementById('topbarMenu').classList.toggle('open');
    }
    function closeTopbarMenu(){
      document.getElementById('topbarMenu').classList.remove('open');
    }
    document.addEventListener('click', function(e){
      const wrap = document.getElementById('topbarMenuWrap');
      if(wrap && !wrap.contains(e.target)) closeTopbarMenu();
    });
  function logout(){
  localStorage.removeItem('jwt');
  localStorage.removeItem('userRole');
  localStorage.removeItem('studentProfile');
  localStorage.removeItem('studentMarks');
  authToken=null;
  addLog('Logged out');
  setTimeout(()=>location.reload(),200);
}

    /* ── SECTION ROUTING ── */
    function _showSection(id,btn){
      document.querySelectorAll('.section').forEach(c=>c.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      if(btn) btn.classList.add('active');
    }
    function showSection(id,btn){
      _showSection(id,btn);
      if(id==='dashSection')       loadDashboard();
      if(id==='analyticsSection')  loadAnalytics();
      if(id==='viewSection')       getStudents();
      if(id==='topSection')        getStudents().then(renderTop);
      if(id==='completionSection') refreshCompletion();
      if(id==='gradeSection')      buildScaleGrid();
      if(id==='reportSection') loadAssignmentReport();
      if(id==='dupSection')        findDuplicates();
      if(id==='pendingSection') loadPending();
       if(id==='profileSection')    loadAdminProfile();
       if(id==='searchSection') getStudents();
         if(id==='assignmentsPage') { loadAssignments(); loadExpiredAssignments(); }

    }

    /* ── DASHBOARD HOME ── */
    async function loadDashboard(){
      await getStudents();
      const data=allStudents;
      const passed=data.filter(s=>(s.result||'').toLowerCase()==='pass');
      const failed=data.filter(s=>(s.result||'').toLowerCase()==='fail');
      const avg=data.length?Math.round(data.reduce((a,s)=>a+parseInt(s.marks),0)/data.length):0;

      document.getElementById('dashTotal').textContent=data.length;
      document.getElementById('dashPassed').textContent=passed.length;
      document.getElementById('dashFailed').textContent=failed.length;
      document.getElementById('dashAvg').textContent=avg;
      document.getElementById('dashPassRate').textContent=data.length?Math.round(passed.length/data.length*100)+'% pass rate':'';
      document.getElementById('dashFailNote').textContent=failed.length>0?'needs attention':'';
      const active=data.filter(s=>(s.status||'').toLowerCase()==='active').length;
      document.getElementById('dashActive').textContent=active;
document.getElementById('dashInactive').textContent=(data.length-active)+' inactive →';

      buildDashGradeDist(data);
      buildDashDonut(passed.length,failed.length);
    }

    function buildDashGradeDist(data){
      const grades=['A+','A','B','C','D','F'];
      const cols={'A+':'var(--green)',A:'var(--cyan)',B:'var(--purple)',C:'var(--yellow)',D:'#ff9100',F:'var(--pink)'};
      const counts={};
      grades.forEach(g=>counts[g]=0);
      data.forEach(s=>counts[getGrade(s.marks)]++);
      const max=Math.max(...Object.values(counts),1);
      document.getElementById('dashGradeDist').innerHTML=grades.map(g=>`
        <div class="pr-row">
          <span class="pr-lbl" style="color:${cols[g]}">${g}</span>
          <div class="pr-bg"><div class="pr-fill" style="width:${counts[g]/max*100}%;background:${cols[g]};"></div></div>
          <span class="pr-val" style="color:${cols[g]}">${counts[g]}</span>
        </div>`).join('');
    }
async function loadAssignments(){
  try{
    const res = await fetch(`${BASE_URL}/assignments`, {headers:authHeaders()});
    if(!res.ok) throw new Error();
    const data = await res.json();
    assignments = data.map(a=>({
      id: a.id,
      title: a.assignments || a.title,
      description: a.description,
      subject: a.subjects || a.subject || '—',
      due: a.dueDate ? a.dueDate.split('T')[0] : null,
       section: a.section || '—'
    }));
  }catch(e){
    // keep existing local assignments
  }
  updateAssignCount();
  renderAssignments();
  loadAssignmentReport();
}
let expiredAssignments = []; // ← ADD near top with other globals (e.g. next to `let assignments = [];`)

async function loadExpiredAssignments(){
  try{
    const res = await fetch(`${BASE_URL}/assignments/expired`, {headers:authHeaders()});
    if(!res.ok) throw new Error();
    const data = await res.json();
    expiredAssignments = data.map(a=>({
      id: a.id,
      title: a.assignments || a.title,
      subject: a.subjects || a.subject || '—',
      due: a.dueDate ? a.dueDate.split('T')[0] : null,
      section: a.section || '—',
      expired: true
    }));
    renderExpiredAssignments(expiredAssignments);
  }catch(e){
    document.getElementById('expiredAssignmentTable').innerHTML =
      `<tr><td colspan="5"><div class="empty"><div class="eico">⏰</div><p>Failed to load</p></div></td></tr>`;
  }
}
function allTrackedAssignments(){
  return [...assignments, ...expiredAssignments];
}
function renderExpiredAssignments(data){
  const tb = document.getElementById('expiredAssignmentTable');
  if(!data.length){
    tb.innerHTML = `<tr><td colspan="6"><div class="empty"><div class="eico">⏰</div><p>No expired assignments</p></div></td></tr>`;
    return;
  }
  tb.innerHTML = data.map(a => `<tr>
    <td><strong>#${a.id}</strong></td>
    <td><strong style="cursor:pointer;color:var(--cyan)" onclick="showAssignmentDetail(${a.id})">${a.title}</strong> <span class="badge bf">Expired</span></td>
    <td>${a.subject}</td>
    <td>${a.due ? new Date(a.due).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}</td>
    <td>${a.section}</td>
    <td style="display:flex;gap:6px;">
      <button class="btn btn-edit btn-sm" onclick="openExpiredAssignEdit(${a.id})">✎ Edit</button>
      <button class="btn btn-danger btn-sm" onclick="deleteExpiredAssignment(${a.id})">🗑 Delete</button>
    </td>
  </tr>`).join('');
}

function renderAssignments(){
  const search = (document.getElementById('assignSearch')?.value||'').toLowerCase();
  const statusF = document.getElementById('assignStatusFilter')?.value||'all';

  const loggedSection = null; // for admin: show all
let filtered = assignments.filter(a=>{
    if(search && !a.title.toLowerCase().includes(search)) return false;
    if(loggedSection && a.section !== 'ALL' && a.section !== loggedSection) return false;
    return true;
});

  const tb = document.getElementById('assignmentTable');
  if(!filtered.length){
    tb.innerHTML=`<tr><td colspan="7"><div class="empty"><div class="eico">📝</div><p>No assignments found</p></div></td></tr>`;
    return;
  }

  tb.innerHTML = filtered.map(a=>{
    const overdue = isOverdue(a.due);
    return `<tr>
      <td><strong>#${a.id}</strong></td>
     <td><strong style="cursor:pointer;color:var(--cyan)" onclick="showAssignmentDetail(${a.id})">${a.title}</strong>${overdue?'<span class="overdue-flag">⚠ Overdue</span>':''}</td>
      <td>${a.subject||'—'}</td>
      <td style="font-size:12px;color:var(--muted)">${a.description||'—'}</td>
      <td>${a.due ? new Date(a.due).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}</td>
      <td>${a.section || '—'}</td>
      <td>
        <button class="btn btn-edit btn-sm" onclick="openAssignEdit(${a.id})">✎ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAssignment(${a.id})">🗑</button>
      </td>
    </tr>`;
  }).join('');
}
function renderStudentAssignmentTable(data){
  const tb = document.getElementById('assignmentTable');
  if(!data || !data.length){
    tb.innerHTML=`<tr><td colspan="7"><div class="empty"><div class="eico">📝</div><p>No results</p></div></td></tr>`;
    return;
  }
  tb.innerHTML = data.map(s=>`<tr>
    <td><strong>#${s.id}</strong></td>
    <td><strong>${s.name||'—'}</strong></td>
    <td>${s.section||'—'}</td>
    <td><span class="badge bp">✓ ${s.completed||0}</span></td>
    <td><span class="badge gc">⏳ ${s.pending||0}</span></td>
    <td><span class="badge bf">✕ ${s.incompleted||0}</span></td>
    <td>${s.total||0}</td>
  </tr>`).join('');
}
    function buildDashDonut(pass,fail){
      if(dashDChart) dashDChart.destroy();
      const ctx=document.getElementById('dashDonut');
      if(!ctx) return;
      dashDChart=new Chart(ctx,{
        type:'doughnut',
        data:{labels:['Passed','Failed'],datasets:[{data:[pass,fail],backgroundColor:['rgba(34,211,122,.25)','rgba(255,45,120,.25)'],borderColor:['rgba(34,211,122,.9)','rgba(255,45,120,.9)'],borderWidth:2,hoverOffset:6}]},
        options:{responsive:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:'rgba(240,238,255,.45)',font:{family:'DM Sans',size:11},padding:10}}}}
      });
    }

    /* ── AUTO RESULT ── */
    function autoResult(){
      const m=parseInt(document.getElementById('marks').value);
      if(!isNaN(m)){
        document.getElementById('result').value=m>=33?'pass':'fail';
        const g=getGrade(m);
        document.getElementById('gradePreview').innerHTML=
          `<span style="color:${gradeColor(g)};font-family:'Syne',sans-serif;font-weight:800;font-size:16px">${g}</span>&nbsp;`+
          `<span style="color:var(--muted);font-size:12px">${gradeDesc(g)}</span>`;
      }
    }
    function editAutoRes(){ const m=parseInt(document.getElementById('editMarks').value); if(!isNaN(m)) document.getElementById('editResult').value=m>=33?'pass':'fail'; }
    function clearForm(){ ['name','marks','section','subject','rollNumber','Status','student_email'].forEach(id=>document.getElementById(id).value=''); document.getElementById('result').value=''; document.getElementById('gradePreview').innerHTML='Grade preview here'; }

    /* ── ADD STUDENT ── */
   async function addStudent(){
  const name=document.getElementById('name').value.trim();
  const marks=document.getElementById('marks').value;
  const section=document.getElementById('section').value.trim();
  const status=document.getElementById('Status').value.trim();
  const subject=document.getElementById('subject').value.trim();
  const rollNumber=document.getElementById('rollNumber').value.trim(); // ← ADD
  const email=document.getElementById('student_email').value.trim();
  let result=document.getElementById('result').value;
if(!name||!marks||!section||!document.getElementById('rollNumber').value.trim() ||!email){
    showToast('Fill all required fields including Roll Number','warn'); return;
}
  if(!result) result=parseInt(marks)>=33?'pass':'fail';
const username = document.getElementById('username_student')?.value.trim() || null;
const payload = {name, marks:parseInt(marks), section, result, status:status||'Active', subject:subject||'', rollNumber:rollNumber||null, username,email};
  try{
    const res=await fetch(`${BASE_URL}/add`,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(payload)});
    if(!res.ok) throw new Error();
    const saved=await res.json();
    showToast(`${saved.name||name} added!`);
    addLog(`Added: ${saved.name||name}`);
    clearForm(); getStudents();
  }catch(e){
    const newId=allStudents.length?Math.max(...allStudents.map(s=>s.id))+1:1;
    allStudents.push({id:newId,...payload});
    showToast(`${name} added (demo)!`);
    addLog(`Added: ${name}`);
    clearForm(); updateCount();
  }
}

    /* ── GET STUDENTS ── */
    async function getStudents(){
      try{
        const res=await fetch(`${BASE_URL}/all`,{headers:authHeaders(),signal:AbortSignal.timeout(4000)});
        if(!res.ok) throw new Error();
        const data=await res.json();
        setConnStatus(true);
        if(Array.isArray(data)&&data.length>0) allStudents=data;
        else if(Array.isArray(data)&&data.length===0) allStudents=[];
        else throw new Error();
      }catch(e){ setConnStatus(false); if(allStudents.length===0) allStudents=[...DEMO_STUDENTS]; }
      populateFilters();
      displayedStudents=[...allStudents];
      applyFilters();
      updateCount();
      return allStudents;
    }

    function updateCount(){ document.getElementById('sideCount').innerText=allStudents.length; }

    function populateFilters(){
      const secs=[...new Set(allStudents.map(s=>s.section))].sort();
      ['sectionFilter','topSection2'].forEach(id=>{
        const sel=document.getElementById(id);
        if(!sel) return;
        const cur=sel.value;
        sel.innerHTML='<option value="all">All Sections</option>';
        secs.forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent=`Section ${s}`; sel.appendChild(o); });
        if(cur) sel.value=cur;
      });
    }

async function filterByStatus(status){
  try{
    const res = await fetch(`${BASE_URL}/allStatus/${status}`, {headers:authHeaders()});
    if(!res.ok) throw new Error();
    allStudents = await res.json();
    applyFilters();
  }catch(e){ showToast('Filter failed','warn'); }
}

async function filterAssignments(){
  const status = document.getElementById('assignStatusFilter').value || 'all';
  try{
    const res = await fetch(`${BASE_URL}/assignments/list/${status}`, {headers:authHeaders()});
    if(!res.ok) throw new Error();
    const data = await res.json();
    renderStudentAssignmentTable(data);
  }catch(e){ showToast('Failed to filter','warn'); }
}
    /* ── FILTERS ── */
  function getStudentAssignSummary(studentId){
        const all = allTrackedAssignments();
        if(!all.length) return{done:0,pending:0,missed:0,total:0,pct:0};
        const map=completionMap[studentId]||{};
        let done=0,missed=0;
        all.forEach(a=>{const st=map[a.id]||'pending'; if(st==='completed')done++; else if(st==='incompleted')missed++; });
        const total=all.length, pending=total-done-missed, pct=total?Math.round(done/total*100):0;
        return{done,pending,missed,total,pct};
      }
    function applyFilters(){
      const srch=document.getElementById('searchFilter')?.value.toLowerCase()||'';
      const res=document.getElementById('resultFilter')?.value||'all';
      const sec=document.getElementById('sectionFilter')?.value||'all';

  console.log('Filters:', srch, res, sec);
  console.log('allStudents count:', allStudents.length)

      displayedStudents=allStudents.filter(s=>{
      if(!(s.name||'').toLowerCase().includes(srch)) return false;
        if(res!=='all'&&(s.result||'').toLowerCase()!==res) return false;
        if(sec!=='all'&&s.section!==sec) return false;
        return true;
      });
      const sub=document.getElementById('viewSub');
      if(sub) sub.textContent=`Showing ${displayedStudents.length} of ${allStudents.length} students`;
      sortAndRender();
    }

    function sortBy(field){
      currentSort=field;
      document.querySelectorAll('.sort-btn').forEach(b=>b.classList.remove('active'));
      const el=document.getElementById('sort'+field.charAt(0).toUpperCase()+field.slice(1));
      if(el) el.classList.add('active');
      sortAndRender();
    }

    function sortAndRender(){
      let sorted=[...displayedStudents];
      if(currentSort==='id') sorted.sort((a,b)=>a.id-b.id);
      else if(currentSort==='name') sorted.sort((a,b)=>a.name.localeCompare(b.name));
      else if(currentSort==='marks') sorted.sort((a,b)=>b.marks-a.marks);
      else if(currentSort==='grade') sorted.sort((a,b)=>getGrade(a.marks).localeCompare(getGrade(b.marks)));
      else if(currentSort==='assign') sorted.sort((a,b)=>getStudentAssignSummary(b.id).pct-getStudentAssignSummary(a.id).pct);
      renderTable(sorted);
    }

function renderTable(data) {
  if (!data || !data.length) {
    document.getElementById('studentTable').innerHTML =
      `<tr><td colspan="7"><div class="empty"><div class="eico">📋</div><p>No students found</p></div></td></tr>`;
    return;
  }
  document.getElementById('studentTable').innerHTML = data.map(s => {
    const g = getGrade(s.marks);
return `<tr>
  <td><span style="color:var(--muted);font-size:11px">#</span><strong>${s.id}</strong></td>
  <td><strong>${s.name||'—'}</strong></td>
  <td><span style="color:var(--muted);font-size:12px">${s.rollNumber||'—'}</span></td>
  <td><strong>${s.marks}</strong></td>
<td><span class="badge ${gradeCls(g)}">${g}</span></td>
  <td>${s.section}</td>
<td><span class="badge ${(s.result||'').toLowerCase()==='pass'?'bp':'bf'}">${s.result||'—'}</span></td>
  <td><span class="badge ${(s.status||'').toLowerCase()==='active'?'bp':'bf'}">${s.status||'—'}</span></td>
  <td style="display:flex;gap:6px;">
    <button class="btn btn-edit" onclick="openEdit(${s.id})">✎ Edit</button>
    <button class="btn btn-danger" onclick="deleteStudent(${s.id})">🗑</button>
  </td>
</tr>`;
  }).join('');
}

    /* ── DELETE STUDENT ── */
    async function deleteStudent(id){
      const student=allStudents.find(s=>s.id===id);
      try{
        const res=await fetch(`${BASE_URL}/delete/${id}`,{method:'DELETE',headers:authHeaders()});
        if(!res.ok) throw new Error();
        showToast('Student removed'); addLog(`Deleted: ${student?.name||id}`); getStudents();
      }catch(e){
        allStudents=allStudents.filter(s=>s.id!==id); delete completionMap[id];
        showToast('Removed (demo)'); addLog(`Deleted: ${student?.name||id}`);
        populateFilters(); applyFilters(); updateCount();
      }
    }

    function confirmDeleteAll(){
      openConfirmModal('🗑 Delete All Students',`This will permanently remove all ${allStudents.length} students.`,async()=>{
        try{ const res=await fetch(`${BASE_URL}/allDelete`,{method:'DELETE',headers:authHeaders()}); if(!res.ok) throw new Error(); showToast('All students deleted'); }
        catch(e){ showToast('Deleted locally (demo)','warn'); }
        allStudents=[]; completionMap={}; populateFilters(); applyFilters(); updateCount(); addLog('Deleted ALL students');
      });
    }

    /* ── SEARCH ── */
    async function searchStudent() {
    const name = document.getElementById('searchName').value.trim();
    const box = document.getElementById('singleStudent');

    if (!name) {
        showToast('Enter a student name', 'warn');
        return;
    }

    try {
        const res = await fetch(
            `${BASE_URL}/name?name=${encodeURIComponent(name)}`,
            {
                headers: authHeaders()
            }
        );

        if (res.ok) {
            const student = await res.json();
            renderSearchResult(student, box);
        } else {
            const student = allStudents.find(
                s => s.name.toLowerCase() === name.toLowerCase()
            );

            student
                ? renderSearchResult(student, box)
                : notFound(box, name);
        }
    } catch (e) {
        const student = allStudents.find(
            s => s.name.toLowerCase() === name.toLowerCase()
        );

        student
            ? renderSearchResult(student, box)
            : notFound(box, name);
    }
}

function notFound(box, name) {
    box.innerHTML = `
        <div class="errc">
            ⚠️ No student found with name <strong>${name}</strong>
        </div>
    `;
}
function liveSearchStudents() {
    const query = document.getElementById('searchName').value.trim().toLowerCase();
    const box = document.getElementById('singleStudent');

    if (!query) {
        box.innerHTML = '';
        return;
    }

    const matches = allStudents.filter(s =>
        (s.name || '').toLowerCase().includes(query)
    );

    if (!matches.length) {
        notFound(box, document.getElementById('searchName').value.trim());
        return;
    }

    renderSearchResults(matches, box);
}

function renderSearchResults(students, box) {
    box.innerHTML = `
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">
        ${students.length} match${students.length > 1 ? 'es' : ''} found
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${students.map(s => {
          const g = getGrade(s.marks);
          return `
          <div class="srcard" style="cursor:pointer;" onclick="document.getElementById('searchName').value='${s.name.replace(/'/g,"\\'")}';liveSearchStudents();">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
              <div>
                <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:800;">${s.name}</div>
                <div style="font-size:12px;color:var(--muted);margin-top:2px;">#${s.id} · Section ${s.section}</div>
              </div>
              <span class="badge ${gradeCls(g)}" style="font-size:12px;padding:5px 12px;">${g}</span>
            </div>
            <div class="rgrid">
              <div class="ri"><div class="rl">Marks</div><div class="rv">${s.marks}/100</div></div>
              <div class="ri"><div class="rl">Roll No</div><div class="rv">${s.rollNumber || '—'}</div></div>
              <div class="ri"><div class="rl">Result</div><div class="rv" style="color:${(s.result||'').toLowerCase()==='pass'?'var(--cyan)':'var(--pink)'}">${s.result||'—'}</div></div>
              <div class="ri"><div class="rl">Status</div><div class="rv">${s.status||'—'}</div></div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
}

    /* ── EDIT MODAL ── */
    function openEdit(id){
      const s=allStudents.find(x=>x.id===id); if(!s) return;
      document.getElementById('editId').value=s.id;
      document.getElementById('editName').value=s.name;
      document.getElementById('editMarks').value=s.marks;
      document.getElementById('editSection').value=s.section;
      document.getElementById('editStudentEmail').value=s.email||'';
      document.getElementById('editResult').value=s.result||'pass';
      document.getElementById('editStatus').value= s.status || 'Active';
      document.getElementById('editModal').classList.add('open');
    }
    function closeModal(){ document.getElementById('editModal').classList.remove('open'); }
    document.getElementById('editModal').addEventListener('click',e=>{ if(e.target===e.currentTarget) closeModal(); });

async function saveEdit() {
  const id = parseInt(document.getElementById('editId').value);

  const name = document.getElementById('editName').value.trim();
  const marks = parseInt(document.getElementById('editMarks').value);
  const section = document.getElementById('editSection').value.trim();
  const email = document.getElementById('editStudentEmail').value.trim();
  const result = document.getElementById('editResult').value;
  const status = document.getElementById('editStatus').value;

  if (!name || isNaN(marks) || !section) {
    showToast('Fill all fields', 'warn');
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/update/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name,
        marks,
        section,
        result,
        status
      })
    });

    if (!res.ok) throw new Error();

    const updatedStudent = await res.json().catch(() => null);

    const idx = allStudents.findIndex(s => s.id === id);

    if (idx > -1) {
      allStudents[idx] = updatedStudent || {
        ...allStudents[idx],
        name,
        marks,
        section,
        result,
        status
      };
    }

    showToast('Student updated!');
    getStudents();

  } catch (e) {
    const idx = allStudents.findIndex(s => s.id === id);

    if (idx > -1) {
      allStudents[idx] = {
        ...allStudents[idx],
        name,
        marks,
        section,
        result,
        status
      };
    }

    showToast('Updated (demo mode)!');
    applyFilters();
  }

  addLog(`Edited: ${name}`);
  closeModal();
}

    /* ── EXPORT ── */
    function exportCSV(){
      if(!allStudents.length){ showToast('No data to export','warn'); return; }
      const rows=allStudents.map(s=>[s.id,`"${s.name}"`,s.marks,getGrade(s.marks),s.section,s.result,s.status||'',s.subject||'']);
      const csv=[['ID','Name','Marks','Grade','Section','Result','Status','Subject'],...rows].map(r=>r.join(',')).join('\n');
      dl('students_export.csv','text/csv',csv); showToast('CSV exported!'); addLog('Exported CSV');
    }
    function exportJSON(){
      if(!allStudents.length){ showToast('No data to export','warn'); return; }
      dl('students_export.json','application/json',JSON.stringify(allStudents.map(s=>({...s,grade:getGrade(s.marks)})),null,2));
      showToast('JSON exported!'); addLog('Exported JSON');
    }
    function dl(name,type,content){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); }


function exportAssignmentsCSV(){
      if(!assignments.length){ showToast('No assignments to export','warn'); return; }
      const rows=assignments.map(a=>[a.id,`"${a.title}"`,`"${a.subject||''}"`,`"${(a.description||'').replace(/"/g,'""')}"`,a.due||'',a.section||'']);
      const csv=[['ID','Title','Subject','Description','Due Date','Section'],...rows].map(r=>r.join(',')).join('\n');
      dl('assignments_export.csv','text/csv',csv);
      showToast('Assignments exported!');
      addLog('Exported Assignments CSV');
    }
    /* ── ANALYTICS ── */
    async function loadAnalytics(){
      await getStudents();
      const data=allStudents;
      const passed=data.filter(s=>(s.result||'').toLowerCase()==='pass');
      const failed=data.filter(s=>(s.result||'').toLowerCase()==='fail');
      const avg=data.length?Math.round(data.reduce((a,s)=>a+parseInt(s.marks),0)/data.length):0;
      animCount('totalStudents',data.length); animCount('passedStudents',passed.length);
      animCount('failedStudents',failed.length); animCount('avgMarks',avg);
      buildBarChart(passed.length,failed.length);
      buildDonutChart(passed.length,failed.length);
      buildGradeDist(data); renderFilterTable(data);
    }

    function animCount(id,target){
      const el=document.getElementById(id); let cur=0;
      const step=Math.max(1,Math.ceil(target/30));
      const iv=setInterval(()=>{ cur=Math.min(cur+step,target); el.innerText=cur; if(cur>=target) clearInterval(iv); },40);
    }

    function buildBarChart(pass,fail){
      if(bChart) bChart.destroy();
      bChart=new Chart(document.getElementById('barChart'),{
        type:'bar',
        data:{labels:['Passed','Failed'],datasets:[{label:'Students',data:[pass,fail],backgroundColor:['rgba(0,245,212,.2)','rgba(255,45,120,.2)'],borderColor:['rgba(0,245,212,.8)','rgba(255,45,120,.8)'],borderWidth:2,borderRadius:8,borderSkipped:false}]},
        options:{responsive:true,plugins:{legend:{labels:{color:'rgba(240,238,255,.4)',font:{family:'DM Sans',size:11}}}},scales:{x:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'rgba(240,238,255,.4)',font:{family:'DM Sans'}}},y:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'rgba(240,238,255,.4)',font:{family:'DM Sans'}},beginAtZero:true}}}
      });
    }
    function buildDonutChart(pass,fail){
      if(dChart) dChart.destroy();
      dChart=new Chart(document.getElementById('donutChart'),{
        type:'doughnut',
        data:{labels:['Passed','Failed'],datasets:[{data:[pass,fail],backgroundColor:['rgba(0,245,212,.22)','rgba(255,45,120,.22)'],borderColor:['rgba(0,245,212,.9)','rgba(255,45,120,.9)'],borderWidth:2,hoverOffset:6}]},
        options:{responsive:true,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'rgba(240,238,255,.4)',font:{family:'DM Sans',size:11},padding:12}}}}
      });
    }
    function buildGradeDist(data){
      const grades=['A+','A','B','C','D','F'];
      const cols={'A+':'var(--green)',A:'var(--cyan)',B:'var(--purple)',C:'var(--yellow)',D:'#ff9100',F:'var(--pink)'};
      const counts={}; grades.forEach(g=>counts[g]=0); data.forEach(s=>counts[getGrade(s.marks)]++);
      const max=Math.max(...Object.values(counts),1);
      document.getElementById('gradeDist').innerHTML=grades.map(g=>`
        <div class="pr-row">
          <span class="pr-lbl" style="color:${cols[g]}">${g}</span>
          <div class="pr-bg"><div class="pr-fill" style="width:${counts[g]/max*100}%;background:${cols[g]};"></div></div>
          <span class="pr-val" style="color:${cols[g]}">${counts[g]}</span>
        </div>`).join('');
    }
    function filterStudents(){
      const f=document.getElementById('filterSelect').value;
      const filtered=f==='pass'?allStudents.filter(s=>(s.result||'').toLowerCase()==='pass'):f==='fail'?allStudents.filter(s=>(s.result||'').toLowerCase()==='fail'):allStudents;
      renderFilterTable(filtered);
    }
    function renderFilterTable(data){
      if(!data.length){ document.getElementById('filterTable').innerHTML=`<tr><td colspan="6"><div class="empty"><div class="eico">📊</div><p>No data</p></div></td></tr>`; return; }
      document.getElementById('filterTable').innerHTML=data.map(s=>{ const g=getGrade(s.marks); return`<tr><td><span style="color:var(--muted);font-size:11px">#</span><strong>${s.id}</strong></td><td><strong>${s.name}</strong></td><td>${s.marks}</td><td><span class="badge ${gradeCls(g)}">${g}</span></td><td>${s.section}</td><td><span class="badge ${(s.result||'').toLowerCase()==='pass'?'bp':'bf'}">${s.result||'—'}</span></td></tr>`; }).join('');
    }

    /* ── TOP PERFORMERS ── */
    function renderTop(){
      const count=parseInt(document.getElementById('topCount').value);
      const sec=document.getElementById('topSection2').value;
      const medals=['🥇','🥈','🥉'];
      let filtered=[...allStudents];
      if(sec!=='all') filtered=filtered.filter(s=>s.section===sec);
      const top=filtered.sort((a,b)=>b.marks-a.marks).slice(0,count);
      if(!top.length){ document.getElementById('topList').innerHTML=`<div class="empty"><div class="eico">🏆</div><p>No students found</p></div>`; return; }
      document.getElementById('topList').innerHTML=top.map((s,i)=>{
        const g=getGrade(s.marks);
        const rankColor=i===0?'var(--yellow)':i===1?'var(--muted)':i===2?'#cd7f32':'var(--muted)';
        return`<div class="top-item"><div class="top-rank" style="color:${rankColor}">${medals[i]||'#'+(i+1)}</div><div class="top-info"><div class="top-name">${s.name}</div><div class="top-meta">Section ${s.section} · <span class="badge ${gradeCls(g)}" style="font-size:9px;padding:2px 6px">${g}</span></div></div><div class="top-score" style="color:${gradeColor(g)}">${s.marks}<span style="font-size:12px;color:var(--muted)">/100</span></div></div>`;
      }).join('');
    }

    /* ── GRADE CALCULATOR ── */
    function buildScaleGrid(){
      const scale=[{g:'A+',r:'90–100'},{g:'A',r:'80–89'},{g:'B',r:'70–79'},{g:'C',r:'60–69'},{g:'D',r:'33–59'},{g:'F',r:'0–32'}];
      document.getElementById('scaleGrid').innerHTML=scale.map(x=>`<div class="scale-item"><span style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:${gradeColor(x.g)}">${x.g}</span><span style="font-size:12px;color:var(--muted)">${x.r}</span></div>`).join('');
    }
    function calcGrade(){
      const mv=document.getElementById('gcMarks').value;
      const threshold=parseInt(document.getElementById('gcThreshold').value)||33;
      const m=parseInt(mv);
      if(isNaN(m)||m<0||m>100){ document.getElementById('gradeDisplay').style.display='none'; return; }
      const g=getGrade(m); const pass=m>=threshold;
      const disp=document.getElementById('gradeDisplay'); disp.style.display='block';
      document.getElementById('gradeLetter').textContent=g;
      document.getElementById('gradeLetter').style.color=gradeColor(g);
      document.getElementById('gradeDesc').textContent=gradeDesc(g);
      document.getElementById('gradeScoreTxt').textContent=`${m}/100`;
      document.getElementById('gradeScoreTxt').style.color=gradeColor(g);
      document.getElementById('gradeFill').style.width=m+'%';
      document.getElementById('gradeFill').style.background=gradeColor(g);
      const badge=document.getElementById('gcBadge');
      badge.textContent=pass?'PASS ✓':'FAIL ✗'; badge.className='badge '+(pass?'bp':'bf');
      const nm=document.getElementById('gcName').value.trim();
      const sub=document.getElementById('gcSubject').value.trim();
      let info=''; if(nm) info+=`<strong>${nm}</strong>`; if(sub) info+=(nm?' · ':'')+sub;
      document.getElementById('gcStudentName').innerHTML=info;
      document.getElementById('gcFeedback').textContent=gradeFeedback(g);
    }
function goToExpiredAssignments(){
      showSection('assignmentsPage', document.querySelectorAll('.nav-btn')[4]);
      setTimeout(()=>{
        const el = document.getElementById('expiredAssignmentTable');
        if(el) el.closest('.subpanel')?.scrollIntoView({behavior:'smooth', block:'start'});
      }, 150);
    }
    /* ── ASSIGNMENTS ── */
    function updateAssignCount(){
  const n = assignments.length;
  document.getElementById('assignCount').innerText = n;
  document.getElementById('assignTotalNum').innerHTML =
    `${n} <span style="font-size:11px;color:var(--muted);font-weight:500;">Total</span>`;
}
    async function addAssignment(){
      const title=document.getElementById('assignmentTitle').value.trim();
      const description=document.getElementById('assignmentDescription').value.trim();
      const subject=document.getElementById('assignmentSubject').value.trim();
     const due=document.getElementById('assignmentDue').value;
const section=document.getElementById('assignmentSectionInput').value.trim().toUpperCase();
if(!title||!description||!section){ showToast('Fill Title, Description and Section','warn'); return; }
      const localAssign={id:assignments.length?Math.max(...assignments.map(a=>a.id))+1:1,title,description,subject:subject||'—',due:due||null,section:section||'—'};
      try{
        const res=await fetch(`${BASE_URL}/Addassignments`,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({assignments:title, subjects:subject, description:description, dueDate: due ? due+'T00:00:00' : null, section:section})});
        if(!res.ok) throw new Error();
        const server=await res.json();
        assignments.push({id:server.id||localAssign.id,title:server.assignments||server.title||title,description:server.description||description,subject:server.subjects||server.subject||subject||'—',due:server.dueDate ? server.dueDate.split('T')[0] : due||null, section:server.section||section||'—'});
        showToast('Assignment added!');
      }catch(e){ assignments.push(localAssign); showToast('Assignment added (demo)!'); }
      addLog(`Assignment: ${title}`);
      document.getElementById('assignmentTitle').value='';
      document.getElementById('assignmentDescription').value='';
      document.getElementById('assignmentSubject').value='';
      document.getElementById('assignmentDue').value='';
document.getElementById('assignmentSectionInput').value='';
      renderAssignments();
    }

async function loadAssignmentReport(){
  try{
    const res = await fetch(`${BASE_URL}/assignments/report`, {headers:authHeaders()});
    if(!res.ok) throw new Error();
    const data = await res.json();
    renderAssignmentReport(data);
  }catch(e){ showToast('Failed to load report','warn'); }
}

function renderAssignmentReport(data){
  const tb = document.getElementById('assignmentReportTable');
  if(!data.length){
    tb.innerHTML=`<tr><td colspan="7"><div class="empty"><div class="eico">📝</div><p>No data found</p></div></td></tr>`;
    return;
  }
  tb.innerHTML = data.map(r => `<tr>
    <td><strong>#${r.studentId}</strong></td>
    <td><strong>${r.studentName||'—'}</strong></td>
    <td>${r.section||'—'}</td>
    <td><span class="badge bp">✓ ${r.completed}</span></td>
    <td><span class="badge gc">⏳ ${r.pending}</span></td>
    <td><span class="badge bf">✕ ${r.incompleted}</span></td>
    <td><span class="badge gc">${r.total} Total</span></td>
  </tr>`).join('');
}
async function updateAssignment(id, status){
  try{
    const res = await fetch(`${BASE_URL}/updateAssignments/${id}?assignments=${status}`, {
      method:'PATCH', headers:authHeaders()
    });
    if(!res.ok) throw new Error();
    showToast(`Assignment updated: ${status}`);
    addLog(`Assignment #${id} → ${status}`);
    loadAssignments();
  }catch(e){ showToast('Update failed','warn'); }
}
   async function deleteAssignment(id){
  try{
    const res = await fetch(`${BASE_URL}/DeleteAssignment/${id}`, {method:'DELETE', headers:authHeaders()});
    if(!res.ok) throw new Error();
    showToast('Assignment deleted!');
    addLog(`Deleted assignment #${id}`);
    loadAssignments();
  }catch(e){
    showToast('Failed to delete','warn');
  }
}
async function deleteExpiredAssignment(id){
  try{
    const res = await fetch(`${BASE_URL}/Delete/expired/Assignments/${id}`, {method:'DELETE', headers:authHeaders()});
    if(!res.ok) throw new Error();
    showToast('Expired assignment deleted!');
    addLog(`Deleted expired assignment #${id}`);
    loadExpiredAssignments();
  }catch(e){
    showToast('Failed to delete expired assignment','warn');
  }
}

let editingExpiredId = null;
function openExpiredAssignEdit(id){
  const a=expiredAssignments.find(x=>x.id===id); if(!a) return;
  editingExpiredId = id;
  document.getElementById('editAssignId').value=a.id;
  document.getElementById('editAssignTitle').value=a.title||'';
  document.getElementById('editAssignDesc').value=a.description||'';
  document.getElementById('editAssignSubject').value=a.subject||'';
  document.getElementById('editAssignDue').value=a.due||'';
  document.getElementById('editAssignSection').value=a.section||'';
  document.getElementById('editAssignModal').classList.add('open');
}
    function openAssignEdit(id){
      const a=assignments.find(x=>x.id===id); if(!a) return;
      document.getElementById('editAssignId').value=a.id;
      document.getElementById('editAssignTitle').value=a.title||'';
      document.getElementById('editAssignDesc').value=a.description||'';
      document.getElementById('editAssignSubject').value=a.subject||'';
      document.getElementById('editAssignDue').value=a.due||'';
      document.getElementById('editAssignSection').value=a.section||'';
      document.getElementById('editAssignModal').classList.add('open');
    }
    function closeAssignModal(){ document.getElementById('editAssignModal').classList.remove('open'); editingExpiredId = null; }
    document.getElementById('editAssignModal').addEventListener('click',e=>{ if(e.target===e.currentTarget) closeAssignModal(); });
    async function saveAssignEdit(){
      const id=parseInt(document.getElementById('editAssignId').value);
      const title=document.getElementById('editAssignTitle').value.trim();
      const desc=document.getElementById('editAssignDesc').value.trim();
      const subject=document.getElementById('editAssignSubject').value.trim();
      const due=document.getElementById('editAssignDue').value;

    const section = document.getElementById('editAssignSection').value.trim().toUpperCase();
          if(editingExpiredId !== null){
            try{
              const res = await fetch(`${BASE_URL}/Upadate/expired/assignments/${id}`, {
                method:'PUT',
                headers: authHeaders({'Content-Type':'application/json'}),
                body: JSON.stringify({
                  assignments: title,
                  description: desc,
                  subjects: subject,
                  dueDate: due ? due+'T00:00:00' : null,
                  section: section
                })
              });
              if(!res.ok) throw new Error();
              showToast('Assignment updated — moved to Active if date is in the future!');
              addLog(`Edited expired assignment #${id}`);
              editingExpiredId = null;
              closeAssignModal();
              // Refresh BOTH lists — the item should move from expired → active
              await loadAssignments();
              await loadExpiredAssignments();
            }catch(e){
              showToast('Failed to update expired assignment','warn');
            }
            return;
          }

      const idx=assignments.findIndex(a=>a.id===id);
      if(idx>-1){ assignments[idx]={...assignments[idx],title:title||assignments[idx].title,description:desc,subject:subject||'—',due:due||null,section:section||assignments[idx].section}; addLog(`Edited assignment #${id}`); showToast('Assignment updated!'); closeAssignModal(); renderAssignments(); }
    }

async function loadResultModal(type){
      const titles = { pass:'✓ Passed Students', fail:'✕ Failed Students', all:'👥 All Students', active:'⚡ Active Students', inactive:'💤 Inactive Students' };
      document.getElementById('resultModalTitle').textContent = titles[type] || 'Students';
      document.getElementById('resultModalTable').innerHTML = `<tr><td colspan="7"><div class="empty"><div class="eico">⏳</div><p>Loading…</p></div></td></tr>`;
      document.getElementById('resultModal').classList.add('open');

      const endpoints = { pass:'pass', fail:'failed', all:'all', active:'Active', inactive:'Inactive' };
      try{
        const res = await fetch(`${BASE_URL}/${endpoints[type]}`, {headers:authHeaders()});
        if(!res.ok) throw new Error();
        renderResultModalTable(await res.json());
      }catch(e){
        document.getElementById('resultModalTable').innerHTML = `<tr><td colspan="7"><div class="empty"><div class="eico">⚠</div><p>Failed to load</p></div></td></tr>`;
      }
    }

    function renderResultModalTable(data){
      const tb = document.getElementById('resultModalTable');
      if(!data.length){
        tb.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="eico">📋</div><p>No students found</p></div></td></tr>`;
        return;
      }
      tb.innerHTML = data.map(s=>{
        const g = getGrade(s.marks);
        return `<tr>
          <td><strong>#${s.id}</strong></td>
          <td><strong>${s.name||'—'}</strong></td>
          <td>${s.rollNumber||'—'}</td>
          <td>${s.marks}</td>
          <td>${s.section}</td>
         <td><span class="badge ${(s.result||'').toLowerCase()==='pass'?'bp':'bf'}">${(s.result||'—').charAt(0).toUpperCase()+(s.result||'—').slice(1).toLowerCase()}</span></td>
                   <td><span class="badge ${(s.status||'').toLowerCase()==='active'?'bp':'bf'}">${(s.status||'—').charAt(0).toUpperCase()+(s.status||'—').slice(1).toLowerCase()}</span></td>
        </tr>`;
      }).join('');
    }
        function closeResultModal(){ document.getElementById('resultModal').classList.remove('open'); }
        document.getElementById('resultModal').addEventListener('click',e=>{ if(e.target===e.currentTarget) closeResultModal(); });

    /* ── COMPLETION TRACKER ── */
   function cycleStatus(current){
    if(!current||current==='pending') return 'completed';
    if(current==='completed') return 'incompleted';
    return 'pending';
}

async function toggleCompletion(studentId, assignId){
    console.log('toggleCompletion called', studentId, assignId);
    const assign = allTrackedAssignments().find(a => a.id === assignId);
    console.log('found assign:', assign);
    if(assign && assign.expired){
        showToast('Cannot change status — assignment expired','warn');
        console.log('BLOCKED — expired');
        return;
    }


    if(!completionMap[studentId]) completionMap[studentId]={};
    const cur = completionMap[studentId][assignId]||'pending';
    const next = cycleStatus(cur);
    const prev = cur;
    completionMap[studentId][assignId] = next;

    try{
        const res = await fetch(`${BASE_URL}/updateAssignments/${studentId}?assignmentId=${assignId}&status=${next}`, {
            method:'PATCH', headers:authHeaders()
        });
        if(!res.ok){
            completionMap[studentId][assignId] = prev;
            showToast('Cannot update — assignment expired','warn');
        }
    }catch(e){
        completionMap[studentId][assignId] = prev;
        showToast('Update failed','warn');
    }

    await loadAssignmentReport();
    renderCompletionTable();
}
  function getCompletionStats(){
  let done=0,pending=0,missed=0;
  allStudents.forEach(s=>{
    assignments.forEach(a=>{
      if(a.section !== 'ALL' && a.section !== s.section) return;
      const status=(completionMap[s.id]||{})[a.id]||'pending';
      if(status==='completed') done++;
      else if(status==='incompleted') missed++;
      else pending++;
    });
  });
  return{done,pending,missed};
}
async function refreshCompletion(){
    await getStudents();
    await loadAssignments();
 await loadExpiredAssignments();
    try{
        const res = await fetch(`${BASE_URL}/StuentAssignment/all`, {headers:authHeaders()});
        if(res.ok){
            const records = await res.json();
            completionMap = {};
            records.forEach(r => {
                if(!completionMap[r.studentId]) completionMap[r.studentId] = {};
                completionMap[r.studentId][r.assignmentId] = r.status;
            });
        }
    }catch(e){}

    // Build section tabs
    const secs = ['all', ...[...new Set(allStudents.map(s=>s.section))].sort()];
    const tabContainer = document.getElementById('sectionTabs');
    tabContainer.innerHTML = secs.map(sec => `
        <button class="assign-tab sec-tab ${sec===activeSectionTab?'active':''}"
                id="sectab-${sec}" onclick="setSectionTab('${sec}')"
                style="${sec!=='all'?'color:var(--purple);border-color:rgba(177,76,255,.3)':''}">
            ${sec==='all'?'All sections':'Section '+sec}
        </button>`).join('');

    // Assignment dropdown (keep for compatibility)
    const sel = document.getElementById('compAssignFilter');
    if(sel){
        sel.innerHTML='<option value="all">All Assignments</option>';
        assignments.forEach(a=>{
            const o = document.createElement('option');
            o.value = a.id; o.textContent = a.title;
            sel.appendChild(o);
        });
    }

    renderCompletionTable();
}
let activeSectionTab = 'all';
let activeStatusTab  = 'all';

function setSectionTab(sec){
    activeSectionTab = sec;
    document.querySelectorAll('.sec-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('sectab-'+sec).classList.add('active');
    renderCompletionTable();
}

function setStatusTab(status){
    activeStatusTab = status;
    document.querySelectorAll('#statusTabs .assign-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('stab-'+status).classList.add('active');
    renderCompletionTable();
}
async function refreshCompletionMap(){
  try{
    const res = await fetch(`${BASE_URL}/studentAssignments/all`, {headers:authHeaders()})
    if(res.ok){
      const records = await res.json();
      completionMap = {};
      records.forEach(r => {
        if(!completionMap[r.studentId]) completionMap[r.studentId] = {};
        completionMap[r.studentId][r.assignmentId] = r.status;
      });
    }
  }catch(e){}
}
let drawerAssignId = null;
let drawerActiveTab = 'completed';
let drawerData = { completed:[], pending:[], incompleted:[] };

function showAssignmentDetail(assignId){
  const assign = allTrackedAssignments().find(a => a.id === assignId);
  if(!assign) return;
  drawerAssignId = assignId;
  drawerData = { completed:[], pending:[], incompleted:[] };

  const assignSection = assign.section || 'ALL';
  const relevantStudents = assignSection === 'ALL'
    ? allStudents
    : allStudents.filter(s => s.section === assignSection);

  relevantStudents.forEach(s => {
    const status = (completionMap[s.id]||{})[assignId]||'pending';
    if(status==='completed') drawerData.completed.push(s);
    else if(status==='incompleted') drawerData.incompleted.push(s);
    else drawerData.pending.push(s);
  });

<!--  const total = relevantStudents.length;-->

  const total = allStudents.length;
  const pct = total ? Math.round(drawerData.completed.length/total*100) : 0;

  document.getElementById('drawerTitle').textContent = assign.title;
  document.getElementById('drawerMeta').textContent  = `${assign.subject||'—'} · Due: ${assign.due ? new Date(assign.due).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}`;
  document.getElementById('drawerDone').textContent  = drawerData.completed.length;
  document.getElementById('drawerPend').textContent  = drawerData.pending.length;
  document.getElementById('drawerInc').textContent   = drawerData.incompleted.length;
  document.getElementById('drawerTotal').textContent = total;
  document.getElementById('drawerPct').textContent   = pct+'%';

  // open drawer first, then animate bar
// open drawer first, then animate bar
  document.getElementById('assignDrawerOverlay').style.display = 'block';
  document.getElementById('assignDrawer').style.pointerEvents = 'auto';
  document.getElementById('assignDrawer').style.transform = 'translate(-50%,-50%)';
  document.getElementById('assignDrawer').style.opacity = '1';
   setTimeout(()=>{ document.getElementById('drawerPctBar').style.width = pct+'%'; }, 50);

  switchDrawerTab('completed');
}

function switchDrawerTab(tab){
  drawerActiveTab = tab;
  ['completed','pending','incompleted'].forEach(t=>{
    document.getElementById('dtab-'+t).classList.toggle('active', t===tab);
  });
  const list = document.getElementById('drawerStudentList');
  const students = drawerData[tab];
  const cfg = {
    completed:  { cls:'bp', icon:'✓', color:'var(--green)',  empty:'No students completed yet' },
    pending:    { cls:'gc', icon:'⏳', color:'var(--yellow)', empty:'No students pending' },
    incompleted:{ cls:'bf', icon:'✕', color:'var(--pink)',   empty:'No incompleted students' }
  }[tab];

  if(!students.length){
    list.innerHTML=`<div class="empty"><div class="eico">${cfg.icon}</div><p>${cfg.empty}</p></div>`;
    return;
  }
  list.innerHTML = students.map((s,i)=>`
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:10px;animation:fadeUp .2s ease ${i*0.03}s both;">
      <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:700;color:var(--muted);flex-shrink:0;">${i+1}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;">${s.name}</div>
        <div style="font-size:11px;color:var(--muted);">Section ${s.section} · #${s.id}</div>
      </div>
      <span class="badge ${cfg.cls}">${cfg.icon}</span>
    </div>`).join('');
}
function closeAssignDrawer(){
  document.getElementById('assignDrawer').style.pointerEvents = 'none';
  document.getElementById('assignDrawer').style.transform = 'translate(-50%,-60%)';
  document.getElementById('assignDrawer').style.opacity = '0';
  document.getElementById('assignDrawerOverlay').style.display = 'none';
  document.getElementById('drawerPctBar').style.width = '0%';
}
function renderCompletionBody(data){
  const stats = { done: data.length, pending: 0, missed: 0 };
  document.getElementById('completionStats').innerHTML=`
    <div class="cstat cstat-done">${stats.done} <span>Completed</span></div>
    <div class="cstat cstat-pend">0 <span>Pending</span></div>
    <div class="cstat cstat-miss">0 <span>Missed</span></div>`;

  document.getElementById('completionHead').innerHTML=`
    <tr>
      <th>ID</th><th>Name</th><th>Section</th><th>Grade</th><th>Result</th><th>Status</th>
    </tr>`;

  if(!data.length){
    document.getElementById('completionBody').innerHTML=`
      <tr><td colspan="6"><div class="empty"><div class="eico">✅</div>
      <p>No completed assignments found</p></div></td></tr>`;
    return;
  }

  document.getElementById('completionBody').innerHTML = data.map(s => {
    const g = getGrade(s.marks);
    return `<tr>
      <td><strong>#${s.id}</strong></td>
      <td><strong>${s.name}</strong></td>
      <td>${s.section}</td>
      <td><span class="badge ${gradeCls(g)}">${g}</span></td>
      <td><span class="badge ${(s.result||'').toLowerCase()==='pass'?'bp':'bf'}">${s.result||'—'}</span></td>
      <td><span class="badge bp">✓ Completed</span></td>
    </tr>`;
  }).join('');
}
function filterStudentsByAssignment(){ applyFilters(); }


  function renderCompletionTable(){
    const studentSearch = (document.getElementById('compStudentSearch')?.value||'').toLowerCase();
    const assignFilter  = document.getElementById('compAssignFilter')?.value||'all';

    // Filter students by active section tab
    let filteredStudents = activeSectionTab === 'all'
        ? allStudents
        : allStudents.filter(s => s.section === activeSectionTab);

    if(studentSearch) filteredStudents = filteredStudents.filter(s => s.name.toLowerCase().includes(studentSearch));

    const activeAssigns = assignFilter === 'all'
        ? allTrackedAssignments()
        : assignments.filter(a => String(a.id) === String(assignFilter));

    // Recount stats for visible students only
    let done=0, pending=0, missed=0;
    filteredStudents.forEach(s => {
        activeAssigns.forEach(a => {
            if(a.section !== 'ALL' && a.section !== s.section) return;
            const st = (completionMap[s.id]||{})[a.id]||'pending';
            if(st==='completed') done++;
            else if(st==='incompleted') missed++;
            else pending++;
        });
    });
    document.getElementById('statDone').textContent   = done;
    document.getElementById('statPend').textContent   = pending;
    document.getElementById('statMissed').textContent = missed;

    const container = document.getElementById('completionBody');
    container.innerHTML = '';
    document.getElementById('completionHead').innerHTML = '';

    if(!filteredStudents.length || !activeAssigns.length){
        container.innerHTML = `<tr><td colspan="3"><div class="empty"><div class="eico">✅</div>
            <p>${!allStudents.length?'No students.':!assignments.length?'No assignments.':'No results.'}</p>
            </div></td></tr>`;
        return;
    }

    filteredStudents.forEach(s => {
        const sectionAssigns = activeAssigns.filter(a => a.section==='ALL' || a.section===s.section);
        if(!sectionAssigns.length) return;

        let doneCount = 0;
        const assignCells = sectionAssigns.map(a => {
            const status = (completionMap[s.id]||{})[a.id]||'pending';
            // Filter by status tab
            if(activeStatusTab !== 'all'){
                const map = {done:'completed', pending:'pending', missed:'incompleted'};
                if(status !== map[activeStatusTab]) return null;
            }
            if(status==='completed') doneCount++;
            const isPastDue = a.expired || isOverdue(a.due);
            const isOverdueA = isPastDue && status !== 'completed';
           const icon  = status==='completed'?'✓':status==='incompleted'?'✕':'⏳';
           const color = status==='completed'?'var(--green)':status==='incompleted'?'var(--pink)':'var(--yellow)';
           const bg    = status==='completed'?'rgba(34,211,122,.08)':status==='incompleted'?'rgba(255,45,120,.08)':'rgba(255,228,77,.06)';
           const border= status==='completed'?'rgba(34,211,122,.2)':status==='incompleted'?'rgba(255,45,120,.2)':'rgba(255,228,77,.15)';
           const cls   = status==='completed'?'bp':status==='incompleted'?'bf':'gc';
           return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:${bg};border:1px solid ${border};border-radius:9px;cursor:pointer;transition:all .18s;" onclick="${isPastDue?`showAssignmentDetail(${a.id})`:`toggleCompletion(${s.id},${a.id})`}" title="${isPastDue?'Expired — click to view results':'Click to toggle'}">
                <div>
                    <div style="font-size:12px;font-weight:600;color:var(--text);max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title}</div>
                    <div style="font-size:10px;color:${isOverdueA?'var(--pink)':'var(--muted)'};margin-top:2px;">${a.due?new Date(a.due).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'No due date'}${isOverdueA?' ⚠':''}</div>
                </div>
                <div style="width:26px;height:26px;border-radius:7px;background:${color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#000;flex-shrink:0;">${icon}</div>
            </div>`;
        }).filter(Boolean);

        if(activeStatusTab !== 'all' && assignCells.length === 0) return;

        const g = getGrade(s.marks);
        const total = sectionAssigns.length;
        const pct = total ? Math.round(doneCount/total*100) : 0;
        const pctColor = pct===100?'var(--green)':pct>=50?'var(--yellow)':'var(--pink)';

        container.innerHTML += `<tr><td colspan="100" style="padding:4px 0;border:none;">
            <div style="background:var(--card2);border:1px solid var(--border);border-radius:13px;padding:14px 16px;transition:border-color .18s;" onmouseenter="this.style.borderColor='rgba(255,255,255,.15)'" onmouseleave="this.style.borderColor='var(--border)'">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(177,76,255,.2),rgba(0,245,212,.1));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:var(--purple);font-family:'Plus Jakarta Sans',sans-serif;flex-shrink:0;">${s.name.charAt(0).toUpperCase()}</div>
                    <div style="flex:1;">
                        <div style="font-size:13px;font-weight:600;color:var(--text);">${s.name}</div>
                        <div style="font-size:11px;color:var(--muted);margin-top:1px;">Section ${s.section} · <span class="badge ${gradeCls(g)}" style="font-size:9px;padding:2px 6px">${g}</span></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                        <div style="width:80px;height:5px;background:rgba(255,255,255,.07);border-radius:100px;overflow:hidden;">
                            <div style="height:100%;width:${pct}%;background:${pctColor};border-radius:100px;"></div>
                        </div>
                        <span style="font-size:11px;font-weight:700;color:${pctColor};font-family:'Plus Jakarta Sans',sans-serif;min-width:28px;">${pct}%</span>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:7px;">
                    ${assignCells.join('')}
                </div>
            </div>
        </td></tr>`;
    });

    if(container.innerHTML === '') container.innerHTML = `<tr><td colspan="3"><div class="empty"><div class="eico">✅</div><p>No results for this filter</p></div></td></tr>`;
}
    /* ── DUPLICATES ── */
    async function findDuplicates(){
      const tb=document.getElementById('dupTable');
      try{
        const res=await fetch(`${BASE_URL}/sameName`,{headers:authHeaders(),signal:AbortSignal.timeout(4000)});
        if(!res.ok) throw new Error(); dupGroups=await res.json();
      }catch(e){
        const byName={};
        allStudents.forEach(s=>{ const key=s.name.toLowerCase(); (byName[key]=byName[key]||[]).push(s); });
        dupGroups=Object.values(byName).filter(g=>g.length>1).flat();
        if(!dupGroups.length) showToast('No backend — scanned locally','warn');
      }
      document.getElementById('dupCount').innerText=dupGroups.length;
      const banner=document.getElementById('dupBanner');
      if(dupGroups.length>0){ banner.classList.add('show'); document.getElementById('dupBannerTxt').textContent=`Found ${dupGroups.length} student(s) sharing a name with another record.`; }
      else banner.classList.remove('show');
      if(!dupGroups.length){ tb.innerHTML=`<tr><td colspan="5"><div class="empty"><div class="eico">✨</div><p>No duplicate names found</p></div></td></tr>`; return; }
      tb.innerHTML=dupGroups.map(s=>{ const g=getGrade(s.marks); return`<tr><td><strong>#${s.id}</strong></td><td><strong>${s.name}</strong></td><td>${s.marks} <span class="badge ${gradeCls(g)}" style="font-size:9px;margin-left:4px">${g}</span></td><td>${s.section}</td><td><span class="badge ${(s.result||'').toLowerCase()==='pass'?'bp':'bf'}">${s.result||'—'}</span></td></tr>`; }).join('');
      addLog(`Scanned duplicates: ${dupGroups.length} found`);
    }
    function confirmDeleteDupes(){
      openConfirmModal('🗑 Delete Duplicate Students',`This will permanently remove all ${dupGroups.length} students with duplicate names.`,async()=>{
        try{ const res=await fetch(`${BASE_URL}/deletByName`,{method:'DELETE',headers:authHeaders()}); if(!res.ok) throw new Error(); showToast('Duplicates deleted'); getStudents(); }
        catch(e){ const dupIds=new Set(dupGroups.map(s=>s.id)); allStudents=allStudents.filter(s=>!dupIds.has(s.id)); showToast('Duplicates deleted (demo)','warn'); populateFilters(); applyFilters(); updateCount(); }
        dupGroups=[]; findDuplicates(); addLog('Deleted duplicate students');
      });
    }

    /* ── CONFIRM MODAL ── */
    let _confirmCb=null;
    function openConfirmModal(title,body,onConfirm){
      document.getElementById('confirmTitle').textContent=title;
      document.getElementById('confirmBody').textContent=body;
      _confirmCb=onConfirm;
      document.getElementById('confirmModal').classList.add('open');
    }
    function closeConfirmModal(){ document.getElementById('confirmModal').classList.remove('open'); _confirmCb=null; }
    document.getElementById('confirmModal').addEventListener('click',e=>{ if(e.target===e.currentTarget) closeConfirmModal(); });
    document.getElementById('confirmActionBtn').addEventListener('click',async()=>{ if(_confirmCb) await _confirmCb(); closeConfirmModal(); });

    buildScaleGrid();
document.addEventListener('DOMContentLoaded', function(){
  if(authToken) {
    loggedInRole = localStorage.getItem('userRole') || 'ADMIN';
    if(loggedInRole === 'USER') enterStudentFlow();
    else enterDashboard(false);
  }
});

    // ── AUTH / REGISTRATION ──
    function showRegister(){
      document.getElementById('loginCard').style.display='none';
      document.getElementById('registerCard').style.display='block';
    }
    function showLogin(){
      document.getElementById('loginCard').style.display='block';
      document.getElementById('registerCard').style.display='none';
    }
    async function register(){
      const u = document.getElementById('regUsername').value.trim();
      const p = document.getElementById('regPassword').value;
      const r = document.getElementById('regRole').value;
      const msg = document.getElementById('regMsg');
      if(!u||!p){ msg.style.color='var(--pink)'; msg.textContent='Fill all fields'; return; }
      try{
        const res = await fetch(`${AUTH_BASE}/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p,role:r})});
        const text = await res.text();
        if(res.ok){ msg.style.color='var(--cyan)'; msg.textContent='✓ Submitted! Wait for Super Admin approval.'; }
        else { msg.style.color='var(--pink)'; msg.textContent='⚠ '+text; }
      }catch(e){ msg.style.color='var(--pink)'; msg.textContent='⚠ Server unreachable'; }
    }
    async function approveUser(id){
      const res = await fetch(`${AUTH_BASE}/approve/${id}`,{method:'PATCH',headers:authHeaders()});
      if(res.ok){ showToast('User approved!'); loadPending(); }
    }
    async function rejectUser(id){
      const res = await fetch(`${AUTH_BASE}/reject/${id}`,{method:'PATCH',headers:authHeaders()});
      if(res.ok){ showToast('User rejected','warn'); loadPending(); }
    }

function spShowSection(id, btn) {
    document.querySelectorAll('#studentPortalPage .section')
        .forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#studentPortalPage .nav-btn')
        .forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(btn) btn.classList.add('active');

    if(id === 'spGradesSection') {
        document.getElementById('spGrade2').textContent  = document.getElementById('spGrade').textContent;
        document.getElementById('spGrade2').style.color  = document.getElementById('spGrade').style.color;
        document.getElementById('spMarks2').textContent  = document.getElementById('spMarks').textContent;
        document.getElementById('spResult2').textContent = document.getElementById('spResult').textContent;
        document.getElementById('spResult2').className   = document.getElementById('spResult').className;
    }

    if(id === 'spProfileSection') {
        loadMyProfile();
    }
}
    async function loadSuperAdminPage(){
  // Load pending
  try{
    const res = await fetch(`${AUTH_BASE}/pending`, {headers:authHeaders()});
    if(res.ok){
      const users = await res.json();
      document.getElementById('pendingCount').textContent = users.length;
      const tb = document.getElementById('saPendingTable');
      if(!users.length){
        tb.innerHTML=`<tr><td colspan="4"><div class="empty"><div class="eico">🔔</div><p>No pending users</p></div></td></tr>`;
      } else {
        tb.innerHTML = users.map(u=>`<tr>
          <td><strong>#${u.id}</strong></td>
          <td><strong>${u.username}</strong></td>
          <td><span class="badge gc">${u.role}</span></td>
          <td style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" onclick="saApprove(${u.id})">✓ Approve</button>
            <button class="btn btn-danger btn-sm" onclick="saReject(${u.id})">✕ Reject</button>
          </td>
        </tr>`).join('');
      }
    }
  }catch(e){ showToast('Failed to load pending','warn'); }

  // Load all users + stats
  try{
    const res2 = await fetch(`${AUTH_BASE}/users`, {headers:authHeaders()});
    if(res2.ok){
      const all = await res2.json();
      const admins   = all.filter(u=>u.role==='ADMIN').length;
      const users    = all.filter(u=>u.role==='USER').length;
      const approved = all.filter(u=>u.status==='APPROVED').length;
      const pending  = all.filter(u=>u.status==='PENDING').length;
      const rejected = all.filter(u=>u.status==='REJECTED').length;

      document.getElementById('saUserStats').innerHTML = `
        <div style="padding:12px 18px;background:rgba(177,76,255,.08);border:1px solid rgba(177,76,255,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--purple)">${admins}</div>
          <div style="font-size:11px;color:var(--muted)">Admins</div>
        </div>
        <div style="padding:12px 18px;background:rgba(0,245,212,.08);border:1px solid rgba(0,245,212,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--cyan)">${users}</div>
          <div style="font-size:11px;color:var(--muted)">Users</div>
        </div>
        <div style="padding:12px 18px;background:rgba(34,211,122,.08);border:1px solid rgba(34,211,122,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--green)">${approved}</div>
          <div style="font-size:11px;color:var(--muted)">Approved</div>
        </div>
        <div style="padding:12px 18px;background:rgba(255,228,77,.08);border:1px solid rgba(255,228,77,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--yellow)">${pending}</div>
          <div style="font-size:11px;color:var(--muted)">Pending</div>
        </div>
        <div style="padding:12px 18px;background:rgba(255,45,120,.08);border:1px solid rgba(255,45,120,.2);border-radius:11px;">
          <div style="font-size:22px;font-weight:800;color:var(--pink)">${rejected}</div>
          <div style="font-size:11px;color:var(--muted)">Rejected</div>
        </div>`;

     saUsersCache = all;
      renderSaUsersTable();
    }
  }catch(e){}
}

async function saApprove(id){
  const res = await fetch(`${AUTH_BASE}/approve/${id}`, {method:'PATCH', headers:authHeaders()});
  if(res.ok){ showToast('User approved!'); loadSuperAdminPage(); }
  else showToast('Failed to approve','error');
}

async function saReject(id){
  const res = await fetch(`${AUTH_BASE}/reject/${id}`, {method:'PATCH', headers:authHeaders()});
  if(res.ok){ showToast('User rejected','warn'); loadSuperAdminPage(); }
  else showToast('Failed to reject','error');
}
    let saUsersCache = [];
let saActiveRoleTab = 'all';

function setSaRoleTab(role) {
    saActiveRoleTab = role;
    document.querySelectorAll('[id^="saRoleTab-"]').forEach(b => b.classList.remove('active'));
    document.getElementById('saRoleTab-' + role).classList.add('active');
    renderSaUsersTable();
}
/* ══════════════════════════════════════════════════════════
   UI ENHANCEMENTS — purely additive "game HUD" layer.
   Never redefines functions used by script.js (login, logout,
   showSection, etc). Only observes the DOM and layers visual
   feedback on top of whatever script.js already does.
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var REDUCE_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */
  function on(el, evt, sel, handler) {
    el.addEventListener(evt, function (e) {
      var t = e.target.closest(sel);
      if (t && el.contains(t)) handler(t, e);
    }, true);
  }

  /* ---------- 1. RIPPLE ON CLICK ---------- */
  var RIPPLE_SEL = ".btn,.nav-btn,.qa-btn,.tb-btn,.sort-btn,.assign-tab,.theme-toggle,.login-btn";
  on(document, "click", RIPPLE_SEL, function (target, e) {
    if (REDUCE_MOTION) return;
    var rect = target.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height) * 1.4;
    var span = document.createElement("span");
    span.className = "hud-ripple";
    span.style.width = span.style.height = size + "px";
    span.style.left = (e.clientX - rect.left - size / 2) + "px";
    span.style.top = (e.clientY - rect.top - size / 2) + "px";
    target.appendChild(span);
    span.addEventListener("animationend", function () { span.remove(); });
    window.setTimeout(function () { if (span.parentNode) span.remove(); }, 700);
  });

  /* ---------- 2. SLIDING ACTIVE-NAV PILL ---------- */
  function ensurePill(sidebar) {
    var pill = sidebar.querySelector(":scope > .nav-hud-pill");
    if (!pill) {
      pill = document.createElement("div");
      pill.className = "nav-hud-pill";
      sidebar.insertBefore(pill, sidebar.firstChild);
    }
    return pill;
  }
  function movePill(sidebar) {
    var active = sidebar.querySelector(".nav-btn.active");
    var pill = ensurePill(sidebar);
    if (!active) { pill.style.opacity = "0"; return; }
    var sbRect = sidebar.getBoundingClientRect();
    var aRect = active.getBoundingClientRect();
    pill.style.top = (aRect.top - sbRect.top + sidebar.scrollTop) + "px";
    pill.style.height = aRect.height + "px";
    pill.style.opacity = "1";
  }
  function refreshAllPills() {
    document.querySelectorAll(".sidebar").forEach(movePill);
  }
  document.querySelectorAll(".sidebar").forEach(function (sidebar) {
    ensurePill(sidebar);
    var mo = new MutationObserver(function () { movePill(sidebar); });
    mo.observe(sidebar, { attributes: true, attributeFilter: ["class"], subtree: true });
    sidebar.addEventListener("scroll", function () { movePill(sidebar); }, { passive: true });
  });
  window.addEventListener("resize", refreshAllPills);
  window.setTimeout(refreshAllPills, 50);
  window.setTimeout(refreshAllPills, 400); // catch late layout/font shifts

  /* ---------- 3. CARD SPOTLIGHT (pointer-reactive glow) ---------- */
  var SPOTLIGHT_SEL = ".stat-card,.qa-btn,.top-item";
  on(document, "pointermove", SPOTLIGHT_SEL, function (target, e) {
    if (REDUCE_MOTION) return;
    var r = target.getBoundingClientRect();
    target.style.setProperty("--mx", (e.clientX - r.left) + "px");
    target.style.setProperty("--my", (e.clientY - r.top) + "px");
  });

  /* ---------- 4. THEME MORPH WIPE ---------- */
  var themeObserveTargets = [document.documentElement, document.body];
  var lastTheme = null;
  function currentTheme() {
    return document.body.getAttribute("data-theme") || document.documentElement.getAttribute("data-theme") || "dark";
  }
  lastTheme = currentTheme();
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest(".theme-toggle");
    if (!toggle) return;
    var r = toggle.getBoundingClientRect();
    window.__hudThemeOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, true);
  function watchThemeAttr(target) {
    var mo = new MutationObserver(function () {
      var t = currentTheme();
      if (t === lastTheme) return;
      lastTheme = t;
      if (REDUCE_MOTION) return;
      var origin = window.__hudThemeOrigin || { x: window.innerWidth - 40, y: window.innerHeight - 40 };
      var morph = document.createElement("div");
      morph.className = "theme-morph";
      morph.style.setProperty("--tx", origin.x + "px");
      morph.style.setProperty("--ty", origin.y + "px");
      morph.style.background = getComputedStyle(document.body).backgroundColor;
      document.body.appendChild(morph);
      morph.addEventListener("animationend", function () { morph.remove(); });
      window.setTimeout(function () { if (morph.parentNode) morph.remove(); }, 800);
    });
    mo.observe(target, { attributes: true, attributeFilter: ["data-theme"] });
  }
  themeObserveTargets.forEach(watchThemeAttr);

  /* ---------- 5. BOOT-IN SEQUENCE for full-screen pages ---------- */
  var bootWatched = ["mainPage", "studentPortalPage", "superAdminPage", "profileSetupPage"];
  bootWatched.forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var wasVisible = false;
    var mo = new MutationObserver(function () {
      var visible = getComputedStyle(el).display !== "none";
      if (visible && !wasVisible && !REDUCE_MOTION) {
        el.classList.remove("hud-boot");
        void el.offsetWidth; // restart animation
        el.classList.add("hud-boot");
        window.setTimeout(function () { el.classList.remove("hud-boot"); }, 700);
      }
      wasVisible = visible;
    });
    mo.observe(el, { attributes: true, attributeFilter: ["style", "class"] });
  });

  /* ---------- 6. CONFETTI on success toasts ---------- */
  var CONFETTI_COLORS = ["#00f5d4", "#b14cff", "#22d37a", "#ffe44d", "#ff2d78"];
  function burstConfetti(x, y, count) {
    if (REDUCE_MOTION) return;
    count = count || 26;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "hud-confetti-piece";
      var color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      p.style.background = color;
      p.style.left = (x + (Math.random() * 120 - 60)) + "px";
      p.style.top = (y - 10) + "px";
      var dx = (Math.random() * 160 - 80) + "px";
      var rot = (Math.random() * 720 - 360) + "deg";
      p.style.setProperty("--dx", dx);
      p.style.setProperty("--rot", rot);
      var duration = 1.1 + Math.random() * 0.9;
      p.style.animationDuration = duration + "s";
      p.style.animationTimingFunction = "cubic-bezier(.15,.9,.4,1)";
      document.body.appendChild(p);
      (function (piece, d) {
        window.setTimeout(function () { if (piece.parentNode) piece.remove(); }, d * 1000 + 100);
      })(p, duration);
    }
  }
  var toastMo = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (!(node.nodeType === 1)) return;
        var isToast = node.classList && node.classList.contains("toast");
        if (isToast && !node.classList.contains("error") && !node.classList.contains("warn")) {
          burstConfetti(window.innerWidth - 90, window.innerHeight - 60, 18);
        }
      });
    });
  });
  toastMo.observe(document.body, { childList: true });

  /* ---------- 7. NUMBER BUMP on stat text change ---------- */
  var NUM_SEL = ".sc-num,.snum,.top-score,#statDone,#statPend,#statMissed,#assignTotalNum";
  var watchedNums = new WeakSet();
  document.querySelectorAll(NUM_SEL).forEach(watchNumber);

  var bodyMo = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches(NUM_SEL)) watchNumber(node);
        if (node.querySelectorAll) node.querySelectorAll(NUM_SEL).forEach(watchNumber);
      });
    });
  });
  bodyMo.observe(document.body, { childList: true, subtree: true });
  function watchNumber(el) {
    if (watchedNums.has(el) || REDUCE_MOTION) return;
    watchedNums.add(el);
    var mo = new MutationObserver(function () {
      el.classList.remove("hud-bump");
      void el.offsetWidth;
      el.classList.add("hud-bump");
    });
    mo.observe(el, { characterData: true, childList: true, subtree: true });
  }

  /* ---------- 8. AMBIENT ORB PARALLAX ---------- */
  if (!REDUCE_MOTION) {
    var orbA = document.querySelector(".fx-orb-a");
    var orbB = document.querySelector(".fx-orb-b");
    var ticking = false;
    window.addEventListener("pointermove", function (e) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var px = (e.clientX / window.innerWidth - 0.5);
        var py = (e.clientY / window.innerHeight - 0.5);
        if (orbA) orbA.style.transform = "translate(" + (px * 18) + "px," + (py * 18) + "px)";
        if (orbB) orbB.style.transform = "translate(" + (px * -22) + "px," + (py * -22) + "px)";
        ticking = false;
      });
    }, { passive: true });
  }

})();

function renderSaUsersTable() {
    const statusFilter = document.getElementById('saStatusFilter')?.value || 'all';

    const filtered = saUsersCache.filter(u => {
        if (saActiveRoleTab !== 'all' && u.role !== saActiveRoleTab) return false;
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
        return true;
    });

    const tb = document.getElementById('saAllUsersTable');
    if (!filtered.length) {
        tb.innerHTML = `<tr><td colspan="5"><div class="empty"><div class="eico">👥</div>
            <p>No users found for this filter</p></div></td></tr>`;
        return;
    }

    tb.innerHTML = filtered.map(u => `<tr>
        <td><strong>#${u.id}</strong></td>
        <td><strong>${u.username}</strong></td>
        <td><span class="badge gc">${u.role}</span></td>
        <td><span class="badge ${u.status==='APPROVED'?'bp':u.status==='REJECTED'?'bf':'gc'}">${u.status}</span></td>
        <td style="display:flex;gap:6px;">
            ${u.status!=='APPROVED'?`<button class="btn btn-green btn-sm" onclick="saApprove(${u.id})">✓ Approve</button>`:''}
            ${u.status!=='REJECTED'?`<button class="btn btn-danger btn-sm" onclick="saReject(${u.id})">✕ Reject</button>`:''}
        </td>
    </tr>`).join('');
}
