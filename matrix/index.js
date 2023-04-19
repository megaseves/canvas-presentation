const nextBtn = document.querySelector('.next');

nextBtn.addEventListener('click', () => {
   window.location.href = 'http://localhost:63342/canvas-presentation/Mario/index.html?_ijt=6n14rkebp72atsuvns9km1o5io&_ij_reload=RELOAD_ON_SAVE';
});

window.addEventListener('keydown', (e) => {
   if (e.key === 'Enter') {
      window.location.href = 'http://localhost:63342/canvas-presentation/Mario/index.html?_ijt=6n14rkebp72atsuvns9km1o5io&_ij_reload=RELOAD_ON_SAVE';
   }
});