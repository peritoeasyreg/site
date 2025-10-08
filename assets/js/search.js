/**
 * search.js
 * - Redireciona a busca para api/search.php?q="palavra"
 * - Faz validação/hardening simples.
 */
(function () {
  const forms = Array.from(document.querySelectorAll('form.search, form.search-hero'));
  if (!forms.length) return;

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const input = form.querySelector('[name="q"]');
      let q = (input?.value || '').trim();
      if (!q) { e.preventDefault(); return; }
      // normaliza espaços e limita tamanho
      q = q.replace(/\s+/g, ' ').slice(0, 100);
      // redireciona para a API (GET)
      e.preventDefault();
      const url = `/api/search.php?q=${encodeURIComponent(q)}`;
      window.location.href = url;
    });
  });
})();