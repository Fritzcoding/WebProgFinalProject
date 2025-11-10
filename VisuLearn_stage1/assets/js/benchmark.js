// assets/js/benchmark.js
(function(){
  function randomArray(n){ const a = new Array(n); for(let i=0;i<n;i++) a[i]=Math.floor(Math.random()*100000); return a; }
  function bubble(a){ const n=a.length; for(let i=0;i<n;i++){ for(let j=0;j<n-1-i;j++){ if(a[j]>a[j+1]){ const t=a[j]; a[j]=a[j+1]; a[j+1]=t; } } } return a; }
  function merge(a){
    if(a.length<=1) return a;
    const m = Math.floor(a.length/2);
    const left = merge(a.slice(0,m));
    const right = merge(a.slice(m));
    let res=[],i=0,j=0;
    while(i<left.length || j<right.length){
      if(j>=right.length || (i<left.length && left[i]<=right[j])) res.push(left[i++]);
      else res.push(right[j++]);
    }
    return res;
  }
  function quick(a){
    if(a.length<=1) return a;
    const pivot = a[Math.floor(a.length/2)];
    const left = [], right = [], mid=[];
    for(const v of a){ if(v<pivot) left.push(v); else if(v>pivot) right.push(v); else mid.push(v); }
    return quick(left).concat(mid, quick(right));
  }
  function measure(fn, arr){
    const t0 = performance.now();
    fn(arr.slice());
    const t1 = performance.now();
    return t1-t0;
  }
  document.getElementById('bench-run').addEventListener('click', ()=>{
    const n = parseInt(document.getElementById('bench-size').value,10);
    const repeats = parseInt(document.getElementById('bench-repeats').value,10) || 1;
    const results = {bubble:0,merge:0,quick:0};
    for(let r=0;r<repeats;r++){
      const arr = randomArray(n);
      results.bubble += measure(bubble, arr);
      results.merge += measure(merge, arr);
      results.quick += measure(quick, arr);
    }
    for(const k in results) results[k] = (results[k]/repeats).toFixed(2);
    const out = document.getElementById('bench-results');
    out.innerHTML = '<h3>Average time (ms) for n='+n+'</h3><ul><li>Bubble: '+results.bubble+' ms</li><li>Merge: '+results.merge+' ms</li><li>Quick: '+results.quick+' ms</li></ul>';
  });
})();
