import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'
import { GoodwillLogo } from './GoodwillLogo'
import type { SupportedLanguage } from '../uiCopy'
import { getUiStrings } from '../uiCopy'

type FooterProps = {
  language: SupportedLanguage
}

export function Footer({ language }: FooterProps) {
  const ui = getUiStrings(language)
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__intro">
          <GoodwillLogo wordmarkSize={ 20 } logoHeight={ 44 } />
          <p>{ ui.footerTagline }</p>
          <a className="site-footer__learn" href="#">
            { ui.footerLearnMore } →
          </a>
        </div>

        <div className="site-footer__columns">
          <div className="site-footer__social-block">
            <div className="site-footer__social">
              <a href="#" className="site-footer__social-btn" aria-label="Facebook">
                <Facebook size={ 20 } fill="currentColor" strokeWidth={ 0 } aria-hidden />
              </a>
              <a href="#" className="site-footer__social-btn" aria-label="Instagram">
                <Instagram size={ 20 } fill="currentColor" strokeWidth={ 1.75 } aria-hidden />
              </a>
              <a href="#" className="site-footer__social-btn" aria-label="LinkedIn">
                <Linkedin size={ 20 } fill="currentColor" strokeWidth={ 0 } aria-hidden />
              </a>
              <a href="#" className="site-footer__social-btn" aria-label="YouTube">
                <Youtube size={ 20 } fill="currentColor" strokeWidth={ 0 } aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>{ ui.footerCopyright }</p>
        <div className="site-footer__legal">
          <a href="#">{ ui.footerPrivacy }</a>
          <span aria-hidden>|</span>
          <a href="#">{ ui.footerTerms }</a>
          <span aria-hidden>|</span>
          <a href="#">{ ui.footerAccessibility }</a>
        </div>
      </div>
    </footer>
  )
}
