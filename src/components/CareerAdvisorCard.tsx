import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Compass, Download, FileText, GraduationCap, ImagePlus, MapPin, MessageSquare, Mic, Plus, Search, Send, UserRound, X } from 'lucide-react'
import {
  formatFileOnlyUserMessage,
  formatFileUploadAcknowledgment,
  getUiStrings,
  quickActionLabels,
  supportedLanguages,
  type SupportedLanguage,
} from '../uiCopy'

type ChatRole = 'user' | 'advisor'

type PendingWebSearchConfirmation = {
  topic: 'jobs' | 'local_resources' | 'events' | 'general'
  querySoFar: string
}

type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  /** Canonical message used for internal matching (prototype). */
  value?: string
  kind?: 'document'
  attachmentName?: string
  pendingWebSearchConfirmation?: PendingWebSearchConfirmation
}

type CareerAdvisorCardProps = {
  language: SupportedLanguage
  readAloudEnabled: boolean
}

function nextId(): string {
  return `${ Date.now() }-${ Math.random().toString(36).slice(2, 9) }`
}

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="thinking-row" aria-live="polite" aria-busy="true" aria-label={ label }>
      <span className="thinking-row__avatar" aria-hidden>
        <span className="thinking-row__g">g</span>
      </span>
      <div className="thinking-row__bubble">
        <span className="thinking-dot" />
        <span className="thinking-dot" />
        <span className="thinking-dot" />
      </div>
    </div>
  )
}

export function CareerAdvisorCard({ language, readAloudEnabled }: CareerAdvisorCardProps) {
  const formId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
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
  const [openDownloadsFor, setOpenDownloadsFor] = useState<Record<string, boolean>>({})

  const ui = useMemo(() => getUiStrings(language), [language])
  const speechLang = useMemo(
    () => supportedLanguages.find((l) => l.code === language)?.bcp47 ?? 'en-US',
    [language],
  )

  const quickActions = useMemo(() => {
    const labels = quickActionLabels[language] ?? quickActionLabels.en
    return [
      { label: labels.job, icon: Search },
      { label: labels.careers, icon: Compass },
      { label: labels.resume, icon: FileText },
      { label: labels.interviews, icon: MessageSquare },
      { label: labels.skills, icon: GraduationCap },
      { label: labels.local, icon: MapPin },
    ]
  }, [language])

  const speak = useCallback(
    (text: string) => {
      if (!readAloudEnabled) return
      if (!('speechSynthesis' in window)) return
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = speechLang
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    },
    [readAloudEnabled, speechLang],
  )

  const queueAdvisorReply = useCallback(
    async (
      userTextValue: string,
      opts?: {
        expectDocument?: boolean
        uploadedDocumentText?: string | null
        confirmWebSearch?: boolean
        pendingWebSearchConfirmation?: PendingWebSearchConfirmation
      },
    ) => {
      const docText = opts?.uploadedDocumentText ?? null
      try {
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({
                role: m.role === 'advisor' ? 'assistant' : 'user',
                content: m.role === 'user' ? (m.value ?? m.text) : m.text,
              })),
              { role: 'user', content: userTextValue },
            ],
            language,
            ...(docText ? { uploadedDocumentText: docText } : {}),
            ...(opts?.confirmWebSearch ? { confirmWebSearch: true } : {}),
            ...(opts?.pendingWebSearchConfirmation
              ? { pendingWebSearchConfirmation: opts.pendingWebSearchConfirmation }
              : {}),
          }),
        })

        const rawText = await resp.text().catch(() => '')
        let json: any = null
        try {
          json = rawText ? (JSON.parse(rawText) as any) : null
        } catch {
          json = null
        }
        if (!resp.ok) {
          const fallbackBase =
            'Sorry — I’m having trouble responding right now. Please try again in a moment.'
          const base = (typeof json?.error === 'string' ? json.error : json?.error?.message) ?? fallbackBase
          const details =
            typeof json?.error?.details === 'string'
              ? json.error.details
              : Array.isArray(json?.missing)
                ? `Missing: ${ json.missing.join(', ') }`
                : ''
          const status = `HTTP ${ resp.status }`
          const hint =
            details ||
            (rawText && rawText.length < 600 && !rawText.trim().startsWith('<') ? rawText.trim() : '')
          const msg = hint ? `${ base } (${ status }) ${ hint }` : `${ base } (${ status })`
          throw new Error(msg)
        }

        const replyText = String(json?.reply ?? '').trim()
        if (!replyText) throw new Error('Sorry — I didn’t get a response. Please try again.')

        const pending = json?.pendingWebSearchConfirmation as PendingWebSearchConfirmation | undefined

        setAwaitingAdvisor(false)
        setMessages((prev) => [
          ...prev.map((m) =>
            m.role === 'advisor' && m.pendingWebSearchConfirmation
              ? { ...m, pendingWebSearchConfirmation: undefined }
              : m,
          ),
          {
            id: nextId(),
            role: 'advisor',
            text: replyText,
            ...(opts?.expectDocument ? { kind: 'document' as const } : {}),
            ...(pending ? { pendingWebSearchConfirmation: pending } : {}),
          },
        ])
        speak(replyText)
      } catch (e: any) {
        setAwaitingAdvisor(false)
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'advisor',
            text: e?.message || 'Sorry — I’m having trouble responding right now. Please try again.',
          },
        ])
      }
    },
    [language, messages, speak],
  )

  const confirmWebSearch = useCallback(
    (pending: PendingWebSearchConfirmation) => {
      const value = 'Search online'
      setMessages((prev) => [
        ...prev.map((m) =>
          m.role === 'advisor' && m.pendingWebSearchConfirmation
            ? { ...m, pendingWebSearchConfirmation: undefined }
            : m,
        ),
        { id: nextId(), role: 'user', text: ui.searchOnline, value },
      ])
      setAwaitingAdvisor(true)
      queueAdvisorReply(value, { confirmWebSearch: true, pendingWebSearchConfirmation: pending })
    },
    [queueAdvisorReply, ui.searchOnline],
  )

  const sendUserMessage = useCallback(
    (input: string | { displayText: string; value: string; attachmentName?: string; documentText?: string | null }) => {
      const displayText = typeof input === 'string' ? input : input.displayText
      const value = typeof input === 'string' ? input : input.value
      const attachmentName = typeof input === 'string' ? undefined : input.attachmentName
      const documentText = typeof input === 'string' ? documentContext : (input.documentText ?? documentContext)
      const trimmedDisplay = displayText.trim()
      const trimmedValue = value.trim()
      if (!trimmedValue && !attachmentName) return
      const expectDocument = isExplicitDocumentRequest(trimmedValue)
      const activePending = [...messages]
        .reverse()
        .find((m) => m.role === 'advisor' && m.pendingWebSearchConfirmation)?.pendingWebSearchConfirmation
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'user',
          text: trimmedDisplay,
          value: trimmedValue,
          ...(attachmentName ? { attachmentName } : {}),
        },
      ])
      setAwaitingAdvisor(true)
      queueAdvisorReply(trimmedValue, {
        expectDocument,
        uploadedDocumentText: documentText,
        pendingWebSearchConfirmation: activePending,
      })
    },
    [documentContext, messages, queueAdvisorReply],
  )

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, awaitingAdvisor])

  useEffect(() => {
    if (readAloudEnabled) return
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
  }, [readAloudEnabled])

  // Setup voice recognition (Speech-to-text) if supported.
  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || undefined

    if (!SpeechRecognitionCtor) {
      recognitionRef.current = null
      setListening(false)
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
      setListening(true)
      recognition.lang = speechLang
      recognition.start()
      inputRef.current?.focus()
    } catch {
      setListening(false)
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
    inputRef.current?.focus()
  }

  const handleQuickAction = (text: string) => {
    // Quick actions should behave exactly like a normal user message:
    // send the same localized text to the model (no hardcoded English prompts).
    sendUserMessage({ displayText: text, value: text })
    inputRef.current?.focus()
  }

  const chatEmpty = messages.length === 0

  function isExplicitDocumentRequest(text: string) {
    const s = text.toLowerCase()
    return (
      /\b(resume|résumé|cv|curriculum vitae)\b/.test(s) ||
      /\bcover letter\b/.test(s) ||
      /\b(write|draft|generate|create|format)\b/.test(s) &&
        /\b(resume|résumé|cv|cover letter|letter)\b/.test(s)
    )
  }

  // Document heuristics are still used to tag messages (and can be reused later),
  // but downloads are now available for all messages behind a toggle.

  const downloadDocument = async (content: string, format: 'docx' | 'pdf') => {
    const resp = await fetch('/api/document/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, format, fileName: 'message' }),
    })
    if (!resp.ok) return
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = format === 'docx' ? 'message.docx' : 'message.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const toggleDownloads = (id: string) => {
    setOpenDownloadsFor((prev) => ({ ...prev, [id]: !prev[id] }))
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

  return (
    <section
      className={ `advisor-card${ chatEmpty ? ' advisor-card--landing' : ' advisor-card--active-chat' }` }
      aria-labelledby={ chatEmpty ? `${ formId }-title` : undefined }
      aria-label={ chatEmpty ? undefined : ui.conversationAria }
    >
      {chatEmpty ? (
        <div className="advisor-card__hero">
          <div className="advisor-card__sparkle-wrap" aria-hidden>
            <img
              src="/ceo.png"
              alt=""
              className="advisor-card__hero-photo"
              width={ 144 }
              height={ 144 }
              decoding="async"
            />
          </div>
          <div
            className="advisor-card__hero-copy"
            aria-live="polite"
            aria-atomic="true"
          >
            <h1 className="advisor-card__title" id={ `${ formId }-title` }>
              { ui.heroTitle }
            </h1>
            <p className="advisor-card__subtitle">{ ui.heroSubtitle }</p>
          </div>
        </div>
      ) : null}

      {!chatEmpty ? (
        <div className="advisor-card__chat-pane">
          <div className="advisor-card__chat" role="log" aria-live="polite" aria-relevant="additions">
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
                  <div className="bubble bubble--advisor">
                    <div className="bubble__content">
                      <div className="bubble__md">
                        <ReactMarkdown remarkPlugins={ [remarkGfm] }>{ msg.text }</ReactMarkdown>
                      </div>

                      {msg.pendingWebSearchConfirmation ? (
                        <div className="bubble__actions" role="group" aria-label={ ui.suggestedRepliesAria }>
                          <button
                            type="button"
                            className="bubble__action bubble__action--primary"
                            onClick={ () => confirmWebSearch(msg.pendingWebSearchConfirmation!) }
                          >
                            <Search size={ 16 } strokeWidth={ 2 } aria-hidden />
                            <span>{ ui.searchOnline }</span>
                          </button>
                        </div>
                      ) : null}

                      {openDownloadsFor[msg.id] ? (
                        <div className="bubble__actions">
                          <button type="button" className="bubble__action" onClick={ () => downloadDocument(msg.text, 'docx') }>
                            <Download size={ 16 } strokeWidth={ 2 } aria-hidden />
                            <span>Download as Word</span>
                          </button>
                          <button type="button" className="bubble__action" onClick={ () => downloadDocument(msg.text, 'pdf') }>
                            <Download size={ 16 } strokeWidth={ 2 } aria-hidden />
                            <span>Download as PDF</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="msg-tool"
                    aria-label="Show download options"
                    aria-expanded={ Boolean(openDownloadsFor[msg.id]) }
                    onClick={ () => toggleDownloads(msg.id) }
                  >
                    <Download size={ 14 } strokeWidth={ 2 } aria-hidden />
                  </button>
                </div>
              ),
            )}
            {awaitingAdvisor ? <ThinkingIndicator label={ ui.advisorThinkingAria } /> : null}
            <div ref={ chatEndRef } aria-hidden />
          </div>
        </div>
      ) : null}

      <div className={ `advisor-card__dock${ chatEmpty ? '' : ' advisor-card__dock--chat-only' }` }>
        {chatEmpty ? (
          <div className="advisor-card__quick" role="group" aria-label={ ui.quickActionsAria }>
            {quickActions.map(({ label, icon: Icon }) => (
              <button
                key={ label }
                type="button"
                className="quick-pill"
                onClick={ () => handleQuickAction(label) }
              >
                <span className="quick-pill__icon" aria-hidden>
                  <Icon size={ 20 } strokeWidth={ 1.75 } />
                </span>
                <span>{ label }</span>
              </button>
            ))}
          </div>
        ) : null}

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
              <button type="button" className="icon-btn icon-btn--infield" aria-label={ ui.addAria }>
                <Plus size={ 20 } strokeWidth={ 2 } />
              </button>
              <button
                type="button"
                className="text-btn text-btn--infield"
                onClick={ handlePickFile }
                disabled={ uploading }
              >
                <ImagePlus size={ 18 } strokeWidth={ 1.75 } aria-hidden />
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
                className={ `icon-btn icon-btn--infield${ listening ? ' icon-btn--active' : '' }` }
                aria-label={ ui.voiceInputAria }
                aria-pressed={ listening }
                onClick={ toggleVoiceInput }
                disabled={ !recognitionRef.current }
              >
                <Mic size={ 20 } strokeWidth={ 1.75 } />
              </button>
              <button
                type="submit"
                className="send-btn send-btn--infield"
                aria-label={ ui.sendMessageAria }
                disabled={ !canSend }
              >
                <Send size={ 18 } strokeWidth={ 2 } />
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
