import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe, Menu, MessageCircle, X } from 'lucide-react'
import { GoodwillLogo } from './GoodwillLogo'
import { getUiStrings, supportedLanguages, type SupportedLanguage } from '../uiCopy'
import { isReadAloudSupported } from '../lib/readAloudSupport'
import type { AppPage } from '../lib/appNavigation'
import type { TextSizeLevel } from '../lib/textSize'
import { TextSizeControl, type TextSizeOption } from './TextSizeControl'

type HeaderProps = {
  page: AppPage
  compactChat?: boolean
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
  showGlobe = false,
}: {
  language: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
  ariaLabel: string
  showGlobe?: boolean
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
        {showGlobe ? <Globe size={ 18 } strokeWidth={ 2 } className="site-header__lang-globe" aria-hidden /> : null}
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

function ReadAloudToggle({
  ui,
  readAloudAvailable,
  readAloudEnabled,
  onReadAloudChange,
}: {
  ui: ReturnType<typeof getUiStrings>
  readAloudAvailable: boolean
  readAloudEnabled: boolean
  onReadAloudChange: (enabled: boolean) => void
}) {
  if (readAloudAvailable) {
    return (
      <label className="site-header__toggle">
        <input
          type="checkbox"
          checked={ readAloudEnabled }
          onChange={ (e) => onReadAloudChange(e.target.checked) }
        />
        <span className="site-header__toggle-ui" aria-hidden />
        <span className="site-header__toggle-text">{ ui.readAloud }</span>
      </label>
    )
  }

  return (
    <span
      className="site-header__toggle site-header__toggle--unavailable"
      title={ ui.readAloudUnavailable }
      aria-label={ ui.readAloudUnavailable }
    >
      <span className="site-header__toggle-ui site-header__toggle-ui--off" aria-hidden />
      <span className="site-header__toggle-text">{ ui.readAloud }</span>
    </span>
  )
}

export function Header({ page, compactChat = false, onNavigate, language, onLanguageChange, readAloudEnabled, onReadAloudChange, textSizeLevel, onTextSizeChange, textSizeOptions }: HeaderProps) {
  const ui = getUiStrings(language)
  const readAloudAvailable = isReadAloudSupported(language)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const navTo = (target: AppPage) => {
    onNavigate(target)
    closeMenu()
  }

  return (
    <header className={ `site-header${ compactChat ? ' site-header--chat-compact' : '' }` } dir="ltr">
      <div className="site-header__shell">
        <div className="site-header__inner site-header__inner--top">
          <button
            type="button"
            className="site-header__menu-btn"
            aria-label={ ui.mainMenu }
            aria-expanded={ menuOpen }
            aria-controls="site-header-drawer"
            onClick={ () => setMenuOpen((v) => !v) }
          >
            {menuOpen ? <X size={ 22 } strokeWidth={ 2 } aria-hidden /> : <Menu size={ 22 } strokeWidth={ 2 } aria-hidden />}
          </button>

          <a
            href="/"
            className="site-header__brand"
            onClick={ (e) => {
              e.preventDefault()
              navTo('chat')
            } }
            aria-label="Goodwill AI Career Center — Career Advisor"
          >
            <GoodwillLogo wordmarkSize={ 20 } logoHeight={ compactChat ? 32 : 36 } hideWordmark={ compactChat } />
          </a>

          <div className="site-header__right site-header__right--desktop">
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
                <ReadAloudToggle
                  ui={ ui }
                  readAloudAvailable={ readAloudAvailable }
                  readAloudEnabled={ readAloudEnabled }
                  onReadAloudChange={ onReadAloudChange }
                />
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

          <button
            type="button"
            className="site-header__cta site-header__cta--mobile"
            aria-current={ page === 'support' ? 'page' : undefined }
            onClick={ () => onNavigate('support') }
          >
            <MessageCircle size={ 18 } strokeWidth={ 2 } aria-hidden />
            <span>{ ui.liveSupport }</span>
          </button>
        </div>

        <div className="site-header__bar site-header__bar--mobile" role="group" aria-label={ ui.siteSettings }>
          <LanguageMenu
            language={ language }
            onLanguageChange={ onLanguageChange }
            ariaLabel={ ui.language }
            showGlobe
          />
          <span className="site-header__bar-divider" aria-hidden />
          <ReadAloudToggle
            ui={ ui }
            readAloudAvailable={ readAloudAvailable }
            readAloudEnabled={ readAloudEnabled }
            onReadAloudChange={ onReadAloudChange }
          />
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="site-header__backdrop"
            aria-label={ ui.closeMenu }
            onClick={ closeMenu }
          />
          <nav id="site-header-drawer" className="site-header__drawer" aria-label={ ui.mainMenu }>
            <button
              type="button"
              className="site-header__drawer-link"
              aria-current={ page === 'chat' ? 'page' : undefined }
              onClick={ () => navTo('chat') }
            >
              { ui.careerAdvisor }
            </button>
            <button
              type="button"
              className="site-header__drawer-link"
              aria-current={ page === 'resources' ? 'page' : undefined }
              onClick={ () => navTo(page === 'resources' ? 'chat' : 'resources') }
            >
              { ui.resources }
            </button>
            <div className="site-header__drawer-settings">
              <LanguageMenu
                language={ language }
                onLanguageChange={ onLanguageChange }
                ariaLabel={ ui.language }
                showGlobe
              />
              <ReadAloudToggle
                ui={ ui }
                readAloudAvailable={ readAloudAvailable }
                readAloudEnabled={ readAloudEnabled }
                onReadAloudChange={ onReadAloudChange }
              />
              <TextSizeControl
                level={ textSizeLevel }
                onChange={ onTextSizeChange }
                label={ ui.textSize }
                options={ textSizeOptions }
              />
            </div>
          </nav>
        </>
      ) : null}
    </header>
  )
}
