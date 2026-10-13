// O arquivo VERSION da raiz é a única fonte da versão: o build o embute como texto.
import conteudo from '../../../../VERSION' with { loader: 'text' };

/** Versão semântica do Mirante, ex.: "1.0.2". */
export const VERSAO = conteudo.trim();
