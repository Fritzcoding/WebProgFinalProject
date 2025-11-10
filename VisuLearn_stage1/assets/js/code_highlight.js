// assets/js/code_highlight.js
(function(){
  function el(id){ return document.getElementById(id); }
  function renderArray(arr){
    const canvas = el('viz-canvas');
    canvas.innerHTML='';
    const w = canvas.clientWidth || 400;
    arr.forEach((v,i)=>{
      const b = document.createElement('div');
      b.className='bar';
      b.style.height = (20 + (v%80)) + 'px';
      b.style.width = Math.max(20, Math.floor(w/arr.length)-6) + 'px';
      b.style.background = 'linear-gradient(180deg,#6c5ce7,#8e7bff)';
      b.style.display='inline-flex'; b.style.margin='0 4px'; b.style.alignItems='flex-end'; b.style.justifyContent='center';
      const label = document.createElement('div'); label.className='bar-label'; label.textContent = v;
      b.appendChild(label);
      canvas.appendChild(b);
    });
  }
  function highlight(line){
    document.querySelectorAll('.code-line').forEach(el=>el.style.background='transparent');
    const node = document.getElementById('line-'+line);
    if(node) node.style.background='rgba(255,234,167,0.6)';
  }
  function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }
  async function runViz(){
    const arr = [5,3,8,1,2];
    renderArray(arr);
    highlight(0); await sleep(400);
    for(let i=0;i<arr.length;i++){
      highlight(1); await sleep(200);
      for(let j=0;j<arr.length-1-i;j++){
        highlight(2); await sleep(200);
        highlight(3); await sleep(120);
        if(arr[j]>arr[j+1]){
          highlight(4);
          await sleep(200);
          const t = arr[j]; arr[j]=arr[j+1]; arr[j+1]=t;
          renderArray(arr);
          await sleep(200);
        }
        highlight(5); await sleep(80);
      }
      highlight(7); await sleep(120);
    }
    highlight(8);
  }
  document.getElementById('viz-run').addEventListener('click', runViz);
  document.getElementById('viz-reset').addEventListener('click', ()=>{ renderArray([5,3,8,1,2]); document.querySelectorAll('.code-line').forEach(el=>el.style.background='transparent'); });
  document.addEventListener('DOMContentLoaded', ()=>{ renderArray([5,3,8,1,2]); });
})();
