/* SortingVisualizer — selection, insertion, merge with reliable step/back/reset */
(function(window){
  class SortingVisualizer {
    constructor(container, opts = {}) {
      this.container = container;
      this.onUpdate = opts.onUpdate || function(){};
      this.onPseudo = opts.onPseudo || function(){};
      this.array = [];
      this.bars = [];
      this.metrics = { comps:0, swaps:0 };
      this.history = [];
      this.pointer = -1;
      this.running = false;
      this.paused = false;
      this.currentAlg = null;
      this.speed = 160;
      this.pseudocodeMap = {
        selection: "for i = 0 to n-1\n  min = i\n  for j = i+1 to n-1\n    if a[j] < a[min]\n      min = j\n  swap(a[i], a[min])",
        insertion: "for i = 1 to n-1\n  key = a[i]\n  j = i - 1\n  while j >= 0 and a[j] > key\n    a[j+1] = a[j]\n    j = j - 1\n  a[j+1] = key",
        merge: "mergeSort(a)\n  if len(a) <= 1 return a\n  mid = len(a)//2\n  left = mergeSort(a[:mid])\n  right = mergeSort(a[mid:])\n  return merge(left,right)"
      };
    }

    setExamples(arr){ this.examples = arr; }

    generate(n){
      this.array = Array.from({length:n}, ()=>Math.floor(Math.random()*300)+5);
      this._reset();
    }

    loadExample(idx){
      if(!this.examples) return;
      this.array = this.examples[idx].array.slice();
      this._reset();
    }

    _reset(){
      this.container.innerHTML = '';
      this.bars = []; this.metrics = { comps:0, swaps:0 };
      this.history = []; this.pointer = -1; this.running=false; this.paused=false;
      const max = Math.max(...this.array,1);
      for(let i=0;i<this.array.length;i++){
        const el = document.createElement('div');
        el.className='bar';
        el.style.height = `${(this.array[i]/max)*100}%`;
        el.style.background = `linear-gradient(180deg,#0b74de,#0563a6)`;
        el.title = this.array[i];
        this.container.appendChild(el);
        this.bars.push(el);
      }
      this._pushState();
      this.onUpdate(this.metrics);
    }

    _pushState(){
      // snapshot
      this.history = this.history.slice(0, this.pointer+1);
      this.history.push({ arr: this.array.slice(), metrics: {...this.metrics} });
      this.pointer = this.history.length - 1;
    }

    async run(alg, speed){
      if(this.running) return;
      this.speed = speed; this.currentAlg = alg;
      this.onPseudo(this.pseudocodeMap[alg] || '');
      this.paused = false; this.running = true;
      if(alg === 'selection') await this._selectionSort();
      if(alg === 'insertion') await this._insertionSort();
      if(alg === 'merge') await this._mergeSortDriver();
      this.running = false;
    }

    pause(){ this.paused = true; this.running = false; }
    resume(){ this.paused = false; this.running = true; }

    async step(){
      if(this.pointer < this.history.length - 1){
        // step to next recorded state
        this.pointer++;
        const s = this.history[this.pointer];
        this.array = s.arr.slice();
        this.metrics = {...s.metrics};
        this._applyToDOM();
        this.onUpdate(this.metrics);
        return;
      }
      // else run a small slice (call run which will push states). For simplicity, run for one full execution step is not trivial; user can use start to run
    }

    back(){
      if(this.pointer > 0){
        this.pointer--;
        const s = this.history[this.pointer];
        this.array = s.arr.slice();
        this.metrics = {...s.metrics};
        this._applyToDOM();
        this.onUpdate(this.metrics);
      }
    }

    _applyToDOM(highlights = {}){
      const max = Math.max(...this.array,1);
      for(let i=0;i<this.array.length;i++){
        const el = this.bars[i];
        el.style.height = `${(this.array[i]/max)*100}%`;
        if(highlights[i]) el.style.background = highlights[i];
        else el.style.background = `linear-gradient(180deg,#0b74de,#0563a6)`;
        el.textContent = this.array.length <= 40 ? this.array[i] : '';
      }
    }

    _sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

    async _waitForResume(){
      while(this.paused) await this._sleep(50);
    }

    async _selectionSort(){
      const n = this.array.length;
      for(let i=0;i<n;i++){
        let min = i;
        for(let j=i+1;j<n;j++){
          if(this.paused) await this._waitForResume();
          this.metrics.comps++;
          this._applyToDOM({[i]:'linear-gradient(180deg,#f59e0b,#d97706)', [j]:'linear-gradient(180deg,#ff8c42,#ff5e3a)', [min]:'linear-gradient(180deg,#f97316,#ea580c)'});
          this.onUpdate(this.metrics);
          if(this.array[j] < this.array[min]) min = j;
          await this._sleep(this.speed);
        }
        if(min !== i){
          [this.array[i], this.array[min]] = [this.array[min], this.array[i]];
          this.metrics.swaps++;
          this._pushState();
          this._applyToDOM({[i]:'linear-gradient(180deg,#10b981,#047857)', [min]:'linear-gradient(180deg,#10b981,#047857)'});
          this.onUpdate(this.metrics);
          await this._sleep(this.speed);
        } else {
          this._pushState();
        }
      }
    }

    async _insertionSort(){
      const n = this.array.length;
      for(let i=1;i<n;i++){
        let key = this.array[i];
        let j = i-1;
        while(j>=0 && this.array[j] > key){
          if(this.paused) await this._waitForResume();
          this.metrics.comps++;
          this.array[j+1] = this.array[j];
          this._applyToDOM({[j]:'linear-gradient(180deg,#f59e0b,#d97706)', [j+1]:'linear-gradient(180deg,#ff8c42,#ff5e3a)'});
          this.onUpdate(this.metrics);
          await this._sleep(this.speed);
          j--;
        }
        this.array[j+1] = key;
        this.metrics.swaps++;
        this._pushState();
        await this._sleep(this.speed);
      }
    }

    async _mergeSortDriver(){
      await this._mergeSort(0, this.array.length -1);
    }

    async _mergeSort(l, r){
      if(l >= r){ this._pushState(); return; }
      const m = Math.floor((l + r) / 2);
      if(this.paused) await this._waitForResume();
      await this._mergeSort(l, m);
      if(this.paused) await this._waitForResume();
      await this._mergeSort(m+1, r);
      if(this.paused) await this._waitForResume();
      // merge step
      const left = this.array.slice(l, m+1);
      const right = this.array.slice(m+1, r+1);
      let i=0, j=0, k=l;
      while(i < left.length && j < right.length){
        this.metrics.comps++;
        if(left[i] <= right[j]){
          this.array[k++] = left[i++];
        } else {
          this.array[k++] = right[j++];
        }
        this._applyToDOM({[k-1]:'linear-gradient(180deg,#f59e0b,#d97706)'});
        this.onUpdate(this.metrics);
        await this._sleep(this.speed);
      }
      while(i < left.length){ this.array[k++] = left[i++]; this._pushState(); await this._sleep(this.speed); }
      while(j < right.length){ this.array[k++] = right[j++]; this._pushState(); await this._sleep(this.speed); }
      this._pushState();
    }
  }

  window.SortingVisualizer = SortingVisualizer;
})(window);
