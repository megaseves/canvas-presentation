const nextBtn = document.querySelector('.next');

nextBtn.addEventListener('click', () => {
   window.location.href = 'http://localhost:63342/Canvas%20Presentation/Mario/index.html?_ijt=81c1j4vvpfdhqi9g6gluhfq5hu&_ij_reload=RELOAD_ON_SAVE';
});

window.addEventListener('keydown', (e) => {
   if (e.key === 'Enter') {
      window.location.href = 'http://localhost:63342/Canvas%20Presentation/Mario/index.html?_ijt=81c1j4vvpfdhqi9g6gluhfq5hu&_ij_reload=RELOAD_ON_SAVE';
   }
});