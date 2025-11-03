/* Graph visualizer — interactive nodes + BFS/DFS */
(function(window){
  class GraphVisualizer {
    constructor(container, opts = {}) {
      this.container = container;
      this.nodes = []; // {id, x, y, el, adj:Set()}
      this.edges = []; // {from,to,canvas}
      this.nextId = 1;
      this.modeAddEdge = false;
      this.selectedNode = null;
      this.onVisited = opts.onVisited || function(){};
      this._initEvents();
    }

    _initEvents(){
      this.container.addEventListener('click', (e)=>{
        if(e.target === this.container && !this.modeAddEdge){
          // click background to add node
          const rect = this.container.getBoundingClientRect();
          this.addNode(e.clientX - rect.left, e.clientY - rect.top);
        }
      });
      window.addEventListener('resize', ()=> this._redrawEdges());
    }

    addNode(x=60,y=60){
      const id = 'N' + this.nextId++;
      const el = document.createElement('div');
      el.className = 'node';
      el.textContent = id;
      el.style.left = (x - 23) + 'px';
      el.style.top = (y - 23) + 'px';
      this.container.appendChild(el);
      const node = {id, x: x, y: y, el, adj: new Set()};
      this.nodes.push(node);

      // drag
      let dragging=false, sx=0, sy=0;
      el.addEventListener('pointerdown', (ev)=>{
        ev.preventDefault(); dragging=true; sx=ev.clientX; sy=ev.clientY; el.setPointerCapture(ev.pointerId);
        el.style.cursor='grabbing';
      });
      window.addEventListener('pointermove', (ev)=>{
        if(!dragging) return;
        const rect = this.container.getBoundingClientRect();
        const dx = ev.clientX - sx; const dy = ev.clientY - sy;
        sx = ev.clientX; sy = ev.clientY;
        const curLeft = parseFloat(el.style.left), curTop = parseFloat(el.style.top);
        el.style.left = (curLeft + dx) + 'px'; el.style.top = (curTop + dy) + 'px';
        node.x = curLeft + dx + 23; node.y = curTop + dy + 23;
        this._redrawEdges();
      });
      window.addEventListener('pointerup', ()=> { dragging=false; el.style.cursor='grab'; });

      // click - selection / add edge
      el.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        if(this.modeAddEdge){
          if(!this.selectedNode){ this.selectedNode = node; el.style.boxShadow='0 0 0 6px rgba(11,116,222,0.12)'; }
          else if(this.selectedNode.id !== node.id){ this.addEdge(this.selectedNode.id, node.id); this.selectedNode.el.style.boxShadow=''; this.selectedNode = null; }
        } else {
          // toggle selection
          if(this.selectedNode && this.selectedNode.id === node.id){ this.selectedNode.el.style.boxShadow=''; this.selectedNode=null; }
          else { if(this.selectedNode) this.selectedNode.el.style.boxShadow=''; this.selectedNode=node; node.el.style.boxShadow='0 6px 18px rgba(2,6,23,.12)'; }
        }
      });

      this._redrawEdges();
      return node;
    }

    addEdge(aId, bId){
      const a = this.nodes.find(n=>n.id===aId); const b = this.nodes.find(n=>n.id===bId);
      if(!a||!b) return;
      if(a.adj.has(b.id)) return;
      a.adj.add(b.id); b.adj.add(a.id);
      const canvas = document.createElement('canvas');
      canvas.className='edge';
      canvas.width = this.container.clientWidth; canvas.height = this.container.clientHeight;
      this.container.appendChild(canvas);
      this.edges.push({from:a.id,to:b.id,canvas});
      this._redrawEdges();
    }

    clear(){
      this.nodes.forEach(n=> n.el.remove());
      this.edges.forEach(e=> e.canvas.remove());
      this.nodes = []; this.edges = []; this.nextId=1; this.selectedNode=null;
    }

    _redrawEdges(){
      // order: remove all canvases and redraw
      this.edges.forEach(e=>{
        const c = e.canvas;
        c.width = this.container.clientWidth; c.height = this.container.clientHeight;
        const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
        const a = this.nodes.find(n=>n.id===e.from); const b = this.nodes.find(n=>n.id===e.to);
        if(!a||!b) return;
        const rect = this.container.getBoundingClientRect();
        const x1 = a.x - rect.left, y1 = a.y - rect.top;
        const x2 = b.x - rect.left, y2 = b.y - rect.top;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(20,24,36,0.12)'; ctx.lineWidth = 4; ctx.stroke();
      });
    }

    _sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

    async runBFS(startId, speed = 400){
      if(!startId) return;
      const q = [startId]; const visited = new Set([startId]);
      let count=1; this.onVisited(count);
      this._colorNode(startId,'current');
      while(q.length){
        const cur = q.shift();
        this._colorNode(cur,'processing'); await this._sleep(speed);
        const node = this.nodes.find(n=>n.id===cur);
        for(const nbId of Array.from(node.adj)){
          if(!visited.has(nbId)){
            visited.add(nbId); q.push(nbId); count++; this.onVisited(count);
            this._colorNode(nbId,'visiting'); await this._sleep(Math.max(120, speed/2));
          }
        }
        this._colorNode(cur,'visited'); await this._sleep(Math.max(120, speed/3));
      }
    }

    async runDFS(startId, speed = 400){
      if(!startId) return;
      const visited = new Set();
      let count = 0;
      const dfs = async (u) => {
        visited.add(u); count++; this.onVisited(count);
        this._colorNode(u,'visiting'); await this._sleep(speed);
        const node = this.nodes.find(n=>n.id===u);
        for(const nbId of Array.from(node.adj)){
          if(!visited.has(nbId)){
            await dfs(nbId);
          }
        }
        this._colorNode(u,'visited'); await this._sleep(Math.max(100, speed/3));
      };
      await dfs(startId);
    }

    _colorNode(id, state){
      const n = this.nodes.find(x=>x.id===id); if(!n) return;
      if(state === 'visiting') n.el.style.background = 'linear-gradient(180deg,#f59e0b,#d97706)';
      else if(state === 'processing') n.el.style.background = 'linear-gradient(180deg,#ff8c42,#ff5e3a)';
      else if(state === 'visited') n.el.style.background = 'linear-gradient(180deg,#10b981,#047857)';
      else if(state === 'current') n.el.style.background = 'linear-gradient(180deg,#06b6d4,#0891b2)';
    }
  }

  window.GraphVisualizer = GraphVisualizer;
})(window);
