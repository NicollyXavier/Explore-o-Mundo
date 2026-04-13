import styles from './SearchBar.module.css';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

/**
 * Campo de busca controlado para filtrar países pelo nome.
 * @param value - Texto atual da busca
 * @param onChange - Função chamada com o novo valor ao digitar ou limpar
 * @param placeholder - Texto exibido quando o campo está vazio
 */
export function SearchBar({ value, onChange, placeholder = 'Procurar Países…' }: Props) {
  return (
    <div className={styles.wrap}>
      <svg className={styles.icon} viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        aria-label="Procurar Países (digite o nome em inglês)"
      />
      {value && (
        <button
          className={styles.clear}
          onClick={() => onChange('')}
          aria-label="Limpar pesquisa"
        >
          ✕
        </button>
      )}
    </div>
  );
}
