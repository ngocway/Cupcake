import type { CourseUnit } from './public-classes-data';
export { PHONICS_45_DAYS_MAP, getPhonicsDayDataByNumber } from './phonics-45-days-curriculum';

export interface PhonicsWordItem {
  word: string;
  onset: string;
  rime: string;
  ipa: string;
  meaningVi: string;
  exampleSentence: string;
  imageSvg?: string;
  imageUrl?: string;
  audioText?: string;
}

export interface PhonicsDayData {
  day: number;
  stage: number;
  stageTitle: string;
  title: string;
  rime: string;
  vowel: 'a' | 'e' | 'i' | 'o' | 'u';
  words: PhonicsWordItem[];
  decodableStory: {
    title: string;
    lines: string[];
    comprehensionQuestion: {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    };
  };
}

export const PHONICS_DAY_1_DATA: PhonicsDayData = {
  day: 1,
  stage: 1,
  stageTitle: 'Chặng 1: Short Vowel A (Nguyên âm A ngắn)',
  title: 'Vần -at (bat, cat, fat, hat, mat, rat, sat)',
  rime: 'at',
  vowel: 'a',
  words: [
    {
      word: 'bat',
      onset: 'b',
      rime: 'at',
      ipa: '/bæt/',
      meaningVi: 'Con dơi / Cây gậy bóng chày',
      exampleSentence: 'A little bat flies in the sky.',
      audioText: 'bat',
    },
    {
      word: 'cat',
      onset: 'c',
      rime: 'at',
      ipa: '/kæt/',
      meaningVi: 'Con mèo',
      exampleSentence: 'The cute cat says meow.',
      audioText: 'cat',
    },
    {
      word: 'fat',
      onset: 'f',
      rime: 'at',
      ipa: '/fæt/',
      meaningVi: 'Béo múp míp, tròn trĩnh',
      exampleSentence: 'Look at the happy fat cat.',
      audioText: 'fat',
    },
    {
      word: 'hat',
      onset: 'h',
      rime: 'at',
      ipa: '/hæt/',
      meaningVi: 'Cái mũ / Nón',
      exampleSentence: 'He wears a funny blue hat.',
      audioText: 'hat',
    },
    {
      word: 'mat',
      onset: 'm',
      rime: 'at',
      ipa: '/mæt/',
      meaningVi: 'Tấm thảm',
      exampleSentence: 'The soft mat is on the floor.',
      audioText: 'mat',
    },
    {
      word: 'rat',
      onset: 'r',
      rime: 'at',
      ipa: '/ræt/',
      meaningVi: 'Chú chuột nâu',
      exampleSentence: 'A tiny rat loves yummy cheese.',
      audioText: 'rat',
    },
    {
      word: 'sat',
      onset: 's',
      rime: 'at',
      ipa: '/sæt/',
      meaningVi: 'Đã ngồi (quá khứ của sit)',
      exampleSentence: 'The fat cat sat on the mat.',
      audioText: 'sat',
    },
  ],
  decodableStory: {
    title: 'The Fat Cat on the Mat',
    lines: [
      'I see a fat cat.',
      'The fat cat has a hat.',
      'The cat sees a rat with a bat.',
      'The fat cat sat on the mat.',
    ],
    comprehensionQuestion: {
      question: 'Where did the fat cat sit?',
      options: ['On the mat', 'In the hat', 'On the bat', 'In the van'],
      correctAnswer: 'On the mat',
      explanation: 'The story says: "The fat cat sat on the mat."',
    },
  },
};

export const PHONICS_45_DAY_OVERVIEW: Array<{
  day: number;
  stage: number;
  stageName: string;
  title: string;
  rime: string;
  wordSample: string[];
}> = [
  // STAGE 1: SHORT A (Days 1 - 10)
  { day: 1, stage: 1, stageName: 'Short A', title: 'Vần -at', rime: '-at', wordSample: ['bat', 'cat', 'fat', 'hat', 'mat', 'rat', 'sat'] },
  { day: 2, stage: 1, stageName: 'Short A', title: 'Vần -an', rime: '-an', wordSample: ['can', 'fan', 'man', 'pan', 'ran', 'van'] },
  { day: 3, stage: 1, stageName: 'Short A', title: 'Vần -ap', rime: '-ap', wordSample: ['cap', 'map', 'nap', 'tap', 'lap', 'gap'] },
  { day: 4, stage: 1, stageName: 'Short A', title: 'Vần -am', rime: '-am', wordSample: ['dam', 'ham', 'jam', 'ram', 'yam'] },
  { day: 5, stage: 1, stageName: 'Short A', title: 'Vần -ad', rime: '-ad', wordSample: ['bad', 'dad', 'lad', 'mad', 'sad'] },
  { day: 6, stage: 1, stageName: 'Short A', title: 'Vần -ag', rime: '-ag', wordSample: ['bag', 'flag', 'rag', 'tag', 'wag'] },
  { day: 7, stage: 1, stageName: 'Short A', title: 'Vần -ab', rime: '-ab', wordSample: ['cab', 'crab', 'lab', 'tab'] },
  { day: 8, stage: 1, stageName: 'Short A', title: 'Vần -ack', rime: '-ack', wordSample: ['back', 'black', 'pack', 'sack', 'track'] },
  { day: 9, stage: 1, stageName: 'Short A', title: 'Vần -ash', rime: '-ash', wordSample: ['cash', 'dash', 'flash', 'rash', 'splash'] },
  { day: 10, stage: 1, stageName: 'Short A', title: 'Ôn tập Short A Word Families', rime: 'Short A Review', wordSample: ['cat', 'can', 'cap', 'jam', 'dad', 'bag'] },

  // STAGE 2: SHORT E (Days 11 - 18)
  { day: 11, stage: 2, stageName: 'Short E', title: 'Vần -et', rime: '-et', wordSample: ['jet', 'net', 'pet', 'set', 'vet', 'wet'] },
  { day: 12, stage: 2, stageName: 'Short E', title: 'Vần -en', rime: '-en', wordSample: ['den', 'hen', 'men', 'pen', 'ten'] },
  { day: 13, stage: 2, stageName: 'Short E', title: 'Vần -ed', rime: '-ed', wordSample: ['bed', 'fed', 'led', 'red', 'wed'] },
  { day: 14, stage: 2, stageName: 'Short E', title: 'Vần -eg', rime: '-eg', wordSample: ['beg', 'egg', 'leg', 'peg'] },
  { day: 15, stage: 2, stageName: 'Short E', title: 'Vần -ell', rime: '-ell', wordSample: ['bell', 'shell', 'tell', 'well', 'yell'] },
  { day: 16, stage: 2, stageName: 'Short E', title: 'Vần -est', rime: '-est', wordSample: ['best', 'nest', 'rest', 'test', 'vest'] },
  { day: 17, stage: 2, stageName: 'Short E', title: 'Vần -ent & -end', rime: '-ent/-end', wordSample: ['bend', 'lend', 'send', 'tent', 'vent'] },
  { day: 18, stage: 2, stageName: 'Short E', title: 'Ôn tập Short E Word Families', rime: 'Short E Review', wordSample: ['pet', 'pen', 'bed', 'leg', 'bell', 'nest'] },

  // STAGE 3: SHORT I (Days 19 - 27)
  { day: 19, stage: 3, stageName: 'Short I', title: 'Vần -it', rime: '-it', wordSample: ['bit', 'fit', 'hit', 'kit', 'pit', 'sit'] },
  { day: 20, stage: 3, stageName: 'Short I', title: 'Vần -in', rime: '-in', wordSample: ['bin', 'fin', 'pin', 'tin', 'win'] },
  { day: 21, stage: 3, stageName: 'Short I', title: 'Vần -ip', rime: '-ip', wordSample: ['dip', 'lip', 'rip', 'sip', 'tip', 'zip'] },
  { day: 22, stage: 3, stageName: 'Short I', title: 'Vần -ig', rime: '-ig', wordSample: ['big', 'dig', 'fig', 'pig', 'wig'] },
  { day: 23, stage: 3, stageName: 'Short I', title: 'Vần -id & -im', rime: '-id/-im', wordSample: ['kid', 'lid', 'hid', 'swim', 'rim'] },
  { day: 24, stage: 3, stageName: 'Short I', title: 'Vần -ill', rime: '-ill', wordSample: ['fill', 'hill', 'mill', 'pill', 'spill'] },
  { day: 25, stage: 3, stageName: 'Short I', title: 'Vần -ick', rime: '-ick', wordSample: ['brick', 'kick', 'pick', 'sick', 'tick'] },
  { day: 26, stage: 3, stageName: 'Short I', title: 'Vần -ish', rime: '-ish', wordSample: ['dish', 'fish', 'wish', 'swish'] },
  { day: 27, stage: 3, stageName: 'Short I', title: 'Ôn tập Short I Word Families', rime: 'Short I Review', wordSample: ['sit', 'pin', 'lip', 'pig', 'kid', 'hill'] },

  // STAGE 4: SHORT O (Days 28 - 35)
  { day: 28, stage: 4, stageName: 'Short O', title: 'Vần -ot', rime: '-ot', wordSample: ['cot', 'dot', 'hot', 'lot', 'pot', 'rot'] },
  { day: 29, stage: 4, stageName: 'Short O', title: 'Vần -op', rime: '-op', wordSample: ['hop', 'mop', 'pop', 'stop', 'top'] },
  { day: 30, stage: 4, stageName: 'Short O', title: 'Vần -og', rime: '-og', wordSample: ['dog', 'fog', 'frog', 'jog', 'log'] },
  { day: 31, stage: 4, stageName: 'Short O', title: 'Vần -ox', rime: '-ox', wordSample: ['box', 'fox', 'ox'] },
  { day: 32, stage: 4, stageName: 'Short O', title: 'Vần -ock', rime: '-ock', wordSample: ['clock', 'lock', 'rock', 'shock', 'sock'] },
  { day: 33, stage: 4, stageName: 'Short O', title: 'Vần -ob', rime: '-ob', wordSample: ['bob', 'cob', 'job', 'sob'] },
  { day: 34, stage: 4, stageName: 'Short O', title: 'Vần -od & -om', rime: '-od/-om', wordSample: ['mom', 'nod', 'pod', 'rod'] },
  { day: 35, stage: 4, stageName: 'Short O', title: 'Ôn tập Short O Word Families', rime: 'Short O Review', wordSample: ['hot', 'top', 'dog', 'fox', 'lock', 'job'] },

  // STAGE 5: SHORT U & CVC MASTERY (Days 36 - 45)
  { day: 36, stage: 5, stageName: 'Short U', title: 'Vần -ug', rime: '-ug', wordSample: ['bug', 'hug', 'jug', 'mug', 'rug', 'tug'] },
  { day: 37, stage: 5, stageName: 'Short U', title: 'Vần -un', rime: '-un', wordSample: ['bun', 'fun', 'run', 'sun'] },
  { day: 38, stage: 5, stageName: 'Short U', title: 'Vần -ut', rime: '-ut', wordSample: ['cut', 'hut', 'nut', 'shut'] },
  { day: 39, stage: 5, stageName: 'Short U', title: 'Vần -ub', rime: '-ub', wordSample: ['cub', 'rub', 'sub', 'tub'] },
  { day: 40, stage: 5, stageName: 'Short U', title: 'Vần -up & -ud', rime: '-up/-ud', wordSample: ['cup', 'pup', 'mud'] },
  { day: 41, stage: 5, stageName: 'Short U', title: 'Vần -uck', rime: '-uck', wordSample: ['duck', 'luck', 'truck', 'stuck'] },
  { day: 42, stage: 5, stageName: 'Short U', title: 'Vần -um & -ump', rime: '-um/-ump', wordSample: ['drum', 'gum', 'hum', 'bump', 'jump'] },
  { day: 43, stage: 5, stageName: 'Short U', title: 'Vần -ush', rime: '-ush', wordSample: ['brush', 'crush', 'flush', 'rush'] },
  { day: 44, stage: 5, stageName: 'CVC Master', title: 'Thử thách CVC Master Quiz (5 Nguyên Âm)', rime: 'CVC Grand Quiz', wordSample: ['cat', 'bed', 'pig', 'dog', 'sun'] },
  { day: 45, stage: 5, stageName: 'Graduation', title: 'Lễ Tốt Nghiệp: 45-Day Phonics Champion', rime: 'Graduation', wordSample: ['star', 'champion', 'badge', 'reader'] },
];

export const PHONICS_45_UNITS_VI: CourseUnit[] = [
  {
    id: 'phonics-stage-1',
    unitIndex: 1,
    title: 'Chặng 1: Short Vowel A – Các họ vần nguyên âm A ngắn (Ngày 1 – 10)',
    lessonsCount: 10,
    isFreeTrial: true,
    lessons: PHONICS_45_DAY_OVERVIEW.filter(d => d.stage === 1).map(d => ({
      id: `phonics-day-${String(d.day).padStart(2, '0')}`,
      lessonIndex: d.day,
      title: `Day ${String(d.day).padStart(2, '0')}: ${d.title}`,
      type: 'Ghép vần • Flashcard • Game • Truyện đọc',
      isTrial: true,
    })),
  },
  {
    id: 'phonics-stage-2',
    unitIndex: 2,
    title: 'Chặng 2: Short Vowel E – Các họ vần nguyên âm E ngắn (Ngày 11 – 18)',
    lessonsCount: 8,
    isFreeTrial: false,
    lessons: PHONICS_45_DAY_OVERVIEW.filter(d => d.stage === 2).map(d => ({
      id: `phonics-day-${String(d.day).padStart(2, '0')}`,
      lessonIndex: d.day,
      title: `Day ${String(d.day).padStart(2, '0')}: ${d.title}`,
      type: 'Ghép vần • Flashcard • Game • Truyện đọc',
      isTrial: true,
    })),
  },
  {
    id: 'phonics-stage-3',
    unitIndex: 3,
    title: 'Chặng 3: Short Vowel I – Các họ vần nguyên âm I ngắn (Ngày 19 – 27)',
    lessonsCount: 9,
    isFreeTrial: false,
    lessons: PHONICS_45_DAY_OVERVIEW.filter(d => d.stage === 3).map(d => ({
      id: `phonics-day-${String(d.day).padStart(2, '0')}`,
      lessonIndex: d.day,
      title: `Day ${String(d.day).padStart(2, '0')}: ${d.title}`,
      type: 'Ghép vần • Flashcard • Game • Truyện đọc',
      isTrial: true,
    })),
  },
  {
    id: 'phonics-stage-4',
    unitIndex: 4,
    title: 'Chặng 4: Short Vowel O – Các họ vần nguyên âm O ngắn (Ngày 28 – 35)',
    lessonsCount: 8,
    isFreeTrial: false,
    lessons: PHONICS_45_DAY_OVERVIEW.filter(d => d.stage === 4).map(d => ({
      id: `phonics-day-${String(d.day).padStart(2, '0')}`,
      lessonIndex: d.day,
      title: `Day ${String(d.day).padStart(2, '0')}: ${d.title}`,
      type: 'Ghép vần • Flashcard • Game • Truyện đọc',
      isTrial: true,
    })),
  },
  {
    id: 'phonics-stage-5',
    unitIndex: 5,
    title: 'Chặng 5: Short Vowel U & Grand Celebration (Ngày 36 – 45)',
    lessonsCount: 10,
    isFreeTrial: false,
    lessons: PHONICS_45_DAY_OVERVIEW.filter(d => d.stage === 5).map(d => ({
      id: `phonics-day-${String(d.day).padStart(2, '0')}`,
      lessonIndex: d.day,
      title: `Day ${String(d.day).padStart(2, '0')}: ${d.title}`,
      type: 'Ghép vần • Flashcard • Game • Truyện đọc',
      isTrial: true,
    })),
  },
];

export const PHONICS_45_UNITS_EN: CourseUnit[] = PHONICS_45_UNITS_VI.map((unit, idx) => ({
  ...unit,
  title: [
    'Stage 1: Short Vowel A Word Families (Days 1 – 10)',
    'Stage 2: Short Vowel E Word Families (Days 11 – 18)',
    'Stage 3: Short Vowel I Word Families (Days 19 – 27)',
    'Stage 4: Short Vowel O Word Families (Days 28 – 35)',
    'Stage 5: Short Vowel U & CVC Mastery (Days 36 – 45)',
  ][idx] || unit.title,
  lessons: unit.lessons.map(l => ({
    ...l,
    type: 'Blending Lab • Flashcards • Reflex Game • Decodable Story',
  })),
}));
