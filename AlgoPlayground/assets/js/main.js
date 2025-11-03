/* main.js — wires controls to visualizers. Place on all pages. */
document.addEventListener('DOMContentLoaded', ()=> {
  // fetch examples
  let examples = null;
  fetch('assets/data/examples.json').then(r=>r.json()).then(d=> examples = d).catch(()=>{ examples = null; });

  /* -------- SORTING PAGE WIRING -------- */
  const bars = document.getElementById('bars');
  if(bars && window.SortingVisualizer){
    const size = document.getElementById('size');
    const sizeLabel = document.getElementById('sizeLabel');
    const speed = document.getElementById('speed');
    const genBtn = document.getElementById('genBtn');
    const exampleSelect = document.getElementById('exampleSelect');
    const loadExampleBtn = document.getElementById('loadExampleBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepBtn = document.getElementById('stepBtn');
    const backBtn = document.getElementById('backBtn');
    const resetBtn = document.getElementById('resetBtn');
    const comp = document.getElementById('comp');
    const swaps = document.getElementById('swaps');
    const pseudo = document.getElementById('pseudocode');
    const algSelect = document.getElementById('sortAlgorithm');

    const vis = new SortingVisualizer(bars, {
      onUpdate: (m)=> { comp.textContent = m.comps; swaps.textContent = m.swaps; },
      onPseudo: (code)=> { pseudo.textContent = code; }
    });
    if(examples && examples.sorting){
      vis.setExamples(examples.sorting);
      examples.sorting.forEach((s,i)=> {
        const opt = document.createElement('option'); opt.value = i; opt.textContent = s.name; exampleSelect.appendChild(opt);
      });
    }

    sizeLabel.textContent = size.value;
    size.addEventListener('input', ()=> sizeLabel.textContent = size.value);

    genBtn.addEventListener('click', ()=> vis.generate(parseInt(size.value,10)));
    loadExampleBtn.addEventListener('click', ()=> {
      const idx = parseInt(exampleSelect.value,10);
      if(!isNaN(idx)) vis.loadExample(idx);
    });

    startBtn.addEventListener('click', async ()=>{
      startBtn.disabled=true; pauseBtn.disabled=false;
      await vis.run(algSelect.value, parseInt(speed.value,10));
      startBtn.disabled=false; pauseBtn.disabled=true;
    });
    pauseBtn.addEventListener('click', ()=> { vis.paused = true; pauseBtn.disabled=true; startBtn.disabled=false; });
    stepBtn.addEventListener('click', ()=> vis.step());
    backBtn.addEventListener('click', ()=> vis.back());
    resetBtn.addEventListener('click', ()=> vis._reset());

    // initial generate
    vis.generate(parseInt(size.value,10));
  }

  /* -------- BINARY SEARCH PAGE -------- */
  const bsBars = document.getElementById('bsBars');
  if(bsBars && window.SearchVisualizer){
    const size = document.getElementById('bsSize');
    const sizeLabel = document.getElementById('bsSizeLabel');
    const genBtn = document.getElementById('bsGenBtn');
    const startBtn = document.getElementById('bsStartBtn');
    const pauseBtn = document.getElementById('bsPauseBtn');
    const stepBtn = document.getElementById('bsStepBtn');
    const resetBtn = document.getElementById('bsResetBtn');
    const speed = document.getElementById('bsSpeed');
    const targetInput = document.getElementById('targetValue');
    const probes = document.getElementById('probes');
    const pseudo = document.getElementById('bsPseudocode');

    const vis = new SearchVisualizer(bsBars, { onPseudo: (c)=> pseudo.textContent = c });
    sizeLabel.textContent = size.value;
    size.addEventListener('input', ()=> sizeLabel.textContent = size.value);
    genBtn.addEventListener('click', ()=> vis.generateSorted(parseInt(size.value,10)));
    startBtn.addEventListener('click', ()=> {
      probes.textContent = '0';
      vis.run(parseInt(targetInput.value,10), parseInt(speed.value,10)).then(()=> probes.textContent = vis.probes);
      startBtn.disabled=true; pauseBtn.disabled=false;
    });
    pauseBtn.addEventListener('click', ()=> { vis.pause(); pauseBtn.disabled=true; startBtn.disabled=false; });
    stepBtn.addEventListener('click', ()=> vis.step());
    resetBtn.addEventListener('click', ()=> vis._reset());

    vis.generateSorted(parseInt(size.value,10));
  }

  /* -------- GRAPH PAGE -------- */
  const graphArea = document.getElementById('graphArea');
  if(graphArea && window.GraphVisualizer){
    const addNodeBtn = document.getElementById('addNode');
    const addEdgeBtn = document.getElementById('addEdge');
    const clearBtn = document.getElementById('clearGraph');
    const startSelect = document.getElementById('graphStart');
    const runBFS = document.getElementById('runBFS');
    const runDFS = document.getElementById('runDFS');
    const visitedLabel = document.getElementById('gVisited');
    const resetColors = document.getElementById('resetGraphColors');

    const gvis = new GraphVisualizer(graphArea, { onVisited: (c)=> visitedLabel.textContent = c });

    function refreshStartOptions(){
      startSelect.innerHTML = '<option value="">Select start</option>';
      gvis.nodes.forEach(n=> { const o = document.createElement('option'); o.value = n.id; o.textContent = n.id; startSelect.appendChild(o); });
    }

    addNodeBtn.addEventListener('click', ()=> { gvis.addNode(80 + Math.random()*300, 80 + Math.random()*180); refreshStartOptions(); });
    addEdgeBtn.addEventListener('click', ()=> { gvis.modeAddEdge = !gvis.modeAddEdge; addEdgeBtn.textContent = gvis.modeAddEdge ? 'Finish Edge' : 'Add Edge'; if(!gvis.modeAddEdge && gvis.selectedNode) { gvis.selectedNode.el.style.boxShadow=''; gvis.selectedNode=null; } });
    clearBtn.addEventListener('click', ()=> { gvis.clear(); refreshStartOptions(); visitedLabel.textContent='0'; });
    runBFS.addEventListener('click', ()=> { const s = startSelect.value; if(!s) return alert('Choose start node'); visitedLabel.textContent='0'; gvis.runBFS(s, 360); });
    runDFS.addEventListener('click', ()=> { const s = startSelect.value; if(!s) return alert('Choose start node'); visitedLabel.textContent='0'; gvis.runDFS(s, 360); });
    resetColors.addEventListener('click', ()=> { gvis.nodes.forEach(n=> n.el.style.background = 'linear-gradient(180deg,#0b74de,#0563a6)'); visitedLabel.textContent='0'; });

    // load first graph example if present
    if(examples && examples.graphs && examples.graphs.length){
      const g0 = examples.graphs[0];
      // place nodes evenly
      const w = graphArea.clientWidth, h = graphArea.clientHeight;
      g0.nodes.forEach((nd,i)=> {
        const angle = (i / g0.nodes.length) * Math.PI * 2;
        const x = w/2 + Math.cos(angle) * (Math.min(w,h)/4);
        const y = h/2 + Math.sin(angle) * (Math.min(w,h)/4);
        const node = gvis.addNode(x,y);
        node.id = nd.id || node.id;
        node.el.textContent = node.id;
      });
      g0.edges.forEach(e => gvis.addEdge(e[0], e[1]));
      setTimeout(()=> refreshStartOptions(), 200);
    }
  }

  // global keyboard: space toggles pause/resume where applicable
  window.addEventListener('keydown', (e)=>{
    if(e.code === 'Space'){ const s = document.activeElement.tagName; if(['INPUT','TEXTAREA','SELECT'].includes(s)) return; e.preventDefault();
      // try to toggle pause on visible visualizers
      const pauseBtns = document.querySelectorAll('button'); // simple toggle not intrusive
    }
  });
});
