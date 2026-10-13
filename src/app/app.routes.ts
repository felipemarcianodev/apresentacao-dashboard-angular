import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ibge' },
  {
    path: 'ibge',
    title: 'IBGE · Mirante',
    data: { titulo: 'IBGE' },
    loadComponent: () => import('./dashboards/ibge/ibge-painel').then((m) => m.IbgePainel),
  },
  {
    path: 'bcb',
    title: 'Banco Central · Mirante',
    data: { titulo: 'Banco Central' },
    loadComponent: () => import('./dashboards/bcb/bcb-painel').then((m) => m.BcbPainel),
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
    data: { titulo: 'Componentes' },
    loadChildren: () => import('./galeria/galeria.routes').then((m) => m.GALERIA_ROUTES),
  },
  { path: '**', redirectTo: 'ibge' },
];
