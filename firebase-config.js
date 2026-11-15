// Firebase 설정 — web 판(Firebase Hosting)에서만 쓴다. claude.ai 아티팩트 판에는 들어가지 않는다.
//
// 채우는 법 (자세한 것은 web_deploy/README_ko.md):
//   Firebase 콘솔 → 프로젝트 설정(톱니바퀴) → 「일반」 → 「내 앱」의 웹 앱 → 「SDK 설정 및 구성」에서 「구성(Config)」을 고르면
//     const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", ... };
//   가 보입니다. 그 { ... } 부분을 아래 null 자리에 그대로 붙여 넣습니다. 예:
//     window.FIREBASE_CONFIG = {
//       apiKey: "AIzaSy...",
//       authDomain: "my-tenbanners.firebaseapp.com",
//       projectId: "my-tenbanners",
//       storageBucket: "my-tenbanners.appspot.com",
//       messagingSenderId: "1234567890",
//       appId: "1:1234567890:web:abcdef123456"
//     };
//
// 이 값들은 비밀번호가 아닙니다. 웹 앱이면 누구나 브라우저에서 볼 수 있는 「프로젝트 주소」 같은 것이라 공개돼도 괜찮습니다.
// 데이터는 firestore.rules(보안 규칙)가 지킵니다 — 남의 저장은 읽을 수도 고칠 수도 없습니다.
// null 그대로 두면 온라인 기능(로그인·클라우드 저장·현황)만 꺼지고 게임은 그대로 됩니다.
window.FIREBASE_CONFIG = {
  "apiKey": "AIzaSyD_JXGqINezmWthUT0EzbaMtF90xhmG2p0",
  "authDomain": "my-dark-16182.firebaseapp.com",
  "projectId": "my-dark-16182",
  "storageBucket": "my-dark-16182.firebasestorage.app",
  "messagingSenderId": "906517420148",
  "appId": "1:906517420148:web:15dbc86642d316404b9921"
};

// 로그인 단추: 켠(true) 제공자의 단추만 보입니다. 설정을 마치지 않은 제공자는 false 로 두세요(눌러도 실패하는 단추가 보이지 않게).
//   google : Firebase 콘솔 Authentication 에서 Google 을 켜면 true
//   kakao  : 카카오 디벨로퍼스 + Firebase 「OpenID Connect(oidc.kakao)」 제공자를 마치면 true (Identity Platform 업그레이드 필요)
//   naver  : 네이버 개발자 센터 + 함수(functions/) 배포를 마치면 true, 그리고 아래 두 칸을 채웁니다 (Blaze 요금제 필요)
//     naverClientId    : 네이버 애플리케이션의 Client ID (공개 값. Client Secret 은 절대 여기에 쓰지 않습니다)
//     naverFunctionUrl : `firebase deploy --only functions` 끝에 나오는 naverLogin 함수 주소 (https://naverlogin-….run.app)
// 같은 사람이라도 Google·카카오·네이버로 각각 들어오면 서로 다른 계정(따로 저장)이 됩니다.
window.LOGIN_PROVIDERS = { google: true, kakao: false, naver: false, naverClientId: '', naverFunctionUrl: '' };
