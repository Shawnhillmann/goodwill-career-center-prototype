export type SupportedLanguage = 'ar' | 'ht' | 'en' | 'it' | 'pl' | 'ru' | 'es'

export const supportedLanguages: { code: SupportedLanguage; label: string; bcp47: string }[] = [
  { code: 'en', label: 'English', bcp47: 'en-US' },
  { code: 'es', label: 'Spanish', bcp47: 'es' },
  { code: 'it', label: 'Italian', bcp47: 'it-IT' },
  { code: 'ht', label: 'Creole', bcp47: 'ht' },
  { code: 'pl', label: 'Polish', bcp47: 'pl-PL' },
  { code: 'ru', label: 'Russian', bcp47: 'ru-RU' },
  { code: 'ar', label: 'Arabic', bcp47: 'ar' },
]

type UiStrings = {
  careerAdvisor: string
  resources: string
  liveSupport: string
  liveSupportTitle: string
  liveSupportVirtualSession: string
  liveSupportCentersHeading: string
  liveSupportZipLabel: string
  liveSupportZipPlaceholder: string
  liveSupportZipHint: string
  liveSupportNearest: string
  backToChat: string
  resourcesTitle: string
  resourcesIntro: string
  siteSettings: string
  textSize: string
  textSizeSmall: string
  textSizeNormal: string
  textSizeLarge: string
  textSizeVeryLarge: string
  language: string
  readAloud: string
  readAloudUnavailable: string
  heroTitle: string
  heroSubtitle: string
  quickActionsAria: string
  conversationAria: string
  messageLabel: string
  voiceInputAria: string
  sendMessageAria: string
  advisorThinkingAria: string
  advisorThinkingLabel: string
  placeholder: string
  addFile: string
  removeAttachment: string
  uploadingFile: string
  aiDisclaimer: string
  footerTagline: string
  footerLearnMore: string
  footerCopyright: string
  footerPrivacy: string
  footerTerms: string
  footerAccessibility: string
  resourceComingSoon: string
}

const uiStrings: Record<SupportedLanguage, UiStrings> = {
  en: {
    careerAdvisor: 'Career Advisor',
    resources: 'Resources',
    liveSupport: 'Live Support',
    liveSupportTitle: 'Live support',
    liveSupportVirtualSession: 'Schedule a virtual session with one of our career coaches (coming soon)',
    liveSupportCentersHeading: 'Visit or call one of our career centers',
    liveSupportZipLabel: 'Your ZIP code',
    liveSupportZipPlaceholder: 'Enter ZIP code',
    liveSupportZipHint: 'Enter your ZIP code to see the closest centers first.',
    liveSupportNearest: 'Nearest to you',
    backToChat: 'Back to chat',
    resourcesTitle: 'Career resources',
    resourcesIntro: 'Short videos, slideshows, and guides you can use with a coach or on your own.',
    siteSettings: 'Site settings',
    textSize: 'Text size',
    textSizeSmall: 'Small',
    textSizeNormal: 'Normal',
    textSizeLarge: 'Large',
    textSizeVeryLarge: 'Very large',
    language: 'Language',
    readAloud: 'Read aloud',
    readAloudUnavailable: 'Read aloud is not available in Arabic.',
    heroTitle: 'Hi, I’m your AI Career Advisor',
    heroSubtitle: 'How can I help you reach your goals today?',
    quickActionsAria: 'Quick actions',
    conversationAria: 'AI Career Advisor conversation',
    messageLabel: 'Message to your career advisor',
    voiceInputAria: 'Voice input',
    sendMessageAria: 'Send message',
    advisorThinkingAria: 'Advisor is thinking',
    advisorThinkingLabel: 'Thinking',
    placeholder: 'Ask anything…',
    addFile: 'Add file',
    removeAttachment: 'Remove attachment',
    uploadingFile: 'Uploading…',
    aiDisclaimer:
      'Goodwill career advisor uses AI which can make mistakes. Jobs and other information are not vetted by Goodwill. Do not share private information and double check important information.',
    footerTagline: 'Goodwill helps people build skills, find jobs, and grow their careers.',
    footerLearnMore: 'Learn more about Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Use',
    footerAccessibility: 'Accessibility',
    resourceComingSoon: 'Coming soon',
  },
  es: {
    careerAdvisor: 'Asesor de carreras',
    resources: 'Recursos',
    liveSupport: 'Apoyo en vivo',
    liveSupportTitle: 'Apoyo en vivo',
    liveSupportVirtualSession: 'Programa una sesión virtual con uno de nuestros coaches de carrera (próximamente)',
    liveSupportCentersHeading: 'Visita o llama a uno de nuestros centros de carrera',
    liveSupportZipLabel: 'Tu código postal',
    liveSupportZipPlaceholder: 'Ingresa tu código postal',
    liveSupportZipHint: 'Ingresa tu código postal para ver primero los centros más cercanos.',
    liveSupportNearest: 'Más cercano a ti',
    backToChat: 'Volver al chat',
    resourcesTitle: 'Recursos de carrera',
    resourcesIntro: 'Videos cortos, presentaciones y guías para usar con un coach o por tu cuenta.',
    siteSettings: 'Ajustes del sitio',
    textSize: 'Tamaño de texto',
    textSizeSmall: 'Pequeño',
    textSizeNormal: 'Normal',
    textSizeLarge: 'Grande',
    textSizeVeryLarge: 'Muy grande',
    language: 'Idioma',
    readAloud: 'Leer en voz alta',
    readAloudUnavailable: 'La lectura en voz alta no está disponible en árabe.',
    heroTitle: 'Hola, soy tu asesor de carreras con IA',
    heroSubtitle: '¿Cómo puedo ayudarte a alcanzar tus metas hoy?',
    quickActionsAria: 'Acciones rápidas',
    conversationAria: 'Conversación con el asesor de carreras con IA',
    messageLabel: 'Mensaje para tu asesor de carreras',
    voiceInputAria: 'Entrada de voz',
    sendMessageAria: 'Enviar mensaje',
    advisorThinkingAria: 'El asesor está pensando',
    advisorThinkingLabel: 'Pensando',
    placeholder: 'Escribe tu mensaje…',
    addFile: 'Agregar archivo',
    removeAttachment: 'Quitar archivo adjunto',
    uploadingFile: 'Subiendo…',
    aiDisclaimer:
      'El asesor de carreras de Goodwill usa IA y puede cometer errores. Los empleos y otra información no están verificados por Goodwill. No compartas información privada y verifica la información importante.',
    footerTagline: 'Goodwill ayuda a las personas a desarrollar habilidades, encontrar trabajo y crecer profesionalmente.',
    footerLearnMore: 'Conoce más sobre Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Política de privacidad',
    footerTerms: 'Términos de uso',
    footerAccessibility: 'Accesibilidad',
    resourceComingSoon: 'Próximamente',
  },
  it: {
    careerAdvisor: 'Consulente di carriera',
    resources: 'Risorse',
    liveSupport: 'Supporto dal vivo',
    liveSupportTitle: 'Supporto dal vivo',
    liveSupportVirtualSession: 'Prenota una sessione virtuale con uno dei nostri career coach (in arrivo)',
    liveSupportCentersHeading: 'Visita o chiama uno dei nostri centri per la carriera',
    liveSupportZipLabel: 'Il tuo CAP',
    liveSupportZipPlaceholder: 'Inserisci il CAP',
    liveSupportZipHint: 'Inserisci il CAP per vedere per primi i centri più vicini.',
    liveSupportNearest: 'Più vicino a te',
    backToChat: 'Torna alla chat',
    resourcesTitle: 'Risorse per la carriera',
    resourcesIntro: 'Video brevi, presentazioni e guide da usare con un coach o in autonomia.',
    siteSettings: 'Impostazioni del sito',
    textSize: 'Dimensione testo',
    textSizeSmall: 'Piccolo',
    textSizeNormal: 'Normale',
    textSizeLarge: 'Grande',
    textSizeVeryLarge: 'Molto grande',
    language: 'Lingua',
    readAloud: 'Leggi ad alta voce',
    readAloudUnavailable: 'La lettura ad alta voce non è disponibile in arabo.',
    heroTitle: 'Ciao, sono il tuo consulente di carriera AI',
    heroSubtitle: 'Come posso aiutarti a raggiungere i tuoi obiettivi oggi?',
    quickActionsAria: 'Azioni rapide',
    conversationAria: 'Conversazione con il consulente di carriera AI',
    messageLabel: 'Messaggio al tuo consulente di carriera',
    voiceInputAria: 'Input vocale',
    sendMessageAria: 'Invia messaggio',
    advisorThinkingAria: 'Il consulente sta pensando',
    advisorThinkingLabel: 'Sto pensando',
    placeholder: 'Chiedi qualsiasi cosa…',
    addFile: 'Aggiungi file',
    removeAttachment: 'Rimuovi allegato',
    uploadingFile: 'Caricamento…',
    aiDisclaimer:
      'Il consulente di carriera Goodwill usa l’IA e può commettere errori. Le offerte di lavoro e altre informazioni non sono verificate da Goodwill. Non condividere informazioni private e verifica le informazioni importanti.',
    footerTagline: 'Goodwill aiuta le persone a sviluppare competenze, trovare lavoro e crescere professionalmente.',
    footerLearnMore: 'Scopri di più su Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Informativa sulla privacy',
    footerTerms: 'Termini di utilizzo',
    footerAccessibility: 'Accessibilità',
    resourceComingSoon: 'In arrivo',
  },
  ht: {
    careerAdvisor: 'Konseye karyè',
    resources: 'Resous',
    liveSupport: 'Sipò an dirèk',
    liveSupportTitle: 'Sipò an dirèk',
    liveSupportVirtualSession: 'Pran yon sesyon vityèl ak youn nan coach karyè nou yo (byento)',
    liveSupportCentersHeading: 'Vizite oswa rele youn nan sant karyè nou yo',
    liveSupportZipLabel: 'Kòd postal ou',
    liveSupportZipPlaceholder: 'Antre kòd postal la',
    liveSupportZipHint: 'Antre kòd postal ou pou w wè sant ki pi pre yo an premye.',
    liveSupportNearest: 'Ki pi pre ou',
    backToChat: 'Tounen nan chat la',
    resourcesTitle: 'Resous pou karyè',
    resourcesIntro: 'Videyo kout, dyapo, ak gid ou ka itilize ak yon antrenè oswa poukont ou.',
    siteSettings: 'Paramèt sit la',
    textSize: 'Gwosè tèks',
    textSizeSmall: 'Piti',
    textSizeNormal: 'Nòmal',
    textSizeLarge: 'Gwo',
    textSizeVeryLarge: 'Trè gwo',
    language: 'Lang',
    readAloud: 'Li byen fò',
    readAloudUnavailable: 'Li byen fò pa disponib an arab.',
    heroTitle: 'Bonjou, mwen se konseye karyè ou ak IA',
    heroSubtitle: 'Kijan mwen ka ede ou atenn objektif ou jodi a?',
    quickActionsAria: 'Aksyon rapid',
    conversationAria: 'Konvèsasyon ak konseye karyè IA',
    messageLabel: 'Mesaj pou konseye karyè ou',
    voiceInputAria: 'Antre vwa',
    sendMessageAria: 'Voye mesaj',
    advisorThinkingAria: 'Konseye a ap reflechi',
    advisorThinkingLabel: 'Ap reflechi',
    placeholder: 'Ekri mesaj ou…',
    addFile: 'Ajoute fichye',
    removeAttachment: 'Retire fichye a',
    uploadingFile: 'Ap telechaje…',
    aiDisclaimer:
      'Konseye karyè Goodwill la itilize IA epi li ka fè erè. Travay ak lòt enfòmasyon yo pa verifye pa Goodwill. Pa pataje enfòmasyon prive epi verifye enfòmasyon enpòtan yo.',
    footerTagline: 'Goodwill ede moun devlope konpetans, jwenn travay, epi grandi nan karyè yo.',
    footerLearnMore: 'Aprann plis sou Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Règleman sou vi prive',
    footerTerms: 'Kondisyon itilizasyon',
    footerAccessibility: 'Aksesibilite',
    resourceComingSoon: 'Byento',
  },
  pl: {
    careerAdvisor: 'Doradca kariery',
    resources: 'Materiały',
    liveSupport: 'Wsparcie na żywo',
    liveSupportTitle: 'Wsparcie na żywo',
    liveSupportVirtualSession: 'Umów wirtualną sesję z jednym z naszych doradców kariery (wkrótce)',
    liveSupportCentersHeading: 'Odwiedź lub zadzwoń do jednego z naszych centrów kariery',
    liveSupportZipLabel: 'Twój kod pocztowy',
    liveSupportZipPlaceholder: 'Wpisz kod pocztowy',
    liveSupportZipHint: 'Wpisz kod pocztowy, aby najpierw zobaczyć najbliższe centra.',
    liveSupportNearest: 'Najbliżej Ciebie',
    backToChat: 'Wróć do czatu',
    resourcesTitle: 'Materiały o karierze',
    resourcesIntro: 'Krótkie filmy, prezentacje i poradniki do użycia z doradcą lub samodzielnie.',
    siteSettings: 'Ustawienia strony',
    textSize: 'Rozmiar tekstu',
    textSizeSmall: 'Mały',
    textSizeNormal: 'Normalny',
    textSizeLarge: 'Duży',
    textSizeVeryLarge: 'Bardzo duży',
    language: 'Język',
    readAloud: 'Czytaj na głos',
    readAloudUnavailable: 'Czytanie na głos nie jest dostępne w języku arabskim.',
    heroTitle: 'Cześć, jestem Twoim doradcą kariery AI',
    heroSubtitle: 'Jak mogę pomóc Ci osiągnąć Twoje cele dzisiaj?',
    quickActionsAria: 'Szybkie akcje',
    conversationAria: 'Rozmowa z doradcą kariery AI',
    messageLabel: 'Wiadomość do Twojego doradcy kariery',
    voiceInputAria: 'Wprowadzanie głosowe',
    sendMessageAria: 'Wyślij wiadomość',
    advisorThinkingAria: 'Doradca myśli',
    advisorThinkingLabel: 'Myślę',
    placeholder: 'Napisz wiadomość…',
    addFile: 'Dodaj plik',
    removeAttachment: 'Usuń załącznik',
    uploadingFile: 'Przesyłanie…',
    aiDisclaimer:
      'Doradca kariery Goodwill korzysta z AI, które może popełniać błędy. Oferty pracy i inne informacje nie są weryfikowane przez Goodwill. Nie udostępniaj prywatnych informacji i sprawdzaj ważne informacje.',
    footerTagline: 'Goodwill pomaga rozwijać umiejętności, znaleźć pracę i rozwijać karierę.',
    footerLearnMore: 'Dowiedz się więcej o Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Polityka prywatności',
    footerTerms: 'Warunki korzystania',
    footerAccessibility: 'Ułatwienia dostępu',
    resourceComingSoon: 'Wkrótce',
  },
  ru: {
    careerAdvisor: 'Консультант по карьере',
    resources: 'Материалы',
    liveSupport: 'Живая поддержка',
    liveSupportTitle: 'Живая поддержка',
    liveSupportVirtualSession: 'Запланируйте виртуальную сессию с одним из наших карьерных коучей (скоро)',
    liveSupportCentersHeading: 'Посетите или позвоните в один из наших карьерных центров',
    liveSupportZipLabel: 'Ваш почтовый индекс',
    liveSupportZipPlaceholder: 'Введите индекс',
    liveSupportZipHint: 'Введите индекс, чтобы сначала увидеть ближайшие центры.',
    liveSupportNearest: 'Ближайший к вам',
    backToChat: 'Назад в чат',
    resourcesTitle: 'Ресурсы по карьере',
    resourcesIntro: 'Короткие видео, презентации и руководства для работы с консультантом или самостоятельно.',
    siteSettings: 'Настройки сайта',
    textSize: 'Размер текста',
    textSizeSmall: 'Мелкий',
    textSizeNormal: 'Обычный',
    textSizeLarge: 'Крупный',
    textSizeVeryLarge: 'Очень крупный',
    language: 'Язык',
    readAloud: 'Озвучивать текст',
    readAloudUnavailable: 'Озвучивание недоступно для арабского языка.',
    heroTitle: 'Здравствуйте, я ваш AI‑консультант по карьере',
    heroSubtitle: 'Чем я могу помочь вам сегодня?',
    quickActionsAria: 'Быстрые действия',
    conversationAria: 'Диалог с AI‑консультантом по карьере',
    messageLabel: 'Сообщение вашему консультанту по карьере',
    voiceInputAria: 'Голосовой ввод',
    sendMessageAria: 'Отправить сообщение',
    advisorThinkingAria: 'Консультант думает',
    advisorThinkingLabel: 'Думаю',
    placeholder: 'Введите сообщение…',
    addFile: 'Добавить файл',
    removeAttachment: 'Удалить вложение',
    uploadingFile: 'Загрузка…',
    aiDisclaimer:
      'Карьерный консультант Goodwill использует ИИ и может ошибаться. Вакансии и другая информация не проверяются Goodwill. Не сообщайте личные данные и перепроверяйте важную информацию.',
    footerTagline: 'Goodwill помогает развивать навыки, находить работу и строить карьеру.',
    footerLearnMore: 'Узнать больше о Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Политика конфиденциальности',
    footerTerms: 'Условия использования',
    footerAccessibility: 'Доступность',
    resourceComingSoon: 'Скоро',
  },
  ar: {
    careerAdvisor: 'المستشار المهني',
    resources: 'الموارد',
    liveSupport: 'دعم مباشر',
    liveSupportTitle: 'دعم مباشر',
    liveSupportVirtualSession: 'حدّد جلسة افتراضية مع أحد مدربي المهنة لدينا (قريبًا)',
    liveSupportCentersHeading: 'زر أو اتصل بأحد مراكز المهنة لدينا',
    liveSupportZipLabel: 'الرمز البريدي',
    liveSupportZipPlaceholder: 'أدخل الرمز البريدي',
    liveSupportZipHint: 'أدخل الرمز البريدي لعرض أقرب المراكز أولًا.',
    liveSupportNearest: 'الأقرب إليك',
    backToChat: 'العودة إلى الدردشة',
    resourcesTitle: 'موارد مهنية',
    resourcesIntro: 'فيديوهات قصيرة وعروض شرائح وأدلة يمكنك استخدامها مع مدرب أو بمفردك.',
    siteSettings: 'إعدادات الموقع',
    textSize: 'حجم النص',
    textSizeSmall: 'صغير',
    textSizeNormal: 'عادي',
    textSizeLarge: 'كبير',
    textSizeVeryLarge: 'كبير جدًا',
    language: 'اللغة',
    readAloud: 'قراءة بصوت عالٍ',
    readAloudUnavailable: 'القراءة بصوت عالٍ غير متاحة باللغة العربية.',
    heroTitle: 'مرحبًا، أنا مستشارك المهني بالذكاء الاصطناعي',
    heroSubtitle: 'كيف يمكنني مساعدتك في الوصول إلى أهدافك اليوم؟',
    quickActionsAria: 'إجراءات سريعة',
    conversationAria: 'محادثة مع المستشار المهني بالذكاء الاصطناعي',
    messageLabel: 'رسالة إلى مستشارك المهني',
    voiceInputAria: 'إدخال صوتي',
    sendMessageAria: 'إرسال الرسالة',
    advisorThinkingAria: 'المستشار يفكر',
    advisorThinkingLabel: 'أفكر',
    placeholder: 'اكتب رسالتك…',
    addFile: 'إضافة ملف',
    removeAttachment: 'إزالة المرفق',
    uploadingFile: 'جارٍ الرفع…',
    aiDisclaimer:
      'يستخدم مستشار Goodwill المهني الذكاء الاصطناعي وقد يخطئ. الوظائف والمعلومات الأخرى غير مُدقَّقة من Goodwill. لا تشارك معلومات خاصة وتحقق من المعلومات المهمة.',
    footerTagline: 'تساعد Goodwill الناس على بناء المهارات والعثور على وظائف وتطوير مساراتهم المهنية.',
    footerLearnMore: 'اعرف المزيد عن Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'سياسة الخصوصية',
    footerTerms: 'شروط الاستخدام',
    footerAccessibility: 'إمكانية الوصول',
    resourceComingSoon: 'قريبًا',
  },
}

export function getUiStrings(language: SupportedLanguage): UiStrings {
  return uiStrings[language] ?? uiStrings.en
}

/** Stored in chat history when the user sends only an attached file (no typed text). */
export function formatFileOnlyUserMessage(language: SupportedLanguage, fileName: string): string {
  const templates: Record<SupportedLanguage, string> = {
    en: '[Attached file: {name}]',
    es: '[Archivo adjunto: {name}]',
    it: '[File allegato: {name}]',
    ht: '[Fichye ajoute: {name}]',
    pl: '[Załączony plik: {name}]',
    ru: '[Прикреплённый файл: {name}]',
    ar: '[ملف مرفق: {name}]',
  }
  const template = templates[language] ?? templates.en
  return template.replace('{name}', fileName)
}

/** Advisor reply when the user uploads a file with no additional message. */
export function formatFileUploadAcknowledgment(language: SupportedLanguage, fileName: string): string {
  const templates: Record<SupportedLanguage, string> = {
    en: "I see you uploaded {name} — I'm ready to discuss it further with you when you are.",
    es: 'Veo que subiste {name} — estoy listo para hablar de ello contigo cuando quieras.',
    it: 'Vedo che hai caricato {name} — sono pronto a parlarne con te quando vuoi.',
    ht: 'Mwen wè ou telechaje {name} — mwen pare pou nou diskite sou li lè w pare.',
    pl: 'Widzę, że przesłałeś(-aś) {name} — jestem gotowy(-a), aby omówić to z Tobą, kiedy będziesz gotowy(-a).',
    ru: 'Я вижу, что вы загрузили {name} — я готов обсудить это с вами, когда вы будете готовы.',
    ar: 'أرى أنك رفعت {name} — أنا مستعد لمناقشته معك عندما تكون جاهزًا.',
  }
  const template = templates[language] ?? templates.en
  return template.replace('{name}', fileName)
}

export type ResourceExample = {
  title: string
  description: string
  typeLabel: string
}

export const resourceExamples: Record<SupportedLanguage, ResourceExample[]> = {
  en: [
    {
      title: 'Resume basics',
      description: 'A short guide on structure, keywords, and what recruiters look for.',
      typeLabel: 'Guide',
    },
    {
      title: 'Interview practice',
      description: 'Common questions and how to answer with confidence.',
      typeLabel: 'Video',
    },
    {
      title: 'Job search plan',
      description: 'Step-by-step slideshow to organize your search week by week.',
      typeLabel: 'Slideshow',
    },
    {
      title: 'Workplace skills',
      description: 'Communication, teamwork, and problem-solving on the job.',
      typeLabel: 'Video',
    },
    {
      title: 'Local career centers',
      description: 'How to find coaching, workshops, and hiring events near you.',
      typeLabel: 'Guide',
    },
    {
      title: 'First 90 days at work',
      description: 'Tips for starting strong in a new role.',
      typeLabel: 'Guide',
    },
  ],
  es: [
    {
      title: 'Fundamentos del currículum',
      description: 'Guía breve sobre estructura, palabras clave y lo que buscan los reclutadores.',
      typeLabel: 'Guía',
    },
    {
      title: 'Práctica de entrevistas',
      description: 'Preguntas comunes y cómo responder con confianza.',
      typeLabel: 'Video',
    },
    {
      title: 'Plan de búsqueda de empleo',
      description: 'Presentación paso a paso para organizar tu búsqueda semana a semana.',
      typeLabel: 'Presentación',
    },
    {
      title: 'Habilidades en el trabajo',
      description: 'Comunicación, trabajo en equipo y resolución de problemas.',
      typeLabel: 'Video',
    },
    {
      title: 'Centros de carrera locales',
      description: 'Cómo encontrar coaching, talleres y ferias de empleo cerca de ti.',
      typeLabel: 'Guía',
    },
    {
      title: 'Tus primeros 90 días',
      description: 'Consejos para empezar bien en un nuevo puesto.',
      typeLabel: 'Guía',
    },
  ],
  it: [
    {
      title: 'Basi del curriculum',
      description: 'Una breve guida su struttura, parole chiave e cosa cercano i recruiter.',
      typeLabel: 'Guida',
    },
    {
      title: 'Pratica al colloquio',
      description: 'Domande frequenti e come rispondere con sicurezza.',
      typeLabel: 'Video',
    },
    {
      title: 'Piano di ricerca lavoro',
      description: 'Presentazione passo passo per organizzare la ricerca settimana per settimana.',
      typeLabel: 'Presentazione',
    },
    {
      title: 'Competenze sul lavoro',
      description: 'Comunicazione, lavoro di squadra e problem solving.',
      typeLabel: 'Video',
    },
    {
      title: 'Centri per la carriera locali',
      description: 'Come trovare coaching, workshop ed eventi di recruiting vicino a te.',
      typeLabel: 'Guida',
    },
    {
      title: 'I primi 90 giorni di lavoro',
      description: 'Consigli per iniziare al meglio in un nuovo ruolo.',
      typeLabel: 'Guida',
    },
  ],
  ht: [
    {
      title: 'Baz rezime',
      description: 'Yon gid kout sou estrikti, mo kle, ak sa rekrite yo ap chèche.',
      typeLabel: 'Gid',
    },
    {
      title: 'Pratik entèvyou',
      description: 'Kesyon komen ak kijan pou reponn ak konfyans.',
      typeLabel: 'Videyo',
    },
    {
      title: 'Plan rechèch travay',
      description: 'Yon prezantasyon etap pa etap pou òganize rechèch ou chak semèn.',
      typeLabel: 'Dyapo',
    },
    {
      title: 'Konpetans nan travay',
      description: 'Kominikasyon, travay an ekip, ak rezoud pwoblèm.',
      typeLabel: 'Videyo',
    },
    {
      title: 'Sant karyè lokal',
      description: 'Kijan pou jwenn coaching, atelye, ak evènman anboche tou pre ou.',
      typeLabel: 'Gid',
    },
    {
      title: 'Premye 90 jou nan travay',
      description: 'Konsèy pou kòmanse byen nan yon nouvo wòl.',
      typeLabel: 'Gid',
    },
  ],
  pl: [
    {
      title: 'Podstawy CV',
      description: 'Krótki przewodnik o strukturze, słowach kluczowych i oczekiwaniach rekruterów.',
      typeLabel: 'Poradnik',
    },
    {
      title: 'Ćwiczenia do rozmowy',
      description: 'Typowe pytania i jak odpowiadać pewnie.',
      typeLabel: 'Wideo',
    },
    {
      title: 'Plan poszukiwania pracy',
      description: 'Prezentacja krok po kroku, jak uporządkować poszukiwania tydzień po tygodniu.',
      typeLabel: 'Prezentacja',
    },
    {
      title: 'Umiejętności w pracy',
      description: 'Komunikacja, praca zespołowa i rozwiązywanie problemów.',
      typeLabel: 'Wideo',
    },
    {
      title: 'Lokalne centra kariery',
      description: 'Jak znaleźć coaching, warsztaty i targi pracy w pobliżu.',
      typeLabel: 'Poradnik',
    },
    {
      title: 'Pierwsze 90 dni w pracy',
      description: 'Wskazówki, jak dobrze zacząć w nowej roli.',
      typeLabel: 'Poradnik',
    },
  ],
  ru: [
    {
      title: 'Основы резюме',
      description: 'Краткое руководство по структуре, ключевым словам и ожиданиям рекрутеров.',
      typeLabel: 'Руководство',
    },
    {
      title: 'Подготовка к собеседованию',
      description: 'Типичные вопросы и как отвечать уверенно.',
      typeLabel: 'Видео',
    },
    {
      title: 'План поиска работы',
      description: 'Пошаговая презентация, как организовать поиск неделя за неделей.',
      typeLabel: 'Презентация',
    },
    {
      title: 'Навыки на работе',
      description: 'Коммуникация, командная работа и решение проблем.',
      typeLabel: 'Видео',
    },
    {
      title: 'Местные карьерные центры',
      description: 'Как найти коучинг, мастер-классы и ярмарки вакансий рядом с вами.',
      typeLabel: 'Руководство',
    },
    {
      title: 'Первые 90 дней на работе',
      description: 'Советы, как уверенно начать в новой роли.',
      typeLabel: 'Руководство',
    },
  ],
  ar: [
    {
      title: 'أساسيات السيرة الذاتية',
      description: 'دليل قصير عن الهيكل والكلمات المفتاحية وما يبحث عنه مسؤولو التوظيف.',
      typeLabel: 'دليل',
    },
    {
      title: 'التدرب على المقابلة',
      description: 'أسئلة شائعة وكيفية الإجابة بثقة.',
      typeLabel: 'فيديو',
    },
    {
      title: 'خطة البحث عن عمل',
      description: 'عرض تقديمي خطوة بخطوة لتنظيم بحثك أسبوعًا بأسبوع.',
      typeLabel: 'عرض تقديمي',
    },
    {
      title: 'مهارات مكان العمل',
      description: 'التواصل والعمل الجماعي وحل المشكلات.',
      typeLabel: 'فيديو',
    },
    {
      title: 'مراكز مهنية محلية',
      description: 'كيفية العثور على التدريب وورش العمل ومعارض التوظيف بالقرب منك.',
      typeLabel: 'دليل',
    },
    {
      title: 'أول 90 يومًا في العمل',
      description: 'نصائح للبدء بقوة في دور جديد.',
      typeLabel: 'دليل',
    },
  ],
}
