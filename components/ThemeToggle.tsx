import React, { useState } from 'react';
import { Moon, Sun } from '@phosphor-icons/react';
import { useLanguage } from '../i18n/LanguageContext';

type Theme = 'light' | 'dark';

const THEME_KEY = 'minime_theme';
const THEME_COLORS: Record<Theme, string> = { light: '#F6FBFE', dark: '#000509' };

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') root.dataset.theme = 'dark';
  else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
};

export const ThemeToggle: React.FC = () => {
  const { t } = useLanguage();
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const label = theme === 'dark' ? t.lightTheme : t.darkTheme;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="ctl touch w-control h-control rounded-full bg-surface text-text shadow-sm flex items-center justify-center"
    >
      {theme === 'dark' ? <Sun size={16} weight="duotone" /> : <Moon size={16} weight="duotone" />}
    </button>
  );
};
