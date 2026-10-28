const search = document.querySelector('#search');
const filter = document.querySelector('#filter');
const locationFilter = document.querySelector('#location-filter');
const rows = [...document.querySelectorAll('tbody tr')];
const pageSize = document.querySelector('#page-size');
const previous = document.querySelector('#prev-page');
const next = document.querySelector('#next-page');
const pagination = document.querySelector('#pagination');
let page = 1;
let oldestFirst = false;
const sortCreated = document.querySelector('#sort-created');
const requestedLocation = new URLSearchParams(location.search).get('location');
if (requestedLocation && locationFilter && [...locationFilter.options].some(option => option.value === requestedLocation)) locationFilter.value = requestedLocation;
function render() {
  const query = (search?.value || '').trim().toLowerCase();
  const selected = filter?.value || '';
  const location = locationFilter?.value || '';
  const matching = rows.filter(row => row.dataset.search.includes(query) && (!selected || row.dataset.filter === selected) && (!location || (location === '__unassigned__' ? !row.dataset.location : row.dataset.location === location)));
  matching.sort((a, b) => (a.dataset.created.localeCompare(b.dataset.created) || Number(a.dataset.id) - Number(b.dataset.id)) * (oldestFirst ? 1 : -1));
  const tableBody = document.querySelector('.register tbody');
  matching.forEach(row => tableBody?.appendChild(row));
  const size = Number(pageSize?.value || 13);
  const pages = Math.max(1, Math.ceil(matching.length / size));
  page = Math.min(page, pages);
  rows.forEach(row => row.hidden = true);
  matching.slice((page - 1) * size, page * size).forEach(row => row.hidden = false);
  const empty = document.querySelector('#no-results');
  if (empty) empty.hidden = matching.length > 0 || rows.length === 0;
  if (pagination) pagination.hidden = matching.length === 0;
  const summary = document.querySelector('#page-summary');
  if (summary) summary.textContent = `Showing ${(page - 1) * size + 1}–${Math.min(page * size, matching.length)} of ${matching.length} · Page ${page} of ${pages}`;
  if (previous) previous.disabled = page === 1;
  if (next) next.disabled = page === pages;
}
sortCreated?.addEventListener('click', () => { oldestFirst = !oldestFirst; page = 1; document.querySelector('#sort-arrow').textContent = oldestFirst ? '↑' : '↓'; sortCreated.setAttribute('aria-label', `Sort by date created, ${oldestFirst ? 'oldest' : 'newest'} first`); sortCreated.setAttribute('aria-pressed', String(oldestFirst)); render(); });
search?.addEventListener('input', () => { page = 1; render(); });
filter?.addEventListener('change', () => { page = 1; render(); });
locationFilter?.addEventListener('change', () => { page = 1; render(); });
pageSize?.addEventListener('change', () => { page = 1; render(); });
previous?.addEventListener('click', () => { page--; render(); });
next?.addEventListener('click', () => { page++; render(); });
render();
const alertRows = [...document.querySelectorAll('#alert-list .attention')];
const moreAlerts = document.querySelector('#more-alerts');
const alertFilter = document.querySelector('#alert-filter');
const alertEmpty = document.querySelector('#alert-empty');
let alertsExpanded = false;
function updateAlerts() {
  const matching = alertRows.filter(row => !alertFilter?.value || row.dataset.alertType === alertFilter.value);
  alertRows.forEach(row => row.hidden = true);
  matching.forEach((row, index) => row.hidden = !alertsExpanded && index >= 5);
  if (alertEmpty) alertEmpty.hidden = matching.length > 0;
  if (moreAlerts) { moreAlerts.hidden = matching.length <= 5; moreAlerts.textContent = alertsExpanded ? 'Show less' : `Show all ${matching.length} alerts`; moreAlerts.setAttribute('aria-expanded', String(alertsExpanded)); }
}
moreAlerts?.addEventListener('click', () => { alertsExpanded = !alertsExpanded; updateAlerts(); });
alertFilter?.addEventListener('change', () => { alertsExpanded = false; updateAlerts(); });
updateAlerts();
const themeToggle = document.querySelector('#theme-toggle');
function setTheme(dark) { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; if (themeToggle) themeToggle.checked = dark; }
setTheme(localStorage.getItem('ims-theme') === 'dark');
themeToggle?.addEventListener('change', () => { setTheme(themeToggle.checked); localStorage.setItem('ims-theme', themeToggle.checked ? 'dark' : 'light'); });
const downloadDetails = document.querySelector('#download-details');
downloadDetails?.addEventListener('click', () => {
  const title = document.querySelector('.detail h2')?.textContent.trim() || 'Record';
  const items = [...document.querySelectorAll('.detailgrid > div')].map(el => [el.querySelector('small')?.textContent || '', el.querySelector('strong')?.textContent || '']);
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
  const width = 1400, margin = 76, gap = 36, col = (width - 2 * margin - gap) / 2;
  ctx.font = '22px Segoe UI, sans-serif';
  function wrap(value, max) {
    const result=[]; let line='';
    for (const word of value.replace(/\s+/g, ' ').trim().split(' ')) {
      for (const part of word.match(/.{1,32}/gu) || ['']) {
        const next=line ? line+' '+part : part;
        if (line && ctx.measureText(next).width > max) { result.push(line); line=part; } else line=next;
      }
    }
    result.push(line || '—'); return result;
  }
  const entries=[];
  for(let i=0;i<items.length;i+=2){const cells=items.slice(i,i+2).map(([label,value])=>({label,lines:wrap(value,col-42)}));entries.push({cells,height:82+Math.max(...cells.map(c=>c.lines.length))*30});}
  canvas.width=width;canvas.height=300+entries.reduce((sum,row)=>sum+row.height,0)+80;
  ctx.fillStyle='#f2f6f5';ctx.fillRect(0,0,width,canvas.height);
  ctx.fillStyle='#102d3b';ctx.fillRect(0,0,width,180);ctx.fillStyle='#35b3a5';ctx.fillRect(margin,43,10,58);
  ctx.fillStyle='#9fc4c2';ctx.font='bold 18px Segoe UI, sans-serif';ctx.fillText('INVENTORY MANAGEMENT SYSTEM',margin+28,58);
  ctx.fillStyle='#ffffff';ctx.font='bold 34px Segoe UI, sans-serif';ctx.fillText('Record details',margin+28,106);
  ctx.fillStyle='#5f777b';ctx.font='bold 16px Segoe UI, sans-serif';ctx.fillText('ITEM',margin,225);
  ctx.fillStyle='#173b45';ctx.font='bold 29px Segoe UI, sans-serif';ctx.fillText(title,margin,260,width-2*margin);
  let y=295;
  for(const row of entries){row.cells.forEach((cell,i)=>{const x=margin+i*(col+gap);ctx.fillStyle='#fff';ctx.fillRect(x,y,col,row.height-18);ctx.strokeStyle='#dce7e5';ctx.strokeRect(x+.5,y+.5,col-1,row.height-19);ctx.fillStyle='#6b8588';ctx.font='bold 15px Segoe UI, sans-serif';ctx.fillText(cell.label.toUpperCase(),x+20,y+29);ctx.fillStyle='#173b45';ctx.font='22px Segoe UI, sans-serif';cell.lines.forEach((line,j)=>ctx.fillText(line,x+20,y+62+j*30));});y+=row.height;}
  ctx.fillStyle='#748b8d';ctx.font='16px Segoe UI, sans-serif';ctx.fillText('Generated from the local inventory prototype',margin,canvas.height-35);
  const a=document.createElement('a');a.download=(title.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,50)||'inventory-record')+'.png';a.href=canvas.toDataURL('image/png');a.click();
});

const dashboardGreeting = document.querySelector('#dashboard-greeting');
const dashboardDate = document.querySelector('#dashboard-date');
const dashboardTime = document.querySelector('#dashboard-time');
function updateDashboardClock() {
  if (!dashboardGreeting || !dashboardDate || !dashboardTime) return;
  const now = new Date();
  const zone = 'Asia/Manila';
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', hourCycle: 'h23' }).format(now));
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  dashboardGreeting.textContent = `${greeting}, ${dashboardGreeting.dataset.user}`;
  dashboardDate.textContent = new Intl.DateTimeFormat('en-PH', { timeZone: zone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
  dashboardTime.textContent = new Intl.DateTimeFormat('en-PH', { timeZone: zone, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(now) + ' PHT';
}
if (dashboardGreeting) { updateDashboardClock(); setInterval(updateDashboardClock, 1000); }

const reportDialog = document.querySelector('#report-dialog');
document.querySelector('#open-report')?.addEventListener('click', () => reportDialog?.showModal());
document.querySelector('#close-report')?.addEventListener('click', () => reportDialog?.close());
document.querySelector('#cancel-report')?.addEventListener('click', () => reportDialog?.close());
const reportForm = reportDialog?.querySelector('form');
reportForm?.addEventListener('submit', event => {
  const start = reportForm.elements.start;
  const end = reportForm.elements.end;
  end.setCustomValidity(start.value && end.value && start.value > end.value ? 'End date must be on or after the start date.' : '');
  if (!reportForm.reportValidity()) event.preventDefault();
});
reportForm?.elements.end.addEventListener('input', () => reportForm.elements.end.setCustomValidity(''));
reportForm?.elements.start.addEventListener('input', () => reportForm.elements.end.setCustomValidity(''));


const logoutDialog = document.querySelector("#logout-dialog");
document.querySelector("#logout-open")?.addEventListener("click", () => logoutDialog?.showModal());
document.querySelector("#logout-cancel")?.addEventListener("click", () => logoutDialog?.close());
