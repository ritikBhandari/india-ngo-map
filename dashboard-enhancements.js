(function(){
'use strict';
const api=window.ngoDashboard;if(!api)return;
const records=api.orgRecords,districts=api.data.districts;
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const years=records.map(o=>Number(o.year)).filter(y=>y>=1900&&y<=2100);
const minYear=Math.min(...years),maxYear=Math.max(...years);
const states=[...new Set(records.map(o=>o.state).filter(Boolean))].sort();
const topics=[...new Set(records.flatMap(o=>o.topics||[]))].sort();
const filter={from:minYear,to:maxYear,placement:'all',quality:'all',text:''};
let chartState='',chartTopic='',dashboardView='map';
const nav=document.createElement('nav');nav.className='ngo-nav';nav.setAttribute('aria-label','Dashboard views');
nav.innerHTML='<button type="button" data-view="map" aria-selected="true">◉ Explore map</button><button type="button" data-view="insights" aria-selected="false">▥ Data insights</button>';
document.querySelector('header').insertBefore(nav,document.querySelector('header .tag'));
const mapAside=document.querySelector('.controls');
const advanced=document.createElement('section');advanced.className='extra-controls';
advanced.innerHTML='<div class="eyebrow">DEEPER EXPLORATION</div><p class="filter-helper">Combine these filters with the state, search and topic controls above. They also affect NGO markers and lists.</p><label for="ngoYearFrom">Fellowship years</label><div class="two-cols"><select id="ngoYearFrom" aria-label="From fellowship year"></select><select id="ngoYearTo" aria-label="To fellowship year"></select></div><label for="ngoPlacement">Location coverage</label><select id="ngoPlacement"><option value="all">All locations</option><option value="mapped">Mapped to a district</option><option value="unmapped">Not mapped</option></select><label for="ngoQuality">Data provenance</label><select id="ngoQuality"><option value="all">All demographic sources</option><option value="user">My supplied district data</option><option value="census">Census fallback only</option><option value="missing">No district composition</option></select><button type="button" class="clear-filters" id="ngoClear">Reset exploration filters</button>';
const orgControls=mapAside.querySelector('.org-controls');orgControls.parentNode.insertBefore(advanced,orgControls.nextSibling);
const yearsOptions=years.length?[...new Set(years)].sort((a,b)=>a-b):[];
for(const id of ['ngoYearFrom','ngoYearTo'])$(id).innerHTML=yearsOptions.map(y=>'<option value="'+y+'">'+y+'</option>').join('');
$('ngoYearFrom').value=String(minYear);$('ngoYearTo').value=String(maxYear);
function source(o){
 if(o.districtIndex==null)return 'missing';
 const d=districts[o.districtIndex];if(!d)return 'missing';
 if(d.dem?.values&&Object.keys(d.dem.values).length)return 'user';
 return d.census2011?'census':'missing';
}
function matches(o){
 const y=Number(o.year);
 if(!Number.isFinite(y)||y<filter.from||y>filter.to)return false;
 if(filter.placement==='mapped'&&o.districtIndex==null)return false;
 if(filter.placement==='unmapped'&&o.districtIndex!=null)return false;
 if(filter.quality!=='all'&&source(o)!==filter.quality)return false;
 if(filter.text&&!([o.name,o.fellow,o.location,o.district,o.state,o.summary,...o.topics].join(' ').toLowerCase().includes(filter.text)))return false;
 return true;
}
window.ngoExtraMatch=matches;
function refreshMap(){api.updateOrganizations();if(dashboardView==='insights')renderInsights();}
function syncYear(){
 filter.from=Number($('ngoYearFrom').value);filter.to=Number($('ngoYearTo').value);
 if(filter.from>filter.to){filter.to=filter.from;$('ngoYearTo').value=String(filter.to)}
 $('iYearFrom').value=String(filter.from);$('iYearTo').value=String(filter.to);refreshMap();
}
$('ngoYearFrom').addEventListener('change',syncYear);$('ngoYearTo').addEventListener('change',syncYear);
$('ngoPlacement').addEventListener('change',()=>{filter.placement=$('ngoPlacement').value;$('iPlacement').value=filter.placement;refreshMap()});
$('ngoQuality').addEventListener('change',()=>{filter.quality=$('ngoQuality').value;refreshMap()});
$('ngoClear').addEventListener('click',()=>{
 filter.from=minYear;filter.to=maxYear;filter.placement='all';filter.quality='all';filter.text='';
 $('ngoYearFrom').value=String(minYear);$('ngoYearTo').value=String(maxYear);
 $('ngoPlacement').value='all';$('ngoQuality').value='all';
 chartState='';chartTopic='';$('iState').value='';$('iTopic').value='';$('iSearch').value='';$('iPlacement').value='all';$('iYearFrom').value=String(minYear);$('iYearTo').value=String(maxYear);
 api.updateOrganizations();renderInsights();
});
const insights=document.createElement('section');insights.className='ngo-insights';insights.id='dataInsights';insights.setAttribute('aria-label','NGO data insights');
insights.innerHTML='<div class="insights-inner"><div class="insights-heading"><div><div class="insights-kicker">INDIA NGO MAP / EXPLORATORY ANALYTICS</div><h2>Explore the patterns behind the map.</h2><p>Compare geographic reach, fellowship cohorts, issue areas and data quality. Every figure recalculates as you filter. Counts represent records in this dataset, not a census of all NGOs in India.</p></div><button class="insights-export" id="exportInsights" type="button">↓ Export filtered CSV</button></div><div class="insights-filters"><label>State or UT<select id="iState"></select></label><label>Issue / topic<select id="iTopic"></select></label><label>Fellowship from<select id="iYearFrom"></select></label><label>Fellowship to<select id="iYearTo"></select></label><label>Map coverage<select id="iPlacement"><option value="all">All records</option><option value="mapped">Mapped only</option><option value="unmapped">Unmapped only</option></select></label><label>Search<input id="iSearch" type="search" placeholder="Name, fellow, location…" /></label><button class="insights-export" type="button" id="insightsReset">Reset</button></div><div id="insightKPIs" class="insight-kpis"></div><div id="insightGrid" class="insight-grid"></div><p class="insight-note">Interpretation: “year” means Ashoka Fellowship year, not NGO founding year. Geographic assignments can be approximate. Your supplied district demographic composition takes precedence over Census 2011. SC/ST and religion are overlapping classifications and are never added together.</p></div>';
document.body.append(insights);
$('iState').innerHTML='<option value="">All states and UTs</option>'+states.map(s=>'<option value="'+escapeHTML(s)+'">'+escapeHTML(s)+'</option>').join('');
$('iTopic').innerHTML='<option value="">All issue areas</option>'+topics.map(s=>'<option value="'+escapeHTML(s)+'">'+escapeHTML(s)+'</option>').join('');
for(const id of ['iYearFrom','iYearTo'])$(id).innerHTML=yearsOptions.map(y=>'<option value="'+y+'">'+y+'</option>').join('');
$('iYearFrom').value=String(minYear);$('iYearTo').value=String(maxYear);
function switchView(view){
 dashboardView=view;
 document.body.classList.toggle('insights-active',view==='insights');
 nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.view===view)));
 if(view==='insights')renderInsights();else{api.updateOrganizations();window.dispatchEvent(new Event('resize'))}
 location.hash=view==='insights'?'insights':'map';
}
nav.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)switchView(b.dataset.view)});
function groupCount(arr,key){const m=new Map();for(const o of arr){const keys=key(o);for(const k of Array.isArray(keys)?keys:[keys])if(k)m.set(k,(m.get(k)||0)+1)}return [...m.entries()].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0])))}
function filteredRecords(){return records.filter(o=>matches(o)&&(!chartState||o.state===chartState)&&(!chartTopic||o.topics.includes(chartTopic)))}
function barCard(title,note,entries,limit=12,action=null){
 const values=entries.slice(0,limit),mx=Math.max(1,...values.map(x=>x[1]));
 return '<div class="insight-card"><h3>'+escapeHTML(title)+'</h3><p class="explain">'+escapeHTML(note)+'</p><div class="bar-list">'+(values.length?values.map(([k,v])=>'<div class="bar-item"><div class="bar-name">'+(action?'<button type="button" data-action="'+action+'" data-value="'+escapeHTML(k)+'" title="Explore '+escapeHTML(k)+'">'+escapeHTML(k)+'</button>':escapeHTML(k))+'</div><div class="bar-track"><div class="bar-fill" style="width:'+(v/mx*100).toFixed(1)+'%"></div></div><div class="bar-value">'+v.toLocaleString('en-IN')+'</div></div>').join(''):'<div class="insight-empty">No records for the selected filters.</div>')+'</div></div>';
}
function card(title,note,html,wide=false){return '<div class="insight-card'+(wide?' wide':'')+'"><h3>'+escapeHTML(title)+'</h3><p class="explain">'+escapeHTML(note)+'</p>'+html+'</div>'}
function kpi(value,name){return '<div class="insight-kpi"><span class="number">'+escapeHTML(value)+'</span><div class="caption">'+escapeHTML(name)+'</div></div>'}
function renderInsights(){
 const arr=filteredRecords(),placed=arr.filter(o=>o.districtIndex!=null),uniqueStates=new Set(placed.map(o=>o.state)),uniqueDistricts=new Set(placed.map(o=>o.state+'|'+o.district)),notPlaced=arr.length-placed.length;
 $('insightKPIs').innerHTML=kpi(arr.length.toLocaleString('en-IN'),'NGO / fellow records in selection')+kpi(uniqueStates.size,'States & UTs with mapped NGOs')+kpi(uniqueDistricts.size,'Distinct mapped districts')+kpi(arr.length?Math.round(100*placed.length/arr.length)+'%':'—','Records with district placement');
 const stateCounts=groupCount(placed,o=>o.state);
 const districtCounts=groupCount(placed,o=>o.district+', '+o.state);
 const topTopics=groupCount(arr,o=>[...new Set(o.topics||[])]);
 const yearCounts=groupCount(arr,o=>String(o.year)).sort((a,b)=>Number(a[0])-Number(b[0]));
 const decadeCounts=groupCount(arr,o=>{const y=Number(o.year);return Number.isFinite(y)?Math.floor(y/10)*10+'s':'Year not provided'});
 const qualityCounts=groupCount(arr,o=>source(o)==='user'?'Your district data':source(o)==='census'?'Census 2011 fallback':'Not available / unmapped');
 const locationCounts=groupCount(arr,o=>o.districtIndex==null?'Not mapped':o.metroAmbiguous?'City / metro approximation':'District located');
 const stateTotal=groupCount(placed,o=>o.state);
 const stateSet=new Set(stateTotal.map(x=>x[0]));
 const zeroStates=[...new Set(districts.map(d=>d.state))].filter(s=>!stateSet.has(s));
 const distinctTopics=topTopics.length;
 const yearMax=Math.max(1,...yearCounts.map(x=>x[1]));
 const timeline='<div class="insight-timeline">'+yearCounts.map(([y,n])=>'<div class="timeline-col" title="'+escapeHTML(y)+': '+n+' fellow records" data-year="'+escapeHTML(y)+'"><div class="stick" style="height:'+Math.max(3,n/yearMax*155).toFixed(1)+'px"></div></div>').join('')+'</div><div class="timeline-years"><span>'+escapeHTML(yearCounts[0]?.[0]||'—')+'</span><span>'+escapeHTML(yearCounts[yearCounts.length-1]?.[0]||'—')+'</span></div>';
 const concentration=placed.length&&districtCounts.length?(100*districtCounts.slice(0,10).reduce((n,x)=>n+x[1],0)/placed.length).toFixed(1)+'%':'—';
 const topTen=card('Geographic concentration','Share of mapped records in the 10 most-represented districts. A high share indicates clustered presence.','<div style="font-size:52px;font-weight:800;color:#8ceccc;letter-spacing:-2px">'+concentration+'</div><p class="insight-note">Top 10 district locations of '+placed.length.toLocaleString('en-IN')+' mapped records.</p>');
 const distribution=card('Fellowship-year timeline','Counts by Ashoka Fellowship year; hover to inspect. Click a year to filter the entire dashboard.',timeline,true);
 const gaps=card('States with no mapped records in selection','An absence here means no geolocated records in this filtered dataset—not necessarily no NGOs operating there.','<div class="insight-note">'+(zeroStates.length?zeroStates.map(escapeHTML).join(' · '):'All listed states/UTs have at least one mapped record in this selection.')+'</div>');
 const snapshots=card('Coverage diagnostic','Quick data completeness indicators for this selection.','<div class="insight-table-wrap"><table class="insight-table"><tbody><tr><td>Mapped records</td><td>'+placed.length+'</td></tr><tr><td>Unmapped records</td><td>'+notPlaced+'</td></tr><tr><td>Distinct topic tags</td><td>'+distinctTopics+'</td></tr><tr><td>Records using supplied district data</td><td>'+arr.filter(o=>source(o)==='user').length+'</td></tr><tr><td>Census fallback records</td><td>'+arr.filter(o=>source(o)==='census').length+'</td></tr></tbody></table></div>');
 $('insightGrid').innerHTML=barCard('NGOs by state / UT','Ranked by mapped NGO records. Click a state to focus the full dashboard.',stateCounts,16,'state')+barCard('Most represented districts','Concentration of NGO records, based on attributed district locations.',districtCounts,15)+distribution+barCard('Top issue areas','Each issue tag is counted independently: one NGO may appear in multiple topics.',topTopics,15,'topic')+barCard('Fellowships by decade','The number of fellow records in each cohort decade; not NGO incorporation dates.',decadeCounts,12)+barCard('Demographic source coverage','Your district data takes priority; Census is fallback only where your composition is absent.',qualityCounts,10)+barCard('Location precision','Unmapped, approximate metro, and mapped district records. Location quality affects geographic comparisons.',locationCounts,10)+topTen+gaps+snapshots;
}
$('iState').addEventListener('change',e=>{chartState=e.target.value;renderInsights()});
$('iTopic').addEventListener('change',e=>{chartTopic=e.target.value;renderInsights()});
$('iYearFrom').addEventListener('change',e=>{filter.from=Number(e.target.value);if(filter.from>filter.to){filter.to=filter.from;$('iYearTo').value=String(filter.to)}$('ngoYearFrom').value=String(filter.from);$('ngoYearTo').value=String(filter.to);refreshMap()});
$('iYearTo').addEventListener('change',e=>{filter.to=Number(e.target.value);if(filter.to<filter.from){filter.from=filter.to;$('iYearFrom').value=String(filter.from)}$('ngoYearFrom').value=String(filter.from);$('ngoYearTo').value=String(filter.to);refreshMap()});
$('iPlacement').addEventListener('change',e=>{filter.placement=e.target.value;$('ngoPlacement').value=filter.placement;refreshMap()});
$('iSearch').addEventListener('input',e=>{filter.text=e.target.value.trim().toLowerCase();refreshMap()});
$('insightsReset').addEventListener('click',()=>{$('ngoClear').click()});
$('insightGrid').addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');
 const y=e.target.closest('[data-year]');
 if(y){const yy=Number(y.dataset.year);$('iYearFrom').value=String(yy);$('iYearTo').value=String(yy);filter.from=yy;filter.to=yy;$('ngoYearFrom').value=String(yy);$('ngoYearTo').value=String(yy);refreshMap();return}
 if(!b)return;
 if(b.dataset.action==='state'){chartState=b.dataset.value;$('iState').value=chartState;renderInsights()}
 if(b.dataset.action==='topic'){chartTopic=b.dataset.value;$('iTopic').value=chartTopic;renderInsights()}
});
$('exportInsights').addEventListener('click',()=>{
 const rows=filteredRecords();
 const cols=['name','fellow','year','state','district','location','matchStatus','topics','demographic_source'];
 const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const csv=[cols.join(','),...rows.map(o=>cols.map(c=>quote(c==='topics'?(o.topics||[]).join('; '):c==='demographic_source'?source(o):o[c])).join(','))].join('\r\n');
 const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='india-ngo-map-filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
window.addEventListener('hashchange',()=>{const desired=location.hash==='#insights'?'insights':'map';if(desired!==dashboardView)switchView(desired)});
api.updateOrganizations();
if(location.hash==='#insights')switchView('insights');
})();