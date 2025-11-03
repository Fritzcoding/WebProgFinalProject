/* graphVisualizer.js
   Basic graph editor + BFS animation.
   Exposes window.GraphVisualizer for main wiring.
*/
(function(window){
  class GraphVisualizer {
    constructor(container, opts = {}) {
      this.container = container;
      this.nodes = []; // {id,x,y,el}
      this.edges = []; // {from,to,el}
      this.nodeCounter = 0;
      this.selectedNode = null;
      this.modeAddEdge = false;
      this.onVisitedChange = opts.onVisitedChange || function(){};
      this._initEvents();
    }

    _initEvents(){
      // click to select node (handled per node)
    }

    addNode(x = 60 + Math.random()*200, y = 60 + Math.random()*200){
      const id = 'N' + (++this.nodeCounter);
      const el = document.createElement('div');
      el.className = 'node';
      el.textContent = id;
      el.style.left = (x - 22) + 'px';
      el.style.top = (y - 22) + 'px';
      el.draggable = false;
      el.dataset.id = id;
      this.container.appendChild(el);
      const node = { id, x, y, el, adj: new Set() };
      this.nodes.push(node);

      // drag support
      let dragging = false, startX=0, startY=0;
      el.addEventListener('pointerdown', (ev)=>{
        ev.preventDefault();
        dragging = true;
        el.style.cursor = 'grabbing';
        startX = ev.clientX; startY = ev.clientY;
      });
      window.addEventListener('pointermove', (ev)=>{
        if(!dragging) return;
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        startX = ev.clientX; startY = ev.clientY;
        const rect = this.container.getBoundingClientRect();
        const curX = parseFloat(el.style.left) + dx;
        const curY = parseFloat(el.style.top) + dy;
        el.style.left = curX + 'px';
        el.style.top = curY + 'px';
        node.x = curX + 22; node.y = curY + 22;
        this._updateEdges();
      });
      window.addEventListener('pointerup', ()=> {
        dragging = false;
        el.style.cursor = 'grab';
      });

      // click to select or create edge
      el.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        if(this.modeAddEdge){
          if(!this.selectedNode){
            this.selectedNode = node;
            el.style.boxShadow = '0 0 0 4px rgba(11,116,222,0.18)';
          } else if(this.selectedNode.id !== node.id){
            this.addEdge(this.selectedNode.id, node.id);
            this.selectedNode.el.style.boxShadow = '';
            this.selectedNode = null;
          }
        } else {
          // toggle selection
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

      return node;
    }

    addEdge(fromId, toId){
      const from = this.nodes.find(n=>n.id===fromId);
      const to = this.nodes.find(n=>n.id===toId);
      if(!from || !to) return;
      // Avoid duplicate
      if(from.adj.has(to.id)) return;
      from.adj.add(to.id);
      to.adj.add(from.id); // undirected graph for BFS demo
      const el = document.createElement('canvas');
      el.className = 'edge';
      el.width = this.container.clientWidth;
      el.height = this.container.clientHeight;
      this.container.appendChild(el);
      this.edges.push({ from: from.id, to: to.id, el });
      this._updateEdges();
    }

    _updateEdges(){
      // clear and redraw all edge canvases
      this.edges.forEach(edge => {
        const canvas = edge.el;
        canvas.width = this.container.clientWidth;
        canvas.height = this.container.clientHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);
        const f = this.nodes.find(n=>n.id===edge.from);
        const t = this.nodes.find(n=>n.id===edge.to);
        if(!f || !t) return;
        const x1 = f.x - 22 - this.container.getBoundingClientRect().left;
        const y1 = f.y - 22 - this.container.getBoundingClientRect().top;
        const x2 = t.x - 22 - this.container.getBoundingClientRect().left;
        const y2 = t.y - 22 - this.container.getBoundingClientRect().top;
        ctx.beginPath();
        ctx.moveTo(x1+22, y1+22);
        ctx.lineTo(x2+22, y2+22);
        ctx.strokeStyle = 'rgba(80,80,80,0.12)';
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    }

    clear(){
      this.nodes.forEach(n=> n.el.remove());
      this.edges.forEach(e=> e.el.remove());
      this.nodes = []; this.edges = []; this.nodeCounter = 0; this.selectedNode = null;
    }

    loadExampleGraph(obj){
      this.clear();
      // place nodes evenly
      const w = this.container.clientWidth, h = this.container.clientHeight;
      const N = obj.nodes.length;
      obj.nodes.forEach((n,i)=>{
        const angle = (i/N) * Math.PI*2;
        const x = w/2 + Math.cos(angle)*Math.min(w,h)/4;
        const y = h/2 + Math.sin(angle)*Math.min(w,h)/4;
        const node = this.addNode(x,y);
        node.id = obj.nodes[i].id || node.id;
        node.el.textContent = node.id;
      });
      // remap ids if necessary
      // add edges
      (obj.edges || []).forEach(e => this.addEdge(e[0], e[1]));
      this._updateEdges();
    }

    async runBFS(startId){
      const start = this.nodes.find(n=>n.id===startId);
      if(!start) return;
      // BFS with visualization
      const q = [start.id];
      const visited = new Set([start.id]);
      let visitedCount = 1;
      this._markNode(start.id, 'visiting');
      this.onVisitedChange(visitedCount);
      while(q.length){
        const cur = q.shift();
        // highlight current
        this._markNode(cur, 'current');
        await this._sleep(500);
        const curNode = this.nodes.find(n=>n.id===cur);
        const neighbors = Array.from(curNode.adj);
        for(const nb of neighbors){
          if(!visited.has(nb)){
            visited.add(nb);
            q.push(nb);
            visitedCount++;
            this._markNode(nb, 'visiting');
            this.onVisitedChange(visitedCount);
            await this._sleep(400);
          }
        }
        this._markNode(cur, 'visited');
        await this._sleep(250);
      }
    }

    _markNode(id, state){
      const n = this.nodes.find(x=>x.id===id);
      if(!n) return;
      if(state === 'current') n.el.style.background = 'linear-gradient(180deg,#ff8c42,#ff5e3a)';
      else if(state === 'visiting') n.el.style.background = 'linear-gradient(180deg,#f59e0b,#d97706)';
      else if(state === 'visited') n.el.style.background = 'linear-gradient(180deg,#06b6d4,#0891b2)';
    }

    _sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
  }

  window.GraphVisualizer = GraphVisualizer;
})(window);
