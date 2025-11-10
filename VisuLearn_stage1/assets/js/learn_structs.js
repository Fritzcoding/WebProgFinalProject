// learn_structs.js — Stack, Queue, LinkedList interactive implementations
(function(){
  function by(id){ return document.getElementById(id); }
  // Stack
  const stackInput = by('stack-input'), stackPush = by('stack-push'), stackPop = by('stack-pop'), stackReset = by('stack-reset'), stackCanvas = by('stack-canvas');
  let stack = [];
  function renderStack(){ stackCanvas.innerHTML=''; stack.forEach((v,i)=>{ const box=document.createElement('div'); box.className='card'; box.style.minWidth='80px'; box.style.padding='8px'; box.textContent=v; stackCanvas.appendChild(box); }); }
  stackPush.addEventListener('click', ()=>{ const v=stackInput.value.trim(); if(!v) return; stack.push(v); stackInput.value=''; renderStack(); });
  stackPop.addEventListener('click', ()=>{ if(stack.length===0) return; stack.pop(); renderStack(); });
  stackReset.addEventListener('click', ()=>{ stack=[]; renderStack(); });

  // Queue
  const queueInput = by('queue-input'), qEnq = by('queue-enq'), qDeq = by('queue-deq'), qReset = by('queue-reset'), queueCanvas = by('queue-canvas');
  let queue = [];
  function renderQueue(){ queueCanvas.innerHTML=''; queue.forEach((v,i)=>{ const box=document.createElement('div'); box.className='card'; box.style.padding='8px'; box.style.minWidth='64px'; box.textContent=v; queueCanvas.appendChild(box); }); }
  qEnq.addEventListener('click', ()=>{ const v=queueInput.value.trim(); if(!v) return; queue.push(v); queueInput.value=''; renderQueue(); });
  qDeq.addEventListener('click', ()=>{ if(queue.length===0) return; queue.shift(); renderQueue(); });
  qReset.addEventListener('click', ()=>{ queue=[]; renderQueue(); });

  // Linked List (singly) — visual as boxes with arrows
  const llInput = by('ll-input'), llPush = by('ll-push'), llPop = by('ll-pop'), llInsertPos = by('ll-insert-pos'), llPos = by('ll-pos'), llReset = by('ll-reset'), llCanvas = by('ll-canvas'), llLog = by('ll-log');
  let ll = [];
  function renderLL(){ llCanvas.innerHTML=''; if(ll.length===0){ llCanvas.textContent='(empty)'; return; }
    ll.forEach((v,i)=>{
      const node = document.createElement('div'); node.style.display='flex'; node.style.alignItems='center';
      const box = document.createElement('div'); box.className='card'; box.style.minWidth='72px'; box.style.padding='8px'; box.textContent=v;
      node.appendChild(box);
      if(i < ll.length-1){ const arrow = document.createElement('div'); arrow.style.margin='0 6px'; arrow.innerHTML = '&#8594;'; arrow.style.color='#6b7280'; arrow.style.fontSize='20px'; node.appendChild(arrow); }
      llCanvas.appendChild(node);
    }); }
  function logLL(msg){ llLog.textContent = msg || ''; }
  llPush.addEventListener('click', ()=>{ const v=llInput.value.trim(); if(!v) return; ll.push(v); llInput.value=''; renderLL(); logLL('Pushed '+v); });
  llPop.addEventListener('click', ()=>{ if(ll.length===0){ logLL('Empty'); return; } const v=ll.pop(); renderLL(); logLL('Popped '+v); });
  llInsertPos.addEventListener('click', ()=>{ const v=llInput.value.trim(); const p = parseInt(llPos.value,10); if(!v || Number.isNaN(p) || p<0 || p>ll.length){ logLL('Invalid pos'); return; } ll.splice(p,0,v); renderLL(); logLL('Inserted '+v+' at '+p); });
  llReset.addEventListener('click', ()=>{ ll=[]; renderLL(); logLL('Reset'); });

  document.addEventListener('DOMContentLoaded', ()=>{ renderStack(); renderQueue(); renderLL(); });
})();