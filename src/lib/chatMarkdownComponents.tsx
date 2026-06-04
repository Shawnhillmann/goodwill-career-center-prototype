import type { Components } from 'react-markdown'

/** Chat links open in a new tab so users stay in the Career Center. */
export const chatMarkdownComponents: Components = {
  a: ({ href, children, ...rest }) => (
    <a href={ href } target="_blank" rel="noopener noreferrer" { ...rest }>
      { children }
    </a>
  ),
}
