# Dev Gallery Querystring Synchronization

## Overview
`dev/index.html`에서 현재 선택된 spec과 connector 설정을 URL querystring에 자동으로 동기화하고, 페이지 접근 시 querystring을 읽어 초기 상태를 복원하도록 구현했습니다.

## Changes
- `dev/index.html`:
  - `initFromURL`: 페이지 로드 시 URLSearchParams에서 `spec`, `connector`를 파싱하여 셀렉트 메뉴(`exampleMenu`, `connectorMenu`)의 초기 선택 상태를 설정.
  - 레거시 쿼리스트링(예: `?athletes`, `?dev:foo`)과의 하위 호환성 유지.
  - `updateURL`: spec 또는 connector가 변경될 때 `history.replaceState`를 사용하여 현재 URL 파라미터(`?spec=...&connector=...`)를 최신화.
  - `popstate` 이벤트 리스너를 등록하여 브라우저 뒤로가기/앞으로가기 시에도 상태가 복원되도록 처리.
