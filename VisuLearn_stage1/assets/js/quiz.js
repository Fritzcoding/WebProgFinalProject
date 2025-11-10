// assets/js/quiz.js
(function(){
  async function loadQuiz(){
    try{
      const res = await fetch('assets/data/quiz.json');
      const qs = await res.json();
      renderQuiz(qs);
    }catch(e){
      document.getElementById('quiz-container').innerText = 'Failed to load quiz: '+e;
    }
  }
  function renderQuiz(qs){
    const c = document.getElementById('quiz-container');
    c.innerHTML='';
    let idx=0, score=0;
    function showQuestion(i){
      const q = qs[i];
      c.innerHTML = '<h3>Q'+(i+1)+': '+q.question+'</h3>';
      const ul = document.createElement('div');
      q.options.forEach(opt=>{
        const btn = document.createElement('button');
        btn.className='btn';
        btn.style.display='block'; btn.style.margin='6px 0';
        btn.textContent = opt;
        btn.onclick = ()=>{
          if(opt===q.answer){ score++; alert('Correct!'); }
          else alert('Wrong — answer: '+q.answer);
          i++;
          if(i<qs.length) showQuestion(i); else finish();
        };
        ul.appendChild(btn);
      });
      c.appendChild(ul);
      const progress = document.createElement('div');
      progress.style.marginTop='8px';
      progress.textContent = 'Progress: '+(i+1)+' / '+qs.length;
      c.appendChild(progress);
    }
    function finish(){
      c.innerHTML = '<h3>Finished</h3><p>Your score: '+score+' / '+qs.length+'</p><button id="retry" class="btn">Retry</button>';
      document.getElementById('retry').onclick = ()=>{ score=0; showQuestion(0); };
    }
    showQuestion(0);
  }
  document.addEventListener('DOMContentLoaded', loadQuiz);
})();
