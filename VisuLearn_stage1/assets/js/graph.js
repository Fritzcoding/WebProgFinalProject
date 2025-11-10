// Graph lab using D3 force simulation with drag & add
(function(){
  const d3root = window.d3;
  if(!d3root) return;
  let nodes = [{id:'A'},{id:'B'},{id:'C'}];
  let links = [{source:'A',target:'B'},{source:'B',target:'C'},{source:'C',target:'A'}];
  let svg, sim;
  function create(){
    const container = d3root.select('#graph-canvas');
    container.selectAll('*').remove();
    const w = container.node().clientWidth || 800;
    const h = container.node().clientHeight || 420;
    svg = container.append('svg').attr('width',w).attr('height',h);
    sim = d3root.forceSimulation(nodes).force('charge', d3root.forceManyBody().strength(-400)).force('center', d3root.forceCenter(w/2,h/2)).force('link', d3root.forceLink(links).id(d=>d.id).distance(100));
    const link = svg.append('g').attr('class','links').selectAll('line').data(links).join('line').attr('stroke','#cbd5e1').attr('stroke-width',2);
    const node = svg.append('g').attr('class','nodes').selectAll('g').data(nodes, d=>d.id).join(enter=>{
      const g = enter.append('g').call(d3root.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));
      g.append('circle').attr('r',22).attr('fill','#6c5ce7').attr('stroke','#fff').attr('stroke-width',3);
      g.append('text').attr('dy',5).attr('text-anchor','middle').attr('fill','#fff').text(d=>d.id);
      return g;
    });
    sim.on('tick', ()=>{
      link.attr('x1', d=>d.source.x).attr('y1', d=>d.source.y).attr('x2', d=>d.target.x).attr('y2', d=>d.target.y);
      node.attr('transform', d=>'translate('+d.x+','+d.y+')');
    });
    function dragstarted(event,d){ if(!event.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; }
    function dragged(event,d){ d.fx=event.x; d.fy=event.y; }
    function dragended(event,d){ if(!event.active) sim.alphaTarget(0); d.fx=null; d.fy=null; }
    // store handles globally
    window.VISULEARN = window.VISULEARN || {};
    window.VISULEARN.graphsim = {nodes,links,svg,sim,redraw:create};
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    create();
    document.getElementById('add-node').addEventListener('click', ()=>{
      const id = String.fromCharCode(65 + (nodes.length % 26));
      nodes.push({id});
      window.VISULEARN.graphsim.redraw();
    });
    document.getElementById('add-edge').addEventListener('click', ()=>{
      if(nodes.length<2) return;
      links.push({source:nodes[nodes.length-1].id, target:nodes[0].id});
      window.VISULEARN.graphsim.redraw();
    });
    document.getElementById('bfs').addEventListener('click', ()=>{
      // simple BFS highlight wave from first node
      const order = [];
      const map = new Map(nodes.map(n=>[n.id,[]]));
      links.forEach(l=>{ map.get(l.source).push(l.target); map.get(l.target).push(l.source); });
      const start = nodes[0].id;
      const q=[start]; const seen=new Set([start]);
      while(q.length){ const u=q.shift(); order.push(u); (map.get(u)||[]).forEach(v=>{ if(!seen.has(v)){ seen.add(v); q.push(v); } }); }
      // animate highlights
      const svgg = d3root.select('#graph-canvas svg g.nodes');
      order.forEach((id,i)=>{
        setTimeout(()=>{
          svgg.selectAll('g').filter(d=>d.id===id).select('circle').transition().duration(400).attr('fill','#ff7675');
        }, i*500);
        setTimeout(()=>{
          svgg.selectAll('g').filter(d=>d.id===id).select('circle').transition().duration(400).attr('fill','#6c5ce7');
        }, i*500+900);
      });
    });
    document.getElementById('dfs').addEventListener('click', ()=>{ /* similar effect */ document.getElementById('bfs').click(); });
    document.getElementById('reset-graph').addEventListener('click', ()=>{ nodes=[{id:'A'},{id:'B'},{id:'C'}]; links=[{source:'A',target:'B'},{source:'B',target:'C'},{source:'C',target:'A'}]; create(); });
  });
})();