import { useEffect, useMemo, useState } from 'react'
import { CareerAdvisorCard } from './components/CareerAdvisorCard'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import './App.css'
import { getUiStrings, supportedLanguages, type SupportedLanguage } from './uiCopy'
import { loadTextSizeLevel, saveTextSizeLevel, type TextSizeLevel } from './lib/textSize'
import { isReadAloudSupported } from './lib/readAloudSupport'
import { ResourcesPage } from './pages/ResourcesPage'
import { LiveSupportPage } from './pages/LiveSupportPage'
import { warmApiBackend } from './lib/warmApi'

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
  const [textSizeLevel, setTextSizeLevel] = useState<TextSizeLevel>(() => loadTextSizeLevel())

  useEffect(() => {
    warmApiBackend()
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
    <div className="app" id="top" lang={ langTag } dir={ language === 'ar' ? 'rtl' : 'ltr' }>
      <Header
        page={ page }
        onNavigate={ (next) => setPage(next) }
        language={ language }
        onLanguageChange={ setLanguage }
        readAloudEnabled={ readAloudEnabled }
        onReadAloudChange={ setReadAloudEnabled }
        textSizeLevel={ textSizeLevel }
        onTextSizeChange={ handleTextSizeChange }
        textSizeOptions={ textSizeOptions }
      />
      <main className="app__main">
        {page === 'resources' ? (
          <ResourcesPage language={ language } onBack={ () => setPage('chat') } />
        ) : page === 'support' ? (
          <LiveSupportPage language={ language } />
        ) : (
          <CareerAdvisorCard
            language={ language }
            readAloudEnabled={ readAloudEnabled && isReadAloudSupported(language) }
          />
        )}
      </main>
      <Footer language={ language } />
    </div>
  )
}
