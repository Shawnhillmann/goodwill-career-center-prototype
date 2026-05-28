/** Keyword-based dummy responses for the prototype (no API). */
import type { SupportedLanguage } from './uiCopy'

type AdvisorReply = {
  rawEnglish: string
  displayText: string
}

function translateStaticEnglish(text: string, language: SupportedLanguage): string {
  if (language === 'en') return text

  const map: Record<SupportedLanguage, Record<string, string>> = {
    en: {},
    es: {
      'Got it — we’ll look for roles that match that schedule. Is there a certain field you’re curious about, like retail, office work, or something else?':
        'Entendido: buscaremos puestos que se ajusten a ese horario. ¿Hay algún campo que te interese, como ventas al por menor, trabajo de oficina u otra cosa?',
      'Thanks — that helps me understand your direction. You can share more about pay, hours, or training goals whenever you’re ready.':
        'Gracias, eso me ayuda a entender tu dirección. Cuando quieras, puedes compartir más sobre salario, horario u objetivos de capacitación.',
      'Perfect. Let’s start with a common question for that kind of role: what is one strength you’d want a manager to remember about you?':
        'Perfecto. Empecemos con una pregunta común para ese tipo de puesto: ¿cuál es una fortaleza que te gustaría que un gerente recuerde de ti?',
      'Great — start with whichever feels strongest for you, and we’ll shape it into clear resume language step by step.':
        'Genial: empieza por lo que se sienta más fuerte para ti y lo convertiremos en lenguaje claro para tu currículum paso a paso.',
      'Those are strengths employers notice. Pick one to turn into a short achievement sentence when you’re ready.':
        'Son fortalezas que los empleadores notan. Elige una para convertirla en una frase breve de logro cuando estés listo/a.',
      'I can help you build or improve your resume. To start, tell me about your most recent job, volunteer work, or skills you want employers to notice.':
        'Puedo ayudarte a crear o mejorar tu currículum. Para empezar, cuéntame sobre tu trabajo más reciente, voluntariado o habilidades que quieres que los empleadores noten.',
      'I can help you find job options that fit your goals. What kind of work are you interested in, and do you prefer full-time, part-time, or flexible hours?':
        'Puedo ayudarte a encontrar opciones de trabajo que se ajusten a tus metas. ¿Qué tipo de trabajo te interesa y prefieres tiempo completo, medio tiempo o horario flexible?',
      'Great — we can practice together. Tell me what kind of job you’re interviewing for, and I’ll ask you a few common interview questions.':
        'Genial: podemos practicar juntos. Dime para qué tipo de trabajo estás entrevistando y te haré algunas preguntas comunes.',
      'Let’s explore your strengths. Think about tasks people often ask you for help with, jobs you’ve done before, or things you enjoy doing.':
        'Exploremos tus fortalezas. Piensa en tareas con las que la gente suele pedirte ayuda, trabajos que has hecho antes o cosas que disfrutas.',
      'I can help with that. We can work on finding a job, improving your resume, practicing for interviews, or exploring your strengths. What would you like to do first?':
        'Puedo ayudarte con eso. Podemos trabajar en encontrar un empleo, mejorar tu currículum, practicar entrevistas o explorar tus fortalezas. ¿Qué te gustaría hacer primero?',
    },
    ht: {
      'Got it — we’ll look for roles that match that schedule. Is there a certain field you’re curious about, like retail, office work, or something else?':
        'Dakò — n ap chèche wòl ki mache ak orè sa a. Èske gen yon domèn ou enterese, tankou detay, travay biwo, oswa yon lòt bagay?',
      'Thanks — that helps me understand your direction. You can share more about pay, hours, or training goals whenever you’re ready.':
        'Mèsi — sa ede m konprann direksyon ou. Ou ka pataje plis sou salè, lè travay, oswa objektif fòmasyon lè ou pare.',
      'Perfect. Let’s start with a common question for that kind of role: what is one strength you’d want a manager to remember about you?':
        'Trè byen. Ann kòmanse ak yon kesyon komen: ki yon fòs ou ta vle yon manadjè sonje sou ou?',
      'Great — start with whichever feels strongest for you, and we’ll shape it into clear resume language step by step.':
        'Trè byen — kòmanse ak sa ki pi fò pou ou, epi n ap mete l nan mo klè pou rezime ou etap pa etap.',
      'Those are strengths employers notice. Pick one to turn into a short achievement sentence when you’re ready.':
        'Se fòs anplwayè yo remake. Chwazi youn pou fè yon fraz kout sou yon reyalizasyon lè ou pare.',
      'I can help you build or improve your resume. To start, tell me about your most recent job, volunteer work, or skills you want employers to notice.':
        'Mwen ka ede ou bati oswa amelyore rezime ou. Pou kòmanse, pale m de dènye travay ou, volontarya, oswa konpetans ou vle anplwayè yo remake.',
      'I can help you find job options that fit your goals. What kind of work are you interested in, and do you prefer full-time, part-time, or flexible hours?':
        'Mwen ka ede ou jwenn opsyon travay ki mache ak objektif ou. Ki kalite travay ou enterese, epi ou pito plen tan, a tan pasyèl, oswa lè fleksib?',
      'Great — we can practice together. Tell me what kind of job you’re interviewing for, and I’ll ask you a few common interview questions.':
        'Trè byen — nou ka pratike ansanm. Di m ki kalite travay ou gen entèvyou pou li, epi m ap poze kèk kesyon komen.',
      'Let’s explore your strengths. Think about tasks people often ask you for help with, jobs you’ve done before, or things you enjoy doing.':
        'Ann eksplore fòs ou. Panse a bagay moun souvan mande ou èd pou yo, travay ou te fè deja, oswa bagay ou renmen fè.',
      'I can help with that. We can work on finding a job, improving your resume, practicing for interviews, or exploring your strengths. What would you like to do first?':
        'Mwen ka ede ak sa. Nou ka travay sou jwenn yon travay, amelyore rezime ou, pratike entèvyou, oswa eksplore fòs ou. Kisa ou vle fè an premye?',
    },
    pl: {
      'Got it — we’ll look for roles that match that schedule. Is there a certain field you’re curious about, like retail, office work, or something else?':
        'Rozumiem — poszukamy ról pasujących do takiego grafiku. Czy interesuje Cię konkretny obszar, np. handel, praca biurowa lub coś innego?',
      'Thanks — that helps me understand your direction. You can share more about pay, hours, or training goals whenever you’re ready.':
        'Dziękuję — to pomaga mi zrozumieć kierunek. Kiedy będziesz gotowy/a, możesz powiedzieć więcej o wynagrodzeniu, godzinach lub celach szkoleniowych.',
      'Perfect. Let’s start with a common question for that kind of role: what is one strength you’d want a manager to remember about you?':
        'Świetnie. Zacznijmy od typowego pytania: jaka jest jedna cecha/umiejętność, którą chciał(a)byś, aby przełożony zapamiętał o Tobie?',
      'Great — start with whichever feels strongest for you, and we’ll shape it into clear resume language step by step.':
        'Super — zacznij od tego, co jest dla Ciebie najsilniejsze, a my krok po kroku ubierzemy to w jasny język CV.',
      'Those are strengths employers notice. Pick one to turn into a short achievement sentence when you’re ready.':
        'To są mocne strony, które zauważają pracodawcy. Wybierz jedną, a zamienimy ją w krótkie zdanie o osiągnięciu.',
      'I can help you build or improve your resume. To start, tell me about your most recent job, volunteer work, or skills you want employers to notice.':
        'Mogę pomóc Ci stworzyć lub poprawić CV. Na początek opowiedz o swojej ostatniej pracy, wolontariacie lub umiejętnościach, które chcesz wyróżnić.',
      'I can help you find job options that fit your goals. What kind of work are you interested in, and do you prefer full-time, part-time, or flexible hours?':
        'Mogę pomóc znaleźć oferty pasujące do Twoich celów. Jaką pracą jesteś zainteresowany/a i czy wolisz pełny etat, część etatu czy elastyczne godziny?',
      'Great — we can practice together. Tell me what kind of job you’re interviewing for, and I’ll ask you a few common interview questions.':
        'Świetnie — możemy poćwiczyć razem. Powiedz, o jaką pracę się ubiegasz, a zadam kilka typowych pytań rekrutacyjnych.',
      'Let’s explore your strengths. Think about tasks people often ask you for help with, jobs you’ve done before, or things you enjoy doing.':
        'Przyjrzyjmy się Twoim mocnym stronom. Pomyśl o zadaniach, w których inni proszą Cię o pomoc, o pracy, którą wykonywałeś/aś, lub o tym, co lubisz robić.',
      'I can help with that. We can work on finding a job, improving your resume, practicing for interviews, or exploring your strengths. What would you like to do first?':
        'Mogę w tym pomóc. Możemy popracować nad znalezieniem pracy, poprawą CV, ćwiczeniem rozmów lub poznaniem Twoich mocnych stron. Od czego chcesz zacząć?',
    },
    ru: {
      'Got it — we’ll look for roles that match that schedule. Is there a certain field you’re curious about, like retail, office work, or something else?':
        'Понял(а) — подберём варианты под такой график. Есть ли сфера, которая вам интересна: розница, офисная работа или что‑то другое?',
      'Thanks — that helps me understand your direction. You can share more about pay, hours, or training goals whenever you’re ready.':
        'Спасибо — это помогает понять направление. Когда будете готовы, расскажите о зарплате, графике или целях обучения.',
      'Perfect. Let’s start with a common question for that kind of role: what is one strength you’d want a manager to remember about you?':
        'Отлично. Начнём с типичного вопроса: какую одну сильную сторону вы бы хотели, чтобы руководитель запомнил о вас?',
      'Great — start with whichever feels strongest for you, and we’ll shape it into clear resume language step by step.':
        'Отлично — начните с самого сильного, и мы шаг за шагом оформим это в понятные формулировки для резюме.',
      'Those are strengths employers notice. Pick one to turn into a short achievement sentence when you’re ready.':
        'Это сильные стороны, которые замечают работодатели. Выберите одну — и мы превратим её в короткое предложение об достижении.',
      'I can help you build or improve your resume. To start, tell me about your most recent job, volunteer work, or skills you want employers to notice.':
        'Я помогу составить или улучшить резюме. Для начала расскажите о вашей последней работе, волонтёрстве или навыках, которые хотите подчеркнуть.',
      'I can help you find job options that fit your goals. What kind of work are you interested in, and do you prefer full-time, part-time, or flexible hours?':
        'Я помогу найти варианты работы под ваши цели. Какая работа вам интересна и какой график вы предпочитаете: полный день, неполный или гибкий?',
      'Great — we can practice together. Tell me what kind of job you’re interviewing for, and I’ll ask you a few common interview questions.':
        'Отлично — можем потренироваться вместе. Скажите, на какую должность вы проходите собеседование, и я задам несколько типичных вопросов.',
      'Let’s explore your strengths. Think about tasks people often ask you for help with, jobs you’ve done before, or things you enjoy doing.':
        'Давайте изучим ваши сильные стороны. Подумайте о задачах, с которыми к вам часто обращаются, о прошлых работах или о том, что вам нравится делать.',
      'I can help with that. We can work on finding a job, improving your resume, practicing for interviews, or exploring your strengths. What would you like to do first?':
        'Я могу помочь. Мы можем заняться поиском работы, улучшением резюме, тренировкой собеседований или анализом сильных сторон. С чего начнём?',
    },
    ar: {
      'Got it — we’ll look for roles that match that schedule. Is there a certain field you’re curious about, like retail, office work, or something else?':
        'حسنًا — سنبحث عن وظائف تناسب هذا الجدول. هل لديك مجال يهمك مثل البيع بالتجزئة أو العمل المكتبي أو غير ذلك؟',
      'Thanks — that helps me understand your direction. You can share more about pay, hours, or training goals whenever you’re ready.':
        'شكرًا — هذا يساعدني على فهم اتجاهك. يمكنك مشاركة المزيد عن الأجر أو الساعات أو أهداف التدريب عندما تكون جاهزًا.',
      'Perfect. Let’s start with a common question for that kind of role: what is one strength you’d want a manager to remember about you?':
        'ممتاز. لنبدأ بسؤال شائع لهذا النوع من الوظائف: ما هي نقطة قوة واحدة تريد أن يتذكرها المدير عنك؟',
      'Great — start with whichever feels strongest for you, and we’ll shape it into clear resume language step by step.':
        'رائع — ابدأ بما تشعر أنه الأقوى لديك، وسنحوّله إلى صياغة واضحة للسيرة الذاتية خطوة بخطوة.',
      'Those are strengths employers notice. Pick one to turn into a short achievement sentence when you’re ready.':
        'هذه نقاط قوة يلاحظها أصحاب العمل. اختر واحدة لتحويلها إلى جملة إنجاز قصيرة عندما تكون جاهزًا.',
      'I can help you build or improve your resume. To start, tell me about your most recent job, volunteer work, or skills you want employers to notice.':
        'يمكنني مساعدتك في إنشاء سيرتك الذاتية أو تحسينها. للبدء، أخبرني عن أحدث وظيفة أو عمل تطوعي أو مهارات تريد أن يلاحظها أصحاب العمل.',
      'I can help you find job options that fit your goals. What kind of work are you interested in, and do you prefer full-time, part-time, or flexible hours?':
        'يمكنني مساعدتك في العثور على وظائف تناسب أهدافك. ما نوع العمل الذي تهتم به، وهل تفضل دوامًا كاملًا أم جزئيًا أم ساعات مرنة؟',
      'Great — we can practice together. Tell me what kind of job you’re interviewing for, and I’ll ask you a few common interview questions.':
        'رائع — يمكننا التدرب معًا. أخبرني عن نوع الوظيفة التي تجري مقابلة لها، وسأطرح عليك بعض أسئلة المقابلة الشائعة.',
      'Let’s explore your strengths. Think about tasks people often ask you for help with, jobs you’ve done before, or things you enjoy doing.':
        'دعنا نستكشف نقاط قوتك. فكّر في المهام التي يطلب منك الآخرون المساعدة فيها، أو الأعمال التي قمت بها من قبل، أو الأشياء التي تستمتع بها.',
      'I can help with that. We can work on finding a job, improving your resume, practicing for interviews, or exploring your strengths. What would you like to do first?':
        'يمكنني المساعدة. يمكننا العمل على العثور على وظيفة، أو تحسين السيرة الذاتية، أو التدرب على المقابلات، أو استكشاف نقاط قوتك. بماذا تود أن تبدأ؟',
    },
  }

  return map[language]?.[text] ?? text
}

function getAdvisorResponseEnglish(userMessage: string): string {
  const raw = userMessage.trim()
  const m = raw.toLowerCase()

  if (m === 'full-time' || m === 'part-time' || m === 'flexible hours') {
    return 'Got it — we’ll look for roles that match that schedule. Is there a certain field you’re curious about, like retail, office work, or something else?'
  }
  if (
    m === 'retail or customer service' ||
    m === 'office or admin' ||
    m.includes('open to different fields')
  ) {
    return 'Thanks — that helps me understand your direction. You can share more about pay, hours, or training goals whenever you’re ready.'
  }
  if (m === 'customer service' || m === 'office / administrative' || m === 'warehouse or logistics') {
    return 'Perfect. Let’s start with a common question for that kind of role: what is one strength you’d want a manager to remember about you?'
  }
  if (m === 'mostly paid jobs' || m === 'volunteer experience' || m === 'skills i want to highlight') {
    return 'Great — start with whichever feels strongest for you, and we’ll shape it into clear resume language step by step.'
  }
  if (m === 'helping customers' || m === 'staying organized' || m === 'computers or software') {
    return 'Those are strengths employers notice. Pick one to turn into a short achievement sentence when you’re ready.'
  }
  if (m.includes('resume')) {
    return 'I can help you build or improve your resume. To start, tell me about your most recent job, volunteer work, or skills you want employers to notice.'
  }
  if (m.includes('job') || m.includes('work')) {
    return 'I can help you find job options that fit your goals. What kind of work are you interested in, and do you prefer full-time, part-time, or flexible hours?'
  }
  if (m.includes('interview')) {
    return 'Great — we can practice together. Tell me what kind of job you’re interviewing for, and I’ll ask you a few common interview questions.'
  }
  if (m.includes('strength') || m.includes('skills')) {
    return 'Let’s explore your strengths. Think about tasks people often ask you for help with, jobs you’ve done before, or things you enjoy doing.'
  }
  return 'I can help with that. We can work on finding a job, improving your resume, practicing for interviews, or exploring your strengths. What would you like to do first?'
}

export function getAdvisorResponse(userMessage: string, language: SupportedLanguage): AdvisorReply {
  const rawEnglish = getAdvisorResponseEnglish(userMessage)
  return { rawEnglish, displayText: translateStaticEnglish(rawEnglish, language) }
}

/**
 * Contextual suggested replies shown under the latest advisor message (prototype).
 * Later this can be driven by real conversation state / API.
 */
type QuickReply = { label: string; value: string }

function translateQuickReply(english: string, language: SupportedLanguage): string {
  if (language === 'en') return english
  const map: Record<SupportedLanguage, Record<string, string>> = {
    en: {},
    es: {
      'Full-time': 'Tiempo completo',
      'Part-time': 'Medio tiempo',
      'Flexible hours': 'Horario flexible',
      'Retail or customer service': 'Ventas o atención al cliente',
      'Office or admin': 'Oficina o administración',
      'I’m open to different fields': 'Estoy abierto/a a diferentes áreas',
      'Customer service': 'Atención al cliente',
      'Office / administrative': 'Oficina / administrativo',
      'Warehouse or logistics': 'Almacén o logística',
      'Mostly paid jobs': 'Mayormente trabajos pagados',
      'Volunteer experience': 'Experiencia de voluntariado',
      'Skills I want to highlight': 'Habilidades que quiero destacar',
      'Helping customers': 'Ayudar a clientes',
      'Staying organized': 'Mantenerme organizado/a',
      'Computers or software': 'Computadoras o software',
      'I want to find a job': 'Quiero encontrar trabajo',
      'I want to improve my resume': 'Quiero mejorar mi currículum',
      'I want to practice for an interview': 'Quiero practicar para una entrevista',
      'I want to explore my strengths': 'Quiero explorar mis fortalezas',
    },
    ht: {
      'Full-time': 'Plen tan',
      'Part-time': 'A tan pasyèl',
      'Flexible hours': 'Lè fleksib',
      'Retail or customer service': 'Detay oswa sèvis kliyan',
      'Office or admin': 'Biwo oswa admin',
      'I’m open to different fields': 'Mwen ouvè a diferan domèn',
      'Customer service': 'Sèvis kliyan',
      'Office / administrative': 'Biwo / administratif',
      'Warehouse or logistics': 'Depo oswa lojistik',
      'Mostly paid jobs': 'Pifò travay peye',
      'Volunteer experience': 'Eksperyans volontarya',
      'Skills I want to highlight': 'Konpetans mwen vle mete an valè',
      'Helping customers': 'Ede kliyan',
      'Staying organized': 'Rete òganize',
      'Computers or software': 'Òdinatè oswa lojisyèl',
      'I want to find a job': 'Mwen vle jwenn yon travay',
      'I want to improve my resume': 'Mwen vle amelyore rezime mwen',
      'I want to practice for an interview': 'Mwen vle pratike pou yon entèvyou',
      'I want to explore my strengths': 'Mwen vle eksplore fòs mwen',
    },
    pl: {
      'Full-time': 'Pełny etat',
      'Part-time': 'Część etatu',
      'Flexible hours': 'Elastyczne godziny',
      'Retail or customer service': 'Handel lub obsługa klienta',
      'Office or admin': 'Biuro lub administracja',
      'I’m open to different fields': 'Jestem otwarty/a na różne branże',
      'Customer service': 'Obsługa klienta',
      'Office / administrative': 'Biuro / administracja',
      'Warehouse or logistics': 'Magazyn lub logistyka',
      'Mostly paid jobs': 'Głównie płatne prace',
      'Volunteer experience': 'Wolontariat',
      'Skills I want to highlight': 'Umiejętności, które chcę podkreślić',
      'Helping customers': 'Pomaganie klientom',
      'Staying organized': 'Dobra organizacja',
      'Computers or software': 'Komputery lub oprogramowanie',
      'I want to find a job': 'Chcę znaleźć pracę',
      'I want to improve my resume': 'Chcę poprawić CV',
      'I want to practice for an interview': 'Chcę poćwiczyć rozmowę',
      'I want to explore my strengths': 'Chcę poznać moje mocne strony',
    },
    ru: {
      'Full-time': 'Полный день',
      'Part-time': 'Неполный день',
      'Flexible hours': 'Гибкий график',
      'Retail or customer service': 'Розница или обслуживание клиентов',
      'Office or admin': 'Офис или администрирование',
      'I’m open to different fields': 'Я открыт/а к разным сферам',
      'Customer service': 'Обслуживание клиентов',
      'Office / administrative': 'Офис / административная работа',
      'Warehouse or logistics': 'Склад или логистика',
      'Mostly paid jobs': 'В основном оплачиваемая работа',
      'Volunteer experience': 'Волонтёрский опыт',
      'Skills I want to highlight': 'Навыки, которые хочу подчеркнуть',
      'Helping customers': 'Помощь клиентам',
      'Staying organized': 'Организованность',
      'Computers or software': 'Компьютеры или программы',
      'I want to find a job': 'Я хочу найти работу',
      'I want to improve my resume': 'Я хочу улучшить резюме',
      'I want to practice for an interview': 'Я хочу потренироваться для интервью',
      'I want to explore my strengths': 'Я хочу изучить свои сильные стороны',
    },
    ar: {
      'Full-time': 'دوام كامل',
      'Part-time': 'دوام جزئي',
      'Flexible hours': 'ساعات مرنة',
      'Retail or customer service': 'البيع بالتجزئة أو خدمة العملاء',
      'Office or admin': 'مكتبي أو إداري',
      'I’m open to different fields': 'أنا منفتح/ة على مجالات مختلفة',
      'Customer service': 'خدمة العملاء',
      'Office / administrative': 'مكتبي / إداري',
      'Warehouse or logistics': 'مستودع أو لوجستيات',
      'Mostly paid jobs': 'معظمها وظائف مدفوعة',
      'Volunteer experience': 'خبرة تطوعية',
      'Skills I want to highlight': 'مهارات أريد إبرازها',
      'Helping customers': 'مساعدة العملاء',
      'Staying organized': 'البقاء منظمًا',
      'Computers or software': 'الحاسوب أو البرامج',
      'I want to find a job': 'أريد العثور على وظيفة',
      'I want to improve my resume': 'أريد تحسين سيرتي الذاتية',
      'I want to practice for an interview': 'أريد التدرب للمقابلة',
      'I want to explore my strengths': 'أريد استكشاف نقاط قوتي',
    },
  }
  return map[language]?.[english] ?? english
}

export function getQuickRepliesForAdvisorMessage(advisorTextEnglish: string, language: SupportedLanguage): QuickReply[] {
  if (advisorTextEnglish.includes('full-time, part-time, or flexible hours')) {
    const values = ['Full-time', 'Part-time', 'Flexible hours']
    return values.map((value) => ({ value, label: translateQuickReply(value, language) }))
  }
  if (advisorTextEnglish.includes('match that schedule') && advisorTextEnglish.includes('field')) {
    const values = ['Retail or customer service', 'Office or admin', 'I’m open to different fields']
    return values.map((value) => ({ value, label: translateQuickReply(value, language) }))
  }
  if (advisorTextEnglish.includes('practice together') && advisorTextEnglish.includes('interview questions')) {
    const values = ['Customer service', 'Office / administrative', 'Warehouse or logistics']
    return values.map((value) => ({ value, label: translateQuickReply(value, language) }))
  }
  if (advisorTextEnglish.includes('build or improve your resume')) {
    const values = ['Mostly paid jobs', 'Volunteer experience', 'Skills I want to highlight']
    return values.map((value) => ({ value, label: translateQuickReply(value, language) }))
  }
  if (advisorTextEnglish.includes('explore your strengths')) {
    const values = ['Helping customers', 'Staying organized', 'Computers or software']
    return values.map((value) => ({ value, label: translateQuickReply(value, language) }))
  }
  if (advisorTextEnglish.includes('What would you like to do first?')) {
    const values = [
      'I want to find a job',
      'I want to improve my resume',
      'I want to practice for an interview',
      'I want to explore my strengths',
    ]
    return values.map((value) => ({ value, label: translateQuickReply(value, language) }))
  }
  return []
}
