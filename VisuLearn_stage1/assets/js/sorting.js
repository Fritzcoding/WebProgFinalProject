// Improved sorting visualizer (vanilla JS + d3 for drawing)
(function(){
  const d3root = window.d3;
  if(!d3root) return;
  const canvasEl = document.getElementById('sorting-canvas');
  if(!canvasEl) return;
  let data = [3,7,2,5,9,1,4,6,8,0];
  let speed = 350;
  let algo = 'bubble';
  let steps = [];
  let timer = null;
  let paused = true;

  // --- Code tracing helpers ---
  function clearCodeHighlights(){
    document.querySelectorAll('.code-line').forEach(el=>el.style.background='transparent');
  }
  function highlightCode(algo, idx){
    clearCodeHighlights();
    if(!algo) return;
    const id = algo + '-line-' + idx;
    const el = document.getElementById(id);
    if(el) el.style.background='rgba(255,230,120,0.9)';
  }
  function mapOpToLine(algo, op){
    // returns a line index to highlight for given op and algorithm
    if(algo==='bubble'){
      if(op.type==='compare') return 3;
      if(op.type==='swap') return 4;
      if(op.type==='markSorted') return 7;
      if(op.type==='pick') return 2;
    } else if(algo==='insertion'){
      if(op.type==='pick') return 2;
      if(op.type==='compare') return 4;
      if(op.type==='shift') return 5;
      if(op.type==='insert') return 8;
    } else if(algo==='merge'){
      if(op.type==='write') return 4;
    }
    return null;
  }

  function render(){
    canvasEl.innerHTML = '';
    const w = canvasEl.clientWidth || 700;
    const h = 320;
    const svg = d3root.select(canvasEl).append('svg').attr('width',w).attr('height',h);
    const x = d3root.scaleBand().domain(d3root.range(data.length)).range([10,w-10]).padding(0.12);
    const y = d3root.scaleLinear().domain([0, d3root.max(data)]).range([40,h-20]);
    const g = svg.append('g');
    g.selectAll('rect').data(data).join('rect')
      .attr('class','bar')
      .attr('x',(_,i)=>x(i))
      .attr('y',d=>h - y(d))
      .attr('width', x.bandwidth())
      .attr('height', d=>y(d))
      .style('background','transparent')
      .attr('fill','#6c5ce7')
      .attr('rx',6);
    g.selectAll('text').data(data).join('text')
      .attr('x',(_,i)=>x(i)+x.bandwidth()/2)
      .attr('y',d=>h - y(d) + 18)
      .attr('text-anchor','middle').text(d=>d).attr('fill','white').attr('font-size',12);
  }

  function generateSteps(arr, algorithm){
    const a = arr.slice();
    const ops = [];
    if(algorithm==='bubble'){
      for(let i=0;i<a.length;i++){
        for(let j=0;j<a.length-1-i;j++){
          ops.push({type:'compare',i:j,j:j+1});
          if(a[j]>a[j+1]){ ops.push({type:'swap',i:j,j:j+1}); const t=a[j]; a[j]=a[j+1]; a[j+1]=t; }
        }
        ops.push({type:'markSorted',index:a.length-1-i});
      }
    } else if(algorithm==='insertion'){
      for(let i=1;i<a.length;i++){
        let key=a[i]; let j=i-1;
        ops.push({type:'pick',index:i});
        while(j>=0 && a[j]>key){
          ops.push({type:'compare',i:j,j:j+1});
          ops.push({type:'shift',from:j,to:j+1});
          a[j+1]=a[j]; j--;
        }
        ops.push({type:'insert',index:j+1,val:key}); a[j+1]=key;
      }
    } else if(algorithm==='merge'){
      function mergeSortRange(l,r){
        if(l>=r) return;
        const m=Math.floor((l+r)/2);
        mergeSortRange(l,m); mergeSortRange(m+1,r);
        const left=a.slice(l,m+1), right=a.slice(m+1,r+1);
        let i=0,j=0,k=l;
        while(i<left.length || j<right.length){
          if(i<left.length && (j>=right.length || left[i]<=right[j])){
            ops.push({type:'write',index:k,val:left[i]}); a[k]=left[i]; i++; k++;
          } else {
            ops.push({type:'write',index:k,val:right[j]}); a[k]=right[j]; j++; k++;
          }
        }
      }
      mergeSortRange(0,a.length-1);
    } else if(algorithm==='quick'){
      function qsort(l,r){
        if(l>=r) return;
        let p=a[Math.floor((l+r)/2)]; ops.push({type:'pivot',low:l,high:r,pivotVal:p});
        let i=l,j=r;
        while(i<=j){
          while(a[i]<p){ ops.push({type:'compare',i:i}); i++; }
          while(a[j]>p){ ops.push({type:'compare',i:j}); j--; }
          if(i<=j){ ops.push({type:'swap',i:i,j:j}); const t=a[i]; a[i]=a[j]; a[j]=t; i++; j--; }
        }
        qsort(l,j); qsort(i,r);
      }
      qsort(0,a.length-1);
    }
    return ops;
  }

  function applyOp(op){
    if(!op) return;
    window.lastOp = op;
    if(op.type==='swap'){
      const t=data[op.i]; data[op.i]=data[op.j]; data[op.j]=t;
    } else if(op.type==='shift' || op.type==='insert' || op.type==='write'){
      if(op.type==='insert' || op.type==='write') data[op.index]=op.val;
      else if(op.type==='shift') data[op.to]=data[op.from];
    }
    // re-render with small transition by updating DOM
    const svg = d3root.select('#sorting-canvas svg');
    if(svg.empty()) return;
    const h = +svg.attr('height');
    const x = d3root.scaleBand().domain(d3root.range(data.length)).range([10,+svg.attr('width')-10]).padding(0.12);
    const y = d3root.scaleLinear().domain([0, d3root.max(data)]).range([40,h-20]);
    svg.selectAll('rect').data(data)
      .transition().duration(Math.max(60, speed/3))
      .attr('y', d=>h - y(d)).attr('height', d=>y(d));
    svg.selectAll('text').data(data)
      .transition().duration(Math.max(60, speed/3))
      .text(d=>d).attr('y', d=>h - y(d) + 18);
    // highlight corresponding code line for this op
    try{ const ln=mapOpToLine(algo, lastOp); if(ln!==null) highlightCode(algo, ln); }catch(e){}
  }

  function startPlayback(){
    if(steps.length===0) steps = generateSteps(data, algo);
    if(timer) clearInterval(timer);
    timer = setInterval(()=>{
      if(steps.length===0){ stopPlayback(); document.getElementById('play-btn').textContent='Play'; paused=true; return; }
      const op = steps.shift(); applyOp(op);
    }, Math.max(40, speed/6));
  }
  function stopPlayback(){ if(timer) { clearInterval(timer); timer=null; } }

  // Controls binding
  function bindControls(){
    const sizeRange = document.getElementById('size-range');
    const speedRange = document.getElementById('speed-range');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const playBtn = document.getElementById('play-btn');
    const stepBtn = document.getElementById('step-btn');
    const resetBtn = document.getElementById('reset-btn');
    const algoSelect = document.getElementById('algo-select');
    const arrayInput = document.getElementById('array-input');
    const applyInput = document.getElementById('apply-input');

    sizeRange && sizeRange.addEventListener('input', ()=>{ const n = +sizeRange.value; data = Array.from({length:n}, ()=>Math.floor(Math.random()*100)); render(); steps=[]; });
    speedRange && speedRange.addEventListener('input', ()=> speed = +speedRange.value);
    shuffleBtn && shuffleBtn.addEventListener('click', ()=>{ for(let i=data.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=data[i]; data[i]=data[j]; data[j]=t; } render(); steps=[]; });
    playBtn && playBtn.addEventListener('click', ()=>{ if(paused){ paused=false; playBtn.textContent='Pause'; startPlayback(); } else { paused=true; playBtn.textContent='Play'; stopPlayback(); } });
    stepBtn && stepBtn.addEventListener('click', ()=>{ if(steps.length===0) steps = generateSteps(data, algo); const op = steps.shift(); if(op) applyOp(op); });
    resetBtn && resetBtn.addEventListener('click', ()=>{ stopPlayback(); data=[3,7,2,5,9,1,4,6,8,0]; render(); steps=[]; paused=true; playBtn.textContent='Play'; });
    algoSelect && algoSelect.addEventListener('change', (e)=>{ algo=e.target.value; steps=[]; });
    applyInput && applyInput.addEventListener('click', ()=>{ const val = arrayInput.value.trim(); if(!val) return; const arr = val.split(',').map(s=>+s.trim()).filter(n=>!Number.isNaN(n)); if(arr.length>0){ data=arr; render(); steps=[]; } });
    // Make learn page trace controls hook into same logic if present
    const tracePlay = document.getElementById('trace-play');
    const traceStep = document.getElementById('trace-step');
    const traceReset = document.getElementById('trace-reset');
    if(tracePlay){ tracePlay.addEventListener('click', ()=> playBtn && playBtn.click()); }
    if(traceStep){ traceStep.addEventListener('click', ()=> stepBtn && stepBtn.click()); }
    if(traceReset){ traceReset.addEventListener('click', ()=> resetBtn && resetBtn.click()); }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    render();
    bindControls();
  });
})();