/**
 * O motor de PDF do Chromium (usado pelo Puppeteer em page.pdf()) sempre
 * converte fontes carregadas via @font-face em fontes Type3 — cada glifo
 * vira um mini-desenho vetorial independente, o que deixa o texto
 * praticamente impossível de editar no Illustrator (aparece "quebrado",
 * cheio de agrupamentos/clipping masks por caractere).
 *
 * Fontes já instaladas no SISTEMA operacional (não carregadas via
 * @font-face) são embutidas corretamente como fontes de verdade (Type0/
 * TrueType), continuam editáveis no Illustrator.
 *
 * Por isso, para geração de PDF, a fonte Inter é instalada como fonte de
 * sistema no container (ver Dockerfile) e removemos as declarações
 * @font-face de Inter do HTML antes de renderizar — assim o Chromium casa
 * o "font-family: Inter" com a fonte de sistema em vez de tratar como
 * webfont. A prévia no navegador continua usando @font-face normalmente
 * (necessário lá, já que roda no navegador de quem acessa a ferramenta).
 */
export function stripInterFontFace(html: string): string {
  const pattern = /@font-face\s*\{[^}]*font-family\s*:\s*['"]?Inter[^;'"]*['"]?[^}]*\}/gis;
  return html.replace(pattern, "");
}
