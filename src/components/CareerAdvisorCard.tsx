import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ClipboardList,
  Compass,
  FileText,
  ListChecks,
  MapPin,
  MessageSquare,
  Mic,
  Paperclip,
  Send,
  UserRound,
  X,
} from 'lucide-react'
import {
  formatFileOnlyUserMessage,
  formatFileUploadAcknowledgment,
  getUiStrings,
  supportedLanguages,
  type SupportedLanguage,
} from '../uiCopy'
import { isReadAloudSupported } from '../lib/readAloudSupport'
import {
  playAdvisorMessageSound,
  playStreamWordTick,
  playUserMessageSound,
  startStreamingSound,
  startThinkingSound,
  stopStreamingSound,
  stopThinkingSound,
  unlockChatAudio,
} from '../lib/chatSounds'
import { consumeAdvisorChatStream } from '../lib/chatStream'
import { shouldStreamAdvisorReply } from '../lib/streamingPolicy'
import { createStreamTextReveal } from '../lib/streamTextReveal'
import { isResumeOutputRequest } from '../lib/resumeTask'
import {
  resolveAdvisorMessageMeta,
  shouldRenderResumePreview,
  type AdvisorDocumentType,
} from '../../shared/advisorMessage'
import { ResumePreview } from './ResumePreview'
import { MessageActionsMenu } from './MessageActionsMenu'
import { getQuickActionCopy, listMobileQuickActions, listQuickActions, type QuickActionId } from '../quickActions'
import { QuickActionCarousel } from './QuickActionCarousel'
import { useMobileChatViewport } from '../lib/useMobileChatViewport'
import { useMediaQuery } from '../lib/useMediaQuery'

type ChatRole = 'user' | 'advisor'

type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  /** Canonical message used for internal matching (prototype). */
  value?: string
  kind?: 'document'
  documentType?: AdvisorDocumentType
  attachmentName?: string
  streaming?: boolean
}

type CareerAdvisorCardProps = {
  language: SupportedLanguage
  readAloudEnabled: boolean
  onChatActiveChange?: (active: boolean) => void
  /** Mobile active chat: compact header when pinned to the latest messages. */
  onMobileHeaderCompactChange?: (compact: boolean) => void
}

function nextId(): string {
  return `${ Date.now() }-${ Math.random().toString(36).slice(2, 9) }`
}

function ThinkingIndicator({ label, text }: { label: string; text: string }) {
  return (
    <div className="thinking-row" aria-live="polite" aria-busy="true" aria-label={ label }>
      <span className="thinking-row__avatar" aria-hidden>
        <span className="thinking-row__g">g</span>
      </span>
      <div className="thinking-row__bubble">
        <span className="thinking-row__label">{ text }</span>
        <span className="thinking-row__dots" aria-hidden>
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </span>
      </div>
    </div>
  )
}

export function CareerAdvisorCard({
  language,
  readAloudEnabled,
  onChatActiveChange,
  onMobileHeaderCompactChange,
}: CareerAdvisorCardProps) {
  const formId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const composerDockRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)
  const chatIsLiveRef = useRef(false)
  const pinningScrollRef = useRef(false)
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [awaitingAdvisor, setAwaitingAdvisor] = useState(false)
  const [listening, setListening] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<{ name: string; text: string } | null>(null)
  const [pendingUploadName, setPendingUploadName] = useState<string | null>(null)
  const [documentContext, setDocumentContext] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [voiceInputAvailable, setVoiceInputAvailable] = useState(false)
  const mobileChatLayout = useMediaQuery('(max-width: 1023px)')

  const ui = useMemo(() => getUiStrings(language), [language])
  const readAloudActive = readAloudEnabled && isReadAloudSupported(language)
  const speechLang = useMemo(
    () => supportedLanguages.find((l) => l.code === language)?.bcp47 ?? 'en-US',
    [language],
  )

  const quickActionIcons: Record<QuickActionId, typeof Compass> = useMemo(
    () => ({
      explore_careers: Compass,
      build_resume: FileText,
      help_apply: ClipboardList,
      practice_interviews: MessageSquare,
      career_plan: ListChecks,
      local_resources: MapPin,
    }),
    [],
  )

  const quickActions = useMemo(() => {
    return listQuickActions(language).map((action) => ({
      ...action,
      icon: quickActionIcons[action.id],
    }))
  }, [language, quickActionIcons])

  const mobileQuickActions = useMemo(() => {
    return listMobileQuickActions(language).map((action) => ({
      ...action,
      icon: quickActionIcons[action.id],
    }))
  }, [language, quickActionIcons])

  const speak = useCallback(
    (text: string) => {
      if (!readAloudActive) return
      if (!('speechSynthesis' in window)) return
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = speechLang
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    },
    [readAloudActive, speechLang],
  )

  const toApiMessages = useCallback(
    (thread: ChatMessage[], latestUserContent: string) => [
      ...thread.map((m) => ({
        role: (m.role === 'advisor' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.role === 'user' ? (m.value ?? m.text) : m.text,
      })),
      { role: 'user' as const, content: latestUserContent },
    ],
    [],
  )

  const queueAdvisorReply = useCallback(
    async (
      apiMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
      opts?: {
        expectDocument?: boolean
        uploadedDocumentText?: string | null
        source?: 'typed' | 'quick_option'
        quickAction?: QuickActionId
      },
    ) => {
      const docText = opts?.uploadedDocumentText ?? null
      const source = opts?.source ?? 'typed'
      const quickAction = opts?.quickAction
      const lastUserContent =
        [...apiMessages].reverse().find((m) => m.role === 'user')?.content?.trim() ?? ''
      const expectResume = Boolean(
        opts?.expectDocument ||
          isResumeOutputRequest(apiMessages, lastUserContent, Boolean(docText?.trim()), opts?.quickAction),
      )
      const useStream = shouldStreamAdvisorReply({
        messages: apiMessages,
        userMessage: lastUserContent,
        expectDocument: expectResume,
        quickAction,
        hasUploadedDocument: Boolean(docText?.trim()),
      })
      const streamMessageId = nextId()
      let streamBubbleVisible = false

      const applyDocMeta = (message: ChatMessage, documentType?: string | null): ChatMessage => {
        const meta = resolveAdvisorMessageMeta({ documentType, expectResume })
        if (!meta.documentType) return message
        return { ...message, kind: 'document', documentType: 'resume' }
      }

      const reveal = useStream
        ? createStreamTextReveal(
            (displayText) => {
              if (!displayText) return
              if (!streamBubbleVisible) {
                streamBubbleVisible = true
                setAwaitingAdvisor(false)
                stopThinkingSound()
                startStreamingSound()
                setMessages((prev) => [
                  ...prev,
                  {
                    id: streamMessageId,
                    role: 'advisor',
                    text: displayText,
                    streaming: true,
                  },
                ])
                return
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMessageId ? { ...m, text: displayText, streaming: true } : m,
                ),
              )
            },
            { onWord: () => playStreamWordTick() },
          )
        : null

      const showStreamError = (message: string) => {
        reveal?.reset()
        stopStreamingSound()
        setAwaitingAdvisor(false)
        setMessages((prev) => {
          const withoutPartial = streamBubbleVisible
            ? prev.filter((m) => m.id !== streamMessageId)
            : prev
          return [
            ...withoutPartial,
            {
              id: nextId(),
              role: 'advisor' as const,
              text: message,
            },
          ]
        })
        playAdvisorMessageSound()
      }

      try {
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            language,
            source,
            stream: useStream,
            ...(quickAction ? { quickAction } : {}),
            ...(docText ? { uploadedDocumentText: docText } : {}),
          }),
        })

        await consumeAdvisorChatStream(resp, {
          onDelta: (_chunk, fullText) => {
            if (reveal) {
              reveal.setTarget(fullText)
              return
            }
            if (!streamBubbleVisible) {
              streamBubbleVisible = true
              setAwaitingAdvisor(false)
              setMessages((prev) => [
                ...prev,
                applyDocMeta(
                  {
                    id: streamMessageId,
                    role: 'advisor',
                    text: fullText,
                  },
                  null,
                ),
              ])
              return
            }
            setMessages((prev) =>
              prev.map((m) => (m.id === streamMessageId ? { ...m, text: fullText } : m)),
            )
          },
          onDone: (replyText, meta) => {
            reveal?.flush()
            stopStreamingSound()
            setAwaitingAdvisor(false)
            setMessages((prev) => {
              if (!streamBubbleVisible) {
                return [
                  ...prev,
                  applyDocMeta(
                    {
                      id: streamMessageId,
                      role: 'advisor',
                      text: replyText,
                    },
                    meta?.documentType,
                  ),
                ]
              }
              return prev.map((m) =>
                m.id === streamMessageId
                  ? applyDocMeta({ ...m, text: replyText, streaming: false }, meta?.documentType)
                  : m,
              )
            })
            playAdvisorMessageSound()
            speak(replyText)
          },
          onError: (message) => {
            showStreamError(message)
          },
        })
      } catch (e: any) {
        showStreamError(e?.message || 'Sorry — I’m having trouble responding right now. Please try again.')
      }
    },
    [language, speak],
  )

  const sendUserMessage = useCallback(
    (
      input: string | { displayText: string; value: string; attachmentName?: string; documentText?: string | null },
      opts?: { source?: 'typed' | 'quick_option'; quickAction?: QuickActionId },
    ) => {
      const displayText = typeof input === 'string' ? input : input.displayText
      const value = typeof input === 'string' ? input : input.value
      const attachmentName = typeof input === 'string' ? undefined : input.attachmentName
      const documentText = typeof input === 'string' ? documentContext : (input.documentText ?? documentContext)
      const trimmedDisplay = displayText.trim()
      const trimmedValue = value.trim()
      if (!trimmedValue && !attachmentName) return
      const docText = documentText ?? documentContext
      const source = opts?.source ?? 'typed'
      const userMessage: ChatMessage = {
        id: nextId(),
        role: 'user',
        text: trimmedDisplay,
        value: trimmedValue,
        ...(attachmentName ? { attachmentName } : {}),
      }
      const apiMessages = toApiMessages(messages, trimmedValue)
      const expectDocument = isResumeOutputRequest(
        apiMessages,
        trimmedValue,
        Boolean(docText?.trim()),
        opts?.quickAction,
      )
      stickToBottomRef.current = true
      if (mobileChatLayout) onMobileHeaderCompactChange?.(true)
      setMessages((prev) => [...prev, userMessage])
      playUserMessageSound()
      setAwaitingAdvisor(true)
      queueAdvisorReply(apiMessages, { expectDocument, uploadedDocumentText: docText, source, quickAction: opts?.quickAction })
    },
    [documentContext, messages, mobileChatLayout, onMobileHeaderCompactChange, queueAdvisorReply, toApiMessages],
  )

  const chatEmpty = messages.length === 0

  useEffect(() => {
    onChatActiveChange?.(!chatEmpty)
    if (!chatEmpty) stickToBottomRef.current = true
    if (chatEmpty) onMobileHeaderCompactChange?.(false)
  }, [chatEmpty, onChatActiveChange, onMobileHeaderCompactChange])

  useMobileChatViewport(mobileChatLayout)

  const chatIsLive = awaitingAdvisor || messages.some((m) => m.streaming)

  const syncMobileHeaderCompact = useCallback(() => {
    if (!mobileChatLayout || chatEmpty) return
    onMobileHeaderCompactChange?.(stickToBottomRef.current)
  }, [mobileChatLayout, chatEmpty, onMobileHeaderCompactChange])

  const finishPinningScroll = useCallback(() => {
    if (!mobileChatLayout) {
      pinningScrollRef.current = false
      return
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pinningScrollRef.current = false
        syncMobileHeaderCompact()
      })
    })
  }, [mobileChatLayout, syncMobileHeaderCompact])

  const scrollChatScrollerToEnd = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      const scroller = chatScrollRef.current
      if (!scroller) return
      const top = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      if (mobileChatLayout) pinningScrollRef.current = true
      if (behavior === 'auto') {
        scroller.scrollTop = top
      } else {
        scroller.scrollTo({ top, behavior })
      }
      if (mobileChatLayout) finishPinningScroll()
    },
    [mobileChatLayout, finishPinningScroll],
  )

  const scrollMessagesToEnd = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      if (mobileChatLayout) {
        scrollChatScrollerToEnd(behavior === 'smooth' ? 'smooth' : 'auto')
        return
      }
      const anchor = chatEndRef.current
      if (anchor) {
        anchor.scrollIntoView({ block: 'end', behavior })
        return
      }
      scrollChatScrollerToEnd(behavior)
    },
    [mobileChatLayout, scrollChatScrollerToEnd],
  )

  const handleChatScroll = useCallback(() => {
    const scroller = chatScrollRef.current
    if (!scroller) return
    const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight
    stickToBottomRef.current = distanceFromBottom < 96
    if (mobileChatLayout && !chatEmpty && !pinningScrollRef.current) {
      onMobileHeaderCompactChange?.(stickToBottomRef.current)
    }
  }, [mobileChatLayout, chatEmpty, onMobileHeaderCompactChange])

  const pinMobileChatToEnd = useCallback(() => {
    scrollChatScrollerToEnd('auto')
    if (!mobileChatLayout) return
    pinningScrollRef.current = true
    requestAnimationFrame(() => {
      scrollChatScrollerToEnd('auto')
      finishPinningScroll()
    })
  }, [scrollChatScrollerToEnd, mobileChatLayout, finishPinningScroll])

  useLayoutEffect(() => {
    const wasLive = chatIsLiveRef.current
    chatIsLiveRef.current = chatIsLive

    if (!stickToBottomRef.current) return

    const behavior =
      mobileChatLayout || chatIsLive || messages.length <= 2 ? 'auto' : 'smooth'
    scrollMessagesToEnd(behavior)

    if (mobileChatLayout && wasLive && !chatIsLive) {
      pinMobileChatToEnd()
    }

    if (mobileChatLayout && !chatEmpty && !pinningScrollRef.current) {
      syncMobileHeaderCompact()
    }
  }, [
    messages,
    awaitingAdvisor,
    chatIsLive,
    scrollMessagesToEnd,
    mobileChatLayout,
    chatEmpty,
    onMobileHeaderCompactChange,
    pinMobileChatToEnd,
    syncMobileHeaderCompact,
  ])

  useEffect(() => {
    if (!mobileChatLayout) onMobileHeaderCompactChange?.(false)
  }, [mobileChatLayout, onMobileHeaderCompactChange])

  useEffect(() => {
    if (!chatIsLive || chatEmpty || !mobileChatLayout) return
    let frame = 0
    const followDuringLive = () => {
      if (stickToBottomRef.current) scrollChatScrollerToEnd('auto')
      frame = requestAnimationFrame(followDuringLive)
    }
    frame = requestAnimationFrame(followDuringLive)
    return () => cancelAnimationFrame(frame)
  }, [chatIsLive, chatEmpty, mobileChatLayout, scrollChatScrollerToEnd])

  useEffect(() => {
    if (chatEmpty) return
    const scroller = chatScrollRef.current
    if (!scroller) return

    const followEnd = () => {
      if (!stickToBottomRef.current) return
      if (mobileChatLayout) {
        scrollChatScrollerToEnd('auto')
        return
      }
      if (!chatIsLive) return
      chatEndRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' })
    }

    if (!mobileChatLayout && !chatIsLive) return

    const mo = new MutationObserver(followEnd)
    mo.observe(scroller, { childList: true, subtree: true, characterData: true })

    const ro = new ResizeObserver(followEnd)
    ro.observe(scroller)
    scroller.querySelectorAll('.msg-row, .thinking-row, .bubble').forEach((el) => ro.observe(el))

    followEnd()
    return () => {
      mo.disconnect()
      ro.disconnect()
    }
  }, [chatIsLive, chatEmpty, messages.length, mobileChatLayout, scrollChatScrollerToEnd])

  useEffect(() => {
    if (awaitingAdvisor) {
      startThinkingSound()
      return () => stopThinkingSound()
    }
    stopThinkingSound()
  }, [awaitingAdvisor])

  useEffect(() => {
    const unlock = () => unlockChatAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    return () => stopThinkingSound()
  }, [])

  useEffect(() => {
    if (readAloudActive) return
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
  }, [readAloudActive])

  // Setup voice recognition (Speech-to-text) if supported.
  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || undefined

    if (!SpeechRecognitionCtor) {
      recognitionRef.current = null
      setListening(false)
      setVoiceInputAvailable(false)
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = speechLang

    recognition.onresult = (event: any) => {
      const result = event?.results?.[0]
      const transcript = result?.[0]?.transcript
      if (typeof transcript === 'string') {
        setDraft(transcript)
      }
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    setVoiceInputAvailable(true)

    return () => {
      try {
        recognition.onresult = null
        recognition.onerror = null
        recognition.onend = null
        recognition.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
      setVoiceInputAvailable(false)
    }
  }, [speechLang])

  const toggleVoiceInput = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (listening) {
      try {
        recognition.stop()
      } finally {
        setListening(false)
      }
      return
    }

    try {
      recognition.lang = speechLang
      recognition.start()
      setListening(true)
      inputRef.current?.focus()
    } catch {
      try {
        recognition.abort()
        recognition.lang = speechLang
        recognition.start()
        setListening(true)
      } catch {
        setListening(false)
      }
    }
  }, [listening, speechLang])

  const clearPendingAttachment = useCallback(() => {
    if (uploading) return
    setPendingAttachment(null)
    setPendingUploadName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [uploading])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (uploading) return

    const trimmedDraft = draft.trim()
    const attachment = pendingAttachment
    if (!trimmedDraft && !attachment) return

    const attachmentName = attachment?.name
    const isFileOnly = Boolean(attachmentName && !trimmedDraft)

    if (attachment?.text) {
      setDocumentContext(attachment.text)
    }

    if (isFileOnly && attachmentName) {
      const historyValue = formatFileOnlyUserMessage(language, attachmentName)
      const acknowledgment = formatFileUploadAcknowledgment(language, attachmentName)
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'user',
          text: '',
          value: historyValue,
          attachmentName,
        },
        { id: nextId(), role: 'advisor', text: acknowledgment },
      ])
      playUserMessageSound()
      playAdvisorMessageSound()
      speak(acknowledgment)
    } else {
      const value =
        trimmedDraft || (attachmentName ? formatFileOnlyUserMessage(language, attachmentName) : '')
      if (!value) return

      sendUserMessage({
        displayText: trimmedDraft,
        value,
        ...(attachmentName ? { attachmentName } : {}),
        documentText: attachment?.text ?? documentContext,
      })
    }

    setDraft('')
    setPendingAttachment(null)
    setPendingUploadName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (mobileChatLayout) {
      stickToBottomRef.current = true
      onMobileHeaderCompactChange?.(true)
    }
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true })
    })
  }

  const handleQuickAction = (action: QuickActionId) => {
    const copy = getQuickActionCopy(language, action)
    sendUserMessage(copy.starter, { source: 'quick_option', quickAction: action })
    inputRef.current?.focus()
  }

  const downloadDocument = async (content: string, format: 'docx' | 'pdf') => {
    const resp = await fetch('/api/document/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, format, fileName: 'resume' }),
    })
    if (!resp.ok) return
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = format === 'docx' ? 'resume.docx' : 'resume.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const copyMessageText = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      // Fallback for older browsers or denied permission.
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
  }

  const handlePickFile = () => fileInputRef.current?.click()

  const handleFileSelected = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setPendingUploadName(file.name)
    setPendingAttachment(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const resp = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await resp.json().catch(() => null)
      if (!resp.ok) {
        const msg = json?.error?.message ?? 'Unable to upload that file.'
        throw new Error(msg)
      }
      const extractedText = String(json?.extractedText ?? '').trim()
      if (!extractedText) throw new Error('We could not read any text from that file.')
      setPendingAttachment({ name: file.name, text: extractedText })
      setPendingUploadName(null)
    } catch (e: any) {
      setPendingAttachment(null)
      setPendingUploadName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'advisor', text: e?.message || 'Unable to upload that file.' },
      ])
    } finally {
      setUploading(false)
      inputRef.current?.focus()
    }
  }

  const composerHasAttachment = Boolean(pendingUploadName || pendingAttachment)
  const canSend = !uploading && (draft.trim().length > 0 || Boolean(pendingAttachment))

  useLayoutEffect(() => {
    if (!mobileChatLayout) {
      document.documentElement.style.removeProperty('--chat-composer-height')
      return
    }

    const dock = composerDockRef.current
    if (!dock) return

    const minHeightPx = 88
    let lastHeight = 0
    const syncHeight = () => {
      const measured = Math.ceil(dock.getBoundingClientRect().height)
      const height = Math.max(minHeightPx, measured)
      if (height === lastHeight) return
      lastHeight = height
      document.documentElement.style.setProperty('--chat-composer-height', `${ height }px`)
    }

    syncHeight()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncHeight) : null
    ro?.observe(dock)
    return () => {
      ro?.disconnect()
    }
  }, [composerHasAttachment, draft, mobileChatLayout, messages.length, chatEmpty])

  const composerForm = (
    <form
      id={ `${ formId }-form` }
      className={ `advisor-card__composer${ chatEmpty ? '' : ' advisor-card__composer--dock-top' }` }
      onSubmit={ handleSubmit }
      noValidate
    >
      <label htmlFor={ `${ formId }-input` } className="visually-hidden">
        { ui.messageLabel }
      </label>
      <div className="advisor-card__composer-stack">
        {composerHasAttachment ? (
          <div className="composer-attachment" role="status" aria-live="polite">
            <span className="composer-attachment__pill">
              <FileText size={ 16 } strokeWidth={ 2 } aria-hidden />
              <span className="composer-attachment__name">
                { uploading ? ui.uploadingFile : (pendingAttachment?.name ?? pendingUploadName) }
              </span>
            </span>
            <button
              type="button"
              className="composer-attachment__remove icon-btn"
              aria-label={ ui.removeAttachment }
              onClick={ clearPendingAttachment }
              disabled={ uploading }
            >
              <X size={ 18 } strokeWidth={ 2 } aria-hidden />
            </button>
          </div>
        ) : null}
        <div className="advisor-card__input-shell advisor-card__input-shell--integrated">
          <button
            type="button"
            className="text-btn text-btn--infield"
            onClick={ handlePickFile }
            disabled={ uploading }
          >
            <Paperclip size={ 20 } strokeWidth={ 2 } aria-hidden />
            <span className="text-btn__label">{ ui.addFile }</span>
          </button>
          <input
            ref={ fileInputRef }
            type="file"
            className="visually-hidden"
            accept=".pdf,.docx,.txt"
            onChange={ (e) => handleFileSelected(e.target.files?.[0] ?? null) }
          />
          <textarea
            id={ `${ formId }-input` }
            ref={ inputRef }
            className="advisor-card__textarea advisor-card__textarea--integrated"
            placeholder={ ui.placeholder }
            rows={ 1 }
            value={ draft }
            onChange={ (e) => setDraft(e.target.value) }
            onKeyDown={ (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            } }
          />
          <button
            type="button"
            className={ `icon-btn icon-btn--infield icon-btn--mic${ listening ? ' icon-btn--active' : '' }` }
            aria-label={ ui.voiceInputAria }
            aria-pressed={ listening }
            onClick={ toggleVoiceInput }
            disabled={ !voiceInputAvailable }
          >
            <Mic size={ 22 } strokeWidth={ 2 } />
          </button>
          <button
            type="submit"
            className="send-btn send-btn--infield"
            aria-label={ ui.sendMessageAria }
            disabled={ !canSend }
          >
            <Send size={ 20 } strokeWidth={ 2.25 } />
          </button>
        </div>
      </div>
    </form>
  )

  return (
    <div className={ `career-advisor-stack${ chatEmpty ? '' : ' career-advisor-stack--active' }` }>
    <section
      className={ `advisor-card${ chatEmpty ? ' advisor-card--landing' : ' advisor-card--active-chat' }` }
      aria-labelledby={ chatEmpty ? `${ formId }-title` : undefined }
      aria-label={ chatEmpty ? undefined : ui.conversationAria }
    >
      {chatEmpty ? (
        <div className="advisor-card__landing">
          <div className="advisor-card__hero">
            <div className="advisor-card__portrait">
              <img
                src="/ceo.png"
                alt={ ui.heroPortraitAlt }
                className="advisor-card__portrait-photo"
                width={ 320 }
                height={ 400 }
                decoding="async"
              />
            </div>
            <div className="advisor-card__hero-content">
              <div
                className="advisor-card__hero-intro"
                aria-live="polite"
                aria-atomic="true"
              >
                <h1 className="advisor-card__title" id={ `${ formId }-title` }>
                  { ui.heroTitle }
                </h1>
                <p className="advisor-card__subtitle">{ ui.heroSubtitle }</p>
                <p className="advisor-card__subtitle-prompt advisor-card__subtitle-prompt--desktop">
                  { ui.heroSubtitlePrompt }
                </p>
              </div>

              <div className="advisor-card__quick advisor-card__quick--grid" role="group" aria-label={ ui.quickActionsAria }>
                {quickActions.map(({ id, label, ariaLabel, icon: Icon }) => (
                  <button
                    key={ id }
                    type="button"
                    className="quick-pill"
                    aria-label={ ariaLabel }
                    onClick={ () => handleQuickAction(id) }
                  >
                    <span className="quick-pill__icon" aria-hidden>
                      <Icon size={ 22 } strokeWidth={ 2 } />
                    </span>
                    <span aria-hidden>{ label }</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="advisor-card__quick-carousel">
            <QuickActionCarousel
              actions={ mobileQuickActions }
              ariaLabel={ ui.quickActionsAria }
              onSelect={ handleQuickAction }
            />
          </div>
        </div>
      ) : null}

      {!chatEmpty ? (
        <div className="advisor-card__chat-pane">
          <div
            ref={ chatScrollRef }
            className="advisor-card__chat"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            onScroll={ handleChatScroll }
          >
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={ msg.id } className="msg-row msg-row--user">
                  <div className="bubble bubble--user">
                    {msg.attachmentName ? (
                      <div className="bubble__attachment" aria-label={ msg.attachmentName }>
                        <FileText size={ 16 } strokeWidth={ 2 } aria-hidden />
                        <span className="bubble__attachment-name">{ msg.attachmentName }</span>
                      </div>
                    ) : null}
                    {msg.text ? (
                      <div className="bubble__md">
                        <ReactMarkdown remarkPlugins={ [remarkGfm] }>{ msg.text }</ReactMarkdown>
                      </div>
                    ) : null}
                  </div>
                  <span className="msg-avatar msg-avatar--user" aria-hidden>
                    <UserRound size={ 16 } strokeWidth={ 2 } />
                  </span>
                </div>
              ) : (
                <div key={ msg.id } className="msg-row msg-row--advisor">
                  <span className="msg-avatar msg-avatar--advisor" aria-hidden>
                    <span className="msg-avatar__g">g</span>
                  </span>
                  <div
                    className={ `bubble bubble--advisor${ msg.streaming ? ' bubble--streaming' : '' }${ shouldRenderResumePreview(msg) ? ' bubble--resume-doc' : '' }` }
                  >
                    <div className="bubble__content">
                      {shouldRenderResumePreview(msg) ? (
                        <ResumePreview text={ msg.text } />
                      ) : (
                        <div className="bubble__md">
                          <ReactMarkdown remarkPlugins={ [remarkGfm] }>{ msg.text }</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {!msg.streaming ? (
                      <MessageActionsMenu
                        messageId={ msg.id }
                        text={ msg.text }
                        onCopy={ copyMessageText }
                        onExportPdf={ (text) => downloadDocument(text, 'pdf') }
                        onExportWord={ (text) => downloadDocument(text, 'docx') }
                      />
                    ) : null}
                  </div>
                </div>
              ),
            )}
            {awaitingAdvisor ? (
              <ThinkingIndicator label={ ui.advisorThinkingAria } text={ ui.advisorThinkingLabel } />
            ) : null}
            <div ref={ chatEndRef } className="advisor-card__chat-anchor" aria-hidden />
          </div>
        </div>
      ) : null}

      {chatEmpty && !mobileChatLayout ? (
        <div className="advisor-card__dock">{ composerForm }</div>
      ) : null}

      {!chatEmpty && !mobileChatLayout ? (
        <div
          ref={ composerDockRef }
          className="advisor-card__dock advisor-card__dock--chat-only advisor-card__composer-dock advisor-card__composer-dock--in-card"
        >
          { composerForm }
        </div>
      ) : null}
    </section>

    {mobileChatLayout ? (
      <div
        ref={ composerDockRef }
        className="advisor-card__dock advisor-card__dock--chat-only advisor-card__composer-dock advisor-card__composer-dock--mobile-fixed"
      >
        { composerForm }
      </div>
    ) : null}

    {chatEmpty ? (
      <p className="ai-disclaimer ai-disclaimer--welcome" role="note">
        { ui.aiDisclaimer }
      </p>
    ) : null}
    </div>
  )
}
