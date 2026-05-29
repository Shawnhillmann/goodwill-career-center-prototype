import { useMemo, useState } from 'react'
import { MapPin, Phone, Video } from 'lucide-react'
import { careerCenters } from '../data/careerCenters'
import { normalizeZipInput, sortCentersByZip } from '../lib/careerCenterZip'
import type { SupportedLanguage } from '../uiCopy'
import { getUiStrings } from '../uiCopy'

type LiveSupportPageProps = {
  language: SupportedLanguage
}

function formatAddress(center: (typeof careerCenters)[number]): string {
  return `${center.address}, ${center.city}, ${center.state} ${center.zip}`
}

function phoneHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`
}

export function LiveSupportPage({ language }: LiveSupportPageProps) {
  const ui = getUiStrings(language)
  const [zipInput, setZipInput] = useState('')

  const sortedCenters = useMemo(
    () => sortCentersByZip(careerCenters, zipInput),
    [zipInput],
  )

  const zipReady = normalizeZipInput(zipInput).length === 5

  return (
    <section className="support" aria-label={ ui.liveSupportTitle }>
      <h1 className="support__title">{ ui.liveSupportTitle }</h1>

      <div className="support-card support-card--virtual" role="note">
        <span className="support-card__icon" aria-hidden>
          <Video size={ 22 } strokeWidth={ 1.75 } />
        </span>
        <p className="support-card__text">{ ui.liveSupportVirtualSession }</p>
      </div>

      <section className="support__centers" aria-labelledby="support-centers-heading">
        <h2 id="support-centers-heading" className="support__section-title">
          { ui.liveSupportCentersHeading }
        </h2>

        <form
          className="support__zip-form"
          onSubmit={ (e) => e.preventDefault() }
        >
          <label className="support__zip-label" htmlFor="support-zip">
            { ui.liveSupportZipLabel }
          </label>
          <input
            id="support-zip"
            className="support__zip-input"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={ 5 }
            placeholder={ ui.liveSupportZipPlaceholder }
            value={ zipInput }
            onChange={ (e) => setZipInput(normalizeZipInput(e.target.value)) }
            aria-describedby="support-zip-hint"
          />
          <p id="support-zip-hint" className="support__zip-hint">
            { ui.liveSupportZipHint }
          </p>
        </form>

        <ul className="support__center-list">
          {sortedCenters.map((center, index) => (
            <li key={ center.id } className="support-center">
              {zipReady && index === 0 ? (
                <span className="support-center__badge">{ ui.liveSupportNearest }</span>
              ) : null}
              <h3 className="support-center__name">{ center.name }</h3>
              <p className="support-center__row">
                <MapPin size={ 16 } strokeWidth={ 2 } aria-hidden />
                <span>{ formatAddress(center) }</span>
              </p>
              <p className="support-center__row">
                <Phone size={ 16 } strokeWidth={ 2 } aria-hidden />
                <a href={ phoneHref(center.phone) } className="support-center__phone">
                  { center.phone }
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
