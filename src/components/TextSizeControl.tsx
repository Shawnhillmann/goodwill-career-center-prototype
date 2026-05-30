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
  return (
    <div className="site-header__text-size">
      <span className="site-header__text-size-label" id="text-size-label">
        { label }
      </span>
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
          aria-labelledby="text-size-label"
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
    </div>
  )
}
