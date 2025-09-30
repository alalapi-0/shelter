import type { FC } from 'react';
import clsx from 'clsx';
import styles from './Header.module.css';

export type PageKey = 'register' | 'feed' | 'compose' | 'groups';

interface HeaderProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  isAuthenticated: boolean;
  health?: {
    status: string;
    db?: 'ok' | 'down';
    redis?: 'ok' | 'down';
  };
  healthLoading: boolean;
}

const navItems: { key: PageKey; label: string }[] = [
  { key: 'register', label: 'Register' },
  { key: 'feed', label: 'Feed' },
  { key: 'compose', label: 'Compose' },
  { key: 'groups', label: 'Groups' }
];

const StatusBadge: FC<{ label: string; status?: 'ok' | 'down'; loading: boolean }> = ({
  label,
  status,
  loading
}) => {
  const className = status === 'ok' ? 'status-badge status-ok' : 'status-badge status-down';
  const text = loading ? 'loading…' : status === 'ok' ? 'ok' : 'down';
  return (
    <span className={className} role="status" aria-live="polite">
      {label}: {text}
    </span>
  );
};

export const Header: FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  isAuthenticated,
  health,
  healthLoading
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div>
          <div className={styles.brand}>Shadow Groups</div>
          <div aria-live="polite">{isAuthenticated ? '匿名身份已激活' : '尚未注册匿名身份'}</div>
        </div>
        <nav aria-label="Primary">
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={clsx(styles.navButton, {
                    [styles.navButtonActive]: currentPage === item.key
                  })}
                  onClick={() => onNavigate(item.key)}
                  aria-current={currentPage === item.key ? 'page' : undefined}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.statusGroup}>
          <StatusBadge label="API" status={health?.status === 'ok' ? 'ok' : 'down'} loading={healthLoading} />
          <StatusBadge label="DB" status={health?.db} loading={healthLoading} />
          <StatusBadge label="Redis" status={health?.redis} loading={healthLoading} />
        </div>
      </div>
    </header>
  );
};

export default Header;
