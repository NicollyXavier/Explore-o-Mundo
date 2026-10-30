import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Country } from '../types/country';
import { fetchCountryByCode, fetchBorderCountries, formatPopulation, formatArea } from '../utils/api';
import styles from './CountryPage.module.css';

/**
 * Página de detalhes de um país específico.
 *
 * O código do país (CCA3) é extraído da URL via `useParams`.
 * Sempre que o `code` muda (ex: usuário clica em um país fronteiriço),
 * o `useEffect` rebusca os dados do novo país.
 *
 * Fluxo de carregamento:
 * 1. Exibe <LoadingSkeleton /> enquanto aguarda a resposta principal.
 * 2. Ao receber os dados, renderiza o layout completo.
 * 3. Em paralelo, busca os países fronteiriços e os adiciona ao estado
 *    quando disponíveis (os borders aparecem depois do conteúdo principal).
 *
 * Em caso de erro ou país não encontrado, exibe uma mensagem com link de volta.
 */
export function CountryPage() {
  const { code } = useParams<{ code: string }>();
  const [country, setCountry] = useState<Country | null>(null);
  const [borderCountries, setBorderCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);
    setBorderCountries([]);

    fetchCountryByCode(code)
      .then(async data => {
        setCountry(data);
        setLoading(false);
        if (data.borders?.length) {
          const borders = await fetchBorderCountries(data.cca3);
          setBorderCountries(borders);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [code]);

  if (loading) return <LoadingSkeleton />;
  if (error || !country) return (
    <div className={styles.errorWrap}>
      <p>Não foi possível carregar os dados do país.</p>
      <Link to="/" className={styles.backBtn}>← Voltar para todos os países</Link>
    </div>
  );

  const languages = country.languages ? Object.values(country.languages) : [];
  const currencies = country.currencies
    ? Object.values(country.currencies).map(c => `${c.name} (${c.symbol})`)
    : [];
  const nativeNames = country.name.nativeName
    ? [...new Set(Object.values(country.name.nativeName).map(n => n.common))].slice(0, 3)
    : [];

  return (
    <main className={styles.main}>
      <div className={styles.flagHero}>
        <img
          src={country.flags.svg || country.flags.png}
          alt={country.flags.alt || `Bandeira do ${country.name.common}`}
          className={styles.flag}
        />
        <div className={styles.flagOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.continent}>{country.continents?.[0] || country.region}</span>
          <h1 className={styles.countryName}>{country.name.common}</h1>
          <p className={styles.officialName}>{country.name.official}</p>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.statsStrip}>
          <StatPill label="População" value={formatPopulation(country.population)} icon="◉" />
          {country.capital?.[0] && <StatPill label="Capital" value={country.capital[0]} icon="◎" />}
          {country.area && <StatPill label="Área" value={formatArea(country.area)} icon="◫" />}
          <StatPill label="Região" value={country.region} icon="◌" />
          {country.subregion && <StatPill label="Sub-região" value={country.subregion} icon="◍" />}
        </div>

        <div className={styles.content}>
          <div className={styles.details}>
            <Section title="Identidade">
              <Row label="Nome Comum" value={country.name.common} />
              <Row label="Nome Oficial" value={country.name.official} />
              {nativeNames.length > 0 && (
                <Row label="Nome Nativo" value={nativeNames.join(' · ')} />
              )}
              {country.cca2 && <Row label="ISO Alpha-2" value={country.cca2} />}
              {country.cca3 && <Row label="ISO Alpha-3" value={country.cca3} />}
              {country.tld?.length && <Row label="Top-level domain" value={country.tld.join(', ')} />}
              <Row label="Independente" value={country.independent ? 'Sim' : 'Não'} />
            </Section>

            <Section title="Geografia">
              {country.capital?.length && <Row label="Capital(is)" value={country.capital.join(', ')} />}
              <Row label="Região" value={country.region} />
              {country.subregion && <Row label="Sub-região" value={country.subregion} />}
              {country.continents?.length && <Row label="Continentes" value={country.continents.join(', ')} />}
              {country.area && <Row label="Área total" value={formatArea(country.area)} />}
              {country.latlng && <Row label="Coordenadas" value={`${country.latlng[0].toFixed(2)}°, ${country.latlng[1].toFixed(2)}°`} />}
              <Row label="Sem litoral" value={country.landlocked ? 'Sim' : 'Não'} />
            </Section>

            <Section title="Pessoas &amp; Economia">
              <Row label="População" value={country.population.toLocaleString()} />
              {languages.length > 0 && <Row label="Idiomas" value={languages.join(', ')} />}
              {currencies.length > 0 && <Row label="Moedas" value={currencies.join(', ')} />}
            </Section>

            <Section title="Transporte &amp; Fuso">
              {country.car?.side && <Row label="Lado da condução" value={country.car.side} />}
              {country.car?.signs?.length && <Row label="Sinais de carro" value={country.car.signs.join(', ')} />}
              {country.timezones?.length && (
                <Row
                  label="Fuso horário"
                  value={country.timezones.length > 3
                    ? `${country.timezones.slice(0, 3).join(', ')} +${country.timezones.length - 3} more`
                    : country.timezones.join(', ')}
                />
              )}
            </Section>
          </div>

          <div className={styles.sidebar}>
            {country.coatOfArms?.svg && (
              <div className={styles.coatCard}>
                <p className={styles.coatLabel}>Brasão</p>
                <img
                  src={country.coatOfArms.svg}
                  alt={`Coat of Arms of ${country.name.common}`}
                  className={styles.coat}
                />
              </div>
            )}

            {country.maps?.googleMaps && (
              <a
                href={country.maps.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapLink}
              >
                <span>Ver no Google Maps</span>
                <span className={styles.mapArrow}>↗</span>
              </a>
            )}

            {borderCountries.length > 0 && (
              <div className={styles.bordersCard}>
                <p className={styles.bordersTitle}>Países Fronteiriços</p>
                <div className={styles.bordersList}>
                  {borderCountries.map(b => (
                    <Link key={b.cca3} to={`/country/${b.cca3}`} className={styles.borderItem}>
                      <img
                        src={b.flags.svg || b.flags.png}
                        alt={`Flag of ${b.name.common}`}
                        className={styles.borderFlag}
                      />
                      <span>{b.name.common}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Componente "pill" para exibir uma estatística destacada na faixa superior.
 *
 * @param label - Nome da informação (ex: "População")
 * @param value - Valor formatado (ex: "215.3M")
 * @param icon - Caractere Unicode usado como ícone decorativo
 */
function StatPill({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className={styles.pill}>
      <span className={styles.pillIcon}>{icon}</span>
      <div>
        <p className={styles.pillLabel}>{label}</p>
        <p className={styles.pillValue}>{value}</p>
      </div>
    </div>
  );
}

/**
 * Componente de seção com título e conteúdo agrupado.
 * Usado para organizar as informações detalhadas do país em blocos temáticos.
 *
 * @param title - Título da seção (ex: "Geografia")
 * @param children - Linhas de dados (<Row />) que compõem a seção
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.rows}>{children}</div>
    </div>
  );
}

/**
 * Componente de linha rótulo/valor para exibir um par de informação.
 *
 * @param label - Nome do campo (ex: "Área total")
 * @param value - Valor correspondente (ex: "8,515,767 km²")
 */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

/**
 * Esqueleto de carregamento para a página de detalhes.
 * Exibe um placeholder animado enquanto os dados do país são buscados,
 * evitando um salto de layout brusco ao carregar o conteúdo real.
 */
function LoadingSkeleton() {
  return (
    <main className={styles.main}>
      <div className={`${styles.flagHero} skeleton`} style={{ height: 320 }} />
      <div className={styles.body}>
        <div className={styles.statsStrip}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`skeleton`} style={{ height: 70, borderRadius: 8, flex: 1, minWidth: 120 }} />
          ))}
        </div>
      </div>
    </main>
  );
}
