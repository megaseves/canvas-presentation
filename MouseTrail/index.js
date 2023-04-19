const previousBtn = document.querySelector('.back');

previousBtn.addEventListener('click', () => {
   window.location.href = 'http://localhost:63342/Canvas%20Presentation/Mario/index.html?_ijt=c8ov49177bduvvpolfpqdunllf&_ij_reload=RELOAD_ON_SAVE';
});

window.addEventListener('keydown', (e) => {
   if (e.key === 'Backspace') {
      window.location.href = 'http://localhost:63342/Canvas%20Presentation/Mario/index.html?_ijt=c8ov49177bduvvpolfpqdunllf&_ij_reload=RELOAD_ON_SAVE';
   }
});