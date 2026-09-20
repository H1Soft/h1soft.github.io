export type LegalPage = {
  title: string;
  description: string;
  intro: string;
  sections: {
    id: string;
    title: string;
    paragraphs: string[];
    items?: string[];
  }[];
};

export const legal: Record<'en' | 'ko', Record<'privacy' | 'terms' | 'support', LegalPage>> = {
  en: {
    privacy: {
      title: 'Privacy policy',
      description:
        'How Nonogram Trip handles website visits, local app progress, backups and support messages.',
      intro:
        'A clear account of what stays on your device and what happens when you visit this website or contact H1Soft. Effective: September 19, 2026. Last updated: September 20, 2026.',
      sections: [
        {
          id: 'scope',
          title: '1. Who this notice covers',
          paragraphs: [
            'H1Soft provides the Nonogram Trip website and is preparing the Android and iOS app for release. This notice describes the website as currently published and the app’s current local-data design. Store availability will be shown separately when verified.',
            'The website and the installed app handle information differently. You do not need to create a Nonogram Trip account to browse the site or play in the app.',
          ],
        },
        {
          id: 'website',
          title: '2. The website',
          paragraphs: [
            'The website introduces the app, its city routes and collections. It does not collect app progress or provide an account-based journey service.',
            'This version of the Nonogram Trip website does not install analytics scripts or set cookies. When you choose a language or dismiss the language suggestion, the site saves only that preference in this browser’s localStorage. Your browser may also cache ordinary page files as part of loading the site.',
            'The site may read your browser’s language setting to offer a Korean page. It does not automatically redirect you. To remove the saved language and suggestion preferences, clear this website’s site data in your browser.',
          ],
        },
        {
          id: 'app-data',
          title: '3. Data inside the app',
          paragraphs: [
            'The app keeps puzzle progress, completed-flight records, collections, play time and preferences in its private storage on your device. It does not send these records to an H1Soft server. Puzzle play does not require an account or an internet connection.',
            'Reminders are optional and use your operating system’s local notification service. Sharing a postcard or exporting a backup happens only when you choose that action and a destination in the system interface.',
          ],
        },
        {
          id: 'backups',
          title: '4. Backups, sharing and deletion',
          paragraphs: [
            'An exported backup contains your journey and preferences. Keep it somewhere you trust. If you save it in a cloud drive or send it to another person, that destination handles the copy under its own rules. A shared postcard similarly goes to the destination you select.',
            'Your device’s normal operating-system backup may include app data, depending on your settings. H1Soft does not operate an account-based sync service or keep a separate recovery copy of your journey.',
            'Resetting records in the app removes its journey records while retaining preferences. Uninstalling the app normally removes its local app data; it does not delete backup files you exported, postcards you shared or copies held by an operating-system backup. Manage those copies through their respective apps or device settings.',
          ],
        },
        {
          id: 'hosting',
          title: '5. Website hosting',
          paragraphs: [
            'GitHub Pages hosts this website. Delivering a page involves a request to GitHub, which may process technical information such as your IP address, browser information and request time for its service and security purposes. GitHub’s General Privacy Statement describes its processing.',
            'The website does not access your local app progress. When you follow an external link, the destination’s own privacy practices apply.',
          ],
        },
        {
          id: 'contact-data',
          title: '6. When you email us',
          paragraphs: [
            'If you choose to email h1.soft.x001@gmail.com, H1Soft receives your email address and whatever message or attachments you send. We use this information to answer your request, investigate a reported problem or respond to a collaboration enquiry. The email providers involved also process the message to deliver and store it.',
            'Please include only what is needed for your question. Do not send passwords, identity documents or unrelated personal information. A screenshot may reveal information outside the game; crop or hide it before sending. We keep correspondence as needed to handle the request and any necessary follow-up. You can contact us to ask about correction or deletion of your correspondence.',
          ],
        },
        {
          id: 'your-choices',
          title: '7. Your choices and requests',
          paragraphs: [
            'You control the app’s local records, exported files, sharing destinations and notification permission. H1Soft cannot view or change a local journey remotely.',
            'For questions about information you have sent to H1Soft, or a request to access, correct or delete it, email h1.soft.x001@gmail.com. Tell us which correspondence you mean without including unnecessary personal details. Requests about GitHub’s own hosting records should be directed to GitHub.',
          ],
        },
        {
          id: 'children',
          title: '8. Children’s information',
          paragraphs: [
            'Playing does not require a name, age, profile or account. We do not ask children to submit personal information to play. A parent or guardian can contact us if a child has included personal information in a support message and they would like help removing it.',
          ],
        },
        {
          id: 'changes',
          title: '9. Updates to this notice',
          paragraphs: [
            'If the website or app introduces a different way of handling information, this notice will be updated to explain it. Any relevant store privacy disclosures will also need to reflect the released app. The date above identifies the current notice.',
          ],
          items: [
            'September 20, 2026 — Updated the website’s scope and support information.',
            'September 19, 2026 — Initial notice for the pre-release website, user-chosen language preferences, local app records, user-chosen backups and support email.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of use',
      description:
        'Simple terms for using the Nonogram Trip website and app, including content, backups and support.',
      intro:
        'These terms explain how you may use Nonogram Trip’s website and app. Last updated: September 20, 2026.',
      sections: [
        {
          id: 'using',
          title: '1. Using Nonogram Trip',
          paragraphs: [
            'H1Soft offers this website for you to explore Nonogram Trip. You may use it for personal, lawful purposes. The Android and iOS app is being prepared for release; a preview or product description does not mean an app is already available in either store.',
            'If you obtain the app through a platform store, that store’s applicable terms also govern your download and use of its services.',
          ],
        },
        {
          id: 'content',
          title: '2. Artwork and other content',
          paragraphs: [
            'The game, puzzle collection, artwork, text and branding remain subject to their respective intellectual-property rights. Playing the game does not transfer ownership of these materials. Please contact H1Soft before reusing them as part of another product or distributing a standalone asset collection.',
            'You may share your own gameplay screenshots and postcards using the app’s sharing features. Third-party fonts and software retain their own licence terms and notices; these terms do not replace those licences.',
          ],
        },
        {
          id: 'respect',
          title: '3. Respectful use',
          paragraphs: [
            'Do not use the website to disrupt other visitors, interfere with its hosting, impersonate H1Soft or misrepresent modified material as an official release. Do not send unlawful material or another person’s private information through support enquiries.',
          ],
        },
        {
          id: 'backups',
          title: '4. Your progress and backups',
          paragraphs: [
            'The app stores progress on your device. Export a backup before changing devices or removing app data, and keep the original until you have checked the imported journey. Importing a backup replaces the current journey after validation. H1Soft cannot restore a lost local save when no usable backup exists.',
          ],
        },
        {
          id: 'availability',
          title: '5. Availability and changes',
          paragraphs: [
            'We aim to keep the website and app useful and reliable, but cannot promise uninterrupted availability or that every device and browser will behave identically. Features, compatibility and content may change as the product develops. Important changes to information handling will be described in the privacy policy.',
            'External websites, operating-system services and app stores are provided by their respective operators. Their availability and terms are outside H1Soft’s control. Nothing in these terms is intended to remove rights that cannot be excluded under applicable law.',
          ],
        },
        {
          id: 'contact',
          title: '6. Questions and updates',
          paragraphs: [
            'For questions about these terms, content reuse or a problem with the service, contact H1Soft at h1.soft.x001@gmail.com.',
            'Updated terms will be published on this page with a revised date. The first version was published on September 19, 2026.',
          ],
        },
      ],
    },
    support: {
      title: 'Support & FAQ',
      description:
        'Get help with Nonogram Trip: playing, clues, hints, local saves, backups, accessibility and contacting H1Soft.',
      intro:
        'A little guidance before takeoff, and a way to reach us when something does not look right.',
      sections: [
        {
          id: 'release',
          title: 'Where can I get the app?',
          paragraphs: [
            'The Android and iOS releases are being prepared. Verified store links will be added when they are available. The home page introduces the app’s twelve cities, puzzles and collections.',
            'The app currently targets Android 8.0 or later and iOS 15 or later. Store availability and device compatibility should be checked on the official listing when published.',
          ],
        },
        {
          id: 'cost',
          title: 'Do I need to pay to unlock the puzzles?',
          paragraphs: [
            'Nonogram Trip is designed to make its puzzle routes, difficulty levels, hints and collections available without purchases. Routes open through play.',
          ],
        },
        {
          id: 'first-puzzle',
          title: 'What is a nonogram?',
          paragraphs: [
            'A nonogram is a picture made with logic. The numbers beside each row and column tell you the lengths of its filled runs. A clue of 3 means three connected filled squares. A clue of 1, 2 means one filled square, a gap, then two connected filled squares.',
            'A clue of 5 in a five-square line is a good first move: fill the whole line. In the app, you do not need to mark every empty square with an X to finish.',
          ],
        },
        {
          id: 'clues',
          title: 'What do zeroes and different colours mean?',
          paragraphs: [
            'A clue of 0 means the whole line is empty. Use the mark tool to note empty squares. In the app’s colour puzzles, a clue’s colour identifies the ink: runs of different colours can touch, while two runs of the same colour need a gap.',
            'The bundled puzzles are checked for one solution and for a complete solution through row-and-column deductions. Guessing is not needed. An incorrect mark can block the next deduction, so review recent input if you get stuck.',
          ],
        },
        {
          id: 'hints',
          title: 'How do the app’s hints work?',
          paragraphs: [
            'Hints first point to a line, then explain why some squares are certain, and finally let you choose whether to apply those squares. They use the clues and your current marks. They do not change the board before you choose to apply them.',
            'The Operations manual offers eleven short interactive lessons. In Manual flight, automatic error-location rings are hidden; a correctly completed puzzle still finishes automatically.',
          ],
        },
        {
          id: 'offline',
          title: 'Can I play without an internet connection?',
          paragraphs: [
            'The installed app’s puzzles and local progress work offline. App downloads, this website, email and any cloud destination you choose for a backup or shared image require their own connection.',
          ],
        },
        {
          id: 'saving',
          title: 'Where is my progress? What happens on a replay?',
          paragraphs: [
            'The app saves progress on your device. Reopen a flight to continue, or use Flights in progress in the travel desk. Your completed photo and best record remain in the album while an unfinished replay is kept separately.',
            'If saving fails, check your device’s available storage. Avoid deleting or reinstalling the app before you have exported a usable backup.',
          ],
        },
        {
          id: 'transfer',
          title: 'How do I back up or move my journey?',
          paragraphs: [
            'In the app, open Preferences and choose Export your journey. Save the file somewhere you can find again. On the destination device, open Preferences, choose Import a journey and select that file.',
            'Importing replaces the destination’s current progress and preferences after checking the file. Export that device’s current journey first if you want to keep it. Check the result before removing the original app or backup. There is no automatic account-based sync.',
            'If a file is rejected, confirm that it came from Nonogram Trip and was not edited or truncated during transfer. Keep the original file. Contact us with the error and device details; do not attach a backup containing private information unless it is needed and you choose to share it.',
          ],
        },
        {
          id: 'language',
          title: 'How do I change language?',
          paragraphs: [
            'The app and website support English and Korean. In the app, choose a language in Preferences. On the website, English and 한국어 open the corresponding version of the same page.',
            'When you choose a language or dismiss a language suggestion, the website remembers that preference on this browser. A suggestion based on your browser language does not redirect you automatically. Clear this website’s site data to remove the saved preferences. You can also bookmark the language-specific address you prefer.',
            'For a translation issue, send us the page or screen and the wording that needs attention.',
          ],
        },
        {
          id: 'comfort',
          title: 'Can I adjust the display and controls?',
          paragraphs: [
            'The app has light and dark appearance, colour-assistance numbers and patterns, reduced motion and a phone one-handed setting. Sound and haptics can be switched separately. These options are in Preferences.',
            'The website responds to your system’s reduced-motion preference and supports keyboard navigation. If text, focus or a spoken description gets in your way, tell us your browser, device and any assistive technology you use.',
          ],
        },
        {
          id: 'report',
          title: 'How do I report a problem?',
          paragraphs: [
            'Email h1.soft.x001@gmail.com. Describe what you expected, what happened and how to repeat it. Response time depends on the issue and enquiry volume; support is not a live chat.',
            'A short screen recording or screenshot can help. Remove unrelated personal details before sending it.',
          ],
          items: [
            'Device model and operating-system version.',
            'App version, or browser name and version for a website issue.',
            'City and flight ID, or the website page address.',
            'Language, selected mode and the steps leading to the problem.',
            'Any error message shown on screen.',
          ],
        },
        {
          id: 'press',
          title: 'Press, translation and other enquiries',
          paragraphs: [
            'For press material, content-reuse requests, translation corrections or collaboration, contact H1Soft at h1.soft.x001@gmail.com. Tell us what you need and where it will be used. A public press kit is not currently available.',
          ],
        },
      ],
    },
  },
  ko: {
    privacy: {
      title: '개인정보처리방침',
      description:
        '노노그램 트립의 웹사이트 방문, 앱 로컬 기록, 백업과 문의 이메일의 처리 방식을 안내합니다.',
      intro:
        '기기에 남는 정보와 웹사이트를 방문하거나 H1Soft에 문의할 때 처리되는 정보를 설명합니다. 시행일: 2026년 9월 19일. 최종 수정일: 2026년 9월 20일.',
      sections: [
        {
          id: 'scope',
          title: '1. 이 안내의 적용 범위',
          paragraphs: [
            'H1Soft는 노노그램 트립 웹사이트를 제공하고 Android·iOS 앱 출시를 준비하고 있습니다. 이 안내는 현재 공개된 웹사이트와 앱의 현재 로컬 데이터 처리 방식을 설명합니다. 스토어 출시 여부는 확인된 정보로 별도 안내합니다.',
            '웹사이트와 설치한 앱은 정보를 처리하는 방식이 서로 다릅니다. 웹사이트를 보거나 앱에서 퍼즐을 풀기 위해 노노그램 트립 계정을 만들 필요는 없습니다.',
          ],
        },
        {
          id: 'website',
          title: '2. 웹사이트',
          paragraphs: [
            '웹사이트는 앱, 도시별 여정과 수집물을 소개합니다. 앱의 진행 기록을 수집하거나 계정 기반의 여행 기록 서비스를 제공하지 않습니다.',
            '현재 노노그램 트립 웹사이트에는 분석 스크립트가 없으며 쿠키를 설정하지 않습니다. 사용자가 직접 언어를 고르거나 언어 안내를 닫으면 해당 설정만 이 브라우저의 localStorage에 저장합니다. 브라우저가 사이트를 불러오는 과정에서 일반 페이지 파일을 캐시할 수도 있습니다.',
            '한국어 페이지를 제안하기 위해 브라우저의 언어 설정을 읽을 수 있지만 자동으로 페이지를 이동시키지는 않습니다. 저장된 언어 선택과 안내 닫기 설정은 브라우저에서 이 웹사이트의 사이트 데이터를 지워 삭제할 수 있습니다.',
          ],
        },
        {
          id: 'app-data',
          title: '3. 앱 안에 저장되는 정보',
          paragraphs: [
            '앱은 퍼즐 진행도, 완료 기록, 수집물, 플레이 시간과 설정을 기기의 앱 전용 저장 공간에 보관합니다. 이 기록을 H1Soft 서버로 보내지 않습니다. 퍼즐 플레이에는 계정이나 인터넷 연결이 필요하지 않습니다.',
            '알림은 선택 사항이며 운영체제의 로컬 알림 기능을 사용합니다. 사진 공유나 백업 내보내기는 사용자가 해당 기능을 선택하고 시스템 화면에서 대상을 정할 때 실행됩니다.',
          ],
        },
        {
          id: 'backups',
          title: '4. 백업·공유·삭제',
          paragraphs: [
            '내보낸 백업에는 여행 기록과 설정이 담겨 있습니다. 신뢰할 수 있는 곳에 보관해 주세요. 클라우드 드라이브에 저장하거나 다른 사람에게 보내면 그 대상의 처리 방식이 적용됩니다. 공유한 사진도 사용자가 선택한 대상으로 전달됩니다.',
            '기기 설정에 따라 운영체제의 일반 백업에 앱 데이터가 포함될 수 있습니다. H1Soft는 계정 기반 동기화 서버를 운영하거나 여행 기록의 복구용 사본을 별도로 보관하지 않습니다.',
            '앱의 기록 초기화는 설정을 유지한 채 여행 기록을 지웁니다. 앱을 삭제하면 일반적으로 기기 안의 앱 데이터가 지워지지만, 직접 내보낸 백업 파일, 공유한 사진, 운영체제 백업의 사본까지 삭제되지는 않습니다. 해당 사본은 각각의 앱이나 기기 설정에서 관리해 주세요.',
          ],
        },
        {
          id: 'hosting',
          title: '5. 웹사이트 호스팅',
          paragraphs: [
            '이 웹사이트는 GitHub Pages에서 제공됩니다. 페이지를 받으려면 GitHub에 요청이 전달되며, GitHub는 서비스 제공과 보안을 위해 IP 주소, 브라우저 정보, 요청 시각 등의 기술 정보를 처리할 수 있습니다. 자세한 처리 방식은 GitHub의 일반 개인정보처리방침에 설명되어 있습니다.',
            '웹사이트는 기기에 있는 앱 진행 기록에 접근하지 않습니다. 외부 링크를 열면 해당 서비스의 개인정보 처리 방식이 적용됩니다.',
          ],
        },
        {
          id: 'contact-data',
          title: '6. 이메일로 문의할 때',
          paragraphs: [
            'h1.soft.x001@gmail.com으로 직접 문의하면 H1Soft는 발신 이메일 주소와 사용자가 보낸 내용·첨부 파일을 받습니다. 이 정보는 문의 답변, 신고한 문제의 조사 또는 협업 문의에 응답하는 데 사용합니다. 메일을 전달하고 보관하는 과정에는 관련 이메일 서비스 제공자도 관여합니다.',
            '질문에 필요한 정보만 보내 주세요. 비밀번호, 신분증, 문의와 관계없는 개인정보는 보내지 마세요. 화면 캡처에 게임 밖의 정보가 보이면 가리거나 잘라 주세요. 문의와 필요한 후속 처리를 위해 이메일을 보관하며, 정정·삭제에 관한 요청은 같은 주소로 보낼 수 있습니다.',
          ],
        },
        {
          id: 'your-choices',
          title: '7. 직접 관리하기와 요청하기',
          paragraphs: [
            '앱의 로컬 기록, 내보낸 파일, 공유 대상과 알림 권한은 사용자가 관리할 수 있습니다. H1Soft는 기기에 있는 여행 기록을 원격으로 보거나 수정할 수 없습니다.',
            'H1Soft에 보낸 정보에 관한 질문이나 열람·정정·삭제 요청은 h1.soft.x001@gmail.com으로 보내 주세요. 불필요한 개인정보를 추가하지 말고 어떤 문의에 대한 요청인지 알려 주세요. GitHub 자체 호스팅 기록에 관한 요청은 GitHub에 문의해야 합니다.',
          ],
        },
        {
          id: 'children',
          title: '8. 아동의 정보',
          paragraphs: [
            '플레이를 위해 이름, 나이, 프로필이나 계정을 입력할 필요는 없습니다. 어린이에게 플레이를 조건으로 개인정보 제출을 요청하지 않습니다. 아동이 문의 메일에 개인정보를 포함했고 이를 지우는 데 도움이 필요하다면 부모나 보호자가 연락할 수 있습니다.',
          ],
        },
        {
          id: 'changes',
          title: '9. 안내 변경과 이력',
          paragraphs: [
            '웹사이트나 앱이 정보를 처리하는 방식을 바꾸면 이 안내를 갱신해 설명합니다. 관련 스토어 개인정보 공개 내용도 실제 출시 앱에 맞아야 합니다. 위의 날짜로 현재 안내의 버전을 확인할 수 있습니다.',
          ],
          items: [
            '2026년 9월 20일 — 웹사이트 제공 범위와 지원 안내를 갱신했습니다.',
            '2026년 9월 19일 — 출시 준비 웹사이트, 사용자가 고른 언어 설정, 앱 로컬 기록, 사용자가 선택하는 백업과 문의 이메일에 관한 최초 안내.',
          ],
        },
      ],
    },
    terms: {
      title: '이용약관',
      description:
        '노노그램 트립 웹사이트·앱의 이용, 콘텐츠, 백업과 문의에 관한 기본 안내입니다.',
      intro:
        '노노그램 트립의 웹사이트와 앱을 이용하는 방법을 설명합니다. 최종 수정일: 2026년 9월 20일.',
      sections: [
        {
          id: 'using',
          title: '1. 서비스 이용',
          paragraphs: [
            'H1Soft는 노노그램 트립을 알아볼 수 있도록 웹사이트를 제공합니다. 개인적이고 적법한 목적으로 이용할 수 있습니다. Android·iOS 앱은 출시 준비 중이며, 미리보기나 제품 설명이 스토어 출시 완료를 뜻하지는 않습니다.',
            '플랫폼 스토어에서 앱을 받는 경우, 다운로드와 해당 스토어 서비스 이용에는 그 스토어의 적용 가능한 약관도 적용됩니다.',
          ],
        },
        {
          id: 'content',
          title: '2. 그림과 콘텐츠',
          paragraphs: [
            '게임, 퍼즐 모음, 그림, 글과 브랜드에는 각각의 지식재산권이 적용됩니다. 게임을 플레이하는 것이 이 자료의 소유권을 넘겨받는 것은 아닙니다. 다른 제품의 일부로 재사용하거나 자료 모음으로 배포하려면 먼저 H1Soft에 문의해 주세요.',
            '직접 플레이한 화면과 앱의 공유 기능으로 만든 사진은 공유할 수 있습니다. 외부 서체와 소프트웨어에는 각각의 라이선스와 고지가 적용되며, 이 약관이 해당 라이선스를 대신하지 않습니다.',
          ],
        },
        {
          id: 'respect',
          title: '3. 함께 지키는 이용 방식',
          paragraphs: [
            '다른 방문자의 이용이나 호스팅을 방해하거나, H1Soft를 사칭하거나, 수정한 자료를 공식 배포본처럼 소개하지 마세요. 문의를 통해 위법한 자료나 다른 사람의 사적인 정보를 보내지 마세요.',
          ],
        },
        {
          id: 'backups',
          title: '4. 진행 기록과 백업',
          paragraphs: [
            '앱의 진행도는 기기에 저장됩니다. 기기를 바꾸거나 앱 데이터를 지우기 전에 백업을 내보내고, 가져온 기록을 확인할 때까지 원본을 보관해 주세요. 가져오기는 파일 검사 후 현재 여행 기록을 교체합니다. 사용 가능한 백업이 없으면 H1Soft도 잃어버린 로컬 기록을 복구할 수 없습니다.',
          ],
        },
        {
          id: 'availability',
          title: '5. 제공 상태와 변경',
          paragraphs: [
            '웹사이트와 앱을 안정적으로 제공하기 위해 노력하지만, 중단 없는 이용이나 모든 기기·브라우저에서 동일한 동작을 약속하지는 않습니다. 제품 개발에 따라 기능, 호환성과 콘텐츠가 바뀔 수 있습니다. 정보 처리에 중요한 변경이 있으면 개인정보처리방침에 설명합니다.',
            '외부 웹사이트, 운영체제 기능과 앱 스토어는 각각의 운영자가 제공합니다. 그 서비스의 제공 상태와 약관은 H1Soft가 통제하지 않습니다. 이 약관은 적용되는 법에 따라 배제할 수 없는 이용자의 권리를 제한하려는 것이 아닙니다.',
          ],
        },
        {
          id: 'contact',
          title: '6. 문의와 약관 변경',
          paragraphs: [
            '약관, 콘텐츠 재사용 또는 서비스 문제에 관한 문의는 H1Soft의 h1.soft.x001@gmail.com으로 보내 주세요.',
            '약관을 바꾸면 이 페이지에 새 내용과 수정일을 게시합니다. 최초 버전은 2026년 9월 19일에 게시했습니다.',
          ],
        },
      ],
    },
    support: {
      title: '지원 및 자주 묻는 질문',
      description:
        '노노그램 트립의 조작, 클루, 힌트, 로컬 저장, 백업, 접근성 설정과 H1Soft 문의 방법을 안내합니다.',
      intro: '출발 전 궁금한 점을 확인하고, 예상과 다른 일이 생기면 알려 주세요.',
      sections: [
        {
          id: 'release',
          title: '앱은 어디서 받을 수 있나요?',
          paragraphs: [
            'Android·iOS 출시를 준비하고 있습니다. 이용 가능한 공식 스토어 링크가 확인되면 안내하겠습니다. 홈 화면에서 앱의 열두 도시, 퍼즐과 수집물을 살펴볼 수 있습니다.',
            '현재 앱의 지원 기준은 Android 8.0 이상, iOS 15 이상입니다. 실제 출시 여부와 기기 호환성은 공개된 공식 스토어 페이지에서 확인해 주세요.',
          ],
        },
        {
          id: 'cost',
          title: '퍼즐을 열려면 결제해야 하나요?',
          paragraphs: [
            '노노그램 트립은 퍼즐 구역, 난이도, 힌트와 수집물을 결제 없이 이용하도록 설계했습니다. 구역은 플레이하면서 열립니다.',
          ],
        },
        {
          id: 'first-puzzle',
          title: '노노그램은 어떤 퍼즐인가요?',
          paragraphs: [
            '노노그램은 숫자를 읽고 칸을 칠해 그림을 완성하는 논리 퍼즐입니다. 행과 열 옆의 숫자는 이어서 칠할 덩어리의 길이입니다. 3은 세 칸을 이어 칠한다는 뜻이고, 1·2는 한 칸을 칠한 뒤 빈칸을 두고 두 칸을 이어 칠한다는 뜻입니다.',
            '다섯 칸짜리 줄에 5가 보이면 그 줄 전체를 칠할 수 있습니다. 앱에서는 빈칸 모두에 X를 표시하지 않아도 칠한 모양이 맞으면 완성됩니다.',
          ],
        },
        {
          id: 'clues',
          title: '숫자 0과 서로 다른 색은 무슨 뜻인가요?',
          paragraphs: [
            '0은 그 줄이 모두 빈칸이라는 뜻입니다. 빈칸 표시 도구로 메모할 수 있습니다. 앱의 컬러 퍼즐에서는 숫자의 색이 사용할 잉크를 뜻합니다. 색이 다른 덩어리는 붙어도 되지만 같은 색 덩어리 사이에는 빈칸이 필요합니다.',
            '번들 퍼즐은 답이 하나이며 행과 열의 논리 추론으로 끝까지 풀 수 있는지 검사합니다. 추측할 필요는 없습니다. 잘못된 표시가 다음 추론을 막을 수 있으니 막혔을 때는 최근 입력을 다시 살펴보세요.',
          ],
        },
        {
          id: 'hints',
          title: '앱의 힌트는 어떻게 동작하나요?',
          paragraphs: [
            '힌트는 먼저 살펴볼 줄을 가리키고, 어떤 칸을 확정할 수 있는지 이유를 설명한 뒤, 그 칸을 적용할지 직접 선택하게 합니다. 클루와 현재 표시를 사용하며 적용을 선택하기 전에는 보드를 바꾸지 않습니다.',
            '운항 교본에는 짧은 상호작용 수업 11개가 있습니다. 수동 비행에서는 자동 오류 위치 링을 표시하지 않으며, 정답을 완성하면 별도의 확인 없이 결과 화면으로 이동합니다.',
          ],
        },
        {
          id: 'offline',
          title: '인터넷 없이도 플레이할 수 있나요?',
          paragraphs: [
            '설치한 앱의 퍼즐과 로컬 진행 기록은 오프라인에서 동작합니다. 앱 다운로드, 이 웹사이트, 이메일, 백업이나 사진을 보낼 클라우드 서비스에는 각각 인터넷 연결이 필요할 수 있습니다.',
          ],
        },
        {
          id: 'saving',
          title: '진행 기록은 어디에 있나요? 다시 풀면 사진이 바뀌나요?',
          paragraphs: [
            '앱은 진행 기록을 기기에 저장합니다. 같은 항공편을 다시 열거나 여행 데스크의 탑승 중 항공편에서 이어 풀 수 있습니다. 미완료 재도전은 별도로 보관하므로 완성한 사진과 최고 기록은 앨범에 그대로 남습니다.',
            '저장에 실패하면 기기의 남은 저장 공간을 확인해 주세요. 사용 가능한 백업을 내보내기 전에는 앱을 지우거나 다시 설치하지 않는 것이 좋습니다.',
          ],
        },
        {
          id: 'transfer',
          title: '여행 기록을 백업하거나 다른 기기로 옮기려면 어떻게 하나요?',
          paragraphs: [
            '앱의 설정에서 기록 내보내기를 선택하고 다시 찾을 수 있는 곳에 파일을 보관하세요. 옮길 기기에서 설정의 기록 가져오기를 선택한 뒤 해당 파일을 고릅니다.',
            '가져오기는 파일을 검사한 뒤 대상 기기의 현재 진행도와 설정을 교체합니다. 그 기기의 기록도 남기려면 먼저 내보내세요. 가져온 결과를 확인할 때까지 원래 앱과 백업을 보관해 주세요. 계정 기반 자동 동기화는 제공하지 않습니다.',
            '파일이 거부되면 노노그램 트립에서 내보낸 파일인지, 전달 중 수정되거나 일부가 빠지지 않았는지 확인해 주세요. 원본 파일은 보관하고 오류와 기기 정보를 알려 주세요. 백업 첨부가 꼭 필요하고 직접 공유하기로 선택한 경우가 아니라면 사적인 정보가 있는 파일을 보내지 마세요.',
          ],
        },
        {
          id: 'language',
          title: '언어는 어떻게 바꾸나요?',
          paragraphs: [
            '앱과 웹사이트는 한국어와 영어를 지원합니다. 앱에서는 설정에서 언어를 고를 수 있습니다. 웹사이트의 English와 한국어는 같은 페이지의 해당 언어 버전을 엽니다.',
            '웹사이트에서 직접 언어를 고르거나 언어 안내를 닫으면 해당 설정을 이 브라우저에 기억합니다. 브라우저 언어를 바탕으로 안내하더라도 자동으로 페이지를 이동하지 않습니다. 저장된 설정은 이 웹사이트의 사이트 데이터를 지워 삭제할 수 있습니다. 선호하는 언어의 페이지 주소를 북마크할 수도 있습니다.',
            '번역이 어색하면 해당 페이지나 화면과 수정이 필요한 문구를 알려 주세요.',
          ],
        },
        {
          id: 'comfort',
          title: '화면과 조작을 편하게 바꿀 수 있나요?',
          paragraphs: [
            '앱 설정에서 밝은 화면과 야간 비행, 숫자·패턴을 이용한 색 구분 보조, 모션 줄이기와 휴대폰 한 손 모드를 선택할 수 있습니다. 효과음과 햅틱도 각각 켜거나 끌 수 있습니다.',
            '웹사이트는 시스템의 모션 줄이기 설정을 따르며 키보드 탐색을 지원합니다. 글자, 포커스나 낭독 설명이 이용을 어렵게 하면 브라우저, 기기와 사용 중인 보조 기술을 알려 주세요.',
          ],
        },
        {
          id: 'report',
          title: '문제는 어떻게 제보하나요?',
          paragraphs: [
            'h1.soft.x001@gmail.com으로 예상한 동작, 실제로 일어난 일, 같은 문제를 다시 볼 수 있는 순서를 보내 주세요. 답변 시간은 문제의 종류와 문의량에 따라 달라지며 실시간 채팅 지원은 아닙니다.',
            '짧은 화면 녹화나 캡처가 도움이 됩니다. 문의와 관계없는 개인정보는 가리고 보내 주세요.',
          ],
          items: [
            '기기 모델과 운영체제 버전.',
            '앱 버전 또는 웹 문제라면 브라우저 이름과 버전.',
            '도시·항공편 ID 또는 웹사이트 페이지 주소.',
            '언어, 선택한 모드와 문제가 발생하기까지의 조작 순서.',
            '화면에 표시된 오류 메시지.',
          ],
        },
        {
          id: 'press',
          title: '프레스·번역·그 밖의 문의',
          paragraphs: [
            '소개 자료, 콘텐츠 재사용, 번역 오류와 협업 문의는 H1Soft의 h1.soft.x001@gmail.com으로 보내 주세요. 필요한 자료와 사용할 곳을 알려주시면 됩니다. 현재 별도의 공개 프레스킷은 없습니다.',
          ],
        },
      ],
    },
  },
};
