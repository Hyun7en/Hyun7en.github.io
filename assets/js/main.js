// ===== Mobile Nav Toggle =====
const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', siteNav.classList.contains('open'));
  });

  // 메뉴 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !siteNav.contains(e.target)) {
      siteNav.classList.remove('open');
    }
  });
}

// ===== Post Search Filter (홈 페이지) =====
const searchInput = document.getElementById('post-search');
const postCards = document.querySelectorAll('.post-card');

if (searchInput && postCards.length > 0) {
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();

    postCards.forEach((card) => {
      const title = card.querySelector('.post-card-title')?.textContent.toLowerCase() || '';
      const excerpt = card.querySelector('.post-card-excerpt')?.textContent.toLowerCase() || '';
      const tags = card.querySelector('.post-card-tags')?.textContent.toLowerCase() || '';
      const category = card.querySelector('.post-card-category')?.textContent.toLowerCase() || '';

      const match = !query || title.includes(query) || excerpt.includes(query) || tags.includes(query) || category.includes(query);
      card.style.display = match ? '' : 'none';
    });

    // 검색 결과 없음 메시지
    const noResult = document.getElementById('no-result');
    if (noResult) {
      const visible = [...postCards].some(c => c.style.display !== 'none');
      noResult.style.display = visible ? 'none' : '';
    }
  });
}

// ===== 현재 페이지 nav active 표시 =====
document.querySelectorAll('.site-nav a').forEach((link) => {
  if (link.getAttribute('href') === window.location.pathname ||
      (window.location.pathname !== '/' && window.location.pathname.startsWith(link.getAttribute('href')))) {
    link.classList.add('active');
  }
});
