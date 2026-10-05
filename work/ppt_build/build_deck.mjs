import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';
const {SKILL_DIR,TMP_DIR,WORKSPACE_DIR,FINAL_PPTX}=process.env;
const {resolvePresentationFont}=await import(pathToFileURL(path.join(SKILL_DIR,'container_tools/artifact_tool_utils.mjs')).href);
await fs.mkdir(TMP_DIR,{recursive:true});
const C={navy:'#10263B',navy2:'#183950',teal:'#087E80',teal2:'#DDEFEF',orange:'#C77B19',orange2:'#FFF2DB',red:'#A84C43',red2:'#FCE9E7',ink:'#172B3C',muted:'#5E7282',pale:'#F2F6F8',line:'#D8E1E7',white:'#FFFFFF',green:'#277455',green2:'#E8F3ED'};
const font=resolvePresentationFont({fontFamily:"Arial"});
const p=Presentation.create({slideSize:{width:1280,height:720}});
function shape(slide,geo,x,y,w,h,fill='none',lineFill='none',lineWidth=0){return slide.shapes.add({geometry:geo,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:lineFill,width:lineWidth}})}
function txt(slide,x,y,w,h,text,size=22,color=C.ink,bold=false,align='left',valign='top'){let s=shape(slide,'textbox',x,y,w,h,'none','none',0);s.text=text;s.text.style={typeface:font,fontSize:size,bold,color,alignment:align,verticalAlignment:valign,autoFit:'shrinkText',wrap:'square',insets:{top:0,right:0,bottom:0,left:0}};return s}
function rect(slide,x,y,w,h,fill,border=fill,r=12){let s=shape(slide,'roundRect',x,y,w,h,fill,border,1);s.borderRadius=r;return s}
function line(slide,x1,y1,x2,y2,color=C.line,width=2){return shape(slide,'line',x1,y1,x2-x1,y2-y1,'none',color,width)}
function connect(slide,a,b,color=C.teal){slide.shapes.connect(a,b,{kind:'straight',fromSide:'right',toSide:'left',line:{style:'solid',fill:color,width:2},tail:{type:'triangle',width:'med',length:'med'}})}
function heading(slide,title,subtitle,n){txt(slide,54,34,1130,56,title,42,C.navy,true);if(subtitle)txt(slide,56,92,1120,34,subtitle,21,C.muted,false);line(slide,54,665,1226,665,C.line,1);txt(slide,54,677,780,20,'AIR POWER  /  PREDICTIVE MAINTENANCE TECHNICAL APPROACH',12,C.muted,true);txt(slide,1184,674,42,22,String(n).padStart(2,'0'),14,C.muted,true,'right')}
function notes(slide,text){slide.speakerNotes.textFrame.setText(text)}
function boxTitleBody(slide,x,y,w,h,title,body,fill=C.white,accent=C.teal){rect(slide,x,y,w,h,fill,C.line,12);shape(slide,'rect',x,y,7,h,accent,accent,0);txt(slide,x+20,y+16,w-36,40,title,22,C.navy,true);txt(slide,x+20,y+62,w-36,h-72,body,18,C.ink,false);}

// 1 — cover
{
 const s=p.slides.add();s.background.fill=C.navy;
 shape(s,'rect',0,0,16,720,C.teal,C.teal,0);
 txt(s,76,76,1090,32,'PROBLEM STATEMENT 26249  ·  MINISTRY OF DEFENCE',17,'#A9CFD5',true);
 txt(s,76,165,1040,150,'Air Power\nPredictive Maintenance & Fleet Availability',54,C.white,true);
 shape(s,'rect',76,344,125,6,C.orange,C.orange,0);
 txt(s,76,384,900,76,'Technical approach for a real-data prototype and a secure defence pilot',26,'#D5E1E8',false);
 txt(s,76,540,1040,60,'Real public evidence now  →  authorized fleet integration when available',21,'#A9CFD5',true);
 txt(s,76,674,500,20,'ARCHITECTURE  ·  DATA  ·  MODELS  ·  OPERATIONS',13,'#A9CFD5',true);
 notes(s,'Purpose: explain a practical predictive-maintenance solution while being precise about current data limits. Today the prototype can use real public aviation data and a real general-aviation benchmark. It cannot claim Indian military fleet readiness without authorized MoD/IAF records. The target design is a secure, human-reviewed maintenance decision-support system.');
}
// 2 — architecture
{
 const s=p.slides.add();s.background.fill=C.white;heading(s,'Target system architecture','One governed asset picture connects aircraft health to maintenance and supply decisions',2);
 const xs=[50,293,536,779,1022],w=205,y=218,h=220;
 const titles=['1  SOURCE SYSTEMS','2  SECURE INGEST','3  DATA FOUNDATION','4  ANALYTICS','5  USER ACTION'];
 const bodies=[
 'Aircraft health\nSortie hours / cycles\nTechnical logs\nParts & work orders',
 'Read-only connectors\nBatch / approved stream\nSchema + unit checks\nTime & asset matching',
 'Raw evidence store\nValidated operational data\nAircraft → component graph\nVersioned feature history',
 'Health anomaly scores\nFailure risk / RUL\nAvailability forecast\nParts demand signals',
 'Engineer review\nMaintenance plan\nPart reservation\nFleet readiness view'];
 const fills=[C.pale,'#E7F2F4',C.pale,'#EAF4F0',C.navy2];
 const shapes=[];
 for(let i=0;i<5;i++){const b=rect(s,xs[i],y,w,h,fills[i],i===4?C.navy2:C.line,12);shapes.push(b);txt(s,xs[i]+15,y+17,w-30,35,titles[i],16,i===4?'#BFE1E1':C.teal,true);txt(s,xs[i]+15,y+63,w-30,143,bodies[i],19,i===4?C.white:C.ink,false);}
 for(let i=0;i<4;i++)connect(s,shapes[i],shapes[i+1]);
 // cross-cutting governance band
 rect(s,74,480,1132,88,C.navy,C.navy,10);
 txt(s,98,497,210,27,'CROSS-CUTTING CONTROLS',16,'#A9CFD5',true);
 txt(s,98,528,1080,30,'Role-based access  ·  encryption  ·  audit trail  ·  data lineage  ·  model versioning  ·  human approval',20,C.white,false);
 txt(s,74,601,1115,35,'Feedback loop: confirmed defect, repair action and post-maintenance sensor response return to the governed record.',18,C.muted,false);
 notes(s,'Architecture detail: (1) ingest health monitoring telemetry, flight/sortie hours and cycles, technical logbook defects, work orders, component changes, stock balances and maintenance capacity. (2) Use approved on-prem or defence network connectors; validate source, schema, clock, units, missingness, asset identity and duplicate events before processing. Preserve immutable raw evidence. (3) Link aircraft, engine/component, sortie, fault, maintenance task, part, base/unit and availability periods using stable authorized identifiers. (4) Analytics produce advisory anomaly scores, failure risk and remaining-life estimates only after validation, plus parts and availability forecasts. (5) Engineers review evidence, approve action and record actual findings; the model never autonomously grounds an aircraft or closes a technical record. Security controls apply end-to-end.');
}
// 3 — data and model strategy
{
 const s=p.slides.add();s.background.fill=C.white;heading(s,'Real-data strategy and model path','Use public evidence to validate the workflow; use authorized fleet data to train the operational model',3);
 // three wide columns, no decorative photo; editable diagrams
 const x1=52,x2=455,x3=858,w=360,y=180,h=270;
 boxTitleBody(s,x1,y,w,h,'REAL PUBLIC EVIDENCE','India context\nDGCA / IndiGo operational aggregates\nAAIB occurrence counts\n\nAircraft-level condition is not published.',C.pale,C.teal);
 boxTitleBody(s,x2,y,w,h,'REAL SENSOR BENCHMARK','NGAFID general-aviation records\nCessna 172S flight 813 case trace\n“Low Oil Pressure” event label\n\nBenchmark only — not Indian defence.',C.teal2,C.orange);
 rect(s,x3,y,w,h,C.navy2,C.navy2,12);
 shape(s,'rect',x3,y,7,h,'#A9CFD5','#A9CFD5',0);
 txt(s,x3+20,y+16,w-36,40,'AUTHORIZED FLEET DATA',22,'#BFE1E1',true);
 txt(s,x3+20,y+62,w-36,h-72,'Health sensors + flight hours/cycles\nDefect and maintenance labels\nPart issues + stock position\nGrounding / return-to-service times\n\nRequired for IAF deployment.',18,C.white,false);
 const a=shape(s,'rightArrow',415,283,34,40,C.orange,C.orange,0);const b=shape(s,'rightArrow',818,283,34,40,C.orange,C.orange,0);
 // analytics lane
 rect(s,52,490,1166,112,'#F7F9FA',C.line,10);
 txt(s,76,505,245,28,'MODEL DEVELOPMENT',17,C.teal,true);
 const steps=[['01','Align & label'],['02','Build per-type baselines'],['03','Train / compare'],['04','Validate by aircraft & time'],['05','Pilot with engineer review']];
 const sx=[76,300,524,748,972];
 steps.forEach((v,i)=>{shape(s,'ellipse',sx[i],546,28,28,i===4?C.orange:C.teal,i===4?C.orange:C.teal,0);txt(s,sx[i],549,28,19,v[0],12,C.white,true,'center');txt(s,sx[i]+38,546,180,34,v[1],18,C.ink,true);if(i<4)line(s,sx[i]+192,560,sx[i+1]-15,560,C.line,2)});
 txt(s,58,618,1140,28,'Validation: split by aircraft and time; report false-alert rate, precision/recall, RUL error, lead time and engineer acceptance.',17,C.muted,false);
 notes(s,'Sources and evidence: India operational context uses IndiGo’s published operational statistics page, which says values are as reported by DGCA (https://www.goindigo.in/information/investor-relations/operational-statistics/domestic.html), and AAIB annual accident/incident statistics (https://aaib.gov.in/Accidenetstatistics.html). The real sensor case and event labels are from the NGAFID-LOCI-GATS public dataset (CC BY 4.0; https://huggingface.co/datasets/CDuong04/NGAFID-LOCI-GATS-Data). The separate NGAFID aviation maintenance benchmark record contains flight recordings linked to maintenance labels and is multiple gigabytes (https://doi.org/10.5281/zenodo.6624956). The Cessna event example validates ingestion and visualization only; it is not a trained or validated defence model. Target defence sources must be provided through an authorized MoD/IAF channel. Data preparation: retain provenance, units, aircraft/component identity, source timestamps and maintenance outcome; exclude post-failure data from pre-failure features. Split by aircraft identity and chronological period to prevent leakage.');
}
// 4 — decision workflow
{
 const s=p.slides.add();s.background.fill=C.white;heading(s,'Predictive-maintenance decision workflow','Every alert carries evidence, an owner and an auditable next step',4);
 const y=230,w=205,h=185,xs=[50,293,536,779,1022];
 const t=['MONITOR','TRIAGE','PLAN','EXECUTE','LEARN'];
 const body=[
 'Stream sensor trends\nTrack hours / cycles\nCompare by platform\nCheck data quality',
 'Rank health alert\nShow signal history\nLink defect history\nEngineer confirms',
 'Suggest inspection\nEstimate time window\nCheck parts & capacity\nPlanner approves',
 'Issue work order\nReserve component\nRecord labour / finding\nUpdate service status',
 'Verify after repair\nClose / revise label\nMeasure alert quality\nRefresh model safely'];
 const bs=[];
 for(let i=0;i<5;i++){let b=rect(s,xs[i],y,w,h,i===4?C.navy2:(i===1?C.orange2:C.pale),i===4?C.navy2:C.line,12);bs.push(b);txt(s,xs[i]+16,y+17,w-32,32,t[i],18,i===4?'#BFE1E1':(i===1?C.orange:C.teal),true);txt(s,xs[i]+16,y+61,w-32,h-75,body[i],18,i===4?C.white:C.ink,false)}
 for(let i=0;i<4;i++)connect(s,bs[i],bs[i+1]);
 rect(s,76,478,1125,111,C.teal2,C.teal2,10);
 txt(s,99,494,1080,30,'ENGINEER-IN-THE-LOOP SAFETY GATE',17,C.teal,true);
 txt(s,99,529,1060,50,'AI recommends and explains. Authorized engineering staff decide whether to inspect, defer, ground or release the aircraft.',22,C.navy,true);
 txt(s,76,609,1100,27,'Alert payload: asset + component · signal and time window · comparison baseline · confidence · suggested action · source record',17,C.muted,false);
 notes(s,'The workflow prevents a model score from becoming an unsupported maintenance instruction. Source data enters with quality status and provenance. The model returns a ranked advisory with an explanation (sensor trend, operating regime, relevant history), not a diagnosis. Engineering staff confirm the alert against the approved technical procedure and create/approve a maintenance task. The planner sees work scope, skill requirements, part stock/location and predicted return-to-service impacts. The maintainer records the actual finding, replacement/repair, labour and closeout; follow-up telemetry and service outcomes become labels after review. All actions are versioned and auditable.');
}
// 5 — fleet and parts
{
 const s=p.slides.add();s.background.fill=C.white;heading(s,'Fleet availability and spares logic','Combine aircraft status with work orders, parts and maintenance capacity to forecast readiness',5);
 // formula visual
 rect(s,58,172,415,182,C.navy,C.navy,12);
 txt(s,84,194,360,31,'READINESS MEASURE',17,'#BFE1E1',true);
 txt(s,84,239,366,72,'Serviceable aircraft ÷\ntotal fleet',29,C.white,true);
 txt(s,84,323,360,20,'Show status coverage; unknown ≠ serviceable',16,'#BFE1E1',false);
 // three inputs into planner
 const inputs=[['WORK ORDERS','Open task · priority\nrequired skill · duration'],['PARTS','On hand · reserved\nreorder point · lead time'],['CAPACITY','Available technicians\nbase / agency workload']];
 const yy=[180,305,430];const src=[];
 for(let i=0;i<3;i++){let b=rect(s,545,yy[i],270,92,i===1?C.orange2:C.pale,C.line,10);src.push(b);txt(s,565,yy[i]+13,230,23,inputs[i][0],16,i===1?C.orange:C.teal,true);txt(s,565,yy[i]+39,230,44,inputs[i][1],17,C.ink,false)}
 let planner=rect(s,936,268,273,145,C.teal2,C.teal,2);txt(s,958,287,230,31,'PLANNING ENGINE',19,C.teal,true);txt(s,958,328,230,70,'Rank safe maintenance windows\nHighlight parts constraints\nShow readiness by date',18,C.ink,false);
 src.forEach(x=>connect(s,x,planner,C.teal));
 // lower rule
 line(s,58,540,1208,540,C.line,1);
 txt(s,68,561,1130,33,'Forecast output',18,C.navy,true);
 txt(s,68,596,1125,46,'Expected serviceable count by date  ·  aircraft blocked by missing parts  ·  tasks at risk of delay  ·  “why” behind each forecast',18,C.muted,false);
 notes(s,'Availability must use an authoritative, time-stamped serviceability state and a defined denominator. Do not infer defence fleet availability from public civil aircraft departures or accident counts. The planning layer joins each open work order to aircraft/component, task duration and skill, spares reservations and stock, base/agency capacity, and expected return-to-service time. It can then calculate constraints and scenario forecasts such as “if part X arrives on date D, aircraft A could return after task T.” This is decision support: the planning forecast does not authorize dispatch or override maintenance release rules. Missing or stale status is shown as unknown, never silently counted serviceable.');
}
// 6 — security, rollout, data request
{
 const s=p.slides.add();s.background.fill=C.white;heading(s,'Secure rollout and data requirements','Start with a small authorized pilot, prove value, then extend across platforms',6);
 const phases=[['1','DISCOVER','Confirm owner, data authority,\nplatform and approved network'],['2','CONNECT','Map real feeds; validate IDs,\ntime, units and status'],['3','SHADOW','Run alerts beside current process;\nmeasure misses and false alarms'],['4','PILOT','Engineer-reviewed recommendations;\nrecord outcomes and savings'],['5','SCALE','Approve platform-specific models;\nmonitor drift and audit changes']];
 const x=[54,291,528,765,1002],y=170,w=205,h=150,sh=[];
 phases.forEach((v,i)=>{let b=rect(s,x[i],y,w,h,i===4?C.navy2:C.pale,i===4?C.navy2:C.line,11);sh.push(b);shape(s,'ellipse',x[i]+15,y+15,30,30,i===4?C.orange:C.teal,i===4?C.orange:C.teal,0);txt(s,x[i]+15,y+20,30,18,v[0],15,C.white,true,'center');txt(s,x[i]+56,y+17,135,24,v[1],16,i===4?'#BFE1E1':C.teal,true);txt(s,x[i]+16,y+59,w-32,84,v[2],17,i===4?C.white:C.ink,false)});for(let i=0;i<4;i++)connect(s,sh[i],sh[i+1]);
 txt(s,58,355,1120,31,'AUTHORIZED DATA REQUEST  /  MINIMUM USEFUL PILOT',18,C.navy,true);
 const cols=[['HEALTH','Timestamp · aircraft/component key\nsensor value · unit · operating regime'],['MAINTENANCE','Defect code · finding · task\nopened/closed · return-to-service'],['OPERATIONS & SUPPLY','Flight hours/cycles · status history\npart issue/stock · team capacity']];
 cols.forEach((c,i)=>{const xx=58+i*390;line(s,xx,399,xx+340,399,i===1?C.orange:C.teal,4);txt(s,xx,414,345,24,c[0],16,i===1?C.orange:C.teal,true);txt(s,xx,450,350,70,c[1],17,C.ink,false)});
 rect(s,58,557,1150,71,C.orange2,C.orange2,9);
 txt(s,78,572,1100,47,'Security boundary: deploy only on an MoD-approved environment; apply least-privilege access, encryption, audit logs and explicit engineering approval. Do not send restricted data to public services.',17,C.ink,true);
 notes(s,'Pilot gates: (1) data owner and operational authority approve the scope and data handling. (2) Integrate one platform/unit with pseudonymized stable IDs where possible; preserve source timestamps, component hierarchy and units. (3) Run in shadow mode with no effect on dispatch or maintenance release; compare alerts to engineer findings and quantify false alarms and missed events. (4) Enable advisory recommendations only after engineering acceptance criteria and governance approval. (5) Scale per platform with independent validation, change control, model versioning and drift monitoring. Ask for authorized/sanitized exports of health telemetry, hours/cycles, technical defects, work orders with opened/closed/return-to-service time, part issues and stock position, and serviceability history. Data minimization and approved network placement are design controls; the user organization determines classification and handling requirements.');
}
// previews and candidate draft
const draft=path.join(TMP_DIR,'candidate.pptx');await (await PresentationFile.exportPptx(p)).save(draft);
for(let i=0;i<p.slides.items.length;i++){const slide=p.slides.items[i];const img=await p.export({slide,format:'png',scale:1});await fs.writeFile(path.join(TMP_DIR,`slide-${i+1}.png`),new Uint8Array(await img.arrayBuffer()));const layout=await slide.export({format:'layout'});await fs.writeFile(path.join(TMP_DIR,`slide-${i+1}.layout.json`),await layout.text());}
console.log(`Draft exported: ${draft}; slides=${p.slides.items.length}; font=${font}`);


