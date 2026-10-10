document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const grid = document.getElementById('allStoriesGrid');
  const cards = [...grid.querySelectorAll('.book-card')];
  const searchInput = document.getElementById('searchInput');
  const genreFilter = document.getElementById('genreFilter');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const modal = document.getElementById('storyModal');
  const modalClose = document.getElementById('modalClose');
  const finishReading = document.getElementById('finishReading');
  let currentCard = null;

  function getLiked() {
    try { return JSON.parse(localStorage.getItem('storybook-liked') || '[]'); }
    catch { return []; }
  }
  function isLiked(id) { return getLiked().includes(Number(id)); }

  // Theme switch
  try { if (localStorage.getItem('storybook-theme') === 'dark') body.classList.add('dark'); } catch {}
  function setThemeLabel() { themeToggle.textContent = body.classList.contains('dark') ? '☀ Light mode' : '☾ Dark mode'; }
  setThemeLabel();
  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    try { localStorage.setItem('storybook-theme', body.classList.contains('dark') ? 'dark' : 'light'); } catch {}
    setThemeLabel();
  });

  // Mobile navigation
  menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navLinks.querySelectorAll('a').forEach(item => item.classList.remove('active'));
    link.classList.add('active');
  }));

  // Build the genre filter from the story cards already written in index.html
  [...new Set(cards.map(card => card.dataset.genre))].forEach(genre => {
    if (genre === 'Choose genre') return;
    const option = document.createElement('option');
    option.value = genre; option.textContent = genre;
    genreFilter.appendChild(option);
  });

  function renderStories() {
    const query = searchInput.value.trim().toLowerCase();
    const genre = genreFilter.value;
    let visible = 0;
    cards.forEach(card => {
      const matchesText = [card.dataset.title, card.dataset.author, card.dataset.genre, card.dataset.synopsis]
        .some(value => value.toLowerCase().includes(query));
      const matchesGenre = genre === 'all' || card.dataset.genre === genre;
      const show = matchesText && matchesGenre;
      card.hidden = !show;
      if (show) visible++;
      const likeButton = card.querySelector('[data-like]');
      const liked = isLiked(card.dataset.id);
      likeButton.classList.toggle('liked', liked);
      likeButton.textContent = liked ? '♥' : '♡';
    });
    resultCount.textContent = `${visible} ${visible === 1 ? 'story' : 'stories'}`;
    emptyState.hidden = visible > 0;
  }

  grid.querySelectorAll('[data-like]').forEach(button => button.addEventListener('click', () => {
    const id = Number(button.dataset.like);
    let liked = getLiked();
    liked = liked.includes(id) ? liked.filter(item => item !== id) : [...liked, id];
    try { localStorage.setItem('storybook-liked', JSON.stringify(liked)); } catch {}
    renderStories();
    if (currentCard && Number(currentCard.dataset.id) === id) updateModalLike();
  }));

  function openStory(card) {
    currentCard = card;
    const d = card.dataset;
    document.getElementById('modalGenre').textContent = `${d.genre.toUpperCase()} · STORY PREVIEW`;
    document.getElementById('modalTitle').textContent = d.title;
    const authorNode = document.getElementById('modalAuthor');
    authorNode.textContent = '';
    authorNode.append('By ');
    if (d.authorUrl) {
      const link = document.createElement('a');
      link.href = d.authorUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = d.author; authorNode.append(link);
    } else authorNode.append(d.author);
    document.getElementById('modalSynopsis').textContent = d.synopsis;
    document.getElementById('chapterTitle').textContent = 'Preview';
    document.getElementById('chapterContent').textContent = d.content;
    const originalLink = document.getElementById('originalChapterLink');
    originalLink.href = d.storyUrl || d.authorUrl || 'https://www.wattpad.com';
    originalLink.textContent = d.storyUrl ? 'Read full story on Inkitt ↗' : 'Visit original story page ↗';
    updateModalLike();
    modal.hidden = false;
    body.style.overflow = 'hidden';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = 'Reading progress: 0%';
  }
  grid.querySelectorAll('[data-read]').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('.book-card');
    if (card) openStory(card);
  }));

  function updateModalLike() {
    if (!currentCard) return;
    const button = document.getElementById('modalLike');
    button.textContent = isLiked(currentCard.dataset.id) ? '♥ Liked' : '♡ Like story';
  }
  document.getElementById('modalLike').addEventListener('click', () => {
    if (!currentCard) return;
    const id = Number(currentCard.dataset.id);
    let liked = getLiked();
    liked = liked.includes(id) ? liked.filter(item => item !== id) : [...liked, id];
    try { localStorage.setItem('storybook-liked', JSON.stringify(liked)); } catch {}
    updateModalLike(); renderStories();
  });

  const readingArea = document.getElementById('readingArea');
  readingArea.addEventListener('scroll', () => {
    const maxScroll = readingArea.scrollHeight - readingArea.clientHeight;
    const percent = maxScroll <= 0 ? 100 : Math.round((readingArea.scrollTop / maxScroll) * 100);
    document.getElementById('progressBar').style.width = percent + '%';
    document.getElementById('progressText').textContent = `Reading progress: ${percent}%`;
  });
  function closeStory() { modal.hidden = true; body.style.overflow = ''; }
  modalClose.addEventListener('click', closeStory);
  finishReading.addEventListener('click', closeStory);
  modal.addEventListener('click', event => { if (event.target === modal) closeStory(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeStory(); });
  searchInput.addEventListener('input', renderStories);
  genreFilter.addEventListener('change', renderStories);
  renderStories();
});
