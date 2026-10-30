import type { Country } from '../types/country';

/** URL base da REST Countries API v5 */
const BASE_URL = 'https://api.restcountries.com/countries/v5';

/** Chave da API (definida em .env.local → VITE_RESTCOUNTRIES_KEY) */
const API_KEY = import.meta.env.VITE_RESTCOUNTRIES_KEY as string | undefined;

/** Tamanho máximo de página no plano gratuito da API */
const PAGE_SIZE = 100;

/**
 * Campos solicitados na listagem de países da home.
 * Na v5 usamos `response_fields` (caminhos com ponto) em vez de `fields`.
 */
const LIST_FIELDS = [
  'names.common',
  'names.official',
  'flag.url_svg',
  'flag.url_png',
  'flag.description',
  'population',
  'region',
  'subregion',
  'capitals',
  'codes.alpha_3',
].join(',');

/** Campos pesados que não usamos na página de detalhe. */
const DETAIL_OMIT = 'names.translations';

/** Mensagens amigáveis para os erros HTTP mais comuns da API. */
const HTTP_ERRORS: Record<number, string> = {
  401: 'Chave da API inválida ou ausente (401).',
  403: 'Acesso negado pela API (403): cota mensal esgotada ou origem não permitida.',
  404: 'Recurso não encontrado (404).',
  429: 'Muitas requisições em pouco tempo (429). Aguarde alguns segundos.',
};

interface Meta {
  total: number;
  count: number;
  limit: number;
  offset: number;
  more: boolean;
}

interface ApiData {
  objects: any[];
  meta: Meta;
}

/**
 * Chamada genérica à API v5. Envia a chave no header Authorization
 * e devolve o conteúdo de `data` (`objects` + `meta`).
 */
async function request(
  path: string,
  params: Record<string, string | number> = {}
): Promise<ApiData> {
  if (!API_KEY) {
    throw new Error('Chave da API não configurada (VITE_RESTCOUNTRIES_KEY).');
  }

  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const res = await fetch(`${BASE_URL}${path}?${qs}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(HTTP_ERRORS[res.status] ?? `Falha ao consultar a API (${res.status}).`);
  }

  const json = await res.json();
  return json.data as ApiData;
}

/**
 * Converte um registro da v5 para o formato `Country` usado pelos componentes
 * (que foi desenhado em cima da v3.1). Assim as páginas não precisam mudar.
 */
function toCountry(raw: any): Country {
  const lat = raw.coordinates?.lat;
  const lng = raw.coordinates?.lng;

  // v5: [{ name: "English", bcp47: "en" }] → v3.1: { en: "English" }
  const languages = Array.isArray(raw.languages)
    ? Object.fromEntries(
        raw.languages.map((l: any, i: number) => [l.bcp47 ?? String(i), l.name as string])
      )
    : undefined;

  // v5: [{ code: "CAD", name: "Canadian dollar", symbol: "$" }] → v3.1: { CAD: { name, symbol } }
  const currencies = Array.isArray(raw.currencies)
    ? Object.fromEntries(
        raw.currencies.map((c: any, i: number) => [
          c.code ?? String(i),
          { name: c.name as string, symbol: (c.symbol ?? '') as string },
        ])
      )
    : undefined;

  return {
    name: {
      common: raw.names?.common ?? '',
      official: raw.names?.official ?? '',
      nativeName: raw.names?.native,
    },
    flags: {
      svg: raw.flag?.url_svg,
      png: raw.flag?.url_png,
      alt: raw.flag?.description || undefined,
    },
    population: raw.population ?? 0,
    region: raw.region ?? '',
    subregion: raw.subregion,
    capital: Array.isArray(raw.capitals) ? raw.capitals.map((c: any) => c.name) : undefined,
    languages,
    currencies,
    borders: raw.borders,
    area: raw.area?.kilometers,
    timezones: raw.timezones,
    continents: raw.continents,
    cca3: raw.codes?.alpha_3 ?? '',
    cca2: raw.codes?.alpha_2 ?? '',
    tld: raw.tlds,
    independent: raw.classification?.sovereign,
    maps: {
      googleMaps: raw.links?.google_maps,
      openStreetMaps: raw.links?.open_street_maps,
    },
    car: { signs: raw.cars?.signs, side: raw.cars?.driving_side },
    latlng: typeof lat === 'number' && typeof lng === 'number' ? [lat, lng] : undefined,
    landlocked: raw.landlocked,
  };
}

const CACHE_KEY = 'explore-o-mundo:countries:v5';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas
let listInFlight: Promise<Country[]> | null = null;

/**
 * Busca todos os países (a v5 pagina em até 100 por requisição, então são 3 chamadas).
 * O resultado fica 24h no localStorage para poupar a cota mensal do plano gratuito.
 * Chamadas simultâneas (ex.: React.StrictMode em dev) compartilham a mesma requisição.
 * @returns Promise com array de países
 * @throws Error se a requisição falhar
 */
export function fetchAllCountries(): Promise<Country[]> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { time, data } = JSON.parse(cached);
      if (Date.now() - time < CACHE_TTL && Array.isArray(data) && data.length) return Promise.resolve(data);
    }
  } catch {
    /* cache inválido ou indisponível: segue para a API */
  }

  if (listInFlight) return listInFlight;

  listInFlight = (async () => {
    const params = { response_fields: LIST_FIELDS, limit: PAGE_SIZE };
    const first = await request('', { ...params, offset: 0 });
    const pages = Math.ceil(first.meta.total / PAGE_SIZE);
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        request('', { ...params, offset: (i + 1) * PAGE_SIZE })
      )
    );
    const countries = [first, ...rest].flatMap(p => p.objects).map(toCountry);

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: countries }));
    } catch {
      /* storage cheio ou bloqueado: segue sem cache */
    }
    return countries;
  })().finally(() => {
    listInFlight = null;
  });

  return listInFlight;
}

/**
 * Busca os detalhes completos de um país pelo seu código CCA3 (ex: "BRA").
 * @param code - Código alpha-3 do país
 * @returns Promise com os dados detalhados do país
 * @throws Error se o país não for encontrado ou a requisição falhar
 */
export async function fetchCountryByCode(code: string): Promise<Country> {
  const data = await request(`/codes.alpha_3/${encodeURIComponent(code)}`, {
    response_fields_omit: DETAIL_OMIT,
  });
  if (!data.objects.length) throw new Error(`País não encontrado: ${code}`);
  return toCountry(data.objects[0]);
}

/**
 * Busca os países que fazem fronteira com o país `code` (usado na página de detalhe).
 * A v5 não aceita vários códigos de uma vez, mas permite busca reversa em `borders`:
 * `/borders/BRA` devolve todos os países que têm o Brasil como vizinho.
 * Retorna apenas nome, bandeira e código para não sobrecarregar a resposta.
 * @param code - Código alpha-3 do país atual
 * @returns Promise com array de países vizinhos
 */
export async function fetchBorderCountries(code: string): Promise<Country[]> {
  const data = await request(`/borders/${encodeURIComponent(code)}`, {
    response_fields: 'names.common,flag.url_svg,flag.url_png,codes.alpha_3',
    limit: PAGE_SIZE,
  });
  return data.objects.map(toCountry);
}

/**
 * Formata um número de população em uma string legível e compacta. 50000 → "50K"
 * @param pop - Número de habitantes
 * @returns String formatada com sufixo B (bilhões), M (milhões) ou K (milhares)
 */
export function formatPopulation(pop: number): string {
  if (pop >= 1_000_000_000) return `${(pop / 1_000_000_000).toFixed(1)}B`;
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${(pop / 1_000).toFixed(0)}K`;
  return pop.toString();
}

/**
 * Formata um valor de área em km² com separador de milhar.
 * Exemplo: 8515767 → "8,515,767 km²"
 * @param area - Área em quilômetros quadrados
 * @returns String formatada com unidade "km²"
 */
export function formatArea(area: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(area)) + ' km²';
}
