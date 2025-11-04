/* Enhanced Sorting Visualizer with better animations and state management */
(function(window){
  class SortingVisualizer {
    constructor(container, opts = {}) {
      this.container = container;
      this.onUpdate = opts.onUpdate || function(){};
      this.onPseudo = opts.onPseudo || function(){};
      this.onMessage = opts.onMessage || function(){};
      this.array = [];
      this.bars = [];
      this.metrics = { comps: 0, swaps: 0 };
      this.history = [];
      this.pointer = -1;
      this.running = false;
      this.paused = false;
      this.currentAlg = null;
      this.speed = 160;
      this.pseudoMap = {
        selection: `// Selection Sort
for i = 0 to n-1
  min = i
  for j = i+1 to n-1
    if a[j] < a[min]
      min = j
  swap(a[i], a[min])`,
        insertion: `// Insertion Sort
for i = 1 to n-1
  key = a[i]
  j = i - 1
  while j >= 0 and a[j] > key
    a[j+1] = a[j]
    j = j - 1
  a[j+1] = key`,
        merge: `// Merge Sort
mergeSort(a, left, right)
  if left < right
    mid = floor((left + right) / 2)
    mergeSort(a, left, mid)
    mergeSort(a, mid+1, right)
    merge(a, left, mid, right)`
      };
    }

    setExamples(arr){ this.examples = arr; }

    generate(n){
      this.array = Array.from({length: n}, () => Math.floor(Math.random() * 300) + 5);
      this._reset();
      this._animateBars('pop-in');
    }

    loadExample(idx){
      if(!this.examples || !this.examples[idx]) return;
      this.array = this.examples[idx].array.slice();
      this._reset();
      this._animateBars('pop-in');
    }

    _reset(){
      this.container.innerHTML = '';
      this.bars = []; 
      this.metrics = { comps: 0, swaps: 0 };
      this.history = []; 
      this.pointer = -1; 
      this.running = false; 
      this.paused = false;
      
      const max = Math.max(...this.array, 1);
      for(let i = 0; i < this.array.length; i++){
        const el = document.createElement('div');
        el.className = 'bar state-default';
        el.style.height = `${(this.array[i] / max) * 100}%`;
        el.textContent = this.array.length < 40 ? this.array[i] : '';
        this.container.appendChild(el);
        this.bars.push(el);
      }
      this._pushState();
      this.onUpdate(this.metrics);
    }

    _pushState(){
      this.history = this.history.slice(0, this.pointer + 1);
      this.history.push({ 
        arr: this.array.slice(), 
        metrics: {...this.metrics} 
      });
      this.pointer = this.history.length - 1;
    }

    async run(alg, speed){
      if (this.running) return;
      
      this.speed = speed; 
      this.currentAlg = alg;
      this.onPseudo(this.pseudoMap[alg] || '');
      
      try {
        if(alg === 'selection') await this._selectionSort();
        else if(alg === 'insertion') await this._insertionSort();
        else if(alg === 'merge') await this._mergeSortDriver();
        
        // Final animation when complete
        await this._celebrateCompletion();
      } catch (error) {
        if (error.message !== 'PAUSED') {
          this.onMessage('Sorting was interrupted', 'error');
        }
      }
    }

    pause(){ 
      this.paused = true; 
      this.running = false; 
    }

    resume(){ 
      this.paused = false; 
      this.running = true; 
    }

    async step(){
      if(this.pointer < this.history.length - 1){
        this.pointer++;
        const s = this.history[this.pointer];
        this.array = s.arr.slice();
        this.metrics = {...s.metrics};
        this._applyToDOM();
        this.onUpdate(this.metrics);
        return;
      }
      
      if (!this.currentAlg) {
        this.onMessage('Please select an algorithm first', 'error');
        return;
      }
      
      this.paused = false; 
      this.running = true;
      // For step mode, we'll run one iteration at a time
      await this._runSingleStep();
      this.paused = true; 
      this.running = false;
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
      const max = Math.max(...this.array, 1);
      for(let i = 0; i < this.array.length; i++){
        const el = this.bars[i];
        el.style.height = `${(this.array[i] / max) * 100}%`;
        el.textContent = this.array.length < 40 ? this.array[i] : '';
        
        // Remove all state classes
        el.className = el.className.replace(/\bstate-\w+/g, '');
        
        if(highlights[i]) {
          el.classList.add(highlights[i]);
        } else {
          el.classList.add('state-default');
        }
      }
    }

    _sleep(ms){ 
      return new Promise(r => setTimeout(r, ms)); 
    }

    _animateBars(animationType){
      this.bars.forEach((bar, i) => {
        bar.style.animation = 'none';
        setTimeout(() => {
          if (animationType === 'pop-in') {
            bar.style.transform = 'scaleY(0)';
            bar.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
              bar.style.transform = 'scaleY(1)';
           