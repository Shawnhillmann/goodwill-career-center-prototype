import { useEffect, useMemo, useState } from 'react'
import { CareerAdvisorCard } from './components/CareerAdvisorCard'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import './App.css'
import { getUiStrings, supportedLanguages, type SupportedLanguage } from './uiCopy'
import { ResourcesPage } from './pages/ResourcesPage'
import { LiveSupportPage } from './pages/LiveSupportPage'

export default function App() {
  const [page, setPage] = useState<'chat' | 'resources' | 'support'>('chat')
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = window.localStorage.getItem('gw.language') as SupportedLanguage | null
    return saved && supportedLanguages.some((l) => l.code === saved) ? saved : 'en'
  })
  const [readAloudEnabled, setReadAloudEnabled] = useState<boolean>(() => {
    const saved = window.localStorage.getItem('gw.readAloud')
    return saved === 'true'
  })

  useEffect(() => {
    window.localStorage.setItem('gw.language', language)
  }, [language])

  useEffect(() => {
    window.localStorage.setItem('gw.readAloud', String(readAloudEnabled))
  }, [readAloudEnabled])

  const ui = useMemo(() => getUiStrings(language), [language])
  const langTag = supportedLanguages.find((l) => l.code === language)?.bcp47 ?? 'en-US'

  return (
    <div className="app" id="top" lang={ langTag } dir={ language === 'ar' ? 'rtl' : 'ltr' }>
      <Header
        page={ page }
        onNavigate={ (next) => setPage(next) }
        language={ language }
        onLanguageChange={ setLanguage }
        readAloudEnabled={ readAloudEnabled }
        onReadAloudChange={ setReadAloudEnabled }
      />
      <main className="app__main">
        {page === 'resources' ? (
          <ResourcesPage language={ language } onBack={ () => setPage('chat') } />
        ) : page === 'support' ? (
          <LiveSupportPage language={ language } />
        ) : (
          <>
            <CareerAdvisorCard language={ language } readAloudEnabled={ readAloudEnabled } />
            <p className="ai-disclaimer" role="note">
              { ui.aiDisclaimer }
            </p>
          </>
        )}
      </main>
      <Footer language={ language } />
    </div>
  )
}
