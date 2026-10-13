import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ibge' },
  {
    path: 'ibge',
    title: 'IBGE · Mirante',
    data: {
      titulo: 'IBGE',
      descricao: 'População, PIB, desocupação e inflação oficial, com recorte por UF.',
    },
    loadComponent: () => import('./dashboards/em-breve/em-breve').then((m) => m.EmBreve),
  },
  {
    path: 'bcb',
    title: 'Banco Central · Mirante',
    data: { titulo: 'Banco Central', descricao: 'Selic, câmbio e crédito pela API SGS.' },
    loadComponent: () => import('./dashboards/em-breve/em-breve').then((m) => m.EmBreve),
  },
  {
    path: 'ipea',
    title: 'Ipeadata · Mirante',
    data: { titulo: 'Ipeadata', descricao: 'Séries históricas consolidadas pelo Ipea.' },
    loadComponent: () => import('./dashboards/em-breve/em-breve').then((m) => m.EmBreve),
  },
  {
    path: 'ui',
    title: 'Componentes · Mirante',
    data: { titulo: 'Componentes', descricao: 'Documentação de cada componente do kit.' },
    loadComponent: () => import('./dashboards/em-breve/em-breve').then((m) => m.EmBreve),
  },
  { path: '**', redirectTo: 'ibge' },
];
