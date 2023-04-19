const previousBtn = document.querySelector('.back');

previousBtn.addEventListener('click', () => {
   window.location.href = 'http://localhost:63342/canvas-presentation/Cat/index.html?_ijt=6n14rkebp72atsuvns9km1o5io&_ij_reload=RELOAD_ON_SAVE';
});

window.addEventListener('keydown', (e) => {
   if (e.key === 'Backspace') {
      window.location.href = 'http://localhost:63342/canvas-presentation/Cat/index.html?_ijt=6n14rkebp72atsuvns9km1o5io&_ij_reload=RELOAD_ON_SAVE';
   }
});


// Next
const nextBtn = document.querySelector('.next');

nextBtn.addEventListener('click', () => {
   window.location.href = 'http://localhost:63342/canvas-presentation/RagingSea/dist/index.html?_ijt=3v74hifirrjvl7gsff3b1h85ns&_ij_reload=RELOAD_ON_SAVE';
});

window.addEventListener('keydown', (e) => {
   if (e.key === 'Enter') {
      window.location.href = 'http://localhost:63342/canvas-presentation/RagingSea/dist/index.html?_ijt=3v74hifirrjvl7gsff3b1h85ns&_ij_reload=RELOAD_ON_SAVE';
   }
});
