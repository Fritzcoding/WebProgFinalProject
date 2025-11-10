// heap_tree.js — array-backed max-heap with D3 tree rendering + array view
(function(){
  const d3root = window.d3;
  if(!d3root) return;
  function el(id){ return document.getElementById(id); }
  function logTo(elm, txt){ elm.textContent = txt; }

  class MaxHeap {
    constructor(arr){ this.a = arr?arr.slice():[]; this.build(); }
    left(i){ return 2*i+1; }
    right(i){ return 2*i+2; }
    parent(i){ return Math.floor((i-1)/2); }
    swap(i,j){ const t=this.a[i]; this.a[i]=this.a[j]; this.a[j]=t; }
    build(){ for(let i=Math.floor(this.a.length/2)-1;i>=0;i--) this.heapifyDown(i); }
    heapifyUp(i){ while(i>0 && this.a[this.parent(i)]<this.a[i]){ this.swap(i,this.parent(i)); i=this.parent(i); } }
    heapifyDown(i){ const n=this.a.length; while(true){ let l=this.left(i), r=this.right(i), largest=i; if(l<n && this.a[l]>this.a[largest]) largest=l; if(r<n && this.a[r]>this.a[largest]) largest=r; if(largest===i) break; this.swap(i,largest); i=largest; } }
    insert(v){ this.a.push(v); this.heapifyUp(this.a.length-1); }
    extractMax(){ if(this.a.length===0) return null; const m=this.a[0]; const last=this.a.pop(); if(this.a.length>0){ this.a[0]=last; this.heapifyDown(0); } return m; }
    toArray(){ return this.a.slice(); }
  }

  // Convert array to hierarchical nodes for d3.tree
  function arrayToTree(arr){ if(arr.length===0) return null; const nodes = arr.map((v,i)=>({id:i, name:String(v), val:v})); nodes.forEach((n,i)=>{ const l=2*i+1, r=2*i+2; n.children = []; if(l < arr.length) n.children.push(nodes[l]); if(r < arr.length) n.children.push(nodes[r]); if(n.children.length===0) delete n.children; }); return nodes[0]; }

  // Render tree using d3 tree layout
  function renderTree(rootData){ const container = d3root.select('#heap-tree'); container.selectAll('*').remove(); if(!rootData) return; const w = container.node().clientWidth || 420; const h = container.node().clientHeight || 300; const svg = container.append('svg').attr('width',w).attr('height',h);
    const root = d3root.hierarchy(rootData);
    const treeLayout = d3root.tree().size([w-40, h-60]);
    treeLayout(root);
    // links
    svg.append('g').selectAll('line').data(root.links()).join('line')
      .attr('x1',d=>d.source.x+20).attr('y1',d=>d.source.y+20).attr('x2',d=>d.target.x+20).attr('y2',d=>d.target.y+20)
      .attr('stroke','#cbd5e1').attr('stroke-width',2);
    // nodes
    const nodes = svg.append('g').selectAll('g').data(root.descendants()).join('g').attr('transform', d=>'translate('+(d.x+20)+','+(d.y+20)+')');
    nodes.append('circle').attr('r',18).attr('fill','#6c5ce7');
    nodes.append('text').attr('text-anchor','middle').attr('dy',5).attr('fill','#fff').text(d=>d.data.name);
  }

  function renderArrayView(arr){ const el = document.getElementById('heap-array'); el.innerHTML=''; arr.forEach((v,i)=>{ const box = document.createElement('div'); box.className='card'; box.style.minWidth='56px'; box.style.padding='8px'; box.style.display='flex'; box.style.flexDirection='column'; box.style.alignItems='center'; box.innerHTML = '<div style="font-weight:700">'+v+'</div><div style="font-size:12px;color:#6b7280">i:'+i+'</div>'; el.appendChild(box); }); }

  // controls
  const heapInput = el('heap-input'), heapBuildBtn = el('heap-build'), heapInsertBtn = el('heap-insert'), heapExtractBtn = el('heap-extract'), heapReset = el('heap-reset'), heapLog = el('heap-log');
  let heap = new MaxHeap([6,4,8,3,5,7,9]);

  function updateViews(msg){ const arr = heap.toArray(); renderArrayView(arr); renderTree(arrayToTree(arr)); if(msg) logTo(heapLog,msg); }

  heapBuildBtn.addEventListener('click', ()=>{
    const v = heapInput.value.trim(); if(!v) return; const arr = v.split(',').map(s=>Number(s.trim())).filter(x=>!Number.isNaN(x)); heap = new MaxHeap(arr); updateViews('Built from input');
  });
  heapInsertBtn.addEventListener('click', ()=>{
    const v = heapInput.value.trim(); if(!v) { updateViews('Type a number to insert'); return; }
    const last = v.split(',').pop().trim(); const num = Number(last); if(Number.isNaN(num)) { updateViews('Not a number'); return; }
    heap.insert(num); updateViews('Inserted '+num);
  });
  heapExtractBtn.addEventListener('click', ()=>{ const m = heap.extractMax(); updateViews(m===null? 'Heap empty' : 'Extracted '+m); });
  heapReset.addEventListener('click', ()=>{ heap = new MaxHeap([6,4,8,3,5,7,9]); heapInput.value=''; updateViews('Reset'); });

  document.addEventListener('DOMContentLoaded', ()=>{ updateViews('Ready'); });

})();