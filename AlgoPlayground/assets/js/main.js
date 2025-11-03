/* main.js — app wiring for sorting & graph pages */
document.addEventListener('DOMContentLoaded', ()=> {
  // COMMON: fetch examples JSON
  let examplesData = null;
  fetch('assets/data/examples.json').then(r=>r.json()).then(d=>{
    examplesData = d;
    // populate sorting examples dropdown if present
    const select = document.getElementById('exampleSelect');
    if(select && d.sorting){
      d.sorting.forEach((s,i)=> {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = s.name;
        select.appendChild(opt);
      });
    }
    // populate examples page automatically (examples.html uses its own fetch; this is optional)
    // populate graph example select if needed
    const startNodeSelect = document.getElementById('startNodeSelect');
    if(startNodeSelect) {
      // will be filled when graph nodes created (we also add default sample)
    }
  }).catch(err => console.warn('examples load failed', err));

  // SORTING PAGE SETUP
  const visualizerContainer = document.getElementById('visualizer');
  if(visualizerContainer && window.SortVisualizer){
    const sizeEl = document.getElementById('size');
    const sizeVal = document.getElementById('sizeVal');
    const genBtn = document.getElementById('genBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepBtn = document.getElementById('stepBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedEl = document.getElementById('speed');
    const compEl = document.getElementById('comp');
    const swapsEl = document.getElementById('swaps');
    const algorithmSelect = document.getElementById('algorithm');
    const exampleSelect = document.getElementById('exampleSelect');
    const loadExampleBtn = document.getElementById('loadExampleBtn');
    const pseudocodeEl = document.getElementById('pseudocode');

    const visualizer = new SortVisualizer(visualizerContainer, {
      onUpdateMetrics: (c,s) => { compEl.textContent = c; swapsEl.textContent = s; },
      onPseudocode: (code) => { pseudocodeEl.textContent = code; }
    });

    sizeVal.textContent = sizeEl.value;
    sizeEl.addEventListener('input', ()=> sizeVal.textContent = sizeEl.value );
    genBtn.addEventListener('click', ()=> visualizer.generateRandom(parseInt(sizeEl.value,10)));
    loadExampleBtn.addEventListener('click', ()=>{
      const idx = parseInt(exampleSelect.value,10);
      if(!isNaN(idx) && examplesData && examplesData.sorting) visualizer.loadExample(idx);
    });
    startBtn.addEventListener('click', async ()=>{
      startBtn.disabled = true; pauseBtn.disabled = false;
      await visualizer.run(algorithmSelect.value, parseInt(speedEl.value,10));
      startBtn.disabled = false; pauseBtn.disabled = true;
    });
    pauseBtn.addEventListener('click', ()=> { visualizer._paused = true; pauseBtn.disabled = true; startBtn.disabled=false; });
    stepBtn.addEventListener('click', ()=> visualizer.step());
    resetBtn.addEventListener('click', ()=> visualizer.reset());

    // set examples if already loaded
    if(examplesData && examplesData.sorting) visualizer.setExamples(examplesData.sorting);
    // default generate
    visualizer.generateRandom(parseInt(sizeEl.value,10));

    // keyboard support
    window.addEventListener('keydown', (e)=>{
      if(e.code === 'Space'){ e.preventDefault(); if(!visualizer._paused){ visualizer._paused = true; pauseBtn.disabled=true; startBtn.disabled=false } else { visualizer._paused=false; pauseBtn.disabled=false; startBtn.disabled=true; } }
      if(e.key === 'ArrowRight') visualizer.step();
      if(e.key === 'ArrowLeft') {
        // step back
        if(visualizer._pointer > 0) {
          visualizer._pointer--; const s = visualizer._stateHistory[visualizer._pointer];
          visualizer.array = s.array.slice(); visualizer.metrics = {...s.metrics}; visualizer._applyArrayToDOM(); visualizer.onUpdateMetrics(visualizer.metrics.comps, visualizer.metrics.swaps);
        }
      }
    });
  }

  // GRAPH PAGE SETUP
  const graphCanvas = document.getElementById('graphCanvas');
  if(graphCanvas && window.GraphVisualizer){
    const addNodeBtn = document.getElementById('addNodeBtn');
    const addEdgeBtn = document.getElementById('addEdgeBtn');
    const bfsBtn = document.getElementById('bfsBtn');
    const clearBtn = document.getElementById('clearBtn');
    const startNodeSelect = document.getElementById('startNodeSelect');
    const visitedCount = document.getElementById('visitedCount');
    const resetGraphBtn = document.getElementById('resetGraphBtn');

    const graph = new GraphVisualizer(graphCanvas, {
      onVisitedChange: (cnt) => { visitedCount.textContent = cnt; }
    });

    addNodeBtn.addEventListener('click', ()=> {
      const n = graph.addNode(60 + Math.random()*300, 60 + Math.random()*200);
      _refreshStartSelect();
    });
    addEdgeBtn.addEventListener('click', ()=> {
      graph.modeAddEdge = !graph.modeAddEdge;
      addEdgeBtn.textContent = graph.modeAddEdge ? 'Finish Edge Mode' : 'Add Edge';
      if(!graph.modeAddEdge && graph.selectedNode) { graph.selectedNode.el.style.boxShadow=''; graph.selectedNode=null; }
    });
    clearBtn.addEventListener('click', ()=> { graph.clear(); _refreshStartSelect(); visitedCount.textContent='0'; });
    bfsBtn.addEventListener('click', async ()=>{
      const startId = startNodeSelect.value;
      if(!startId) return alert('請選擇開始節點');
      visitedCount.textContent = '0';
      await graph.runBFS(startId);
    });
    resetGraphBtn.addEventListener('click', ()=> {
      // restore node colors
      graph.nodes.forEach(n => n.el.style.background = 'linear-gradient(180deg,#0b74de,#0563a6)');
      visitedCount.textContent = '0';
    });

    function _refreshStartSelect(){
      startNodeSelect.innerHTML = '<option value="">(選擇開始節點)</option>';
      graph.nodes.forEach(n => {
        const opt = document.createElement('option'); opt.value = n.id; opt.textContent = n.id; startNodeSelect.appendChild(opt);
      });
    }

    // load default graph example if available
    fetch('assets/data/examples.json').then(r=>r.json()).then(d=>{
      if(d.graphs && d.graphs.length){
        graph.loadExampleGraph(d.graphs[0]);
        setTimeout(()=> _refreshStartSelect(), 200);
      }
    }).catch(()=>{});
    // refresh on resize to redraw edges
    window.addEventListener('resize', ()=> { if(graph && graph._updateEdges) graph._updateEdges(); });
  }

});
