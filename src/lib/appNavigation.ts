export type AppPage = 'chat' | 'resources' | 'support'

export function hashToPage(hash: string): AppPage {
  if (hash === '#resources') return 'resources'
  if (hash === '#support') return 'support'
  return 'chat'
}

export function pageToHash(page: AppPage): string {
  if (page === 'chat') return ''
  return `#${ page }`
}

export function applyPageHash(page: AppPage): void {
  const next = pageToHash(page)
  const path = window.location.pathname + window.location.search
  window.history.replaceState(null, '', next ? `${ path }${ next }` : path)
}
