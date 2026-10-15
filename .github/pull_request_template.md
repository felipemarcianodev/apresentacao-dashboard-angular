## O que muda

<!-- O motivo e o que entra, em poucas linhas. -->

## Checklist

- [ ] Testes da área tocada verdes (front: test:ci, build:deploy e E2E das telas; backend: dotnet build com 0 avisos e dotnet test inteiro; infra: compose sobe e E2E contra o container)
- [ ] Documentação viva: CLAUDE.md (mapa e regras) e README.md de cada área tocada atualizados neste PR (o workflow PR roda scripts/verificar-documentacao.mjs; o subagente revisor-de-documentacao aponta o texto)
- [ ] Mexeu em teste de ponta a ponta? Persona por tag e catálogo da /testes regravado (npm run testes:catalogo)
- [ ] Contrato entre front e API mudou? frontend/CLAUDE.md e backend/CLAUDE.md atualizados juntos
- [ ] Segurança: agente seguranca-angular no front; revisão no backend; nenhum segredo no diff
- [ ] VERSION atualizado, se for virar release
