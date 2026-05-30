import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  MAX_TEXT_SIZE_PERCENT,
  MIN_TEXT_SIZE_PERCENT,
  TEXT_SIZE_STEP,
} from '../lib/textSize'

type TextSizeControlProps = {
  percent: number
  onChange: (percent: number) => void
  label: string
  sliderTitle: string
  smallerHint: string
  largerHint: string
}

export function TextSizeControl({
  percent,
  onChange,
  label,
  sliderTitle,
  smallerHint,
  largerHint,
}: TextSizeControlProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

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
    <div className="site-header__text-size" ref={ rootRef }>
      <button
        type="button"
        className="site-header__text-size-trigger"
        aria-haspopup="true"
        aria-expanded={ open }
        aria-controls={ panelId }
        onClick={ () => setOpen((v) => !v) }
      >
        <span>{ label }</span>
        <ChevronDown
          size={ 16 }
          strokeWidth={ 2 }
          className={ `site-header__text-size-chevron${ open ? ' site-header__text-size-chevron--open' : '' }` }
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={ panelId }
          className="site-header__text-size-menu"
          role="group"
          aria-label={ label }
        >
          <div className="site-header__text-size-controls">
            <span
              className="site-header__text-size-a site-header__text-size-a--sm"
              aria-hidden
              title={ smallerHint }
            >
              A
            </span>
            <input
              type="range"
              className="site-header__text-size-slider"
              min={ MIN_TEXT_SIZE_PERCENT }
              max={ MAX_TEXT_SIZE_PERCENT }
              step={ TEXT_SIZE_STEP }
              value={ percent }
              onChange={ (e) => onChange(Number(e.target.value)) }
              title={ sliderTitle }
              aria-label={ sliderTitle }
              aria-valuemin={ MIN_TEXT_SIZE_PERCENT }
              aria-valuemax={ MAX_TEXT_SIZE_PERCENT }
              aria-valuenow={ percent }
              aria-valuetext={ `${ percent }%` }
            />
            <span
              className="site-header__text-size-a site-header__text-size-a--lg"
              aria-hidden
              title={ largerHint }
            >
              A
            </span>
          </div>
          <span className="site-header__text-size-value" aria-live="polite">
            { percent }%
          </span>
        </div>
      ) : null}
    </div>
  )
}
