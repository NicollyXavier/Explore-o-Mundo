import type { Country } from '../types/country';

/** URL base da API */
const BASE_URL = 'https://restcountries.com/v3.1';

/**
 * Campos solicitados na listagem de países da home.
 */
const LIST_FIELDS = 'name,flags,population,region,subregion,capital,cca3';

/**
 * Campos solicitados na página de detalhe de um país.
 */
const DETAIL_FIELDS = 'name,flags,population,region,subregion,capital,languages,currencies,borders,area,timezones,continents,cca3,cca2,tld,independent,maps,coatOfArms,car,latlng,landlocked';

/**
 * Busca todos os países disponíveis na API com os campos da listagem.
 * @returns Promise com array de países
 * @throws Error se a requisição falhar
 */
export async function fetchAllCountries(): Promise<Country[]> {
  const res = await fetch(`${BASE_URL}/all?fields=${LIST_FIELDS}`);
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}

/**
 * Busca os detalhes completos de um país pelo seu código CCA3 (ex: "BRA").
 * @param code - Código alpha-3 do país
 * @returns Promise com os dados detalhados do país
 * @throws Error se o país não for encontrado ou a requisição falhar
 */
export async function fetchCountryByCode(code: string): Promise<Country> {
  const res = await fetch(`${BASE_URL}/alpha/${code}?fields=${DETAIL_FIELDS}`);
  if (!res.ok) throw new Error(`Failed to fetch country: ${code}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Busca múltiplos países pelos seus códigos CCA3 (usado para países fronteiriços).
 * Retorna apenas nome, bandeira e código para não sobrecarregar a resposta.
 * @param codes - Array de códigos alpha-3
 * @returns Promise com array de países (retorna [] se nenhum código for passado ou em caso de erro)
 */
export async function fetchCountriesByCodes(codes: string[]): Promise<Country[]> {
  if (!codes.length) return [];
  const res = await fetch(`${BASE_URL}/alpha?codes=${codes.join(',')}&fields=name,flags,cca3`);
  if (!res.ok) return [];
  return res.json();
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
