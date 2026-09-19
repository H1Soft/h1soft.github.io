export type Lang = 'en' | 'ko';
export const origin = 'https://h1soft.github.io';
export const base = '/nonogram/';
export const email = 'h1.soft.x001@gmail.com';
export const stores: { google: string | null; apple: string | null } = {
  google: null,
  apple: null,
};
export const home = (lang: Lang) => `${base}${lang === 'ko' ? 'ko/' : ''}`;
export const page = (lang: Lang, slug = '') => `${home(lang)}${slug ? `${slug}/` : ''}`;
export const asset = (name: string) => `${base}images/${name}`;
export const cities = [
  {
    code: 'ICN',
    en: 'Seoul',
    ko: '서울',
    themeEn: 'River at dawn',
    themeKo: '한강의 새벽',
    colors: ['#2E4A6B', '#D98E4B', '#F2EDE2'],
  },
  {
    code: 'HKG',
    en: 'Hong Kong',
    ko: '홍콩',
    themeEn: 'Harbour light',
    themeKo: '항구의 빛',
    colors: ['#123A4E', '#E2574B', '#F0E9DC'],
  },
  {
    code: 'SIN',
    en: 'Singapore',
    ko: '싱가포르',
    themeEn: 'Garden city',
    themeKo: '정원의 도시',
    colors: ['#1E6B5A', '#EFB03E', '#F4F0E4'],
  },
  {
    code: 'DPS',
    en: 'Bali',
    ko: '발리',
    themeEn: 'Terraces in the sun',
    themeKo: '햇살 아래 계단식 논',
    colors: ['#3C6B3A', '#D9733F', '#F6F1E1'],
  },
  {
    code: 'DXB',
    en: 'Dubai',
    ko: '두바이',
    themeEn: 'Desert gold',
    themeKo: '사막의 금빛',
    colors: ['#A8542A', '#E9B65C', '#F8EEDC'],
  },
  {
    code: 'CAI',
    en: 'Cairo',
    ko: '카이로',
    themeEn: 'Along the Nile',
    themeKo: '나일강을 따라',
    colors: ['#8A6B2E', '#2F6B7A', '#F5EDD9'],
  },
  {
    code: 'ATH',
    en: 'Athens',
    ko: '아테네',
    themeEn: 'Aegean blue',
    themeKo: '에게해의 파랑',
    colors: ['#1B5C96', '#FFFFFF', '#F3F2EC'],
  },
  {
    code: 'VCE',
    en: 'Venice',
    ko: '베네치아',
    themeEn: 'Watercolour canals',
    themeKo: '수채화 같은 운하',
    colors: ['#2A6A78', '#C25A3C', '#F5EDDF'],
  },
  {
    code: 'CDG',
    en: 'Paris',
    ko: '파리',
    themeEn: 'A golden evening',
    themeKo: '금빛 저녁',
    colors: ['#4A5060', '#C9A24B', '#F6F2E9'],
  },
  {
    code: 'KEF',
    en: 'Reykjavík',
    ko: '레이캬비크',
    themeEn: 'Under the aurora',
    themeKo: '오로라 아래',
    colors: ['#13243A', '#3ECFA0', '#8F86D8'],
  },
  {
    code: 'JFK',
    en: 'New York',
    ko: '뉴욕',
    themeEn: 'City after sunset',
    themeKo: '해가 진 뒤의 도시',
    colors: ['#1A2030', '#EFB700', '#EDE8DE'],
  },
  {
    code: 'CUZ',
    en: 'Cusco',
    ko: '쿠스코',
    themeEn: 'Above the clouds',
    themeKo: '구름 위에서',
    colors: ['#5A2E3E', '#E08A3C', '#F2E6D6'],
  },
];
export const faqs: Record<Lang, { q: string; a: string }[]> = {
  en: [
    {
      q: 'Is everything really free?',
      a: 'Yes. All twelve cities, boarding classes, hints and collections are included. There is no paid feature tier, energy meter or time limit.',
    },
    {
      q: 'What is a nonogram?',
      a: 'A nonogram is a picture logic puzzle. Numbers outside the grid tell you the lengths of filled runs in each row and column. Leave at least one empty cell between runs. Try the puzzle at the top of this page.',
    },
    {
      q: 'Can I play without an internet connection?',
      a: 'Yes. The app’s puzzles, hints and collections work offline. Download the app first when it becomes available. This website needs a connection to load.',
    },
    {
      q: 'Which phones and tablets are supported?',
      a: 'Nonogram Trip is built for Android 8.0 or later and iOS 15 or later, including tablets. Store releases are being prepared; this page will link to the listings when they are available.',
    },
    {
      q: 'Can I move my progress to another device?',
      a: 'The app lets you export a backup file and import it on another device. Transfer the file yourself and keep a copy before changing devices. This is a manual backup, not automatic cloud syncing.',
    },
    {
      q: 'Which languages are included?',
      a: 'English and Korean. You can change the app language in settings and the website language in the navigation.',
    },
    {
      q: 'Does each puzzle have just one solution?',
      a: 'Yes. The current catalogue and both web puzzles are checked for a unique solution and can be solved with row and column logic. Three-stage hints help explain the next step.',
    },
    {
      q: 'Where can I get help?',
      a: 'Visit Support or email h1.soft.x001@gmail.com. Include your device, operating system, app version and a short description of what happened.',
    },
  ],
  ko: [
    {
      q: '정말 모든 기능이 무료인가요?',
      a: '네. 열두 도시, 모든 탑승 클래스, 힌트와 수집물을 모두 이용할 수 있습니다. 유료 기능 등급이나 에너지, 시간 제한이 없습니다.',
    },
    {
      q: '노노그램(네모로직)이 무엇인가요?',
      a: '격자 밖의 숫자를 보고 그림을 완성하는 논리 퍼즐입니다. 숫자는 각 행과 열에서 연속으로 칠할 칸의 수를 뜻합니다. 숫자 덩어리 사이에는 빈칸을 하나 이상 두세요. 페이지 위의 퍼즐로 바로 해볼 수 있습니다.',
    },
    {
      q: '인터넷 없이도 플레이할 수 있나요?',
      a: '네. 앱의 퍼즐, 힌트, 수집 기능은 오프라인에서 동작합니다. 출시 후 앱을 먼저 내려받아 주세요. 이 웹사이트를 처음 불러올 때는 인터넷 연결이 필요합니다.',
    },
    {
      q: '어떤 휴대전화와 태블릿을 지원하나요?',
      a: 'Android 8.0 이상, iOS 15 이상의 휴대전화와 태블릿을 지원하도록 제작했습니다. 스토어 출시를 준비 중이며, 공개되면 이 페이지에서 다운로드할 수 있습니다.',
    },
    {
      q: '기기를 바꾸면 기록을 옮길 수 있나요?',
      a: '앱에서 백업 파일을 내보내고 다른 기기에서 가져올 수 있습니다. 파일은 직접 옮겨야 하며, 기기를 바꾸기 전에 사본을 보관해 주세요. 자동 클라우드 동기화 기능은 아닙니다.',
    },
    {
      q: '어떤 언어를 지원하나요?',
      a: '한국어와 영어를 지원합니다. 앱 설정에서 언어를 바꿀 수 있으며, 웹사이트에서는 상단 언어 메뉴를 이용하면 됩니다.',
    },
    {
      q: '퍼즐의 답은 항상 하나인가요?',
      a: '네. 현재 앱의 퍼즐과 웹 체험 퍼즐 두 개는 유일한 해답을 가지며, 행과 열의 논리만으로 풀 수 있는지 검증했습니다. 세 단계 힌트가 다음 수를 이해하도록 도와줍니다.',
    },
    {
      q: '문제가 생기면 어디로 문의하나요?',
      a: '지원 페이지를 방문하거나 h1.soft.x001@gmail.com으로 이메일을 보내 주세요. 기기명, 운영체제, 앱 버전과 문제 상황을 함께 알려주시면 도움이 됩니다.',
    },
  ],
};
