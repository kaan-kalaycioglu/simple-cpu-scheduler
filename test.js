// Usage: node test.js cpu-scheduler.html
// Extracts the engine from the HTML file and compares it to HAND-CALCULATED expected results.
const fs=require('fs');
const html=fs.readFileSync(process.argv[2]||'cpu-scheduler.html','utf8');
const code=html.split('//ENGINE-START')[1].split('//ENGINE-END')[0];
const {validate,schedule,analyze,checks}=new Function(code+';return{validate,schedule,analyze,checks};')();

const W={
 A:[['P1',0,8],['P2',1,4],['P3',2,2],['P4',4,1]],
 B:[['P1',2,3],['P2',2,1],['P3',8,2],['P4',9,1]],
 C:[['P1',3,2],['P2',6,1],['P3',7,2]],
 D:[['P1',0,4],['P2',2,2],['P3',1,2],['P4',1,2]],
 E:[['P1',0,7],['P2',2,4],['P3',4,1],['P4',5,4]]};
// [workload, algo, quantum, expected timeline, avgTAT, avgWT, avgRT]  (all derived by hand)
const C_ALL='IDLE 0-3,P1 3-5,IDLE 5-6,P2 6-7,P3 7-9';
const T=[
 ['A','FCFS',0,'P1 0-8,P2 8-12,P3 12-14,P4 14-15',10.5,6.75,6.75],
 ['A','SJF',0,'P1 0-8,P4 8-9,P3 9-11,P2 11-15',9,5.25,5.25],
 ['A','SRTF',0,'P1 0-1,P2 1-2,P3 2-4,P4 4-5,P2 5-8,P1 8-15',6.25,2.5,0],
 ['A','RR',2,'P1 0-2,P2 2-4,P3 4-6,P1 6-8,P4 8-9,P2 9-11,P1 11-13,P1 13-15',8.5,4.75,1.75],
 ['A','RR',1,'P1 0-1,P2 1-2,P1 2-3,P3 3-4,P2 4-5,P1 5-6,P4 6-7,P3 7-8,P2 8-9,P1 9-10,P2 10-11,P1 11-12,P1 12-13,P1 13-14,P1 14-15',8.5,4.75,0.75],
 ['A','RR',4,'P1 0-4,P2 4-8,P3 8-10,P4 10-11,P1 11-15',9.25,5.5,3.75],
 ['B','FCFS',0,'IDLE 0-2,P1 2-5,P2 5-6,IDLE 6-8,P3 8-10,P4 10-11',2.75,1,1],
 ['B','SJF',0,'IDLE 0-2,P2 2-3,P1 3-6,IDLE 6-8,P3 8-10,P4 10-11',2.25,0.5,0.5],
 ['B','SRTF',0,'IDLE 0-2,P2 2-3,P1 3-6,IDLE 6-8,P3 8-10,P4 10-11',2.25,0.5,0.5],
 ['B','RR',2,'IDLE 0-2,P1 2-4,P2 4-5,P1 5-6,IDLE 6-8,P3 8-10,P4 10-11',2.75,1,0.75],
 ...['FCFS','SJF','SRTF'].map(a=>['C',a,0,C_ALL,5/3,0,0]),['C','RR',2,C_ALL,5/3,0,0],
 ['D','FCFS',0,'P1 0-4,P3 4-6,P4 6-8,P2 8-10',6,3.5,3.5],
 ['D','SJF',0,'P1 0-4,P3 4-6,P4 6-8,P2 8-10',6,3.5,3.5],
 ['D','SRTF',0,'P1 0-1,P3 1-3,P4 3-5,P2 5-7,P1 7-10',5.25,2.75,1.25],
 ['D','RR',2,'P1 0-2,P3 2-4,P4 4-6,P2 6-8,P1 8-10',6,3.5,2],
 ['E','FCFS',0,'P1 0-7,P2 7-11,P3 11-12,P4 12-16',8.75,4.75,4.75],
 ['E','SJF',0,'P1 0-7,P3 7-8,P2 8-12,P4 12-16',8,4,4],
 ['E','SRTF',0,'P1 0-2,P2 2-4,P3 4-5,P2 5-7,P4 7-11,P1 11-16',7,3,0.5],
 ['E','RR',2,'P1 0-2,P2 2-4,P1 4-6,P3 6-7,P2 7-9,P4 9-11,P1 11-13,P4 13-15,P1 15-16',9,5,1.5]];

let fail=0,pass=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m);}};
const procs=r=>r.map(([id,at,bt])=>({id,at,bt}));
const fmt=s=>s.map(x=>`${x.pid===null?'IDLE':x.pid} ${x.start}-${x.end}`).join(',');
for(const [w,a,q,tl,tat,wt,rt] of T){
  const P=procs(W[w]),s=schedule(P,a,q),r=analyze(P,s),n=`${w}/${a}${a==='RR'?' q='+q:''}`;
  ok(fmt(s)===tl,`${n} timeline\n  got      ${fmt(s)}\n  expected ${tl}`);
  ok(Math.abs(r.avg.tat-tat)<1e-9&&Math.abs(r.avg.wt-wt)<1e-9&&Math.abs(r.avg.rt-rt)<1e-9,`${n} averages got ${r.avg.tat},${r.avg.wt},${r.avg.rt}`);
  checks(P,s,r).forEach(c=>ok(c.ok,`${n} property: ${c.name}`));
}
console.log(`Hand-calculated cases: ${T.length} configurations checked`);

// Randomised property tests
let seed=12345;const rnd=m=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed%m;};
let runs=0;
for(let k=0;k<3000;k++){
  const n=1+rnd(7),P=[];for(let i=0;i<n;i++)P.push({id:'P'+(i+1),at:rnd(15),bt:1+rnd(8)});
  const tats={};
  for(const a of ['FCFS','SJF','SRTF','RR']){
    const q=1+rnd(5),s=schedule(P,a,q),r=analyze(P,s);runs++;
    checks(P,s,r).forEach(c=>ok(c.ok,`random ${a} ${JSON.stringify(P)} q=${q}: ${c.name}`));
    tats[a]=r.avg.tat;
  }
  ok(tats.SRTF<=tats.SJF+1e-9,'SRTF avg TAT should not exceed SJF '+JSON.stringify(P));
  ok(tats.SRTF<=tats.FCFS+1e-9,'SRTF avg TAT should not exceed FCFS '+JSON.stringify(P));
}
console.log(`Random workloads: 3000 (${runs} simulations) checked against 5 properties`);

// Input validation
const bad=(rows,a,q,frag)=>{const e=validate(rows,a,q).errs;ok(e.length>0&&e.join('|').includes(frag),`validate should reject (${frag}) got ${JSON.stringify(e)}`);};
bad([],'FCFS','2','at least one');
bad([{id:'P1',at:'0',bt:'3'},{id:'P1',at:'1',bt:'2'}],'FCFS','2','duplicate');
bad([{id:'',at:'0',bt:'3'}],'FCFS','2','ID is empty');
bad([{id:'P1',at:'-1',bt:'3'}],'FCFS','2','arrival');
bad([{id:'P1',at:'1.5',bt:'3'}],'FCFS','2','arrival');
bad([{id:'P1',at:'',bt:'3'}],'FCFS','2','arrival');
bad([{id:'P1',at:'0',bt:'0'}],'FCFS','2','burst');
bad([{id:'P1',at:'0',bt:'abc'}],'FCFS','2','burst');
bad([{id:'P1',at:'0',bt:'3'}],'RR','0','quantum');
bad([{id:'P1',at:'0',bt:'3'}],'RR','1.5','quantum');
ok(validate([{id:'P1',at:'0',bt:'3'}],'FCFS','abc').errs.length===0,'quantum ignored for non-RR');
console.log('Validation cases checked');

console.log(fail?`\n${fail} FAILURES (${pass} passed)`:`\nALL PASSED (${pass} assertions)`);
process.exit(fail?1:0);
