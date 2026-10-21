# Coin Web

실시간 암호화폐 시세와 코인 정보, 거래소 바로가기를 한 곳에서 볼 수 있는 사이트입니다.

## 기능

- **시세** — 시가총액 상위 250개 코인 (1분마다 자동 갱신)
  - 1시간 / 24시간 / 7일 변동률, 거래량, 시가총액, 7일 미니 차트
  - 열 제목을 눌러 정렬, 목록 내 검색, 페이지 넘김
  - ☆ 관심 코인 (브라우저에 저장)
  - 전체 시가총액·거래량·BTC 도미넌스, 공포·탐욕 지수
  - 지금 많이 찾는 코인, 24시간 상승/하락 TOP 5
- **코인 상세**
  - 가격 차트 (1일/7일/30일/90일/1년, 마우스 올리면 가격 표시)
  - 기간별 수익률, 시가총액·FDV·유통량·ATH/ATL 등 시장 정보
  - 코인 설명 (한국어가 없으면 영어 원문), 카테고리, 출시일, 알고리즘
  - 공식 사이트, 백서, 블록 탐색기, 커뮤니티, 소스 코드 링크
  - 코인 ↔ 원화/달러 계산기
  - **거래소 바로가기**: 국내 거래소(업비트·빗썸 등) 원화 시세와 김치 프리미엄, 전 세계 거래소 마켓 목록(신뢰도, 거래량, 거래 링크)
- **거래소** — 신뢰도 순 거래소 목록, 국내 거래소 필터
- **가이드** — 기초 용어 설명, 코인 사는 법, 안전 수칙
- 상단 통합 검색 (모든 코인), KRW/USD 전환, 다크/라이트 모드, 모바일 대응

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 에 빌드
```

Stack: React 18, React Router, Vite

데이터: [CoinGecko API](https://www.coingecko.com/en/api) (무료), [Alternative.me 공포·탐욕 지수](https://alternative.me/crypto/fear-and-greed-index/)

CoinGecko 무료 API는 분당 요청 수 제한이 있습니다. 무료 Demo API 키를 발급받아 `.env.local`에
`VITE_COINGECKO_API_KEY=키값` 을 넣으면 제한이 완화됩니다.

## 배포 (Netlify)

Build command `npm run build`, publish directory `dist`. SPA 라우팅용 `public/_redirects` 포함.
