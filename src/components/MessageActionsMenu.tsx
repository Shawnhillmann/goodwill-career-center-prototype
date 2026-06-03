import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Copy, FileText, MoreVertical } from 'lucide-react'

type MessageActionsMenuProps = {
  messageId: string
  text: string
  onCopy: (text: string) => void | Promise<void>
  onExportPdf: (text: string) => void | Promise<void>
  onExportWord: (text: string) => void | Promise<void>
}

type MenuItem = {
  id: 'copy' | 'pdf' | 'word'
  label: string
  icon: ReactNode
}

export function MessageActionsMenu({
  messageId,
  text,
  onCopy,
  onExportPdf,
  onExportWord,
}: MessageActionsMenuProps) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const closeMenu = useCallback(() => {
    setOpen(false)
    setActiveIndex(0)
  }, [])

  const items: MenuItem[] = [
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy size={ 16 } strokeWidth={ 2 } aria-hidden />,
    },
    {
      id: 'pdf',
      label: 'Export as PDF',
      icon: <FileText size={ 16 } strokeWidth={ 2 } className="msg-menu__icon msg-menu__icon--pdf" aria-hidden />,
    },
    {
      id: 'word',
      label: 'Export as Word',
      icon: <FileText size={ 16 } strokeWidth={ 2 } className="msg-menu__icon msg-menu__icon--word" aria-hidden />,
    },
  ]

  const runItem = useCallback(
    async (itemId: MenuItem['id']) => {
      if (itemId === 'copy') await onCopy(text)
      else if (itemId === 'pdf') await onExportPdf(text)
      else await onExportWord(text)
      closeMenu()
      triggerRef.current?.focus()
    },
    [closeMenu, onCopy, onExportPdf, onExportWord, text],
  )

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        triggerRef.current?.focus()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((prev) => (prev + 1) % items.length)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
        return
      }

      if (event.key === 'Home') {
        event.preventDefault()
        setActiveIndex(0)
        return
      }

      if (event.key === 'End') {
        event.preventDefault()
        setActiveIndex(items.length - 1)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    itemRefs.current[activeIndex]?.focus()

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, closeMenu, items.length, open])

  return (
    <div ref={ rootRef } className="msg-menu">
      <button
        ref={ triggerRef }
        type="button"
        className="msg-menu__trigger"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={ open }
        aria-controls={ menuId }
        onClick={ () => setOpen((prev) => !prev) }
      >
        <MoreVertical size={ 16 } strokeWidth={ 2 } aria-hidden />
      </button>

      {open ? (
        <div
          id={ menuId }
          className="msg-menu__dropdown"
          role="menu"
          aria-label="Message actions"
          data-message-id={ messageId }
        >
          {items.map((item, index) => (
            <button
              key={ item.id }
              ref={ (node) => {
                itemRefs.current[index] = node
              } }
              type="button"
              role="menuitem"
              className="msg-menu__item"
              tabIndex={ index === activeIndex ? 0 : -1 }
              onMouseEnter={ () => setActiveIndex(index) }
              onFocus={ () => setActiveIndex(index) }
              onClick={ () => void runItem(item.id) }
              onKeyDown={ (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  void runItem(item.id)
                }
              } }
            >
              <span className="msg-menu__item-icon">{ item.icon }</span>
              <span>{ item.label }</span>
            </button>
          )) }
        </div>
      ) : null}
    </div>
  )
}
