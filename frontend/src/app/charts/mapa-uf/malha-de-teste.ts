import { MalhaUf } from './projecao';

/** Malha mínima (RJ e SP como quadrados) para testes que não devem carregar o arquivo real. */
export const MALHA_DE_TESTE: MalhaUf = {
  type: 'FeatureCollection',
  features: [
    {
      properties: { codarea: '33' },
      geometry: { type: 'Polygon', coordinates: [[[-44, -21], [-41, -21], [-41, -23], [-44, -23], [-44, -21]]] },
    },
    {
      properties: { codarea: '35' },
      geometry: { type: 'Polygon', coordinates: [[[-53, -20], [-44, -20], [-44, -25], [-53, -25], [-53, -20]]] },
    },
  ],
};
