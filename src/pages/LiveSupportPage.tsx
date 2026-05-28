import type { SupportedLanguage } from '../uiCopy'
import { getUiStrings } from '../uiCopy'

type LiveSupportPageProps = {
  language: SupportedLanguage
}

export function LiveSupportPage({ language }: LiveSupportPageProps) {
  const ui = getUiStrings(language)

  return (
    <section className="support" aria-label={ ui.liveSupportTitle }>
      <h1 className="support__title">{ ui.liveSupportTitle }</h1>
      <p className="support__subtitle">{ ui.liveSupportIntro }</p>
      <div className="support__placeholder" role="note">
        Coming soon: enter your ZIP code or location to find your closest Career Center and phone number.
      </div>
    </section>
  )
}

