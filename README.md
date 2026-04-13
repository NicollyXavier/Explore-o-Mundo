# 🌍 Explorando o Mundo

Uma aplicação React + TypeScript para explorar informações sobre países do mundo, construída com Vite e React Router.


## ✨ Funcionalidades

- **Listagem de países** com bandeira, nome, população, capital e continente
- **Página de detalhes** com informações completas: idiomas, moedas, área, fusos horários, brasão de armas, países vizinhos e muito mais
- **Busca por nome** (nome comum e oficial) em tempo real
- **Filtro por sub-região** com seletor dinâmico
- **Navegação entre países vizinhos** na página de detalhes
- **Link para Google Maps** de cada país
- **Skeleton loading** durante carregamento
- **Design responsivo** para mobile e desktop
- **Animações** suaves de entrada nos cards

## 🛠 Tecnologias

| Tecnologia | Uso |
|---|---|
| React 18 | Interface de usuário com hooks |
| TypeScript | Tipagem estática em todo o projeto |
| Vite | Build tool e dev server |
| React Router v6 | Navegação entre páginas |
| CSS Modules | Estilos com escopo por componente |
| REST Countries API | Fonte de dados sobre países |

## 📁 Estrutura do Projeto

```
world-explorer/
├── public/
│   └── globe.svg              # Favicon
├── src/
│   ├── components/
│   │   ├── Header.tsx         # Cabeçalho com navegação
│   │   ├── Header.module.css
│   │   ├── CountryCard.tsx    # Card de país na listagem
│   │   ├── CountryCard.module.css
│   │   ├── SearchBar.tsx      # Campo de busca
│   │   ├── SearchBar.module.css
│   │   ├── SubregionFilter.tsx # Filtro por sub-região
│   │   └── SubregionFilter.module.css
│   ├── hooks/
│   │   └── useCountries.ts    # Hooks customizados de dados
│   ├── pages/
│   │   ├── HomePage.tsx       # Listagem principal
│   │   ├── HomePage.module.css
│   │   ├── CountryPage.tsx    # Detalhes de um país
│   │   └── CountryPage.module.css
│   ├── types/
│   │   └── country.ts         # Tipagens TypeScript
│   ├── utils/
│   │   └── api.ts             # Funções de API e formatação
│   ├── App.tsx                # Roteamento principal
│   ├── index.css              # Estilos globais e variáveis CSS
│   └── main.tsx               # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Como Executar

### Pré-requisitos

- **Node.js** 18 ou superior
- **npm** 9 ou superior

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositório>
cd world-explorer

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) no navegador.

### Outros comandos

```bash
npm run build    # Build de produção (gera /dist)
npm run preview  # Visualiza o build de produção localmente
```

## 🌐 API Utilizada

[REST Countries API v3.1](https://restcountries.com) — API pública e gratuita, sem necessidade de autenticação.

**Endpoints utilizados:**
- `GET /v3.1/all` — todos os países (com campos selecionados para otimizar o payload)
- `GET /v3.1/alpha/{code}` — detalhes de um país por código CCA3
- `GET /v3.1/alpha?codes={codes}` — múltiplos países por códigos (para países vizinhos)

## 🎨 Decisões Técnicas

### CSS Modules
Escolhi CSS Modules em vez de uma biblioteca de UI (ex: Tailwind, MUI, Chakra) para manter o projeto sem dependências pesadas.

### Custom Hooks
A lógica de dados foi separada em hooks reutilizáveis (`useCountries`, `useFilteredCountries`, `useSubregions`) para manter os componentes de página limpos e testáveis.

### Otimização de rede
Ao buscar todos os países, passo o parâmetro `?fields=...` para a API receber apenas os campos necessários, reduzindo significativamente o tamanho do payload.

### Filtragem no cliente
Como todos os países são carregados de uma vez, a busca e o filtro por sub-região são feitos no cliente com `useMemo`, garantindo resposta instantânea sem requisições adicionais.

## 📱 Responsividade

A aplicação é totalmente responsiva:
- **Desktop (>1024px)**: grid de 5–6 colunas, sidebar lateral na página de detalhes
- **Tablet (640–1024px)**: grid de 3–4 colunas, sidebar reorganizada
- **Mobile (<640px)**: grid de 2 colunas, layout empilhado

## 🔗 Link de projeto no Vercel
- https://explore-o-mundo.vercel.app/

## 👩‍💻 Autoria
- **Nicolly Mayara Xavier Lima** - GitHub: @NicollyXavier
