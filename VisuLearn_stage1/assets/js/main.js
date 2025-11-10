// Shared utilities and small UI behaviors
document.addEventListener('DOMContentLoaded', ()=>{
  // landing bars animation preview
  const landing = document.getElementById('landing-bars');
  if(landing){
    const svg = document.createElement('div');
    svg.style.display='flex';
    svg.style.alignItems='flex-end';
    svg.style.width='320px';
    svg.style.height='160px';
    for(let i=0;i<12;i++){
      const b=document.createElement('div');
      b.className='bar';
      b.style.height=(Math.random()*100+30)+'px';
      b.style.background='linear-gradient(180deg,#6c5ce7,#8e7bff)';
      svg.appendChild(b);
    }
    landing.appendChild(svg);
    setInterval(()=>{
      Array.from(svg.children).forEach((b,i)=>{
        b.style.height=(Math.random()*120+20)+'px';
      });
    },900);
  }

  // nav active highlight based on pathname
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a=>{
    if(a.getAttribute('href')===path) a.classList.add('active');
    else a.classList.remove('active');
  });
});
