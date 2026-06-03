import type { SupportedLanguage } from './uiCopy'

export type QuickActionId =
  | 'explore_careers'
  | 'build_resume'
  | 'help_apply'
  | 'practice_interviews'
  | 'career_plan'
  | 'local_resources'

export const QUICK_ACTION_ORDER: QuickActionId[] = [
  'explore_careers',
  'build_resume',
  'help_apply',
  'practice_interviews',
  'career_plan',
  'local_resources',
]

type QuickActionCopy = {
  label: string
  ariaLabel: string
  starter: string
}

const quickActionCopy: Record<SupportedLanguage, Record<QuickActionId, QuickActionCopy>> = {
  en: {
    explore_careers: {
      label: 'Explore Careers',
      ariaLabel: 'Explore Careers — discover roles that may fit you',
      starter:
        'I would like help exploring careers that may fit me. Ask me about my interests, strengths, work history, education, and preferences. Suggest careers that might suit me and explain why—through conversation and coaching only unless I ask for a document.',
    },
    build_resume: {
      label: 'Build My Resume',
      ariaLabel: 'Build My Resume — get coaching on your resume or CV',
      starter:
        'I would like help with my resume. If I have not uploaded a resume, ask me to upload one or share my work history. Coach me with specific feedback section by section. Reply in conversation only unless I clearly ask you to write or rewrite my full resume.',
    },
    help_apply: {
      label: 'Help Me Apply',
      ariaLabel: 'Help Me Apply — guidance on job search and applications',
      starter:
        'I would like help applying for jobs. Ask which roles I am targeting and about my background. Guide me on search strategies, applications, follow-up, and preparing my materials—step by step through conversation.',
    },
    practice_interviews: {
      label: 'Interview Prep',
      ariaLabel: 'Interview Prep — prepare and practice for interviews',
      starter:
        'I would like to practice interviews. Ask what kind of role I am pursuing, then offer coaching, common questions, and practice one question at a time.',
    },
    career_plan: {
      label: 'Career Planning',
      ariaLabel: 'Career Planning — outline goals and next steps',
      starter:
        'I would like help creating a career plan. Ask about my goals, timeline, constraints, and current situation. Help me outline realistic steps and milestones through conversation.',
    },
    local_resources: {
      label: 'Local Resources',
      ariaLabel: 'Local Resources — career support near you',
      starter:
        'I would like help finding local career and workforce resources. Ask for my city, state, or ZIP code, then describe types of organizations, programs, and support that may be available near me.',
    },
  },
  es: {
    explore_careers: {
      label: 'Explorar carreras',
      ariaLabel: 'Explorar carreras — descubre profesiones que pueden encajar contigo',
      starter:
        'Me gustaría explorar carreras que puedan encajar conmigo. Pregúntame sobre mis intereses, fortalezas, historial laboral, estudios y preferencias. Sugiere profesiones que me convengan y explica por qué—solo mediante conversación y orientación, a menos que pida un documento.',
    },
    build_resume: {
      label: 'Armar mi CV',
      ariaLabel: 'Armar mi CV — recibe orientación sobre tu currículum',
      starter:
        'Me gustaría ayuda con mi currículum. Si no he subido uno, pídeme que lo suba o que comparta mi historial laboral. Oriéntame con comentarios específicos sección por sección. Responde solo en conversación, a menos que pida claramente que redactes o reescribas mi CV completo.',
    },
    help_apply: {
      label: 'Ayúdame a postularme',
      ariaLabel: 'Ayúdame a postularme — orientación para buscar trabajo y aplicar',
      starter:
        'Me gustaría ayuda para postularme a empleos. Pregunta a qué puestos apunto y sobre mi trayectoria. Guíame en estrategias de búsqueda, solicitudes, seguimiento y preparación de materiales—paso a paso en conversación.',
    },
    practice_interviews: {
      label: 'Prep. entrevistas',
      ariaLabel: 'Prep. entrevistas — prepararte y practicar para entrevistas',
      starter:
        'Me gustaría practicar entrevistas. Pregunta qué tipo de puesto busco y luego ofrece orientación, preguntas frecuentes y práctica de una pregunta a la vez.',
    },
    career_plan: {
      label: 'Planificación',
      ariaLabel: 'Planificación — definir metas y próximos pasos de carrera',
      starter:
        'Me gustaría ayuda para crear un plan de carrera. Pregunta sobre mis metas, plazos, limitaciones y situación actual. Ayúdame a definir pasos y hitos realistas mediante conversación.',
    },
    local_resources: {
      label: 'Recursos locales',
      ariaLabel: 'Recursos locales — apoyo profesional cerca de ti',
      starter:
        'Me gustaría encontrar recursos locales de empleo y desarrollo profesional. Pregunta por mi ciudad, estado o código postal y describe tipos de organizaciones, programas y apoyo que puedan estar disponibles cerca de mí.',
    },
  },
  it: {
    explore_careers: {
      label: 'Esplora carriere',
      ariaLabel: 'Esplora carriere — scopri professioni adatte a te',
      starter:
        'Vorrei esplorare carriere che possano adattarsi a me. Fammi domande su interessi, punti di forza, esperienza lavorativa, formazione e preferenze. Suggerisci professioni adatte e spiega perché—solo tramite conversazione e coaching, a meno che non chieda un documento.',
    },
    build_resume: {
      label: 'Crea il mio CV',
      ariaLabel: 'Crea il mio CV — ricevi coaching sul curriculum',
      starter:
        'Vorrei aiuto con il mio curriculum. Se non ne ho caricato uno, chiedimi di caricarlo o di descrivere la mia esperienza lavorativa. Guidami con feedback specifici sezione per sezione. Rispondi solo in conversazione, a meno che non chieda chiaramente di scrivere o riscrivere l’intero CV.',
    },
    help_apply: {
      label: 'Aiutami a candidarmi',
      ariaLabel: 'Aiutami a candidarmi — guida per cercare lavoro e candidarsi',
      starter:
        'Vorrei aiuto per candidarmi a lavoro. Chiedi a quali ruoli mi rivolgo e il mio background. Guidami su strategie di ricerca, candidature, follow-up e preparazione dei materiali—passo dopo passo in conversazione.',
    },
    practice_interviews: {
      label: 'Prep. colloqui',
      ariaLabel: 'Prep. colloqui — preparati e allenati per i colloqui',
      starter:
        'Vorrei esercitarmi ai colloqui. Chiedimi che tipo di ruolo sto cercando, poi offri coaching, domande comuni e pratica una domanda alla volta.',
    },
    career_plan: {
      label: 'Pianificazione',
      ariaLabel: 'Pianificazione — definisci obiettivi e passi di carriera',
      starter:
        'Vorrei aiuto per creare un piano di carriera. Chiedi obiettivi, tempistiche, vincoli e situazione attuale. Aiutami a definire passi e traguardi realistici tramite conversazione.',
    },
    local_resources: {
      label: 'Risorse locali',
      ariaLabel: 'Risorse locali — supporto professionale vicino a te',
      starter:
        'Vorrei trovare risorse locali per carriera e lavoro. Chiedimi città, stato o CAP, poi descrivi tipi di organizzazioni, programmi e supporto disponibili vicino a me.',
    },
  },
  ht: {
    explore_careers: {
      label: 'Eksplore karyè',
      ariaLabel: 'Eksplore karyè — dekouvri pwofesyon ki ka adapte avèk ou',
      starter:
        'Mwen ta renmen eksplore karyè ki ka adapte avèk mwen. Poze m kesyon sou enterè mwen, fòs mwen, istwa travay, edikasyon, ak preferans mwen. Sijere pwofesyon ki ka bon pou mwen epi eksplike poukisa—sèlman nan konvèsasyon ak coaching, sof si m mande yon dokiman.',
    },
    build_resume: {
      label: 'Konstwi rezime mwen',
      ariaLabel: 'Konstwi rezime mwen — jwenn coaching sou rezime ou',
      starter:
        'Mwen ta renmen èd ak rezime mwen. Si mwen pa telechaje yon rezime, mande m pou m telechaje youn oswa pataje istwa travay mwen. Gid m ak fidbak espesifik seksyon pa seksyon. Reponn sèlman nan konvèsasyon, sof si m mande klèman pou w ekri oswa reekri rezime konplè mwen.',
    },
    help_apply: {
      label: 'Ede m aplike',
      ariaLabel: 'Ede m aplike — gid pou chèche travay ak aplike',
      starter:
        'Mwen ta renmen èd pou aplike pou travay. Mande ki wòl m ap vize ak sou background mwen. Gid m sou estrateji rechèch, aplikasyon, swivi, ak preparasyon materyèl—etap pa etap nan konvèsasyon.',
    },
    practice_interviews: {
      label: 'Prep. entèvyou',
      ariaLabel: 'Prep. entèvyou — prepare epi pratike pou entèvyou',
      starter:
        'Mwen ta renmen pratike entèvyou. Mande ki kalite wòl m ap chèche, epi ofri coaching, kesyon komen, ak pratik yon kesyon nan yon moman.',
    },
    career_plan: {
      label: 'Planifikasyon',
      ariaLabel: 'Planifikasyon — defini objektif ak pwochen etap karyè',
      starter:
        'Mwen ta renmen èd pou kreye yon plan karyè. Mande sou objektif mwen, delè, limit, ak sitiyasyon aktyèl mwen. Ede m defini etap ak etap reyalis atravè konvèsasyon.',
    },
    local_resources: {
      label: 'Resous lokal',
      ariaLabel: 'Resous lokal — sipò karyè tou pre ou',
      starter:
        'Mwen ta renmen jwenn resous lokal pou karyè ak travay. Mande vil, eta, oswa kòd postal mwen, epi eksplike kalite òganizasyon, pwogram, ak sipò ki ka disponib tou pre m.',
    },
  },
  pl: {
    explore_careers: {
      label: 'Poznaj kariery',
      ariaLabel: 'Poznaj kariery — odkryj zawody, które mogą Ci pasować',
      starter:
        'Chciałbym/Chciałabym poznać kariery, które mogą do mnie pasować. Zadaj pytania o zainteresowania, mocne strony, doświadczenie, wykształcenie i preferencje. Zaproponuj zawody i wyjaśnij dlaczego—wyłącznie w rozmowie i coachingu, chyba że poproszę o dokument.',
    },
    build_resume: {
      label: 'Zbuduj moje CV',
      ariaLabel: 'Zbuduj moje CV — uzyskaj wskazówki dotyczące CV',
      starter:
        'Chciałbym/Chciałabym uzyskać pomoc z CV. Jeśli nie przesłałem/am CV, poproś o przesłanie lub opisanie doświadczenia zawodowego. Poprowadź mnie z konkretnymi uwagami sekcja po sekcji. Odpowiadaj tylko w rozmowie, chyba że wyraźnie poproszę o napisanie lub przepisanie całego CV.',
    },
    help_apply: {
      label: 'Pomóż mi aplikować',
      ariaLabel: 'Pomóż mi aplikować — wskazówki dotyczące poszukiwania pracy i aplikacji',
      starter:
        'Chciałbym/Chciałabym uzyskać pomoc w aplikowaniu o pracę. Zapytaj, na jakie stanowiska celuję i o moje doświadczenie. Poprowadź mnie przez strategie poszukiwania, aplikacje, follow-up i przygotowanie materiałów—krok po kroku w rozmowie.',
    },
    practice_interviews: {
      label: 'Prep. rozmów',
      ariaLabel: 'Prep. rozmów — przygotuj się do rozmów kwalifikacyjnych',
      starter:
        'Chciałbym/Chciałabym przećwiczyć rozmowy kwalifikacyjne. Zapytaj, jakiego rodzaju pracy szukam, a następnie zaproponuj coaching, typowe pytania i ćwiczenia po jednym pytaniu.',
    },
    career_plan: {
      label: 'Planowanie kariery',
      ariaLabel: 'Planowanie kariery — określ cele i kolejne kroki',
      starter:
        'Chciałbym/Chciałabym stworzyć plan kariery. Zapytaj o cele, harmonogram, ograniczenia i obecną sytuację. Pomóż mi określić realistyczne kroki i kamienie milowe w rozmowie.',
    },
    local_resources: {
      label: 'Zasoby lokalne',
      ariaLabel: 'Zasoby lokalne — wsparcie zawodowe w pobliżu',
      starter:
        'Chciałbym/Chciałabym znaleźć lokalne zasoby zawodowe i rynku pracy. Zapytaj o miasto, województwo lub kod pocztowy, a następnie opisz rodzaje organizacji, programów i wsparcia dostępnych w pobliżu.',
    },
  },
  ru: {
    explore_careers: {
      label: 'Изучить карьеры',
      ariaLabel: 'Изучить карьеры — найти подходящие профессии',
      starter:
        'Мне нужна помощь в изучении подходящих карьер. Задайте вопросы о моих интересах, сильных сторонах, опыте работы, образовании и предпочтениях. Предложите профессии и объясните почему—только в формате беседы и коучинга, если я не попрошу документ.',
    },
    build_resume: {
      label: 'Собрать резюме',
      ariaLabel: 'Собрать резюме — коучинг по резюме',
      starter:
        'Мне нужна помощь с резюме. Если я не загрузил(а) резюме, попросите загрузить его или описать опыт работы. Давайте обратную связь по разделам. Отвечайте только в беседе, пока я явно не попрошу написать или переписать полное резюме.',
    },
    help_apply: {
      label: 'Помочь с откликами',
      ariaLabel: 'Помочь с откликами — поиск работы и подача заявок',
      starter:
        'Мне нужна помощь с подачей заявок на работу. Спросите, на какие роли я ориентируюсь и о моём опыте. Помогите со стратегией поиска, заявками, follow-up и подготовкой материалов—шаг за шагом в беседе.',
    },
    practice_interviews: {
      label: 'Подготовка к интервью',
      ariaLabel: 'Подготовка к интервью — подготовка и тренировка',
      starter:
        'Я хочу потренироваться на собеседованиях. Спросите, какую работу я ищу, затем предложите коучинг, типичные вопросы и практику по одному вопросу за раз.',
    },
    career_plan: {
      label: 'Планирование карьеры',
      ariaLabel: 'Планирование карьеры — цели и следующие шаги',
      starter:
        'Мне нужна помощь в составлении карьерного плана. Спросите о целях, сроках, ограничениях и текущей ситуации. Помогите наметить реалистичные шаги и этапы в формате беседы.',
    },
    local_resources: {
      label: 'Местные ресурсы',
      ariaLabel: 'Местные ресурсы — поддержка рядом с вами',
      starter:
        'Мне нужна помощь в поиске местных карьерных и трудовых ресурсов. Спросите город, штат или почтовый индекс, затем опишите типы организаций, программ и поддержки, доступных поблизости.',
    },
  },
  ar: {
    explore_careers: {
      label: 'استكشف المسارات',
      ariaLabel: 'استكشف المسارات — اكتشف مهنًا قد تناسبك',
      starter:
        'أود المساعدة في استكشاف مسارات مهنية قد تناسبني. اطرح أسئلة عن اهتماماتي ونقاط قوتي وتاريخي الوظيفي وتعليمي وتفضيلاتي. اقترح مهنًا مناسبة واشرح السبب—عبر المحادثة والتوجيه فقط ما لم أطلب مستندًا.',
    },
    build_resume: {
      label: 'بناء سيرتي',
      ariaLabel: 'بناء سيرتي — توجيه حول السيرة الذاتية',
      starter:
        'أود المساعدة في سيرتي الذاتية. إذا لم أرفع سيرة، اطلب مني رفعها أو مشاركة تاريخي الوظيفي. وجّهني بملاحظات محددة قسمًا بقسم. أجب في المحادثة فقط ما لم أطلب صراحة كتابة أو إعادة كتابة سيرتي كاملة.',
    },
    help_apply: {
      label: 'ساعدني في التقديم',
      ariaLabel: 'ساعدني في التقديم — إرشاد للبحث عن عمل والتقديم',
      starter:
        'أود المساعدة في التقديم على الوظائف. اسأل عن الأدوار التي أستهدفها وعن خلفيتي. وجّهني في استراتيجيات البحث والطلبات والمتابعة وإعداد المواد—خطوة بخطوة عبر المحادثة.',
    },
    practice_interviews: {
      label: 'تحضير المقابلة',
      ariaLabel: 'تحضير المقابلة — الاستعداد والتمرين',
      starter:
        'أود التدرب على المقابلات. اسأل عن نوع الدور الذي أسعى إليه، ثم قدّم توجيهًا وأسئلة شائعة وتمرينًا سؤالًا واحدًا في كل مرة.',
    },
    career_plan: {
      label: 'التخطيط المهني',
      ariaLabel: 'التخطيط المهني — تحديد الأهداف والخطوات التالية',
      starter:
        'أود المساعدة في وضع خطة مهنية. اسأل عن أهدافي والجدول الزمني والقيود ووضعي الحالي. ساعدني على تحديد خطوات ومعالم واقعية عبر المحادثة.',
    },
    local_resources: {
      label: 'موارد محلية',
      ariaLabel: 'موارد محلية — دعم مهني قريب منك',
      starter:
        'أود المساعدة في إيجاد موارد مهنية وعمل محلية. اسأل عن مدينتي أو ولايتي أو الرمز البريدي، ثم صف أنواع المنظمات والبرامج والدعم المتاحة قريبًا مني.',
    },
  },
}

export function getQuickActionCopy(language: SupportedLanguage, id: QuickActionId): QuickActionCopy {
  return quickActionCopy[language]?.[id] ?? quickActionCopy.en[id]
}

export function listQuickActions(language: SupportedLanguage): Array<QuickActionCopy & { id: QuickActionId }> {
  return QUICK_ACTION_ORDER.map((id) => ({ id, ...getQuickActionCopy(language, id) }))
}

export function isQuickActionId(value: unknown): value is QuickActionId {
  return typeof value === 'string' && (QUICK_ACTION_ORDER as string[]).includes(value)
}
