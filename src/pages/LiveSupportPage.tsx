import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, MapPin, Phone, Video } from 'lucide-react'
import { careerCenters } from '../data/careerCenters'
import { normalizeZipInput, sortCentersByDistance, type Coordinates } from '../lib/careerCenterZip'
import { fetchZipCoordinates } from '../lib/zipCoordsApi'
import type { SupportedLanguage } from '../uiCopy'
import { getUiStrings } from '../uiCopy'

type LiveSupportPageProps = {
  language: SupportedLanguage
  onBack: () => void
}

function formatAddress(center: (typeof careerCenters)[number]): string {
  return `${center.address}, ${center.city}, ${center.state} ${center.zip}`
}

function phoneHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`
}

export function LiveSupportPage({ language, onBack }: LiveSupportPageProps) {
  const ui = getUiStrings(language)
  const [zipInput, setZipInput] = useState('')
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null)
  const [zipLookupDone, setZipLookupDone] = useState(false)

  const zipReady = normalizeZipInput(zipInput).length === 5

  useEffect(() => {
    if (!zipReady) {
      setUserCoords(null)
      setZipLookupDone(false)
      return
    }

    let cancelled = false
    setZipLookupDone(false)

    fetchZipCoordinates(zipInput).then((coords) => {
      if (cancelled) return
      setUserCoords(coords)
      setZipLookupDone(true)
    })

    return () => {
      cancelled = true
    }
  }, [zipInput, zipReady])

  const { centers: sortedCenters } = useMemo(
    () => sortCentersByDistance(careerCenters, zipReady && zipLookupDone ? userCoords : null),
    [zipReady, zipLookupDone, userCoords],
  )

  const showZipUnknown = zipReady && zipLookupDone && userCoords === null

  return (
    <section className="support" aria-label={ ui.liveSupportTitle }>
      <div className="support__header">
        <button type="button" className="support__back" onClick={ onBack }>
          <ChevronLeft size={ 18 } strokeWidth={ 2 } aria-hidden />
          <span>{ ui.backToChat }</span>
        </button>
      </div>
      <h1 className="support__title">{ ui.liveSupportTitle }</h1>

      <article className="support-card support-card--virtual" role="note">
        <div className="support-card__thumb" aria-hidden>
          <img src="/explore-support.svg" alt="" className="support-card__thumb-img" />
          <span className="support-card__thumb-badge">
            <Video size={ 28 } strokeWidth={ 1.75 } />
          </span>
        </div>
        <div className="support-card__body">
          <p className="support-card__text">{ ui.liveSupportVirtualSession }</p>
        </div>
      </article>

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
            { showZipUnknown ? ui.liveSupportZipUnknown : ui.liveSupportZipHint }
          </p>
        </form>

        <ul className="support__center-list">
          {sortedCenters.map((center, index) => (
            <li key={ center.id } className="support-center">
              {zipReady && zipLookupDone && userCoords && index === 0 ? (
                <span className="support-center__badge">{ ui.liveSupportNearest }</span>
              ) : null}
              <h3 className="support-center__name">{ center.name }</h3>
              {zipReady && zipLookupDone && userCoords && center.distanceMiles != null ? (
                <p className="support-center__distance">
                  { ui.liveSupportMilesAway.replace('%s', center.distanceMiles.toFixed(1)) }
                </p>
              ) : null}
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
