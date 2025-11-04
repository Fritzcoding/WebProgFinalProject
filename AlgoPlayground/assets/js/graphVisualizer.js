/* GraphVisualizer — improved, single canvas for edges, BFS & DFS */
(function(window){
  class GraphVisualizer {
    constructor(container, opts = {}) {
      this.container = container;
      this.nodes = []; // {id, x, y, el, adj:Set}
      this.edges = []; // {from, to}
      this.nextId = 1;
      this.modeAddEdge = false;
      this.selectedNode = null;
      this.onVisited = opts.onVisited || function(){};
      this._createEdgeCanvas();
      this._initEvents();
    }

    _createEdgeCanvas(){
      const canvas = document.createElement('canvas');
      canvas.className = 'edge-canvas';
      canvas.width = this.container.clientWidth;
      canvas.height = this.container.clientHeight;
      this.container.appendChild(canvas);
      this.edgeCanvas = canvas;
      this.ctx = canvas.getContext('2d');
      window.addEventListener('resize', ()=> this._resizeCanvas());
    }

    _resizeCanvas(){
      if(!this.edgeCanvas) return;
      this.edgeCanvas.width = this.container.clientWidth;
      this.edgeCanvas.height = this.container.clientHeight;
      this._drawEdges();
    }

    _initEvents(){
      this.container.addEventListener('click', (e)=>{
        if(e.target === this.container && !this.modeAddEdge){
          const rect = this.container.getBoundingClientRect();
          this.addNode(e.clientX - rect.left, e.clientY - rect.top);
        }
      });
    }

    addNode(x=60,y=60){
      const id = 'N' + this.nextId++;
      const el = document.createElement('div');
      el.className = 'node';
      el.textContent = id;
      el.style.left = (x - 23) + 'px';
      el.style.top = (y - 23) + 'px';
      this.container.appendChild(el);
      const node = { id, x: x, y: y, el, adj: new Set() };
      this.nodes.push(node);

      // drag handling
      let dragging = false, sx=0, sy=0;
      el.addEventListener('pointerdown', (ev)=>{
        ev.preventDefault(); dragging = true; sx = ev.clientX; sy = ev.clientY; el.setPointerCapture(ev.pointerId); el.style.cursor='grabbing';
      });
      window.addEventListener('pointermove', (ev)=>{
        if(!dragging) return;
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        sx = ev.clientX; sy = ev.clientY;
        const curLeft = parseFloat(el.style.left), curTop = parseFloat(el.style.top);
        el.style.left = (curLeft + dx) + 'px'; el.style.top = (curTop + dy) + 'px';
        node.x = curLeft + dx + 23; node.y = curTop + dy + 23;
        this._drawEdges();
      });
      window.addEventListener('pointerup', ()=> { dragging = false; el.style.cursor='grab'; });

      // click handling
      el.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        if(this.modeAddEdge){
          if(!this.selectedNode){
            this.selectedNode = node;
            el.style.boxShadow = '0 0 0 6px rgba(11,116,222,0.12)';
          } else if(this.selectedNode.id !== node.id){
            this.addEdge(this.selectedNode.id, node.id);
            this.selectedNode.el.style.boxShadow = '';
            this.selectedNode = null;
          }
        } else {
          // selection toggle
          if(this.selectedNode && this.selectedNode.id === node.id){
            this.selectedNode.el.style.boxShadow = '';
            this.selectedNode = null;
          } else {
            if(this.selectedNode) this.selectedNode.el.style.boxShadow = '';
            this.selectedNode = node;
            el.style.boxShadow = '0 6px 18px rgba(2,6,23,.12)';
          }
        }
      });

      this._drawEdges();
      return node;
    }

    addEdge(aId, bId){
      const a = this.nodes.find(n=>n.id===aId), b = this.nodes.find(n=>n.id===bId);
      if(!a || !b) return;
      if(a.adj.has(b.id)) return; // already
      a.adj.add(b.id); b.adj.add(a.id);
      this.edges.push({ from: a.id, to: b.id });
      this._drawEdges();
    }

    clear(){
      this.nodes.forEach(n=> n.el.remove());
      this.nodes = []; this.edges = []; this.nextId = 1; this.selectedNode = null;
      if(this.edgeCanvas) this.ctx.clearRect(0,0,this.edgeCanvas.width, this.edgeCanvas.height);
    }

    _drawEdges(){
      if(!this.ctx) return;
      const ctx = this.ctx;
      ctx.clearRect(0,0,this.edgeCanvas.width, this.edgeCanvas.height);
      const rect = this.container.getBoundingClientRect();
      ctx.lineCap = 'round';
      this.edges.forEach(e=>{
        const a = this.nodes.find(n=>n.id===e.from), b = this.nodes.find(n=>n.id===e.to);
        if(!a || !b) return;
        const x1 = a.x - rect.left, y1 = a.y - rect.top;
        const x2 = b.x - rect.left, y2 = b.y - rect.top;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(20,24,36,0.12)';
        ctx.lineWidth = 4;
        ctx.stroke();
      });
    }

    _sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

    _colorNode(id, state){
      const n = this.nodes.find(x=>x.id===id); if(!n) return;
      if(state === 'visiting') n.el.style.background = 'linear-gradient(180deg,#f59e0b,#d97706)';
      else if(state === 'processing') n.el.style.background = 'linear-gradient(180deg,#ff8c42,#ff5e3a)';
      else if(state === 'visited') n.el.style.background = 'linear-gradient(180deg,#10b981,#047857)';
      else if(state === 'current') n.el.style.background = 'linear-gradient(180deg,#06b6d4,#0891b2)';
    }

    async runBFS(startId, speed = 400){
      if(!startId) return;
      const q = [startId];
      const visited = new Set([startId]);
      let count = 1; this.onVisited(count);
      this._colorNode(startId, 'current');
      while(q.length){
        const cur = q.shift();
        this._colorNode(cur, 'processing');
        await this._sleep(speed);
        const curNode = this.nodes.find(n=>n.id === cur);
        for(const nbId of Array.from(curNode.adj)){
          if(!visited.has(nbId)){
            visited.add(nbId); q.push(nbId); count++; this.onVisited(count);
            this._colorNode(nbId, 'visiting');
            await this._sleep(Math.max(120, speed/2));
          }
        }
        this._colorNode(cur, 'visited');
        await this._sleep(Math.max(120, speed/3));
      }
    }

    async runDFS(startId, speed = 400){
      if(!startId) return;
      const visited = new Set(); let count = 0;
      const dfs = async (u) => {
        visited.add(u); count++; this.onVisited(count);
        this._colorNode(u, 'visiting');
        await this._sleep(speed);
        const node = this.nodes.find(n=>n.id===u);
        for(const nb of Array.from(node.adj)){
          if(!visited.has(nb)) await dfs(nb);
        }
        this._colorNode(u, 'visited'); await this._sleep(Math.max(80, speed/3));
      };
      await dfs(startId);
    }

    loadExampleGraph(obj){
      this.clear();
      const w = this.container.clientWidth, h = this.container.clientHeight;
      const N = obj.nodes.length || 0;
      obj.nodes.forEach((nd,i)=>{
        const angle = (i / Math.max(1,N)) * Math.PI * 2;
        const x = w/2 + Math.cos(angle) * (Math.min(w,h)/4);
        const y = h/2 + Math.sin(angle) * (Math.min(w,h)/4);
        const node = this.addNode(x, y);
        node.id = nd.id || node.id;
        node.el.textContent = node.id;
      });
      obj.edges.forEach(e => this.addEdge(e[0], e[1]));
      this._drawEdges();
    }
  }

  window.GraphVisualizer = GraphVisualizer;
})(window);
