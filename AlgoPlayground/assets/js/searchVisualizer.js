/* Binary search visualizer */
(function(window){
  class SearchVisualizer {
    constructor(container, opts = {}) {
      this.container = container;
      this.onPseudo = opts.onPseudo || function(){};
      this.array = [];
      this.bars = [];
      this.history = [];
      this.pointer = -1;
      this.speed = 300;
      this.paused = false;
      this.running = false;
      this.probes = 0;
      this.pseudo = `binarySearch(a, target)\n  low = 0\n  high = len(a) - 1\n  while low <= high\n    mid = (low+high)//2\n    if a[mid] == target return mid\n    else if a[mid] < target low = mid + 1\n    else high = mid - 1`;
    }

    generateSorted(n){
      this.array = Array.from({length:n}, (_,i)=> i*3 + Math.floor(Math.random()*3));
      this._reset();
    }

    _reset(){
      this.container.innerHTML=''; this.bars=[]; this.history=[]; this.pointer=-1; this.probes=0;
      const max = Math.max(...this.array,1);
      this.array.forEach(v=>{
        const el = document.createElement('div');
        el.className = 'bar';
        el.style.height = `${(v/max)*100}%`;
        el.style.background = 'linear-gradient(180deg,#0b74de,#0563a6)';
        el.title = v;
        this.container.appendChild(el);
        this.bars.push(el);
      });
      this._pushState();
      this.onPseudo(this.pseudo);
    }

    _pushState(){ this.history = this.history.slice(0,this.pointer+1); this.history.push({arr:this.array.slice(), probes:this.probes}); this.pointer=this.history.length-1; }

    _apply(highlights = {}){ const max = Math.max(...this.array,1); this.array.forEach((v,i)=>{ const el=this.bars[i]; el.style.height = `${(v/max)*100}%`; if(highlights[i]) el.style.background = highlights[i]; else el.style.background='linear-gradient(180deg,#0b74de,#0563a6)'; el.textContent = this.array.length<40? v : ''; }); }

    _sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

    async run(target, speed){
      this.speed = speed; this.running=true; this.paused=false;
      let low = 0, high = this.array.length -1;
      while(low <= high){
        if(this.paused){ await this._wait(); }
        let mid = Math.floor((low+high)/2);
        this.probes++;
        this._apply({[mid]:'linear-gradient(180deg,#f59e0b,#d97706)', [low]:'linear-gradient(180deg,#06b6d4,#0891b2)', [high]:'linear-gradient(180deg,#06b6d4,#0891b2)'});
        this._pushState();
        await this._sleep(this.speed);
        if(this.array[mid] === target){
          this._apply({[mid]:'linear-gradient(180deg,#10b981,#047857)'}); this._pushState(); break;
        } else if(this.array[mid] < target){
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      this.running=false;
    }

    pause(){ this.paused = true; }
    resume(){ this.paused = false; }
    async step(){
      if(this.pointer < this.history.length -1){
        this.pointer++; const s = this.history[this.pointer]; this.array = s.arr.slice(); this.probes = s.probes; this._apply(); return;
      }
      this.paused=false; this.running=true;
      // run tiny bit not implemented for binary; user should start with startBtn
      this.paused=true; this.running=false;
    }
    back(){
      if(this.pointer > 0){ this.pointer--; const s = this.history[this.pointer]; this.array = s.arr.slice(); this.probes = s.probes; this._apply(); }
    }
    _wait(){ return new Promise(r=>{ const id = setInterval(()=>{ if(!this.paused){ clearInterval(id); r(); } },50); }); }
  }
  window.SearchVisualizer = SearchVisualizer;
})(window);
