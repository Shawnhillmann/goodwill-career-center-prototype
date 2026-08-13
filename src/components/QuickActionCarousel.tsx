import { useCallback, useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import type { QuickActionId } from '../quickActions'

export type QuickActionCarouselItem = {
  id: QuickActionId
  label: string
  description: string
  ariaLabel: string
  icon: LucideIcon
}

type QuickActionCarouselProps = {
  actions: QuickActionCarouselItem[]
  ariaLabel: string
  onSelect: (id: QuickActionId) => void
}

function getActiveIndex(scrollLeft: number, slideOffsets: number[]): number {
  if (!slideOffsets.length) return 0
  let best = 0
  let bestDist = Infinity
  slideOffsets.forEach((offset, i) => {
    const dist = Math.abs(scrollLeft - offset)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  })
  return best
}

export function QuickActionCarousel({ actions, ariaLabel, onSelect }: QuickActionCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const offsets = slideRefs.current.map((el) => el?.offsetLeft ?? 0)
    setActiveIndex(getActiveIndex(track.scrollLeft, offsets))
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    syncActiveIndex()
    track.addEventListener('scroll', syncActiveIndex, { passive: true })
    window.addEventListener('resize', syncActiveIndex)
    return () => {
      track.removeEventListener('scroll', syncActiveIndex)
      window.removeEventListener('resize', syncActiveIndex)
    }
  }, [syncActiveIndex, actions.length])

  const scrollToIndex = (index: number) => {
    const slide = slideRefs.current[index]
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <div className="quick-carousel" role="region" aria-label={ ariaLabel }>
      <div ref={ trackRef } className="quick-carousel__track">
        {actions.map(({ id, label, description, ariaLabel: cardAria, icon: Icon }, index) => (
          <button
            key={ id }
            ref={ (el) => {
              slideRefs.current[index] = el
            } }
            type="button"
            className="quick-carousel__card"
            aria-label={ cardAria }
            onClick={ () => onSelect(id) }
          >
            <span className="quick-carousel__icon" aria-hidden>
              <Icon size={ 22 } strokeWidth={ 2 } />
            </span>
            <span className="quick-carousel__text">
              <span className="quick-carousel__title">{ label }</span>
              <span className="quick-carousel__desc">{ description }</span>
            </span>
            <ChevronRight className="quick-carousel__chevron" size={ 20 } strokeWidth={ 2 } aria-hidden />
          </button>
        ))}
      </div>
      <div className="quick-carousel__dots" role="tablist" aria-label={ ariaLabel }>
        {actions.map((action, index) => (
          <button
            key={ action.id }
            type="button"
            role="tab"
            className={ `quick-carousel__dot${ index === activeIndex ? ' quick-carousel__dot--active' : '' }` }
            aria-selected={ index === activeIndex }
            aria-label={ action.label }
            onClick={ () => scrollToIndex(index) }
          />
        ))}
      </div>
    </div>
  )
}
