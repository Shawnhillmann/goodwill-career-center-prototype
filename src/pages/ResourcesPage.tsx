import { useMemo } from 'react'
import { BookOpen, ChevronLeft, PlayCircle, Presentation } from 'lucide-react'
import type { SupportedLanguage } from '../uiCopy'
import { getUiStrings, resourceExamples } from '../uiCopy'

type ResourcesPageProps = {
  language: SupportedLanguage
  onBack: () => void
}

function resourceIcon(typeLabel: string) {
  const lower = typeLabel.toLowerCase()
  if (lower.includes('video') || lower.includes('videyo') || lower.includes('wideo') || lower.includes('видео') || lower.includes('فيديو')) {
    return PlayCircle
  }
  if (
    lower.includes('slideshow') ||
    lower.includes('present') ||
    lower.includes('dyapo') ||
    lower.includes('презента') ||
    lower.includes('عرض')
  ) {
    return Presentation
  }
  return BookOpen
}

export function ResourcesPage({ language, onBack }: ResourcesPageProps) {
  const ui = getUiStrings(language)
  const examples = useMemo(
    () => resourceExamples[language] ?? resourceExamples.en,
    [language],
  )

  return (
    <section className="resources" aria-label={ ui.resources }>
      <div className="resources__header">
        <button type="button" className="resources__back" onClick={ onBack }>
          <ChevronLeft size={ 18 } strokeWidth={ 2 } aria-hidden />
          <span>{ ui.backToChat }</span>
        </button>
      </div>

      <header className="resources__hero">
        <h1 className="resources__title">{ ui.resourcesTitle }</h1>
        <p className="resources__subtitle">{ ui.resourcesIntro }</p>
      </header>

      <div className="resources__grid">
        {examples.map((item) => {
          const Icon = resourceIcon(item.typeLabel)
          return (
            <article key={ item.title } className="resource-card resource-card--placeholder">
              <div className="resource-card__thumb" aria-hidden>
                <span className="resource-card__thumb-icon">
                  <Icon size={ 40 } strokeWidth={ 1.5 } />
                </span>
              </div>
              <div className="resource-card__body">
                <div className="resource-card__top">
                  <span className="resource-card__icon" aria-hidden>
                    <Icon size={ 18 } strokeWidth={ 2 } />
                  </span>
                  <span className="resource-card__meta">{ item.typeLabel }</span>
                </div>
                <h2 className="resource-card__title">{ item.title }</h2>
                <p className="resource-card__desc">{ item.description }</p>
                <div className="resource-card__actions">
                  <button type="button" className="resource-card__open" disabled>
                    { ui.resourceComingSoon }
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
