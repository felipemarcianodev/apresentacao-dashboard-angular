import { ResolveFn, Routes } from '@angular/router';
import { ComoRodar } from './como-rodar/como-rodar';
import { GaleriaDeTestes } from './galeria-de-testes/galeria-de-testes';
import { PaginaPersona } from './pagina-persona/pagina-persona';
import { buscarPersona } from './personas';

const tituloDaPersona: ResolveFn<string> = (rota) =>
  `${buscarPersona(rota.paramMap.get('persona') ?? '')?.nome ?? 'Persona'} · Testes · Mirante`;

// O título da barra superior vem do data da rota mais funda; só a filha de caminho vazio herda o da mãe.
const NA_BARRA = { titulo: 'Testes' };

export const TESTES_ROUTES: Routes = [
  { path: '', component: GaleriaDeTestes },
  { path: 'como-rodar', component: ComoRodar, title: 'Como rodar os testes · Mirante', data: NA_BARRA },
  { path: ':persona', component: PaginaPersona, title: tituloDaPersona, data: NA_BARRA },
];
