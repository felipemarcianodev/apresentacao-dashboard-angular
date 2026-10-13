// Aplica o tema antes do Angular subir, para não piscar o tema claro em quem usa o escuro.
// Arquivo estático (e não script inline) para continuar compatível com CSP script-src 'self'.
(function () {
  var preferencia = 'system';
  try {
    preferencia = localStorage.getItem('mirante.tema') || 'system';
  } catch (e) {}
  var escuro =
    preferencia === 'dark' ||
    (preferencia === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', escuro);
})();
