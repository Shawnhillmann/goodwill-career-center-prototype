import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { GoodwillLogo } from './GoodwillLogo'
import { getUiStrings, supportedLanguages, type SupportedLanguage } from '../uiCopy'
import { isReadAloudSupported } from '../lib/readAloudSupport'
import type { AppPage } from '../lib/appNavigation'
import type { TextSizeLevel } from '../lib/textSize'
import { TextSizeControl, type TextSizeOption } from './TextSizeControl'

type HeaderProps = {
  page: AppPage
  onNavigate: (page: AppPage) => void
  language: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
  readAloudEnabled: boolean
  onReadAloudChange: (enabled: boolean) => void
  textSizeLevel: TextSizeLevel
  onTextSizeChange: (level: TextSizeLevel) => void
  textSizeOptions: TextSizeOption[]
}

function LanguageMenu({
  language,
  onLanguageChange,
  ariaLabel,
}: {
  language: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
  ariaLabel: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const currentLabel = supportedLanguages.find((l) => l.code === language)?.label ?? language

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="site-header__lang" ref={ rootRef }>
      <button
        type="button"
        className="site-header__lang-trigger"
        aria-label={ ariaLabel }
        aria-haspopup="listbox"
        aria-expanded={ open }
        onClick={ () => setOpen((v) => !v) }
      >
        <span>{ currentLabel }</span>
        <ChevronDown
          size={ 16 }
          strokeWidth={ 2 }
          className={ `site-header__lang-chevron${ open ? ' site-header__lang-chevron--open' : '' }` }
          aria-hidden
        />
      </button>
      {open ? (
        <div className="site-header__lang-menu" role="listbox" aria-label={ ariaLabel }>
          {supportedLanguages.map((opt) => (
            <button
              key={ opt.code }
              type="button"
              role="option"
              aria-selected={ opt.code === language }
              className="site-header__lang-option"
              onClick={ () => {
                onLanguageChange(opt.code)
                setOpen(false)
              } }
            >
              { opt.label }
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function Header({ page, onNavigate, language, onLanguageChange, readAloudEnabled, onReadAloudChange, textSizeLevel, onTextSizeChange, textSizeOptions }: HeaderProps) {
  const ui = getUiStrings(language)
  const readAloudAvailable = isReadAloudSupported(language)

  return (
    <header className="site-header" dir="ltr">
      <div className="site-header__inner">
        <a
          href="/"
          className="site-header__brand"
          onClick={ (e) => {
            e.preventDefault()
            window.location.reload()
          } }
          aria-label="Goodwill AI Career Center — refresh page"
        >
          <GoodwillLogo wordmarkSize={ 20 } logoHeight={ 44 } />
        </a>

        <div className="site-header__right">
          <nav className="site-header__primary" aria-label="Main">
            <button
              type="button"
              className="site-header__link"
              aria-label={ ui.careerAdvisor }
              aria-current={ page === 'chat' ? 'page' : undefined }
              onClick={ () => onNavigate('chat') }
            >
              <span className="site-header__link-text" aria-hidden>{ ui.careerAdvisor }</span>
            </button>
            <button
              type="button"
              className="site-header__link"
              aria-label={ ui.resources }
              aria-current={ page === 'resources' ? 'page' : undefined }
              onClick={ () => onNavigate(page === 'resources' ? 'chat' : 'resources') }
            >
              <span className="site-header__link-text" aria-hidden>{ ui.resources }</span>
            </button>
          </nav>

          <div className="site-header__trailing">
          <div className="site-header__controls" role="group" aria-label={ ui.siteSettings }>
            <TextSizeControl
              level={ textSizeLevel }
              onChange={ onTextSizeChange }
              label={ ui.textSize }
              options={ textSizeOptions }
            />
            <LanguageMenu language={ language } onLanguageChange={ onLanguageChange } ariaLabel={ ui.language } />

            {readAloudAvailable ? (
              <label className="site-header__toggle">
                <input
                  type="checkbox"
                  checked={ readAloudEnabled }
                  onChange={ (e) => onReadAloudChange(e.target.checked) }
                />
                <span className="site-header__toggle-ui" aria-hidden />
                <span className="site-header__toggle-text">{ ui.readAloud }</span>
              </label>
            ) : (
              <span
                className="site-header__toggle site-header__toggle--unavailable"
                title={ ui.readAloudUnavailable }
                aria-label={ ui.readAloudUnavailable }
              >
                <span className="site-header__toggle-ui site-header__toggle-ui--off" aria-hidden />
                <span className="site-header__toggle-text">{ ui.readAloud }</span>
              </span>
            )}
          </div>

          <button
            type="button"
            className="site-header__cta"
            aria-current={ page === 'support' ? 'page' : undefined }
            onClick={ () => onNavigate('support') }
          >
            { ui.liveSupport }
          </button>
        </div>
        </div>
      </div>
    </header>
  )
}
