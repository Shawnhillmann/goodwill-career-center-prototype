import { parseResumeDocument, parseResumeMeta } from '../../shared/resumeParse'
import type { ResumeDocument } from '../../shared/resumeParse'

type ResumePreviewProps = {
  text: string
}

export function ResumePreview({ text }: ResumePreviewProps) {
  const resume = parseResumeDocument(text)
  if (!resume) return null
  return <ResumeDocumentView resume={ resume } />
}

function ResumeDocumentView({ resume }: { resume: ResumeDocument }) {
  return (
    <article className="resume-doc" aria-label={ `Resume for ${ resume.name }` }>
      <header className="resume-doc__header">
        <h2 className="resume-doc__name">{ resume.name }</h2>
        {resume.headline ? <p className="resume-doc__headline">{ resume.headline }</p> : null}
        {resume.contact ? <p className="resume-doc__contact">{ resume.contact }</p> : null}
      </header>

      {resume.sections.map((section) => (
        <section key={ section.title } className="resume-doc__section">
          <h3 className="resume-doc__section-title">{ section.title }</h3>
          <div className="resume-doc__rule" aria-hidden />

          {section.paragraphs.map((para) => (
            <p key={ para } className="resume-doc__paragraph">
              { para }
            </p>
          ))}

          {section.entries.map((entry) => (
            <div key={ `${ entry.title }-${ entry.meta ?? '' }` } className="resume-doc__entry">
              <p className="resume-doc__entry-title">{ entry.title }</p>
              {entry.meta ? <EntryMeta meta={ entry.meta } /> : null}
              {entry.bullets.length ? (
                <ul className="resume-doc__bullets">
                  {entry.bullets.map((b) => (
                    <li key={ b }>{ b }</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}

          {section.bullets.length ? (
            <ul className="resume-doc__bullets">
              {section.bullets.map((b) => (
                <li key={ b }>{ b }</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  )
}

function EntryMeta({ meta }: { meta: string }) {
  const { left, right } = parseResumeMeta(meta)
  if (!right) return <p className="resume-doc__entry-meta">{ meta }</p>
  return (
    <p className="resume-doc__entry-meta resume-doc__entry-meta--split">
      <span>{ left }</span>
      <span>{ right }</span>
    </p>
  )
}
