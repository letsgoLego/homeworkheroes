export interface TipsArticle {
  slug: string;
  path: string;
  title: string;
  category: string;
}

/** Central register of all tips articles — used for full cross-linking. */
export const TIPS_ARTICLES: TipsArticle[] = [
  { slug: 'planera-laxor-foraldrar', path: '/tips/planera-laxor-foraldrar', title: 'Varför läxplanering är avgörande — och hur du som förälder hjälper', category: 'Planering' },
  { slug: 'laxplanering', path: '/tips/laxplanering', title: 'Läxplanering — 7 smarta tips för föräldrar och barn', category: 'Planering' },
  { slug: 'laxrutin', path: '/tips/laxrutin', title: 'Skapa en läxrutin som håller hela terminen', category: 'Rutiner' },
  { slug: 'terminsstart-checklista', path: '/tips/terminsstart-checklista', title: 'Terminsstart — checklista för föräldrar', category: 'Terminsstart' },
  { slug: 'skolstart-rutiner', path: '/tips/skolstart-rutiner', title: 'Morgon- och sovrutiner efter lovet', category: 'Terminsstart' },
  { slug: 'skolmaterial-packlista', path: '/tips/skolmaterial-packlista', title: 'Skolmaterial & packlista inför terminsstarten', category: 'Terminsstart' },
  { slug: 'studieteknik-barn', path: '/tips/studieteknik-barn', title: 'Studieteknik för barn — 8 metoder som fungerar', category: 'Studieteknik' },
  { slug: 'hogstadiet-studieteknik', path: '/tips/hogstadiet-studieteknik', title: 'Studieteknik för högstadiet (åk 7–9)', category: 'Studieteknik' },
  { slug: 'lasforstaelse-barn', path: '/tips/lasforstaelse-barn', title: 'Läsförståelse hos barn (åk 1–6)', category: 'Per ämne' },
  { slug: 'matematik-hjalp-barn', path: '/tips/matematik-hjalp-barn', title: 'Hjälpa barn med matte — utan att ta över', category: 'Per ämne' },
  { slug: 'engelska-glosor', path: '/tips/engelska-glosor', title: 'Engelska glosor — effektiv pluggteknik', category: 'Per ämne' },
  { slug: 'laxor-arskurs-1-3', path: '/tips/laxor-arskurs-1-3', title: 'Läxor i åk 1–3 — guide för lågstadiet', category: 'Per åldersgrupp' },
  { slug: 'laxor-arskurs-4-6', path: '/tips/laxor-arskurs-4-6', title: 'Läxor i åk 4–6 — guide för mellanstadiet', category: 'Per åldersgrupp' },
  { slug: 'tonaringar-laxor', path: '/tips/tonaringar-laxor', title: 'Tonåringar och läxor — stötta utan att kontrollera', category: 'Per åldersgrupp' },
  { slug: 'laxstress', path: '/tips/laxstress', title: 'Läxstress hos barn — så minskar ni den tillsammans', category: 'Välmående' },
  { slug: 'adhd-laxor', path: '/tips/adhd-laxor', title: 'Läxor med ADHD — strategier som fungerar', category: 'Välmående' },
  { slug: 'skarmtid-och-laxor', path: '/tips/skarmtid-och-laxor', title: 'Skärmtid och läxor — hitta en hållbar balans', category: 'Välmående' },
  { slug: 'motivation-laxor', path: '/tips/motivation-laxor', title: 'Motivera barn till läxor — utan tjat', category: 'Motivation' },
  { slug: 'laxhjalp-hemma', path: '/tips/laxhjalp-hemma', title: 'Läxhjälp hemma — komplett guide för föräldrar', category: 'Föräldraroll' },
];
