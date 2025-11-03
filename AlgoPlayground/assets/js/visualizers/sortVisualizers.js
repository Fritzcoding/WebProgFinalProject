/* sortVisualizer.js — non-module, exposes window.SortVisualizer */
(function(window){
  class SortVisualizer {
    constructor(container, opts = {}) {
      this.container = container;
      this.onUpdateMetrics = opts.onUpdateMetrics || function(){};
      this.onPseudocode = opts.onPseudocode || function(){};
      this.array = [];
      this.bars = [];
      this.metrics = { comps:0, swaps:0 };
      this._speed = 200;
      this._stateHistory = [];
      this._pointer = -1;
      this._paused = false;
      this._running = false;
      this._currentAlgorithm = null;
      this.pseudocode = {
        bubble: "for i=0 to n-1\\n for j=0 to n-i-2\\n  if a[j] > a[j+1]\\n   swap(a[j], a[j+1])",
        selection: "for i=0 to n-1\\n min=i\\n for j=i+1 to n-1\\n  if a[j] < a[min]\\n   min=j\\n swap(a[i], a[min])",
        insertion: "for i=1 to n-1\\n key=a[i]\\n j=i-1\\n while j>=0 and a[j]>key\\n  a[j+1]=a[j]\\n  j--\\n a[j+1]=key"
      };
    }

    setExamples(arr){ this.examples = arr; }

    generateRandom(n){
      this.array = Array.from({length:n}, ()=>Math.floor(Math.random()*300)+5);
      this._resetVisualizer();
    }

    loadExample(index){
      if(!this.examples) return;
      const ex = this.examples[index];
      this.array = ex.array.slice();
      this._resetVisualizer();
    }

    setArray(arr){ this.array = arr.slice(); this._resetVisualizer(); }

    _resetVisualizer(){
      this.container.innerHTML = '';
      this.bars = [];
      this._stateHistory = [];
      this._pointer = -1;
      this.metrics = { comps:0, swaps:0 };
      this.onUpdateMetrics(0,0);
      const max = Math.max(...this.array, 1);
      this.array.forEach((v,i)=>{
        const el = document.createElement('div');
        el.className='bar';
        el.style.height = ((v/max)*100) + '%';
        el.style.background = 'linear-gradient(180deg,#0b74de,#0563a6)';
        el.dataset.index = i;
        this.container.appendChild(el);
        this.bars.push(el);
      });
      this._pushState();
    }

    _pushState(){
      this._stateHistory = this._stateHistory.slice(0, this._pointer+1);
      this._stateHistory.push({ array:this.array.slice(), metrics:{...this.metrics} });
      this._pointer = this._stateHistory.length - 1;
    }

    reset(){
      if(this._stateHistory.length){
        const s = this._stateHistory[0];
        this.array = s.array.slice();
        this.metrics = {...s.metrics};
        this._applyArrayToDOM();
        this.onUpdateMetrics(this.metrics.comps, this.metrics.swaps);
      }
    }

    _applyArrayToDOM(highlight = {}) {
      const max = Math.max(...this.array,1);
      this.array.forEach((v,i)=>{
        const el = this.bars[i];
        el.style.height = ((v/max)*100) + '%';
        el.style.opacity = 1;
        if(highlight[i]) el.style.background = 'linear-gradient(180deg,#ff8c42,#ff5e3a)';
        else el.style.background = 'linear-gradient(180deg,#0b74de,#0563a6)';
      });
    }

    _sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

    async run(algorithm='bubble', speed=200){
      this._speed = speed;
      this.onPseudocode(this.pseudocode[algorithm] || '');
      this._currentAlgorithm = algorithm;
      if(algorithm === 'bubble') await this._runBubble();
      if(algorithm === 'selection') await this._runSelection();
      if(algorithm === 'insertion') await this._runInsertion();
    }

    pause(){ this._paused = true; this._running = false; }
    resume(){ this._paused = false; this._running = true; }

    async step(){
      // if next recorded state exists, move to it
      if(this._pointer < this._stateHistory.length - 1){
        this._pointer++;
        const s = this._stateHistory[this._pointer];
        this.array = s.array.slice();
        this.metrics = {...s.metrics};
        this._applyArrayToDOM();
        this.onUpdateMetrics(this.metrics.comps, this.metrics.swaps);
        return;
      }
      // else, run until a new state is pushed (one logical op)
      this._paused = false;
      this._running = true;
      await this.run(this._currentAlgorithm || 'bubble', Math.max(30, this._speed));
      this._paused = true;
      this._running = false;
    }

    async _runBubble(){
      this._running = true;
      const n = this.array.length;
      for(let i=0;i<n;i++){
        for(let j=0;j<n-i-1;j++){
          if(this._paused) await this._waitResume();
          this.metrics.comps++;
          this._applyArrayToDOM({[j]:true,[j+1]:true});
          this.onUpdateMetrics(this.metrics.comps, this.metrics.swaps);
          if(this.array[j] > this.array[j+1]){
            await this._swap(j,j+1);
          }
          this._pushState();
          if(this._paused) await this._waitResume();
          await this._sleep(this._speed);
        }
      }
      this._running = false;
    }

    async _runSelection(){
      this._running = true;
      const n = this.array.length;
      for(let i=0;i<n;i++){
        let min = i;
        for(let j=i+1;j<n;j++){
          if(this._paused) await this._waitResume();
          this.metrics.comps++;
          if(this.array[j] < this.array[min]) min = j;
          this._applyArrayToDOM({[i]:true,[j]:true,[min]:true});
          this.onUpdateMetrics(this.metrics.comps, this.metrics.swaps);
          await this._sleep(this._speed);
        }
        if(min !== i) await this._swap(i,min);
        this._pushState();
      }
      this._running = false;
    }

    async _runInsertion(){
      this._running = true;
      const n = this.array.length;
      for(let i=1;i<n;i++){
        let key = this.array[i], j=i-1;
        while(j>=0 && this.array[j] > key){
          if(this._paused) await this._waitResume();
          this.metrics.comps++;
          this.array[j+1] = this.array[j];
          this._applyArrayToDOM({[j]:true,[j+1]:true});
          this.onUpdateMetrics(this.metrics.comps, this.metrics.swaps);
          await this._sleep(this._speed);
          j--;
        }
        this.array[j+1] = key;
        this._pushState();
      }
      this._running = false;
    }

    async _swap(i,j){
      this.metrics.swaps++;
      const tmp = this.array[i]; this.array[i] = this.array[j]; this.array[j] = tmp;
      this._applyArrayToDOM({[i]:true,[j]:true});
      this.onUpdateMetrics(this.metrics.comps, this.metrics.swaps);
      await this._sleep(Math.max(20, this._speed/2));
    }

    async _waitResume(){
      this._paused = true;
      while(this._paused) await this._sleep(50);
    }
  }

  window.SortVisualizer = SortVisualizer;
})(window);
