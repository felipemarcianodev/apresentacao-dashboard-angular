# Contexto do Mirante

Estado e contexto que antes ficavam na memória da IA (proibida desde 21/11/2026, ver `CLAUDE.md`). Atualizar a seção no commit da tarefa que mudar o estado; data em cada item.

## Origem do projeto (12/10/2026)

- O dono decidiu reconstruir este repositório do zero (Angular 9 para a stack atual) como peça inédita do portfólio, ao lado do LeadsMap e do Planuz, que são SaaS B2B. A proposta virou o Mirante, painel de indicadores do Brasil com dados abertos (BCB e IBGE). O design segue o DNA do blog do portfólio (Inter, azul `#3b82f6`, selos).
- O plano faseado da reconstrução, `docs/plano-reconstrucao.md`, é local e não vai para o git (`docs/plano-*.md` no `.gitignore`). Artefato visual: https://claude.ai/artifact/RFsVFa43HfSG6996cmqriD.

## Git

- A branch principal é a `main` (renomeada de `master` no GitHub em 13/10/2026; a `master` não existe mais). Nunca abrir PR, push ou release a partir de `master`.
- A branch local `legado/angular9-main` guarda o projeto Angular 9 antigo (commit `d08069e`, "preload"), sem upstream; nunca foi para o remoto.

## Produção

- Conferência depois da release: pelo domínio e pela VPS em modo só leitura (`ssh planuz`).
