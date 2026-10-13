/** Tipos mínimos de GeoJSON usados pela malha de UFs do IBGE. */
type Posicao = readonly [number, number] | readonly number[];
type Anel = readonly Posicao[];

interface GeometriaPoligono {
  readonly type: 'Polygon';
  readonly coordinates: readonly Anel[];
}

interface GeometriaMultiPoligono {
  readonly type: 'MultiPolygon';
  readonly coordinates: readonly (readonly Anel[])[];
}

export interface MalhaUf {
  readonly type: 'FeatureCollection';
  readonly features: readonly {
    readonly properties: { readonly codarea: string };
    readonly geometry: GeometriaPoligono | GeometriaMultiPoligono;
  }[];
}

export interface UfProjetada {
  readonly codigo: string;
  readonly caminho: string;
}

export interface MapaProjetado {
  readonly largura: number;
  readonly altura: number;
  readonly ufs: readonly UfProjetada[];
}

/**
 * Projeta a malha em coordenadas de SVG com uma equiretangular corrigida pela latitude média.
 * Para um país do tamanho do Brasil, a distorção é pequena e evita depender de biblioteca de mapas.
 */
export function projetarMalha(malha: MalhaUf, largura = 600): MapaProjetado {
  const aneis = malha.features.flatMap((f) =>
    f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat(),
  );
  const pontos = aneis.flat();
  if (pontos.length === 0) {
    return { largura, altura: 0, ufs: [] };
  }

  const lons = pontos.map((p) => p[0]);
  const lats = pontos.map((p) => p[1]);
  const [minLon, maxLon, minLat, maxLat] = [
    Math.min(...lons),
    Math.max(...lons),
    Math.min(...lats),
    Math.max(...lats),
  ];
  const fatorLon = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const escala = largura / ((maxLon - minLon) * fatorLon);
  const altura = Math.round((maxLat - minLat) * escala);

  const x = (lon: number) => ((lon - minLon) * fatorLon * escala).toFixed(1);
  const y = (lat: number) => ((maxLat - lat) * escala).toFixed(1);
  const anelParaCaminho = (anel: Anel) =>
    anel.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p[0])},${y(p[1])}`).join('') + 'Z';

  const ufs = malha.features.map((f) => {
    const poligonos = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    return {
      codigo: f.properties.codarea,
      caminho: poligonos.flatMap((aneisDoPoligono) => aneisDoPoligono.map(anelParaCaminho)).join(''),
    };
  });

  return { largura, altura, ufs };
}

/**
 * Limites de classe por quantis: cada faixa de cor recebe mais ou menos o mesmo número de UFs.
 * Para dado concentrado (população de SP), quantil mostra mais contraste que intervalos iguais.
 */
export function limitesPorQuantil(valores: readonly number[], classes: number): number[] {
  const ordenados = valores.filter(Number.isFinite).sort((a, b) => a - b);
  if (ordenados.length === 0) {
    return [];
  }
  return Array.from({ length: classes - 1 }, (_, i) => {
    const posicao = ((i + 1) / classes) * (ordenados.length - 1);
    const base = Math.floor(posicao);
    const resto = posicao - base;
    return ordenados[base] + (ordenados[Math.min(base + 1, ordenados.length - 1)] - ordenados[base]) * resto;
  });
}

/** Índice da classe (0 a limites.length) em que o valor cai. */
export function classeDoValor(valor: number, limites: readonly number[]): number {
  const indice = limites.findIndex((limite) => valor <= limite);
  return indice === -1 ? limites.length : indice;
}
