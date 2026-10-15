// Progressive enhancement: every publication is readable without JavaScript.
const filters = document.querySelector('[data-publication-filters]');
if (filters) {
  filters.hidden = false;
  const search = document.querySelector('#paper-search');
  const topic = document.querySelector('#paper-topic');
  const year = document.querySelector('#paper-year');
  const papers = [...document.querySelectorAll('[data-publication]')];
  const count = document.querySelector('#results-count');
  const empty = document.querySelector('#empty-state');
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') || '';
  if ([...topic.options].some(o => o.value === params.get('topic'))) topic.value = params.get('topic');
  if ([...year.options].some(o => o.value === params.get('year'))) year.value = params.get('year');
  function update() {
    const query = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const paper of papers) {
      const matches = query.every(word => paper.dataset.search.includes(word))
        && (!topic.value || paper.dataset.topic === topic.value)
        && (!year.value || paper.dataset.year === year.value);
      paper.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = `${visible} ${visible === 1 ? 'publication' : 'publications'}`;
    empty.hidden = visible !== 0;
    const next = new URLSearchParams();
    if (search.value.trim()) next.set('q', search.value.trim());
    if (topic.value) next.set('topic', topic.value);
    if (year.value) next.set('year', year.value);
    history.replaceState(null, '', location.pathname + (next.size ? `?${next}` : '') + location.hash);
  }
  filters.addEventListener('input', update);
  filters.addEventListener('change', update);
  document.querySelector('#reset-filters').addEventListener('click', () => {
    search.value = ''; topic.value = ''; year.value = ''; update(); search.focus();
  });
  filters.addEventListener('submit', event => event.preventDefault());
  update();
}
