import { ArrowRight } from 'lucide-react'
import type { AppPage } from '../lib/appNavigation'
import type { SupportedLanguage } from '../uiCopy'
import { getUiStrings } from '../uiCopy'

type HomeExploreCardsProps = {
  language: SupportedLanguage
  onNavigate: (page: AppPage) => void
}

export function HomeExploreCards({ language, onNavigate }: HomeExploreCardsProps) {
  const ui = getUiStrings(language)

  const cards = [
    {
      page: 'resources' as const,
      title: ui.exploreResourcesTitle,
      description: ui.exploreResourcesDescription,
      image: '/explore-resources.svg',
      imageAlt: ui.exploreResourcesImageAlt,
    },
    {
      page: 'support' as const,
      title: ui.exploreSupportTitle,
      description: ui.exploreSupportDescription,
      image: '/explore-support.svg',
      imageAlt: ui.exploreSupportImageAlt,
    },
  ]

  return (
    <section className="home-explore-band" aria-label={ ui.exploreSectionAria }>
      <div className="home-explore-band__inner">
        <div className="home-explore__grid">
        {cards.map((card) => (
          <button
            key={ card.page }
            type="button"
            className="home-explore-card"
            aria-label={ `${ card.title } — ${ card.description }` }
            onClick={ () => onNavigate(card.page) }
          >
            <span className="home-explore-card__media" aria-hidden>
              <img src={ card.image } alt="" className="home-explore-card__img" />
            </span>
            <span className="home-explore-card__body">
              <span className="home-explore-card__title">{ card.title }</span>
              <span className="home-explore-card__desc">{ card.description }</span>
              <span className="home-explore-card__cta">
                <span>{ ui.exploreCardCta }</span>
                <ArrowRight size={ 18 } strokeWidth={ 2.25 } aria-hidden />
              </span>
            </span>
          </button>
        ))}
        </div>
      </div>
    </section>
  )
}
