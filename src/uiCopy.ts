export type SupportedLanguage = 'ar' | 'ht' | 'en' | 'pl' | 'ru' | 'es'

export const supportedLanguages: { code: SupportedLanguage; label: string; bcp47: string }[] = [
  { code: 'en', label: 'English', bcp47: 'en-US' },
  { code: 'es', label: 'Spanish', bcp47: 'es' },
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
  liveSupportIntro: string
  backToChat: string
  resourcesTitle: string
  resourcesIntro: string
  siteSettings: string
  language: string
  readAloud: string
  heroTitle: string
  heroSubtitle: string
  quickActionsAria: string
  conversationAria: string
  suggestedRepliesAria: string
  searchOnline: string
  messageLabel: string
  addAria: string
  voiceInputAria: string
  sendMessageAria: string
  advisorThinkingAria: string
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
    liveSupportIntro: 'Find your closest Career Center and the best number to call.',
    backToChat: 'Back to chat',
    resourcesTitle: 'Career resources',
    resourcesIntro: 'Short videos, slideshows, and guides you can use with a coach or on your own.',
    siteSettings: 'Site settings',
    language: 'Language',
    readAloud: 'Read aloud',
    heroTitle: 'Hi, I’m your AI Career Advisor',
    heroSubtitle: 'How can I help you reach your goals today?',
    quickActionsAria: 'Quick actions',
    conversationAria: 'AI Career Advisor conversation',
    suggestedRepliesAria: 'Suggested replies',
    searchOnline: 'Search online',
    messageLabel: 'Message to your career advisor',
    addAria: 'Add',
    voiceInputAria: 'Voice input',
    sendMessageAria: 'Send message',
    advisorThinkingAria: 'Advisor is thinking',
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
    liveSupportIntro: 'Encuentra tu Centro de Carreras más cercano y el mejor número para llamar.',
    backToChat: 'Volver al chat',
    resourcesTitle: 'Recursos de carrera',
    resourcesIntro: 'Videos cortos, presentaciones y guías para usar con un coach o por tu cuenta.',
    siteSettings: 'Ajustes del sitio',
    language: 'Idioma',
    readAloud: 'Leer en voz alta',
    heroTitle: 'Hola, soy tu asesor de carreras con IA',
    heroSubtitle: '¿Cómo puedo ayudarte a alcanzar tus metas hoy?',
    quickActionsAria: 'Acciones rápidas',
    conversationAria: 'Conversación con el asesor de carreras con IA',
    suggestedRepliesAria: 'Respuestas sugeridas',
    searchOnline: 'Buscar en línea',
    messageLabel: 'Mensaje para tu asesor de carreras',
    addAria: 'Agregar',
    voiceInputAria: 'Entrada de voz',
    sendMessageAria: 'Enviar mensaje',
    advisorThinkingAria: 'El asesor está pensando',
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
  ht: {
    careerAdvisor: 'Konseye karyè',
    resources: 'Resous',
    liveSupport: 'Sipò an dirèk',
    liveSupportTitle: 'Sipò an dirèk',
    liveSupportIntro: 'Jwenn Sant Karyè ki pi pre a ak nimewo pou rele a.',
    backToChat: 'Tounen nan chat la',
    resourcesTitle: 'Resous pou karyè',
    resourcesIntro: 'Videyo kout, dyapo, ak gid ou ka itilize ak yon antrenè oswa poukont ou.',
    siteSettings: 'Paramèt sit la',
    language: 'Lang',
    readAloud: 'Li byen fò',
    heroTitle: 'Bonjou, mwen se konseye karyè ou ak IA',
    heroSubtitle: 'Kijan mwen ka ede ou atenn objektif ou jodi a?',
    quickActionsAria: 'Aksyon rapid',
    conversationAria: 'Konvèsasyon ak konseye karyè IA',
    suggestedRepliesAria: 'Repons sijere',
    searchOnline: 'Chèche sou entènèt',
    messageLabel: 'Mesaj pou konseye karyè ou',
    addAria: 'Ajoute',
    voiceInputAria: 'Antre vwa',
    sendMessageAria: 'Voye mesaj',
    advisorThinkingAria: 'Konseye a ap reflechi',
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
    liveSupportIntro: 'Znajdź najbliższe Centrum Kariery i najlepszy numer telefonu.',
    backToChat: 'Wróć do czatu',
    resourcesTitle: 'Materiały o karierze',
    resourcesIntro: 'Krótkie filmy, prezentacje i poradniki do użycia z doradcą lub samodzielnie.',
    siteSettings: 'Ustawienia strony',
    language: 'Język',
    readAloud: 'Czytaj na głos',
    heroTitle: 'Cześć, jestem Twoim doradcą kariery AI',
    heroSubtitle: 'Jak mogę pomóc Ci osiągnąć Twoje cele dzisiaj?',
    quickActionsAria: 'Szybkie akcje',
    conversationAria: 'Rozmowa z doradcą kariery AI',
    suggestedRepliesAria: 'Sugerowane odpowiedzi',
    searchOnline: 'Szukaj online',
    messageLabel: 'Wiadomość do Twojego doradcy kariery',
    addAria: 'Dodaj',
    voiceInputAria: 'Wprowadzanie głosowe',
    sendMessageAria: 'Wyślij wiadomość',
    advisorThinkingAria: 'Doradca myśli',
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
    liveSupportIntro: 'Найдите ближайший карьерный центр и лучший номер для звонка.',
    backToChat: 'Назад в чат',
    resourcesTitle: 'Ресурсы по карьере',
    resourcesIntro: 'Короткие видео, презентации и руководства для работы с консультантом или самостоятельно.',
    siteSettings: 'Настройки сайта',
    language: 'Язык',
    readAloud: 'Озвучивать текст',
    heroTitle: 'Здравствуйте, я ваш AI‑консультант по карьере',
    heroSubtitle: 'Чем я могу помочь вам сегодня?',
    quickActionsAria: 'Быстрые действия',
    conversationAria: 'Диалог с AI‑консультантом по карьере',
    suggestedRepliesAria: 'Рекомендуемые ответы',
    searchOnline: 'Искать в интернете',
    messageLabel: 'Сообщение вашему консультанту по карьере',
    addAria: 'Добавить',
    voiceInputAria: 'Голосовой ввод',
    sendMessageAria: 'Отправить сообщение',
    advisorThinkingAria: 'Консультант думает',
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
    liveSupportIntro: 'اعثر على أقرب مركز مهني وأفضل رقم للاتصال.',
    backToChat: 'العودة إلى الدردشة',
    resourcesTitle: 'موارد مهنية',
    resourcesIntro: 'فيديوهات قصيرة وعروض شرائح وأدلة يمكنك استخدامها مع مدرب أو بمفردك.',
    siteSettings: 'إعدادات الموقع',
    language: 'اللغة',
    readAloud: 'قراءة بصوت عالٍ',
    heroTitle: 'مرحبًا، أنا مستشارك المهني بالذكاء الاصطناعي',
    heroSubtitle: 'كيف يمكنني مساعدتك في الوصول إلى أهدافك اليوم؟',
    quickActionsAria: 'إجراءات سريعة',
    conversationAria: 'محادثة مع المستشار المهني بالذكاء الاصطناعي',
    suggestedRepliesAria: 'ردود مقترحة',
    searchOnline: 'البحث عبر الإنترنت',
    messageLabel: 'رسالة إلى مستشارك المهني',
    addAria: 'إضافة',
    voiceInputAria: 'إدخال صوتي',
    sendMessageAria: 'إرسال الرسالة',
    advisorThinkingAria: 'المستشار يفكر',
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

export const quickActionLabels: Record<
  SupportedLanguage,
  {
    job: string
    careers: string
    resume: string
    interviews: string
    skills: string
    local: string
  }
> = {
  en: {
    job: 'Help me find a job',
    careers: 'Explore career options',
    resume: 'Write my resume / CV',
    interviews: 'Practice interview questions',
    skills: 'Help me build skills',
    local: 'Help me find local resources',
  },
  es: {
    job: 'Ayúdame a encontrar trabajo',
    careers: 'Explorar opciones de carrera',
    resume: 'Escribir mi currículum / CV',
    interviews: 'Practicar preguntas de entrevista',
    skills: 'Ayúdame a desarrollar habilidades',
    local: 'Ayúdame a encontrar recursos locales',
  },
  ht: {
    job: 'Ede m jwenn yon travay',
    careers: 'Eksplore opsyon karyè',
    resume: 'Ekri rezime / CV mwen',
    interviews: 'Pratike kesyon entèvyou',
    skills: 'Ede m devlope konpetans',
    local: 'Ede m jwenn resous lokal',
  },
  pl: {
    job: 'Pomóż mi znaleźć pracę',
    careers: 'Poznaj opcje kariery',
    resume: 'Napisz moje CV',
    interviews: 'Ćwicz pytania rekrutacyjne',
    skills: 'Pomóż mi rozwinąć umiejętności',
    local: 'Pomóż mi znaleźć lokalne zasoby',
  },
  ru: {
    job: 'Помогите мне найти работу',
    careers: 'Изучить варианты карьеры',
    resume: 'Написать резюме / CV',
    interviews: 'Практика вопросов на интервью',
    skills: 'Помогите развить навыки',
    local: 'Помогите найти местные ресурсы',
  },
  ar: {
    job: 'ساعدني في العثور على وظيفة',
    careers: 'استكشاف خيارات مهنية',
    resume: 'كتابة السيرة الذاتية / CV',
    interviews: 'التدرّب على أسئلة المقابلة',
    skills: 'ساعدني في بناء المهارات',
    local: 'ساعدني في العثور على موارد محلية',
  },
}

