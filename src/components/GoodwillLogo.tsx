/** Place logo at `public/goodwill-logo.svg` or `public/goodwill-logo.png` (or pass `logoSrc`). */
export const DEFAULT_GOODWILL_LOGO_SRC = '/goodwill-logo.svg'

export const SITE_TITLE = 'Goodwill AI Career Center'

type GoodwillLogoProps = {
  /** Wordmark text size in px (approx) */
  wordmarkSize?: number
  /** Logo image height in px */
  logoHeight?: number
  /** Path to logo image in `public/` */
  logoSrc?: string
  /** Hide wordmark (logo only) */
  hideWordmark?: boolean
}

export function GoodwillLogo({
  wordmarkSize = 22,
  logoHeight = 40,
  logoSrc = DEFAULT_GOODWILL_LOGO_SRC,
  hideWordmark = false,
}: GoodwillLogoProps) {
  const sizePx = `${ logoHeight }px`

  return (
    <div className="gw-logo" aria-label={ SITE_TITLE }>
      <img
        className="gw-logo__img"
        src={ logoSrc }
        alt=""
        width={ logoHeight }
        height={ logoHeight }
        style={ {
          width: sizePx,
          height: sizePx,
          maxWidth: sizePx,
          maxHeight: sizePx,
          objectFit: 'contain',
        } }
        decoding="async"
      />
      {hideWordmark ? null : (
        <span className="gw-logo__word" style={{ fontSize: wordmarkSize }}>
          { SITE_TITLE }
        </span>
      )}
    </div>
  )
}
