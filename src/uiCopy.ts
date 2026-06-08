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
  liveSupportZipUnknown: string
  liveSupportNearest: string
  liveSupportMilesAway: string
  backToChat: string
  resourcesTitle: string
  resourcesIntro: string
  siteSettings: string
  mainMenu: string
  closeMenu: string
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
  heroSubtitlePrompt: string
  heroPortraitAlt: string
  quickActionsAria: string
  conversationAria: string
  messageLabel: string
  voiceInputAria: string
  sendMessageAria: string
  advisorThinkingAria: string
  advisorThinkingLabel: string
  placeholder: string
  confirmSearchAction: string
  confirmResumeAction: string
  searchConfirmRecoveryMessage: string
  searchConfirmRecoveryRetry: string
  searchConfirmRecoveryManualConfirm: string
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
  exploreSectionAria: string
  exploreResourcesTitle: string
  exploreResourcesDescription: string
  exploreResourcesImageAlt: string
  exploreSupportTitle: string
  exploreSupportDescription: string
  exploreSupportImageAlt: string
  exploreCardCta: string
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
    liveSupportZipUnknown: 'We could not find that ZIP code. Try another U.S. ZIP, or call a center below.',
    liveSupportNearest: 'Nearest to you',
    liveSupportMilesAway: '%s mi away',
    backToChat: 'Back to chat',
    resourcesTitle: 'Career resources',
    resourcesIntro: 'Short videos, slideshows, and guides you can use with a coach or on your own.',
    siteSettings: 'Site settings',
    mainMenu: 'Main menu',
    closeMenu: 'Close menu',
    textSize: 'Text size',
    textSizeSmall: 'Small',
    textSizeNormal: 'Normal',
    textSizeLarge: 'Large',
    textSizeVeryLarge: 'Very large',
    language: 'Language',
    readAloud: 'Read aloud',
    readAloudUnavailable: 'Read aloud is not available in Arabic.',
    heroTitle: 'Hi, I’m your Goodwill Career Advisor',
    heroSubtitle:
      'I’m here to help you find jobs, build skills, improve your resume, and take the next step in your career.',
    heroSubtitlePrompt: 'Where should we start?',
    heroPortraitAlt: 'Goodwill Career Advisor',
    quickActionsAria: 'Quick actions',
    conversationAria: 'Career Advisor conversation',
    messageLabel: 'Message to your career advisor',
    voiceInputAria: 'Voice input',
    sendMessageAria: 'Send message',
    advisorThinkingAria: 'Advisor is thinking',
    advisorThinkingLabel: 'Thinking',
    placeholder: 'Type or talk here…',
    confirmSearchAction: 'Confirm search',
    confirmResumeAction: 'Generate resume',
    searchConfirmRecoveryMessage:
      'Search setup did not finish. You can try confirming anyway, or ask again.',
    searchConfirmRecoveryRetry: 'Try again',
    searchConfirmRecoveryManualConfirm: 'Confirm search anyway',
    addFile: 'Add file',
    removeAttachment: 'Remove attachment',
    uploadingFile: 'Uploading…',
    aiDisclaimer:
      'Goodwill career advisor uses AI which can make mistakes. Information & jobs are not vetted. Do not share private information & double check important information.',
    footerTagline: 'Goodwill helps people build skills, find jobs, and grow their careers.',
    footerLearnMore: 'Learn more about Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Use',
    footerAccessibility: 'Accessibility',
    resourceComingSoon: 'Coming soon',
    exploreSectionAria: 'More ways to get help',
    exploreResourcesTitle: 'Resources',
    exploreResourcesDescription:
      'Short videos, slideshows, and guides you can use with a coach or on your own.',
    exploreResourcesImageAlt: 'Career learning resources',
    exploreSupportTitle: 'Live Support',
    exploreSupportDescription:
      'Find career centers near you, explore virtual coaching, and get in-person help.',
    exploreSupportImageAlt: 'Career center locations',
    exploreCardCta: 'Explore',
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
    liveSupportZipUnknown: 'No encontramos ese código postal. Prueba otro ZIP de EE. UU. o llama a un centro.',
    liveSupportNearest: 'Más cercano a ti',
    liveSupportMilesAway: 'A %s mi',
    backToChat: 'Volver al chat',
    resourcesTitle: 'Recursos de carrera',
    resourcesIntro: 'Videos cortos, presentaciones y guías para usar con un coach o por tu cuenta.',
    siteSettings: 'Ajustes del sitio',
    mainMenu: 'Menú principal',
    closeMenu: 'Cerrar menú',
    textSize: 'Tamaño de texto',
    textSizeSmall: 'Pequeño',
    textSizeNormal: 'Normal',
    textSizeLarge: 'Grande',
    textSizeVeryLarge: 'Muy grande',
    language: 'Idioma',
    readAloud: 'Leer en voz alta',
    readAloudUnavailable: 'La lectura en voz alta no está disponible en árabe.',
    heroTitle: 'Hola, soy tu asesor de carreras de Goodwill',
    heroSubtitle:
      'Estoy aquí para ayudarte a encontrar empleo, desarrollar habilidades, mejorar tu currículum y dar el siguiente paso en tu carrera.',
    heroSubtitlePrompt: '¿Por dónde empezamos?',
    heroPortraitAlt: 'Asesor de carreras de Goodwill',
    quickActionsAria: 'Acciones rápidas',
    conversationAria: 'Conversación con el asesor de carreras',
    messageLabel: 'Mensaje para tu asesor de carreras',
    voiceInputAria: 'Entrada de voz',
    sendMessageAria: 'Enviar mensaje',
    advisorThinkingAria: 'El asesor está pensando',
    advisorThinkingLabel: 'Pensando',
    placeholder: 'Escribe o habla aquí…',
    confirmSearchAction: 'Confirmar búsqueda',
    confirmResumeAction: 'Generar currículum',
    searchConfirmRecoveryMessage:
      'La configuración de la búsqueda no se completó. Puede intentar confirmar de todos modos o volver a preguntar.',
    searchConfirmRecoveryRetry: 'Intentar de nuevo',
    searchConfirmRecoveryManualConfirm: 'Confirmar búsqueda de todos modos',
    addFile: 'Agregar archivo',
    removeAttachment: 'Quitar archivo adjunto',
    uploadingFile: 'Subiendo…',
    aiDisclaimer:
      'El asesor de carreras de Goodwill usa IA y puede cometer errores. La información y los empleos no están verificados. No compartas información privada y verifica la información importante.',
    footerTagline: 'Goodwill ayuda a las personas a desarrollar habilidades, encontrar trabajo y crecer profesionalmente.',
    footerLearnMore: 'Conoce más sobre Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Política de privacidad',
    footerTerms: 'Términos de uso',
    footerAccessibility: 'Accesibilidad',
    resourceComingSoon: 'Próximamente',
    exploreSectionAria: 'Más formas de obtener ayuda',
    exploreResourcesTitle: 'Recursos',
    exploreResourcesDescription:
      'Videos cortos, presentaciones y guías para usar con un coach o por tu cuenta.',
    exploreResourcesImageAlt: 'Recursos de aprendizaje profesional',
    exploreSupportTitle: 'Apoyo en vivo',
    exploreSupportDescription:
      'Encuentra centros de carrera cerca de ti, coaching virtual y ayuda en persona.',
    exploreSupportImageAlt: 'Ubicaciones de centros de carrera',
    exploreCardCta: 'Explorar',
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
    liveSupportZipUnknown: 'CAP non trovato. Prova un altro ZIP statunitense o chiama un centro.',
    liveSupportNearest: 'Più vicino a te',
    liveSupportMilesAway: '%s mi di distanza',
    backToChat: 'Torna alla chat',
    resourcesTitle: 'Risorse per la carriera',
    resourcesIntro: 'Video brevi, presentazioni e guide da usare con un coach o in autonomia.',
    siteSettings: 'Impostazioni del sito',
    mainMenu: 'Menu principale',
    closeMenu: 'Chiudi menu',
    textSize: 'Dimensione testo',
    textSizeSmall: 'Piccolo',
    textSizeNormal: 'Normale',
    textSizeLarge: 'Grande',
    textSizeVeryLarge: 'Molto grande',
    language: 'Lingua',
    readAloud: 'Leggi ad alta voce',
    readAloudUnavailable: 'La lettura ad alta voce non è disponibile in arabo.',
    heroTitle: 'Ciao, sono il tuo consulente di carriera Goodwill',
    heroSubtitle:
      'Sono qui per aiutarti a trovare lavoro, sviluppare competenze, migliorare il curriculum e fare il prossimo passo nella tua carriera.',
    heroSubtitlePrompt: 'Da dove cominciamo?',
    heroPortraitAlt: 'Consulente di carriera Goodwill',
    quickActionsAria: 'Azioni rapide',
    conversationAria: 'Conversazione con il consulente di carriera',
    messageLabel: 'Messaggio al tuo consulente di carriera',
    voiceInputAria: 'Input vocale',
    sendMessageAria: 'Invia messaggio',
    advisorThinkingAria: 'Il consulente sta pensando',
    advisorThinkingLabel: 'Sto pensando',
    placeholder: 'Scrivi o parla qui…',
    confirmSearchAction: 'Conferma ricerca',
    confirmResumeAction: 'Genera curriculum',
    searchConfirmRecoveryMessage:
      'La configurazione della ricerca non è stata completata. Puoi provare a confermare comunque o chiedere di nuovo.',
    searchConfirmRecoveryRetry: 'Riprova',
    searchConfirmRecoveryManualConfirm: 'Conferma ricerca comunque',
    addFile: 'Aggiungi file',
    removeAttachment: 'Rimuovi allegato',
    uploadingFile: 'Caricamento…',
    aiDisclaimer:
      'Il consulente di carriera Goodwill usa l’IA e può commettere errori. Informazioni e offerte di lavoro non sono verificate. Non condividere informazioni private e verifica le informazioni importanti.',
    footerTagline: 'Goodwill aiuta le persone a sviluppare competenze, trovare lavoro e crescere professionalmente.',
    footerLearnMore: 'Scopri di più su Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Informativa sulla privacy',
    footerTerms: 'Termini di utilizzo',
    footerAccessibility: 'Accessibilità',
    resourceComingSoon: 'In arrivo',
    exploreSectionAria: 'Altri modi per ricevere aiuto',
    exploreResourcesTitle: 'Risorse',
    exploreResourcesDescription:
      'Video brevi, presentazioni e guide da usare con un coach o in autonomia.',
    exploreResourcesImageAlt: 'Risorse per l\'apprendimento professionale',
    exploreSupportTitle: 'Supporto dal vivo',
    exploreSupportDescription:
      'Trova centri per la carriera vicino a te, coaching virtuale e supporto di persona.',
    exploreSupportImageAlt: 'Sedi dei centri per la carriera',
    exploreCardCta: 'Esplora',
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
    liveSupportZipUnknown: 'Nou pa jwenn kòd postal sa a. Eseye yon lòt ZIP Etazini oswa rele yon sant.',
    liveSupportNearest: 'Ki pi pre ou',
    liveSupportMilesAway: '%s mi',
    backToChat: 'Tounen nan chat la',
    resourcesTitle: 'Resous pou karyè',
    resourcesIntro: 'Videyo kout, dyapo, ak gid ou ka itilize ak yon antrenè oswa poukont ou.',
    siteSettings: 'Paramèt sit la',
    mainMenu: 'Meni prensipal',
    closeMenu: 'Fèmen meni an',
    textSize: 'Gwosè tèks',
    textSizeSmall: 'Piti',
    textSizeNormal: 'Nòmal',
    textSizeLarge: 'Gwo',
    textSizeVeryLarge: 'Trè gwo',
    language: 'Lang',
    readAloud: 'Li byen fò',
    readAloudUnavailable: 'Li byen fò pa disponib an arab.',
    heroTitle: 'Bonjou, mwen se konseye karyè Goodwill ou',
    heroSubtitle:
      'Mwen la pou ede ou jwenn travay, devlope konpetans, amelyore CV ou, epi fè pwochen etap nan karyè ou.',
    heroSubtitlePrompt: 'Ki kote nou ta dwe kòmanse?',
    heroPortraitAlt: 'Konseye karyè Goodwill',
    quickActionsAria: 'Aksyon rapid',
    conversationAria: 'Konvèsasyon ak konseye karyè',
    messageLabel: 'Mesaj pou konseye karyè ou',
    voiceInputAria: 'Antre vwa',
    sendMessageAria: 'Voye mesaj',
    advisorThinkingAria: 'Konseye a ap reflechi',
    advisorThinkingLabel: 'Ap reflechi',
    placeholder: 'Tape oswa pale isit la…',
    confirmSearchAction: 'Konfime rechèch la',
    confirmResumeAction: 'Kreye rezime a',
    searchConfirmRecoveryMessage:
      'Konfigirasyon rechèch la pa fini. Ou ka eseye konfime kanmenm, oswa mande ankò.',
    searchConfirmRecoveryRetry: 'Eseye ankò',
    searchConfirmRecoveryManualConfirm: 'Konfime rechèch kanmenm',
    addFile: 'Ajoute fichye',
    removeAttachment: 'Retire fichye a',
    uploadingFile: 'Ap telechaje…',
    aiDisclaimer:
      'Konseye karyè Goodwill la itilize IA epi li ka fè erè. Enfòmasyon ak travay yo pa verifye. Pa pataje enfòmasyon prive epi verifye enfòmasyon enpòtan yo.',
    footerTagline: 'Goodwill ede moun devlope konpetans, jwenn travay, epi grandi nan karyè yo.',
    footerLearnMore: 'Aprann plis sou Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Règleman sou vi prive',
    footerTerms: 'Kondisyon itilizasyon',
    footerAccessibility: 'Aksesibilite',
    resourceComingSoon: 'Byento',
    exploreSectionAria: 'Lòt fason pou jwenn èd',
    exploreResourcesTitle: 'Resous',
    exploreResourcesDescription:
      'Videyo kout, dyapo, ak gid ou ka itilize ak yon antrenè oswa poukont ou.',
    exploreResourcesImageAlt: 'Resous aprantisaj karyè',
    exploreSupportTitle: 'Sipò an dirèk',
    exploreSupportDescription:
      'Jwenn sant karyè tou pre ou, coaching vityèl, ak èd an pèsòn.',
    exploreSupportImageAlt: 'Kote sant karyè yo',
    exploreCardCta: 'Eksplore',
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
    liveSupportZipUnknown: 'Nie znaleźliśmy tego kodu pocztowego. Spróbuj inny ZIP w USA lub zadzwoń do centrum.',
    liveSupportNearest: 'Najbliżej Ciebie',
    liveSupportMilesAway: '%s mi stąd',
    backToChat: 'Wróć do czatu',
    resourcesTitle: 'Materiały o karierze',
    resourcesIntro: 'Krótkie filmy, prezentacje i poradniki do użycia z doradcą lub samodzielnie.',
    siteSettings: 'Ustawienia strony',
    mainMenu: 'Menu główne',
    closeMenu: 'Zamknij menu',
    textSize: 'Rozmiar tekstu',
    textSizeSmall: 'Mały',
    textSizeNormal: 'Normalny',
    textSizeLarge: 'Duży',
    textSizeVeryLarge: 'Bardzo duży',
    language: 'Język',
    readAloud: 'Czytaj na głos',
    readAloudUnavailable: 'Czytanie na głos nie jest dostępne w języku arabskim.',
    heroTitle: 'Cześć, jestem Twoim doradcą kariery Goodwill',
    heroSubtitle:
      'Jestem tu, aby pomóc Ci znaleźć pracę, rozwijać umiejętności, ulepszyć CV i zrobić kolejny krok w karierze.',
    heroSubtitlePrompt: 'Od czego zaczniemy?',
    heroPortraitAlt: 'Doradca kariery Goodwill',
    quickActionsAria: 'Szybkie akcje',
    conversationAria: 'Rozmowa z doradcą kariery',
    messageLabel: 'Wiadomość do Twojego doradcy kariery',
    voiceInputAria: 'Wprowadzanie głosowe',
    sendMessageAria: 'Wyślij wiadomość',
    advisorThinkingAria: 'Doradca myśli',
    advisorThinkingLabel: 'Myślę',
    placeholder: 'Pisz lub mów tutaj…',
    confirmSearchAction: 'Potwierdź wyszukiwanie',
    confirmResumeAction: 'Wygeneruj CV',
    searchConfirmRecoveryMessage:
      'Konfiguracja wyszukiwania nie została ukończona. Możesz spróbować potwierdzić mimo to lub zapytać ponownie.',
    searchConfirmRecoveryRetry: 'Spróbuj ponownie',
    searchConfirmRecoveryManualConfirm: 'Potwierdź wyszukiwanie mimo to',
    addFile: 'Dodaj plik',
    removeAttachment: 'Usuń załącznik',
    uploadingFile: 'Przesyłanie…',
    aiDisclaimer:
      'Doradca kariery Goodwill korzysta z AI, które może popełniać błędy. Informacje i oferty pracy nie są weryfikowane. Nie udostępniaj prywatnych informacji i sprawdzaj ważne informacje.',
    footerTagline: 'Goodwill pomaga rozwijać umiejętności, znaleźć pracę i rozwijać karierę.',
    footerLearnMore: 'Dowiedz się więcej o Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Polityka prywatności',
    footerTerms: 'Warunki korzystania',
    footerAccessibility: 'Ułatwienia dostępu',
    resourceComingSoon: 'Wkrótce',
    exploreSectionAria: 'Więcej sposobów na uzyskanie pomocy',
    exploreResourcesTitle: 'Materiały',
    exploreResourcesDescription:
      'Krótkie filmy, prezentacje i poradniki do użycia z doradcą lub samodzielnie.',
    exploreResourcesImageAlt: 'Materiały do nauki zawodowej',
    exploreSupportTitle: 'Wsparcie na żywo',
    exploreSupportDescription:
      'Znajdź centra kariery w pobliżu, coaching wirtualny i pomoc osobiście.',
    exploreSupportImageAlt: 'Lokalizacje centrów kariery',
    exploreCardCta: 'Zobacz',
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
    liveSupportZipUnknown: 'Индекс не найден. Попробуйте другой почтовый индекс США или позвоните в центр.',
    liveSupportNearest: 'Ближайший к вам',
    liveSupportMilesAway: '%s миль',
    backToChat: 'Назад в чат',
    resourcesTitle: 'Ресурсы по карьере',
    resourcesIntro: 'Короткие видео, презентации и руководства для работы с консультантом или самостоятельно.',
    siteSettings: 'Настройки сайта',
    mainMenu: 'Главное меню',
    closeMenu: 'Закрыть меню',
    textSize: 'Размер текста',
    textSizeSmall: 'Мелкий',
    textSizeNormal: 'Обычный',
    textSizeLarge: 'Крупный',
    textSizeVeryLarge: 'Очень крупный',
    language: 'Язык',
    readAloud: 'Озвучивать текст',
    readAloudUnavailable: 'Озвучивание недоступно для арабского языка.',
    heroTitle: 'Здравствуйте, я ваш карьерный консультант Goodwill',
    heroSubtitle:
      'Я здесь, чтобы помочь вам найти работу, развить навыки, улучшить резюме и сделать следующий шаг в карьере.',
    heroSubtitlePrompt: 'С чего начнём?',
    heroPortraitAlt: 'Карьерный консультант Goodwill',
    quickActionsAria: 'Быстрые действия',
    conversationAria: 'Диалог с карьерным консультантом',
    messageLabel: 'Сообщение вашему консультанту по карьере',
    voiceInputAria: 'Голосовой ввод',
    sendMessageAria: 'Отправить сообщение',
    advisorThinkingAria: 'Консультант думает',
    advisorThinkingLabel: 'Думаю',
    placeholder: 'Пишите или говорите здесь…',
    confirmSearchAction: 'Подтвердить поиск',
    confirmResumeAction: 'Создать резюме',
    searchConfirmRecoveryMessage:
      'Настройка поиска не завершена. Вы можете попробовать подтвердить или спросить снова.',
    searchConfirmRecoveryRetry: 'Повторить',
    searchConfirmRecoveryManualConfirm: 'Подтвердить поиск в любом случае',
    addFile: 'Добавить файл',
    removeAttachment: 'Удалить вложение',
    uploadingFile: 'Загрузка…',
    aiDisclaimer:
      'Карьерный консультант Goodwill использует ИИ и может ошибаться. Информация и вакансии не проверяются. Не сообщайте личные данные и перепроверяйте важную информацию.',
    footerTagline: 'Goodwill помогает развивать навыки, находить работу и строить карьеру.',
    footerLearnMore: 'Узнать больше о Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'Политика конфиденциальности',
    footerTerms: 'Условия использования',
    footerAccessibility: 'Доступность',
    resourceComingSoon: 'Скоро',
    exploreSectionAria: 'Другие способы получить помощь',
    exploreResourcesTitle: 'Материалы',
    exploreResourcesDescription:
      'Короткие видео, презентации и руководства для работы с консультантом или самостоятельно.',
    exploreResourcesImageAlt: 'Материалы для карьерного обучения',
    exploreSupportTitle: 'Живая поддержка',
    exploreSupportDescription:
      'Найдите карьерные центры рядом, виртуальный коучинг и очную помощь.',
    exploreSupportImageAlt: 'Расположение карьерных центров',
    exploreCardCta: 'Открыть',
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
    liveSupportZipUnknown: 'لم نعثر على هذا الرمز البريدي. جرّب رمزًا أمريكيًا آخر أو اتصل بأحد المراكز.',
    liveSupportNearest: 'الأقرب إليك',
    liveSupportMilesAway: 'على بُعد %s ميل',
    backToChat: 'العودة إلى الدردشة',
    resourcesTitle: 'موارد مهنية',
    resourcesIntro: 'فيديوهات قصيرة وعروض شرائح وأدلة يمكنك استخدامها مع مدرب أو بمفردك.',
    siteSettings: 'إعدادات الموقع',
    mainMenu: 'القائمة الرئيسية',
    closeMenu: 'إغلاق القائمة',
    textSize: 'حجم النص',
    textSizeSmall: 'صغير',
    textSizeNormal: 'عادي',
    textSizeLarge: 'كبير',
    textSizeVeryLarge: 'كبير جدًا',
    language: 'اللغة',
    readAloud: 'قراءة بصوت عالٍ',
    readAloudUnavailable: 'القراءة بصوت عالٍ غير متاحة باللغة العربية.',
    heroTitle: 'مرحبًا، أنا مستشارك المهني في Goodwill',
    heroSubtitle:
      'أنا هنا لمساعدتك في العثور على وظائف، وبناء المهارات، وتحسين سيرتك الذاتية، واتخاذ الخطوة التالية في مسيرتك المهنية.',
    heroSubtitlePrompt: 'من أين نبدأ؟',
    heroPortraitAlt: 'مستشار مهني في Goodwill',
    quickActionsAria: 'إجراءات سريعة',
    conversationAria: 'محادثة مع المستشار المهني',
    messageLabel: 'رسالة إلى مستشارك المهني',
    voiceInputAria: 'إدخال صوتي',
    sendMessageAria: 'إرسال الرسالة',
    advisorThinkingAria: 'المستشار يفكر',
    advisorThinkingLabel: 'أفكر',
    placeholder: 'اكتب أو تحدث هنا…',
    confirmSearchAction: 'تأكيد البحث',
    confirmResumeAction: 'إنشاء السيرة الذاتية',
    searchConfirmRecoveryMessage:
      'لم يكتمل إعداد البحث. يمكنك محاولة التأكيد على أي حال أو السؤال مرة أخرى.',
    searchConfirmRecoveryRetry: 'حاول مرة أخرى',
    searchConfirmRecoveryManualConfirm: 'تأكيد البحث على أي حال',
    addFile: 'إضافة ملف',
    removeAttachment: 'إزالة المرفق',
    uploadingFile: 'جارٍ الرفع…',
    aiDisclaimer:
      'يستخدم مستشار Goodwill المهني الذكاء الاصطناعي وقد يخطئ. المعلومات والوظائف غير مُدقَّقة. لا تشارك معلومات خاصة وتحقق من المعلومات المهمة.',
    footerTagline: 'تساعد Goodwill الناس على بناء المهارات والعثور على وظائف وتطوير مساراتهم المهنية.',
    footerLearnMore: 'اعرف المزيد عن Goodwill',
    footerCopyright: '© 2024 Goodwill Industries International, Inc.',
    footerPrivacy: 'سياسة الخصوصية',
    footerTerms: 'شروط الاستخدام',
    footerAccessibility: 'إمكانية الوصول',
    resourceComingSoon: 'قريبًا',
    exploreSectionAria: 'طرق أخرى للحصول على المساعدة',
    exploreResourcesTitle: 'الموارد',
    exploreResourcesDescription:
      'فيديوهات قصيرة وعروض شرائح وأدلة يمكنك استخدامها مع مدرب أو بمفردك.',
    exploreResourcesImageAlt: 'موارد التعلم المهني',
    exploreSupportTitle: 'دعم مباشر',
    exploreSupportDescription:
      'اعثر على مراكز المهنة القريبة والتدريب الافتراضي والمساعدة الشخصية.',
    exploreSupportImageAlt: 'مواقع مراكز المهنة',
    exploreCardCta: 'استكشف',
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
