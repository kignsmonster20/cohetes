const TOTAL_PAGES = 6;
const bookElement = document.getElementById('book');
const loadingElement = document.getElementById('loading');
const currentElement = document.getElementById('page-current');
const totalElement = document.getElementById('page-total');
const previousButton = document.getElementById('prev');
const nextButton = document.getElementById('next');

let pageFlip = null;
let currentPage = 0;
let resizeTimeout;
let rebuilding = false;

totalElement.textContent = TOTAL_PAGES;

function createPages() {
  bookElement.innerHTML = '';
  for (let number = 1; number <= TOTAL_PAGES; number++) {
    const page = document.createElement('div');
    page.className = 'page';
    const image = document.createElement('img');
    image.src = `assets/pagina-${number}.webp`;
    image.alt = `Página ${number} de Cohetes 2026`;
    image.draggable = false;
    image.loading = number > 2 ? 'lazy' : 'eager';
    page.appendChild(image);
    bookElement.appendChild(page);
  }
}

function updateControls() {
  currentElement.textContent = Math.min(currentPage + 1, TOTAL_PAGES);
  previousButton.disabled = currentPage <= 0;
  nextButton.disabled = currentPage >= TOTAL_PAGES - 1;
}

function getPageDimensions() {
  const area = document.querySelector('.book-area');
  const compact = window.matchMedia('(max-width: 900px), (max-height: 520px)').matches;
  const heightLimit = Math.max(220, area.clientHeight - 12);
  const widthLimit = Math.max(160, area.clientWidth - (compact ? 64 : 96));
  const ratio = 595.5 / 842.25;
  let height = Math.min(heightLimit, 920);
  let width = Math.round(height * ratio);
  if (width > widthLimit) {
    width = widthLimit;
    height = Math.round(width / ratio);
  }
  return { width: Math.max(160, width), height: Math.max(220, height) };
}

function initializeBook() {
  if (!window.St || !window.St.PageFlip) {
    loadingElement.textContent = 'Activa tu conexión a Internet para abrir la revista.';
    return;
  }
  if (rebuilding) return;
  rebuilding = true;
  const { width, height } = getPageDimensions();
  // En pantallas pequeñas y dispositivos táctiles se conserva una hoja por vista,
  // incluso en horizontal, evitando que el libro se desborde o desaparezca.
  const singlePage = window.matchMedia('(max-width: 900px), (max-height: 520px), (pointer: coarse)').matches;
  try {
    pageFlip = new St.PageFlip(bookElement, {
      width, height, size: 'fixed', minWidth: 160, maxWidth: 650, minHeight: 220, maxHeight: 920,
      drawShadow: true, flippingTime: 700, usePortrait: singlePage, startPage: currentPage,
      autoSize: false, maxShadowOpacity: 0.35, showCover: true, mobileScrollSupport: false,
      swipeDistance: 20, clickEventForward: true, useMouseEvents: true
    });
    pageFlip.loadFromHTML(document.querySelectorAll('.page'));
    pageFlip.on('flip', event => { currentPage = event.data; updateControls(); });
    pageFlip.on('init', () => {
      loadingElement.hidden = true;
      currentPage = pageFlip.getCurrentPageIndex();
      updateControls();
    });
    loadingElement.hidden = true;
    updateControls();
  } catch (error) {
    console.error('Error al inicializar el lector:', error);
    loadingElement.hidden = false;
    loadingElement.textContent = 'No se pudo cargar la revista. Recarga la página.';
  } finally { rebuilding = false; }
}

function goPrevious() { if (pageFlip && currentPage > 0) pageFlip.flipPrev(); }
function goNext() { if (pageFlip && currentPage < TOTAL_PAGES - 1) pageFlip.flipNext(); }
previousButton.addEventListener('click', goPrevious);
nextButton.addEventListener('click', goNext);

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft') goPrevious();
  if (event.key === 'ArrowRight') goNext();
});

function rebuildForViewport() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const savedPage = pageFlip ? pageFlip.getCurrentPageIndex() : currentPage;
    currentPage = Math.max(0, Math.min(savedPage, TOTAL_PAGES - 1));
    if (pageFlip && typeof pageFlip.destroy === 'function') {
      try { pageFlip.destroy(); } catch (_) { /* ignore teardown issues */ }
    }
    pageFlip = null;
    createPages();
    initializeBook();
  }, 180);
}
window.addEventListener('resize', rebuildForViewport);
window.addEventListener('orientationchange', rebuildForViewport);
if (window.visualViewport) window.visualViewport.addEventListener('resize', rebuildForViewport);

createPages();
window.addEventListener('load', () => requestAnimationFrame(initializeBook));
