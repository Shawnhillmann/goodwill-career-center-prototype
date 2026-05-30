import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { TEXT_SIZE_LEVELS, type TextSizeLevel } from '../lib/textSize'

export type TextSizeOption = {
  level: TextSizeLevel
  label: string
}

type TextSizeControlProps = {
  level: TextSizeLevel
  onChange: (level: TextSizeLevel) => void
  label: string
  options: TextSizeOption[]
}

export function TextSizeControl({ level, onChange, label, options }: TextSizeControlProps) {
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

  const orderedOptions = TEXT_SIZE_LEVELS.map(
    (sizeLevel) => options.find((opt) => opt.level === sizeLevel) ?? { level: sizeLevel, label: sizeLevel },
  )

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
          role="radiogroup"
          aria-label={ label }
        >
          {orderedOptions.map((opt) => {
            const selected = level === opt.level
            return (
              <button
                key={ opt.level }
                type="button"
                role="radio"
                aria-checked={ selected }
                className={ `site-header__text-size-option site-header__text-size-option--${ opt.level }${ selected ? ' site-header__text-size-option--selected' : '' }` }
                onClick={ () => {
                  onChange(opt.level)
                  setOpen(false)
                } }
              >
                <span className="site-header__text-size-option-a" aria-hidden>
                  A
                </span>
                <span className="site-header__text-size-option-label">{ opt.label }</span>
              </button>
            )
          }) }
        </div>
      ) : null}
    </div>
  )
}
