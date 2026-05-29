import type { SupportedLanguage } from './uiCopy'

export type QuickActionId =
  | 'find_jobs'
  | 'career_options'
  | 'resume_review'
  | 'interview_prep'
  | 'build_skills'
  | 'local_resources'

export const QUICK_ACTION_ORDER: QuickActionId[] = [
  'find_jobs',
  'career_options',
  'resume_review',
  'interview_prep',
  'build_skills',
  'local_resources',
]

type QuickActionCopy = {
  label: string
  ariaLabel: string
  starter: string
}

const quickActionCopy: Record<SupportedLanguage, Record<QuickActionId, QuickActionCopy>> = {
  en: {
    find_jobs: {
      label: 'Find Jobs',
      ariaLabel: 'Find Jobs — get help searching for work',
      starter:
        'I would like help finding a job. Please start by learning about my background, interests, experience, and goals so you can recommend appropriate career paths and next steps.',
    },
    career_options: {
      label: 'Career Options',
      ariaLabel: 'Career Options — explore careers that may fit you',
      starter:
        'I would like help exploring career options. Ask me questions about my interests, strengths, work history, education, and preferences so you can suggest careers that may fit me.',
    },
    resume_review: {
      label: 'Resume Review',
      ariaLabel: 'Resume Review — improve your resume or CV',
      starter:
        'I would like help with my resume. If I have not uploaded a resume, ask me to upload one or provide my experience. Then help me improve it and position myself for relevant jobs.',
    },
    interview_prep: {
      label: 'Interview Prep',
      ariaLabel: 'Interview Prep — practice and prepare for interviews',
      starter:
        'I would like help preparing for interviews. Ask what type of job I am pursuing and then provide coaching, common interview questions, and practice opportunities.',
    },
    build_skills: {
      label: 'Build Skills',
      ariaLabel: 'Build Skills — identify skills and training to grow',
      starter:
        'I would like help identifying skills that would improve my career opportunities. Ask about my goals and current experience, then recommend practical skills, certifications, or training paths.',
    },
    local_resources: {
      label: 'Local Resources',
      ariaLabel: 'Local Resources — find career support near you',
      starter:
        'I would like help identifying local career and workforce resources. Ask for my city, state, or ZIP code, then explain what types of organizations, programs, and support services may be available to help me.',
    },
  },
  es: {
    find_jobs: {
      label: 'Buscar empleo',
      ariaLabel: 'Buscar empleo — obtener ayuda para encontrar trabajo',
      starter:
        'Me gustaría recibir ayuda para encontrar trabajo. Empieza conociendo mi formación, intereses, experiencia y metas para que puedas recomendarme trayectorias profesionales y próximos pasos adecuados.',
    },
    career_options: {
      label: 'Opciones de carrera',
      ariaLabel: 'Opciones de carrera — explorar profesiones que encajen contigo',
      starter:
        'Me gustaría explorar opciones de carrera. Hazme preguntas sobre mis intereses, fortalezas, historial laboral, estudios y preferencias para sugerirme profesiones que puedan encajar conmigo.',
    },
    resume_review: {
      label: 'Revisión de CV',
      ariaLabel: 'Revisión de CV — mejorar tu currículum',
      starter:
        'Me gustaría ayuda con mi currículum. Si no he subido uno, pídeme que lo suba o que comparta mi experiencia. Luego ayúdame a mejorarlo y posicionarme para empleos relevantes.',
    },
    interview_prep: {
      label: 'Preparación para entrevistas',
      ariaLabel: 'Preparación para entrevistas — practicar y prepararte',
      starter:
        'Me gustaría prepararme para entrevistas. Pregunta qué tipo de empleo busco y luego ofréceme orientación, preguntas frecuentes y oportunidades de práctica.',
    },
    build_skills: {
      label: 'Desarrollar habilidades',
      ariaLabel: 'Desarrollar habilidades — identificar formación para crecer',
      starter:
        'Me gustaría identificar habilidades que mejoren mis oportunidades profesionales. Pregunta por mis metas y experiencia actual, y recomiéndame habilidades prácticas, certificaciones o rutas de formación.',
    },
    local_resources: {
      label: 'Recursos locales',
      ariaLabel: 'Recursos locales — encontrar apoyo profesional cerca de ti',
      starter:
        'Me gustaría identificar recursos locales de empleo y desarrollo profesional. Pregunta por mi ciudad, estado o código postal y explica qué organizaciones, programas y servicios de apoyo pueden estar disponibles para ayudarme.',
    },
  },
  it: {
    find_jobs: {
      label: 'Cerca lavoro',
      ariaLabel: 'Cerca lavoro — ricevi aiuto per trovare un impiego',
      starter:
        'Vorrei aiuto per trovare lavoro. Inizia conoscendo il mio background, i miei interessi, la mia esperienza e i miei obiettivi, così potrai consigliarmi percorsi di carriera e prossimi passi appropriati.',
    },
    career_options: {
      label: 'Opzioni di carriera',
      ariaLabel: 'Opzioni di carriera — esplora professioni adatte a te',
      starter:
        'Vorrei esplorare opzioni di carriera. Fammi domande su interessi, punti di forza, esperienza lavorativa, formazione e preferenze, così potrai suggerirmi professioni adatte a me.',
    },
    resume_review: {
      label: 'Revisione CV',
      ariaLabel: 'Revisione CV — migliora il tuo curriculum',
      starter:
        'Vorrei aiuto con il mio curriculum. Se non ne ho caricato uno, chiedimi di caricarlo o di descrivere la mia esperienza. Poi aiutami a migliorarlo e a posizionarmi per le offerte di lavoro pertinenti.',
    },
    interview_prep: {
      label: 'Preparazione colloquio',
      ariaLabel: 'Preparazione colloquio — esercitati e preparati',
      starter:
        'Vorrei prepararmi ai colloqui. Chiedimi che tipo di lavoro sto cercando e poi offrimi coaching, domande comuni e opportunità di pratica.',
    },
    build_skills: {
      label: 'Sviluppa competenze',
      ariaLabel: 'Sviluppa competenze — individua formazione per crescere',
      starter:
        'Vorrei individuare competenze che possano migliorare le mie opportunità di carriera. Chiedimi obiettivi ed esperienza attuale, poi consigliami competenze pratiche, certificazioni o percorsi formativi.',
    },
    local_resources: {
      label: 'Risorse locali',
      ariaLabel: 'Risorse locali — trova supporto professionale vicino a te',
      starter:
        'Vorrei individuare risorse locali per la carriera e il lavoro. Chiedimi città, stato o CAP, poi spiegami quali organizzazioni, programmi e servizi di supporto potrebbero essere disponibili per aiutarmi.',
    },
  },
  ht: {
    find_jobs: {
      label: 'Jwenn travay',
      ariaLabel: 'Jwenn travay — jwenn èd pou chèche travay',
      starter:
        'Mwen ta renmen jwenn èd pou jwenn travay. Kòmanse pa aprann sou background mwen, enterè mwen, eksperyans mwen, ak objektif mwen pou ou ka rekòmande chemen karyè ak pwochen etap ki apwopriye.',
    },
    career_options: {
      label: 'Opsyon karyè',
      ariaLabel: 'Opsyon karyè — eksplore pwofesyon ki ka adapte avèk ou',
      starter:
        'Mwen ta renmen eksplore opsyon karyè. Poze m kesyon sou enterè mwen, fòs mwen, istwa travay mwen, edikasyon mwen, ak preferans mwen pou ou ka sijere pwofesyon ki ka adapte avèk mwen.',
    },
    resume_review: {
      label: 'Revizyon rezime',
      ariaLabel: 'Revizyon rezime — amelyore CV ou',
      starter:
        'Mwen ta renmen èd ak rezime mwen. Si mwen pa telechaje yon rezime, mande m pou m telechaje youn oswa bay eksperyans mwen. Apre sa, ede m amelyore li epi pozisyone tèt mwen pou travay ki enpòtan.',
    },
    interview_prep: {
      label: 'Prep entèvyou',
      ariaLabel: 'Prep entèvyou — pratike epi prepare pou entèvyou',
      starter:
        'Mwen ta renmen prepare pou entèvyou. Mande ki kalite travay m ap chèche, epi bay m coaching, kesyon komen, ak opòtinite pratik.',
    },
    build_skills: {
      label: 'Devlope konpetans',
      ariaLabel: 'Devlope konpetans — idantifye fòmasyon pou grandi',
      starter:
        'Mwen ta renmen idantifye konpetans ki ta amelyore opòtinite karyè mwen. Mande sou objektif mwen ak eksperyans aktyèl mwen, epi rekòmande konpetans pratik, sètifikasyon, oswa chemen fòmasyon.',
    },
    local_resources: {
      label: 'Resous lokal',
      ariaLabel: 'Resous lokal — jwenn sipò karyè tou pre ou',
      starter:
        'Mwen ta renmen idantifye resous lokal pou karyè ak travay. Mande vil, eta, oswa kòd postal mwen, epi eksplike ki kalite òganizasyon, pwogram, ak sèvis sipò ki ka disponib pou ede m.',
    },
  },
  pl: {
    find_jobs: {
      label: 'Znajdź pracę',
      ariaLabel: 'Znajdź pracę — uzyskaj pomoc w poszukiwaniu pracy',
      starter:
        'Chciałbym/Chciałabym uzyskać pomoc w znalezieniu pracy. Zacznij od poznania mojego doświadczenia, zainteresowań, historii zawodowej i celów, aby móc polecić odpowiednie ścieżki kariery i kolejne kroki.',
    },
    career_options: {
      label: 'Opcje kariery',
      ariaLabel: 'Opcje kariery — poznaj zawody, które do Ciebie pasują',
      starter:
        'Chciałbym/Chciałabym poznać opcje kariery. Zadaj mi pytania o zainteresowania, mocne strony, doświadczenie zawodowe, wykształcenie i preferencje, aby zaproponować zawody, które mogą do mnie pasować.',
    },
    resume_review: {
      label: 'Przegląd CV',
      ariaLabel: 'Przegląd CV — ulepsz swoje CV',
      starter:
        'Chciałbym/Chciałabym uzyskać pomoc z CV. Jeśli nie przesłałem/am CV, poproś o jego przesłanie lub opisanie doświadczenia. Następnie pomóż mi je ulepszyć i lepiej przygotować do odpowiednich ofert pracy.',
    },
    interview_prep: {
      label: 'Przygotowanie do rozmowy',
      ariaLabel: 'Przygotowanie do rozmowy — ćwicz i przygotuj się',
      starter:
        'Chciałbym/Chciałabym przygotować się do rozmów kwalifikacyjnych. Zapytaj, jakiego rodzaju pracy szukam, a następnie zaproponuj coaching, typowe pytania i możliwości ćwiczeń.',
    },
    build_skills: {
      label: 'Rozwijaj umiejętności',
      ariaLabel: 'Rozwijaj umiejętności — wskaż szkolenia, które pomogą Ci rosnąć',
      starter:
        'Chciałbym/Chciałabym określić umiejętności, które poprawią moje szanse zawodowe. Zapytaj o cele i obecne doświadczenie, a następnie poleć praktyczne umiejętności, certyfikaty lub ścieżki szkoleniowe.',
    },
    local_resources: {
      label: 'Zasoby lokalne',
      ariaLabel: 'Zasoby lokalne — znajdź wsparcie zawodowe w pobliżu',
      starter:
        'Chciałbym/Chciałabym znaleźć lokalne zasoby zawodowe i rynku pracy. Zapytaj o moje miasto, województwo lub kod pocztowy, a następnie wyjaśnij, jakie organizacje, programy i usługi wsparcia mogą być dostępne.',
    },
  },
  ru: {
    find_jobs: {
      label: 'Поиск работы',
      ariaLabel: 'Поиск работы — помощь в поиске работы',
      starter:
        'Мне нужна помощь в поиске работы. Начните с того, чтобы узнать о моём опыте, интересах, образовании и целях, чтобы порекомендовать подходящие карьерные пути и следующие шаги.',
    },
    career_options: {
      label: 'Варианты карьеры',
      ariaLabel: 'Варианты карьеры — изучите подходящие профессии',
      starter:
        'Мне нужна помощь в изучении карьерных вариантов. Задайте вопросы о моих интересах, сильных сторонах, опыте работы, образовании и предпочтениях, чтобы предложить подходящие профессии.',
    },
    resume_review: {
      label: 'Проверка резюме',
      ariaLabel: 'Проверка резюме — улучшите своё резюме',
      starter:
        'Мне нужна помощь с резюме. Если я не загрузил(а) резюме, попросите меня загрузить его или описать опыт. Затем помогите улучшить его и подготовиться к подходящим вакансиям.',
    },
    interview_prep: {
      label: 'Подготовка к интервью',
      ariaLabel: 'Подготовка к интервью — практика и подготовка',
      starter:
        'Мне нужна помощь в подготовке к собеседованиям. Спросите, какую работу я ищу, а затем предложите коучинг, типичные вопросы и возможности для практики.',
    },
    build_skills: {
      label: 'Развитие навыков',
      ariaLabel: 'Развитие навыков — определите обучение для роста',
      starter:
        'Мне нужна помощь в определении навыков, которые улучшат мои карьерные возможности. Спросите о моих целях и текущем опыте, затем порекомендуйте практические навыки, сертификаты или программы обучения.',
    },
    local_resources: {
      label: 'Местные ресурсы',
      ariaLabel: 'Местные ресурсы — найдите поддержку рядом с вами',
      starter:
        'Мне нужна помощь в поиске местных карьерных и трудовых ресурсов. Спросите мой город, штат или почтовый индекс, затем объясните, какие организации, программы и службы поддержки могут быть доступны.',
    },
  },
  ar: {
    find_jobs: {
      label: 'البحث عن وظيفة',
      ariaLabel: 'البحث عن وظيفة — احصل على مساعدة في إيجاد عمل',
      starter:
        'أود المساعدة في إيجاد وظيفة. يُرجى البدء بالتعرّف على خلفيتي واهتماماتي وخبرتي وأهدافي حتى تتمكن من اقتراح مسارات مهنية وخطوات تالية مناسبة.',
    },
    career_options: {
      label: 'خيارات مهنية',
      ariaLabel: 'خيارات مهنية — استكشف مهنًا قد تناسبك',
      starter:
        'أود المساعدة في استكشاف الخيارات المهنية. اطرح عليّ أسئلة عن اهتماماتي ونقاط قوتي وتاريخي الوظيفي وتعليمي وتفضيلاتي حتى تقترح مهنًا قد تناسبني.',
    },
    resume_review: {
      label: 'مراجعة السيرة',
      ariaLabel: 'مراجعة السيرة — حسّن سيرتك الذاتية',
      starter:
        'أود المساعدة في سيرتي الذاتية. إذا لم أرفع سيرة ذاتية، اطلب مني رفعها أو تزويدك بخبرتي. ثم ساعدني على تحسينها وتقديم نفسي للوظائف المناسبة.',
    },
    interview_prep: {
      label: 'تحضير المقابلة',
      ariaLabel: 'تحضير المقابلة — تدرّب واستعد للمقابلات',
      starter:
        'أود المساعدة في التحضير للمقابلات. اسأل عن نوع الوظيفة التي أبحث عنها، ثم قدّم لي توجيهًا وأسئلة شائعة وفرصًا للتدريب.',
    },
    build_skills: {
      label: 'بناء المهارات',
      ariaLabel: 'بناء المهارات — حدّد التدريب المناسب للنمو',
      starter:
        'أود المساعدة في تحديد المهارات التي تعزز فرصي المهنية. اسأل عن أهدافي وخبرتي الحالية، ثم اقترح مهارات عملية أو شهادات أو مسارات تدريب.',
    },
    local_resources: {
      label: 'موارد محلية',
      ariaLabel: 'موارد محلية — اعثر على دعم مهني قريب منك',
      starter:
        'أود المساعدة في تحديد الموارد المهنية والعمل المحلية. اسأل عن مدينتي أو ولايتي أو الرمز البريدي، ثم اشرح أنواع المنظمات والبرامج وخدمات الدعم المتاحة.',
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
