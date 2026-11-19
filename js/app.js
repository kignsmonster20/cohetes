const TOTAL_PAGES = 6;
const bookElement = document.getElementById('book');
const loadingElement = document.getElementById('loading');
const currentElement = document.getElementById('page-current');
const totalElement = document.getElementById('page-total');
const previousButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const reader = document.getElementById('reader');

let pageFlip = null;
let currentPage = 0;

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

    page.appendChild(image);
    bookElement.appendChild(page);
  }
}

function updateControls() {
  currentElement.textContent = currentPage + 1;
  previousButton.disabled = currentPage === 0;
  nextButton.disabled = currentPage === TOTAL_PAGES - 1;
}

function initializeBook() {
  if (!window.St || !window.St.PageFlip) {
    loadingElement.textContent = 'Activa tu conexión a Internet para abrir la revista.';
    return;
  }

  const area = document.querySelector('.book-area');
  const isMobile = window.matchMedia('(max-width: 700px)').matches;
  const availableHeight = Math.max(260, area.clientHeight - 10);
  const availableWidth = Math.max(220, area.clientWidth - (isMobile ? 6 : 30));

  // Cada hoja conserva la proporción vertical del PDF original.
  const pageHeight = Math.min(availableHeight, 900);
  let pageWidth = Math.round(pageHeight * 595.5 / 842.25);

  // En pantallas estrechas, la hoja se ajusta al ancho disponible.
  if (pageWidth > availableWidth) {
    pageWidth = availableWidth;
  }

  pageFlip = new St.PageFlip(bookElement, {
    width: pageWidth,
    height: pageHeight,
    size: 'fixed',
    minWidth: 180,
    maxWidth: 650,
    minHeight: 250,
    maxHeight: 920,
    drawShadow: true,
    flippingTime: 850,
    usePortrait: isMobile,
    startPage: currentPage,
    autoSize: false,
    maxShadowOpacity: 0.38,
    showCover: true,
    mobileScrollSupport: true,
    swipeDistance: 25,
    clickEventForward: true,
    useMouseEvents: true
  });

  pageFlip.loadFromHTML(document.querySelectorAll('.page'));
  pageFlip.on('flip', event => {
    currentPage = event.data;
    updateControls();
  });
  pageFlip.on('init', () => {
    loadingElement.hidden = true;
    currentPage = pageFlip.getCurrentPageIndex();
    updateControls();
  });

  loadingElement.hidden = true;
  updateControls();
}

function goPrevious() {
  if (pageFlip && currentPage > 0) pageFlip.flipPrev();
}

function goNext() {
  if (pageFlip && currentPage < TOTAL_PAGES - 1) pageFlip.flipNext();
}

previousButton.addEventListener('click', goPrevious);
nextButton.addEventListener('click', goNext);

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft') goPrevious();
  if (event.key === 'ArrowRight') goNext();
  if (event.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
});

// Recalcula la revista al cambiar la orientación o el tamaño de la ventana.
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const savedPage = pageFlip ? pageFlip.getCurrentPageIndex() : currentPage;
    currentPage = savedPage;
    if (pageFlip && typeof pageFlip.destroy === 'function') pageFlip.destroy();
    createPages();
    initializeBook();
  }, 250);
});

createPages();
window.addEventListener('load', () => requestAnimationFrame(initializeBook));
