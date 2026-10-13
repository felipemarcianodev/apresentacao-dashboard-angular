# Mirante

Kit de dashboard em **Angular 20** e **Tailwind CSS v4**, com painéis sobre dados abertos do Brasil: IBGE, Banco Central e Ipeadata.

- Componentes standalone, zoneless e baseados em signals, seguindo o [Angular Style Guide](https://angular.dev/style-guide).
- Tailwind usado de forma pura: sem biblioteca de componentes e sem biblioteca de gráficos. Os gráficos são SVG próprio.
- A rota `/ui` documenta cada componente do kit, com exemplo, API e trecho de uso, para quem quiser reaproveitar.

## Rodando localmente

Requer Node 20.19 ou superior.

```bash
npm install
npm start              # http://localhost:4200
npm run build:deploy   # build de produção
npm run test:ci        # testes unitários (Chrome headless)
```

## Fontes de dados

Todas públicas, sem chave de acesso:

- [IBGE, API de agregados](https://servicodados.ibge.gov.br/api/docs/agregados?versao=3)
- [Banco Central, API SGS](https://dadosabertos.bcb.gov.br/)
- [Ipeadata](http://www.ipeadata.gov.br/)
