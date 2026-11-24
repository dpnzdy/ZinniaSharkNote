import { pageIntro } from './components.mjs';
import { release } from './release.mjs';

export const developmentPage = {
  id: 'development',
  title: '다음 버전 개발 소식',
  description: 'Windows 저장·복구 변경, Free/Pro 개발 정책과 Android 개발 상태를 안내합니다.',
  render: () => `${pageIntro('IN DEVELOPMENT', '다음 버전 개발 소식', '2026년 11월 18일 개발 기준 · 출시일 미정')}
    <article class="container legal-content help-content">
      <p>${release.released ? `Windows Free와 Pro가 Microsoft Store에 배포되었습니다. <a href="download.html">공개판 다운로드</a>와 <a href="guide.html">공개판 사용 가이드</a>를 이용할 수 있습니다.` : '공개판 제공 상태는 <a href="download.html">다운로드 안내</a>에서 확인할 수 있습니다.'} 아래 내용은 최신 개발판을 기준으로 합니다.</p>
      <nav class="help-jump" aria-label="개발 소식 목차">
        <a href="#windows">Windows 저장과 복구</a>
        <a href="#editions">Free와 Pro</a>
        <a href="#android">Android 개발 상태</a>
        <a href="#media">미디어 삽입 한도</a>
      </nav>
      <section id="windows">
        <h2>Windows 저장과 복구</h2>
        <p>일반 실행은 빈 탭에서 시작합니다. 파일을 지정해 실행하거나 최근 기록에서 열면 디스크에 저장된 .adq 파일을 엽니다. 공개판의 ‘이전 작업 이어하기’로 열던 미저장 작업은 시작 안내에서 선택해 복구본으로 가져올 수 있습니다.</p>
        <ul>
          <li><strong>파일에 저장</strong> · Ctrl+S로 편집 내용을 반영합니다. 기존 파일에 저장할 때는 외부 변경을 확인하고, 덮어쓰기 전에 원본 사본을 만든 뒤 저장 결과를 다시 읽어 검증합니다.</li>
          <li><strong>저장하고 종료</strong> · 변경한 문서별로 저장·버리기·취소를 선택합니다. 두 문서 이상이 남으면 한꺼번에 저장할 수 있습니다. 종료 저장이 진행되는 동안 알림 영역에서 상태를 볼 수 있고, 저장에 실패하면 앱 창과 해당 문서 탭이 다시 나타납니다.</li>
          <li><strong>복구본 열기</strong> · 변경한 문서의 복구본을 약 60초마다 별도로 기록합니다. 파일 → 복구본 관리에서 복구본을 열고 새 .adq 파일로 저장합니다. 중단 시 마지막 복구본 이후의 변경은 남지 않을 수 있습니다.</li>
        </ul>
        <p>개발판에서 복구본 생성, 종료 취소 후 편집 내용 유지, 기존 미저장 작업 가져오기를 시험했습니다.</p>
      </section>
      <section id="editions">
        <h2>Free와 Pro</h2>
        <p>Windows Free에서는 문서당 블록 500개·미디어 15개까지 추가할 수 있습니다. 표·목록 같은 최상위 블록을 각각 하나로 세고, 미디어는 표 안에 있는 항목까지 셉니다. 이미 한도를 넘는 지원 문서는 열고 저장할 수 있으며, 한도를 넘긴 항목 수를 늘리지 않는 편집도 가능합니다. Pro는 이 두 개수 한도를 해제합니다. 파일 용량·구조 등 기술적 한도는 두 에디션에 적용됩니다.</p>
        <div class="help-grid">
          <article><h3>Windows</h3><p>Free와 Pro는 각각 Microsoft Store에서 설치할 수 있습니다. Pro는 일회성 구매 방식이며, Free에서 저장한 지원 .adq 문서를 Pro에서 열 수 있습니다.</p></article>
          <article><h3>Android</h3><p>하나의 앱에서 Pro로 전환할 계획입니다. 일회성 구매, 월 구독, 연 구독을 준비하며 Play 결제 연동은 아직 개발 전입니다.</p></article>
        </div>
        <p>Windows와 Android의 구매 권한은 플랫폼별로 취득합니다. 일회성 구매는 구매한 주요 버전의 Pro 기능을 계속 사용할 수 있는 권한입니다. Android 구독은 유효 기간 동안 최신 Pro 기능을 제공할 계획입니다. Windows 체험 기간과 가격은 <a href="download.html#editions">에디션 비교</a>에서 확인하세요. Android용은 Google Play 출시 예정입니다.</p>
        <p><a href="license.html">배포 및 라이선스 정책 초안</a></p>
      </section>
      <section id="android">
        <h2>Android · Google Play 내부 테스트</h2>
        <p>2026년 11월 24일, Galaxy S22에서 Google Play 내부 테스트판을 업데이트한 뒤 기존 문서를 다시 열었습니다. 자동 입력으로 한글과 표 정렬을 저장하고 재실행 후 편집 내용을 확인했습니다. 일반 공개 일정은 미정입니다.</p>
        <p>Google Play 공개를 준비하고 있습니다. 개발판에서는 한 번에 문서 하나를 편집하며 글과 표, PNG·JPEG·GIF 이미지, MP3·MP4 미디어, 문서 비밀번호를 지원합니다. 시스템 파일 선택기를 통해 .adq 파일을 열고 저장할 수 있습니다.</p>
        <p>기존 파일을 저장할 때 원본 변경 여부를 확인하고 저장 전 사본을 만든 뒤 결과를 다시 읽습니다. 정기 자동 저장은 기본으로 꺼져 있습니다. 첫 저장에서 파일 위치를 선택하세요. 저장 전 사본에는 미저장 편집이 포함되지 않으며, 강제 종료 시 마지막 저장 이후의 변경은 남지 않을 수 있습니다.</p>
        <p>일부 저장·편집 흐름을 실제 기기의 자동 시험에서 확인했습니다. 최신 무음 자동 재생은 에뮬레이터에서 디코더 출력과 영상 전환을 확인했습니다. 실제 기기에서의 입력감, 청취, TalkBack 평가는 별도로 남아 있습니다.</p>
        <p><a href="android-app-privacy.html">Android 앱 개인정보처리방침</a></p>
      </section>
      <section id="media">
        <h2>미디어 삽입 한도</h2>
        <p>Windows와 Android 개발판에서 새로 삽입할 때 적용하는 파일당 한도입니다.</p>
        <ul>
          <li>PNG·JPEG·GIF 이미지 8 MiB</li>
          <li>MP3 오디오 16 MiB</li>
          <li>MP4 비디오 32 MiB</li>
        </ul>
        <p>문서에서 참조하는 미디어 자산의 합계는 128 MiB, 신규 삽입 시 문서 컨테이너 예산은 256 MiB입니다. 기존 지원 문서에 들어 있는 자산은 열기·편집·저장 시 보존합니다.</p>
      </section>
    </article>`,
};
