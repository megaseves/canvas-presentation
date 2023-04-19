
// Previous
const previousBtn = document.querySelector('.back');

previousBtn.addEventListener('click', () => {
   window.location.href = 'http://localhost:63342/canvas-presentation/Mario/index.html?_ijt=vcgdprpdu4o4tncvcpkkc1m9pl&_ij_reload=RELOAD_ON_SAVE';
});

window.addEventListener('keydown', (e) => {
   if (e.key === 'Backspace') {
      window.location.href = 'http://localhost:63342/canvas-presentation/Mario/index.html?_ijt=vcgdprpdu4o4tncvcpkkc1m9pl&_ij_reload=RELOAD_ON_SAVE';
   }
});

// Next
const nextBtn = document.querySelector('.next');

nextBtn.addEventListener('click', () => {
   window.location.href = 'http://localhost:63342/canvas-presentation/MouseTrail/index.html?_ijt=hmrja4au78vq8p62h49gd9iu1c&_ij_reload=RELOAD_ON_SAVE';
});

window.addEventListener('keydown', (e) => {
   if (e.key === 'Enter') {
      window.location.href = 'http://localhost:63342/canvas-presentation/MouseTrail/index.html?_ijt=hmrja4au78vq8p62h49gd9iu1c&_ij_reload=RELOAD_ON_SAVE';
   }
});