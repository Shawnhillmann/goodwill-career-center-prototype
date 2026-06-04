import { useEffect, useMemo, useState } from 'react'
import { CareerAdvisorCard } from './components/CareerAdvisorCard'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import './App.css'
import { getUiStrings, supportedLanguages, type SupportedLanguage } from './uiCopy'
import { loadTextSizeLevel, saveTextSizeLevel, type TextSizeLevel } from './lib/textSize'
import { isReadAloudSupported } from './lib/readAloudSupport'
import { HomeExploreCards } from './components/HomeExploreCards'
import { ResourcesPage } from './pages/ResourcesPage'
import { LiveSupportPage } from './pages/LiveSupportPage'
import { applyPageHash, hashToPage, type AppPage } from './lib/appNavigation'
import { warmApiBackend } from './lib/warmApi'
import { useMediaQuery } from './lib/useMediaQuery'

export default function App() {
  const [page, setPage] = useState<AppPage>(() => hashToPage(window.location.hash))
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = window.localStorage.getItem('gw.language') as SupportedLanguage | null
    return saved && supportedLanguages.some((l) => l.code === saved) ? saved : 'en'
  })
  const [readAloudEnabled, setReadAloudEnabled] = useState<boolean>(() => {
    const saved = window.localStorage.getItem('gw.readAloud')
    return saved === 'true'
  })
  const [textSizeLevel, setTextSizeLevel] = useState<TextSizeLevel>(() => loadTextSizeLevel())
  const [chatActive, setChatActive] = useState(false)
  const [mobileHeaderCompact, setMobileHeaderCompact] = useState(false)
  const mobileChatLayout = useMediaQuery('(max-width: 1023px)')

  useEffect(() => {
    warmApiBackend()
  }, [])

  const navigate = (next: AppPage) => {
    setPage(next)
    applyPageHash(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const onHashChange = () => setPage(hashToPage(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('gw.language', language)
  }, [language])

  useEffect(() => {
    if (!isReadAloudSupported(language) && readAloudEnabled) {
      setReadAloudEnabled(false)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [language, readAloudEnabled])

  useEffect(() => {
    window.localStorage.setItem('gw.readAloud', String(readAloudEnabled))
  }, [readAloudEnabled])

  const handleTextSizeChange = (level: TextSizeLevel) => {
    setTextSizeLevel(saveTextSizeLevel(level))
  }

  const ui = useMemo(() => getUiStrings(language), [language])
  const textSizeOptions = useMemo(
    () => [
      { level: 'small' as const, label: ui.textSizeSmall },
      { level: 'normal' as const, label: ui.textSizeNormal },
      { level: 'large' as const, label: ui.textSizeLarge },
      { level: 'veryLarge' as const, label: ui.textSizeVeryLarge },
    ],
    [ui],
  )
  const langTag = supportedLanguages.find((l) => l.code === language)?.bcp47 ?? 'en-US'

  return (
    <div
      className={ `app${
        page === 'chat' ? (chatActive ? ' app--chat-active' : ' app--chat-landing') : ''
      }${
        page === 'chat' && chatActive && mobileChatLayout && !mobileHeaderCompact
          ? ' app--chat-active-peek'
          : ''
      }` }
      id="top"
      lang={ langTag }
      dir={ language === 'ar' ? 'rtl' : 'ltr' }
    >
      <Header
        page={ page }
        compactChat={ page === 'chat' && chatActive && mobileHeaderCompact }
        onNavigate={ navigate }
        language={ language }
        onLanguageChange={ setLanguage }
        readAloudEnabled={ readAloudEnabled }
        onReadAloudChange={ setReadAloudEnabled }
        textSizeLevel={ textSizeLevel }
        onTextSizeChange={ handleTextSizeChange }
        textSizeOptions={ textSizeOptions }
      />
      <main className={ `app__main${ page === 'chat' ? ' app__main--chat' : '' }` }>
        {page === 'resources' ? (
          <ResourcesPage language={ language } onBack={ () => navigate('chat') } />
        ) : page === 'support' ? (
          <LiveSupportPage language={ language } onBack={ () => navigate('chat') } />
        ) : (
          <div className="chat-view">
            <div className="chat-view__panel">
              <CareerAdvisorCard
                language={ language }
                readAloudEnabled={ readAloudEnabled && isReadAloudSupported(language) }
                onChatActiveChange={ setChatActive }
                onMobileHeaderCompactChange={ setMobileHeaderCompact }
              />
            </div>
            <HomeExploreCards language={ language } onNavigate={ navigate } />
          </div>
        )}
      </main>
      <Footer language={ language } />
    </div>
  )
}
