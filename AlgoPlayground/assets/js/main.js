/* main.js — enhanced with better error handling and UX */
document.addEventListener('DOMContentLoaded', () => {
  // Global state for examples
  let examples = null;
  
  // Enhanced fetch with loading states
  const loadExamples = async () => {
    try {
      const response = await fetch('assets/data/examples.json');
      if (!response.ok) throw new Error('Failed to load examples');
      examples = await response.json();
      console.log('Examples loaded successfully');
    } catch (error) {
      console.warn('Could not load examples:', error);
      examples = null;
    }
  };

  // Initialize examples
  loadExamples();

  // Utility function to show temporary message
  const showMessage = (message, type = 'info', duration = 3000) => {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type} fade-in`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 1000;
      font-weight: 500;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.style.opacity = '0';
      messageEl.style.transform = 'translateX(100px)';
      setTimeout(() => messageEl.remove(), 300);
    }, duration);
  };

  /* -------- SORTING PAGE WIRING -------- */
  const bars = document.getElementById('bars');
  if (bars && window.SortingVisualizer) {
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
      onUpdate: (m) => { 
        comp.textContent = m.comps; 
        swaps.textContent = m.swaps; 
      },
      onPseudo: (code) => { 
        pseudo.textContent = code; 
        // Add syntax highlighting
        setTimeout(() => highlightPseudocode(pseudo), 10);
      },
      onMessage: showMessage
    });

    // Enhanced examples loading
    const setupExamples = () => {
      if (examples && examples.sorting) {
        vis.setExamples(examples.sorting);
        exampleSelect.innerHTML = '<option value="">Choose example...</option>';
        examples.sorting.forEach((s, i) => {
          const opt = document.createElement('option');
          opt.value = i;
          opt.textContent = s.name;
          exampleSelect.appendChild(opt);
        });
        exampleSelect.disabled = false;
        loadExampleBtn.disabled = false;
      } else {
        exampleSelect.innerHTML = '<option value="">No examples available</option>';
        exampleSelect.disabled = true;
        loadExampleBtn.disabled = true;
      }
    };

    // Update examples when loaded
    const checkExamples = setInterval(() => {
      if (examples !== null) {
        setupExamples();
        clearInterval(checkExamples);
      }
    }, 100);

    // Enhanced event handlers
    sizeLabel.textContent = size.value;
    size.addEventListener('input', () => {
      sizeLabel.textContent = size.value;
      sizeLabel.style.transform = 'scale(1.1)';
      setTimeout(() => sizeLabel.style.transform = 'scale(1)', 200);
    });

    genBtn.addEventListener('click', () => {
      genBtn.classList.add('loading');
      setTimeout(() => {
        vis.generate(parseInt(size.value, 10));
        genBtn.classList.remove('loading');
        showMessage('New array generated', 'success');
      }, 300);
    });

    loadExampleBtn.addEventListener('click', () => {
      const idx = parseInt(exampleSelect.value, 10);
      if (!isNaN(idx) && examples && examples.sorting[idx]) {
        vis.loadExample(idx);
        showMessage(`Loaded: ${examples.sorting[idx].name}`, 'success');
      } else {
        showMessage('Please select a valid example', 'error');
      }
    });

    startBtn.addEventListener('click', async () => {
      if (!algSelect.value) {
        showMessage('Please select an algorithm', 'error');
        return;
      }
      
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      stepBtn.disabled = true;
      backBtn.disabled = true;
      
      try {
        await vis.run(algSelect.value, parseInt(speed.value, 10));
        showMessage('Sorting completed!', 'success');
      } catch (error) {
        showMessage('Sorting was interrupted', 'error');
      } finally {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stepBtn.disabled = false;
        backBtn.disabled = false;
      }
    });

    pauseBtn.addEventListener('click', () => { 
      vis.pause(); 
      pauseBtn.disabled = true; 
      startBtn.disabled = false;
      stepBtn.disabled = false;
      backBtn.disabled = false;
      showMessage('Algorithm paused', 'info');
    });

    stepBtn.addEventListener('click', () => {
      vis.step();
      showMessage('Step executed', 'info', 1000);
    });

    backBtn.addEventListener('click', () => {
      vis.back();
      showMessage('Step reversed', 'info', 1000);
    });

    resetBtn.addEventListener('click', () => { 
      vis._reset();
      showMessage('Visualization reset', 'info');
    });

    // Initial generate with animation
    setTimeout(() => {
      vis.generate(parseInt(size.value, 10));
    }, 500);
  }

  /* -------- BINARY SEARCH PAGE -------- */
  const bsBars = document.getElementById('bsBars');
  if (bsBars && window.SearchVisualizer) {
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

    const vis = new SearchVisualizer(bsBars, { 
      onPseudo: (c) => {
        pseudo.textContent = c;
        setTimeout(() => highlightPseudocode(pseudo), 10);
      },
      onMessage: showMessage
    });

    sizeLabel.textContent = size.value;
    size.addEventListener('input', () => {
      sizeLabel.textContent = size.value;
      sizeLabel.style.transform = 'scale(1.1)';
      setTimeout(() => sizeLabel.style.transform = 'scale(1)', 200);
    });

    genBtn.addEventListener('click', () => {
      genBtn.classList.add('loading');
      setTimeout(() => {
        vis.generateSorted(parseInt(size.value, 10));
        genBtn.classList.remove('loading');
        showMessage('Sorted array generated', 'success');
      }, 300);
    });

    startBtn.addEventListener('click', () => {
      const target = parseInt(targetInput.value, 10);
      if (isNaN(target)) {
        showMessage('Please enter a valid target number', 'error');
        return;
      }
      
      probes.textContent = '0';
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      stepBtn.disabled = true;
      
      vis.run(target, parseInt(speed.value, 10)).then((result) => {
        probes.textContent = vis.probes;
        if (result !== -1) {
          showMessage(`Found target at index ${result}`, 'success');
        } else {
          showMessage('Target not found in array', 'warning');
        }
      }).finally(() => {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stepBtn.disabled = false;
      });
    });

    pauseBtn.addEventListener('click', () => { 
      vis.pause(); 
      pauseBtn.disabled = true; 
      startBtn.disabled = false;
      showMessage('Search paused', 'info');
    });

    stepBtn.addEventListener('click', () => {
      vis.step();
      showMessage('Step executed', 'info', 1000);
    });

    resetBtn.addEventListener('click', () => { 
      vis._reset();
      showMessage('Search reset', 'info');
    });

    // Initial generate
    setTimeout(() => {
      vis.generateSorted(parseInt(size.value, 10));
    }, 500);
  }

  /* -------- GRAPH PAGE -------- */
  const graphArea = document.getElementById('graphArea');
  if (graphArea && window.GraphVisualizer) {
    const addNodeBtn = document.getElementById('addNode');
    const addEdgeBtn = document.getElementById('addEdge');
    const clearBtn = document.getElementById('clearGraph');
    const startSelect = document.getElementById('graphStart');
    const runBFS = document.getElementById('runBFS');
    const runDFS = document.getElementById('runDFS');
    const visitedLabel = document.getElementById('gVisited');
    const resetColors = document.getElementById('resetGraphColors');

    const gvis = new GraphVisualizer(graphArea, { 
      onVisited: (c) => visitedLabel.textContent = c,
      onMessage: showMessage
    });

    function refreshStartOptions() {
      startSelect.innerHTML = '<option value="">Select start node...</option>';
      gvis.nodes.forEach(n => { 
        const o = document.createElement('option'); 
        o.value = n.id; 
        o.textContent = n.id; 
        startSelect.appendChild(o); 
      });
      startSelect.disabled = gvis.nodes.length === 0;
    }

    addNodeBtn.addEventListener('click', () => { 
      const node = gvis.addNode(80 + Math.random() * 300, 80 + Math.random() * 180); 
      refreshStartOptions();
      showMessage(`Added node ${node.id}`, 'success', 1500);
    });

    addEdgeBtn.addEventListener('click', () => { 
      gvis.modeAddEdge = !gvis.modeAddEdge; 
      addEdgeBtn.textContent = gvis.modeAddEdge ? 'Finish Edge' : 'Add Edge';
      addEdgeBtn.classList.toggle('active', gvis.modeAddEdge);
      
      if (!gvis.modeAddEdge && gvis.selectedNode) { 
        gvis.selectedNode.el.style.boxShadow = ''; 
        gvis.selectedNode = null; 
      }
      
      showMessage(gvis.modeAddEdge ? 'Click two nodes to connect them' : 'Edge mode disabled', 'info', 2000);
    });

    clearBtn.addEventListener('click', () => { 
      if (gvis.nodes.length === 0) {
        showMessage('Graph is already empty', 'info');
        return;
      }
      
      if (confirm('Are you sure you want to clear the entire graph?')) {
        gvis.clear(); 
        refreshStartOptions(); 
        visitedLabel.textContent = '0'; 
        showMessage('Graph cleared', 'success');
      }
    });

    runBFS.addEventListener('click', () => { 
      const s = startSelect.value; 
      if (!s) {
        showMessage('Please choose a start node', 'error');
        return;
      }
      visitedLabel.textContent = '0'; 
      runBFS.disabled = true;
      runDFS.disabled = true;
      gvis.runBFS(s, 360).finally(() => {
        runBFS.disabled = false;
        runDFS.disabled = false;
      });
    });

    runDFS.addEventListener('click', () => { 
      const s = startSelect.value; 
      if (!s) {
        showMessage('Please choose a start node', 'error');
        return;
      }
      visitedLabel.textContent = '0'; 
      runBFS.disabled = true;
      runDFS.disabled = true;
      gvis.runDFS(s, 360).finally(() => {
        runBFS.disabled = false;
        runDFS.disabled = false;
      });
    });

    resetColors.addEventListener('click', () => { 
      gvis.nodes.forEach(n => n.el.style.background = 'linear-gradient(180deg,#3b82f6,#1d4ed8)'); 
      visitedLabel.textContent = '0'; 
      showMessage('Node colors reset', 'success');
    });

    // Load first graph example if present
    if (examples && examples.graphs && examples.graphs.length) {
      const checkGraphExamples = setInterval(() => {
        if (examples !== null) {
          const g0 = examples.graphs[0];
          const w = graphArea.clientWidth, h = graphArea.clientHeight;
          
          g0.nodes.forEach((nd, i) => {
            const angle = (i / g0.nodes.length) * Math.PI * 2;
            const x = w/2 + Math.cos(angle) * (Math.min(w, h)/3);
            const y = h/2 + Math.sin(angle) * (Math.min(w, h)/3);
            const node = gvis.addNode(x, y);
            node.id = nd.id || node.id;
            node.el.textContent = node.id;
          });
          
          g0.edges.forEach(e => gvis.addEdge(e[0], e[1]));
          setTimeout(() => {
            refreshStartOptions();
            showMessage(`Loaded example: ${g0.name}`, 'success');
          }, 200);
          
          clearInterval(checkGraphExamples);
        }
      }, 100);
    }
  }

  // Pseudocode syntax highlighting
  function highlightPseudocode(preElement) {
    const code = preElement.textContent;
    const lines = code.split('\n');
    
    let highlighted = '';
    lines.forEach(line => {
      let highlightedLine = line
        .replace(/(for|while|if|else|return|function|var|let|const)\b/g, '<span class="keyword">$1</span>')
        .replace(/([a-zA-Z_][a-zA-Z0-9_]*)\(/g, '<span class="function">$1</span>(')
        .replace(/([0-9]+)/g, '<span class="number">$1</span>')
        .replace(/(\/\/.*$)/g, '<span class="comment">$1</span>');
      
      highlighted += highlightedLine + '\n';
    });
    
    preElement.innerHTML = highlighted;
  }

  // Global keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { 
      const activeTag = document.activeElement.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
      e.preventDefault();
      
      // Toggle pause/resume for active visualizer
      const pauseBtns = document.querySelectorAll('#pauseBtn, #bsPauseBtn');
      pauseBtns.forEach(btn => {
        if (!btn.disabled) btn.click();
      });
    }
    
    // Escape key to cancel edge mode in graph
    if (e.code === 'Escape') {
      const addEdgeBtn = document.getElementById('addEdge');
      if (addEdgeBtn && addEdgeBtn.textContent === 'Finish Edge') {
        addEdgeBtn.click();
      }
    }
  });

  // Add loading animation to page
  document.body.classList.add('fade-in');
});