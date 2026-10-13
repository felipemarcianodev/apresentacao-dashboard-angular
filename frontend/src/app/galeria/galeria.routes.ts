import { ResolveFn, Routes } from '@angular/router';
import { buscarDoc } from './docs';
import { GaleriaIndice } from './galeria-indice/galeria-indice';
import { PaginaComponente } from './pagina-componente/pagina-componente';

const tituloDoComponente: ResolveFn<string> = (rota) =>
  `${buscarDoc(rota.paramMap.get('slug') ?? '')?.nome ?? 'Componente'} · Mirante`;

export const GALERIA_ROUTES: Routes = [
  { path: '', component: GaleriaIndice },
  { path: ':slug', component: PaginaComponente, title: tituloDoComponente },
];
