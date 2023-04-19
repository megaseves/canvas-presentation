
// Previous
const previousBtn = document.querySelector('.back');

previousBtn.addEventListener('click', () => {
   window.location.href = 'http://localhost:63342/Canvas%20Presentation/matrix/index.html?_ijt=81c1j4vvpfdhqi9g6gluhfq5hu&_ij_reload=RELOAD_ON_SAVE';
});

window.addEventListener('keydown', (e) => {
   if (e.key === 'Backspace') {
      window.location.href = 'http://localhost:63342/Canvas%20Presentation/matrix/index.html?_ijt=81c1j4vvpfdhqi9g6gluhfq5hu&_ij_reload=RELOAD_ON_SAVE';
   }
});


// Next
const nextBtn = document.querySelector('.next');

nextBtn.addEventListener('click', () => {
   window.location.href = 'http://localhost:63342/Canvas%20Presentation/Cat/index.html?_ijt=c8ov49177bduvvpolfpqdunllf&_ij_reload=RELOAD_ON_SAVE';
});

window.addEventListener('keydown', (e) => {
   if (e.key === 'Enter') {
      window.location.href = 'http://localhost:63342/Canvas%20Presentation/Cat/index.html?_ijt=c8ov49177bduvvpolfpqdunllf&_ij_reload=RELOAD_ON_SAVE';
   }
});