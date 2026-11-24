import { pageIntro } from './components.mjs';
import { release } from './release.mjs';

export const developmentPage = {
  id: 'development',
  title: 'Windows 앱 안내와 Android 개발 소식',
  description: 'Windows 수동 저장·구버전 작업 내보내기, Free·Pro 안내와 Android 개발 상태입니다.',
  render: () => `${pageIntro('WINDOWS & ANDROID', 'Windows 앱과<br>Android 개발 소식', 'Windows는 현재 앱 안내, Android는 개발 상태를 구분합니다.')}
    <article class="container legal-content help-content">
      <p>${release.released ? `Windows Free·Pro는 <a href="download.html">다운로드 안내</a>와 <a href="guide.html">사용 가이드</a>에서 확인할 수 있습니다.` : '공개판 제공 상태는 <a href="download.html">다운로드 안내</a>에서 확인할 수 있습니다.'} 현재 Windows 앱은 수동 파일 저장을 사용합니다. Android 공개 준비 상태와 구분해서 확인하세요.</p>
      <nav class="help-jump" aria-label="개발 소식 목차">
        <a href="#windows">Windows 저장과 복구</a>
        <a href="#editions">Free와 Pro</a>
        <a href="#android">Android 개발 상태</a>
        <a href="#media">미디어 삽입 한도</a>
      </nav>
      <section id="windows"><h2>Windows 파일 저장과 다시 열기</h2><p>일반 실행은 빈 문서로 시작합니다. 파일 열기나 최근 문서에서 디스크에 저장된 .adq 파일을 엽니다. 현재 앱은 작업 이어하기와 주기적 복구 사본 기록을 제공하지 않습니다.</p><ul><li><strong>파일에 저장</strong> · Ctrl+S로 변경 내용을 .adq 파일에 반영합니다. 파일을 닫기 전에 저장하세요.</li><li><strong>종료</strong> · 변경된 문서마다 저장·버리기·취소를 선택합니다. 저장 실패 시 문서를 확인하고 다시 저장하세요.</li><li><strong>구버전 작업</strong> · 남아 있는 작업 문서나 복구 사본은 파일 → 이전 버전 문서 내보내기에서 새 .adq 파일로 내보낼 수 있습니다. 현재 문서의 자동 보존 기능이 아닙니다.</li></ul><p>강제 종료·전원 장애에서는 마지막 파일 저장 이후의 변경을 잃을 수 있습니다. <a href="guide.html#save">파일 저장과 다시 열기</a>를 확인하세요.</p></section>
      <section id="editions"><h2>Windows Free와 Pro</h2><p>${release.freeAnswer}</p><p>${release.priceAnswer}</p><p>Windows Free와 Pro는 별도 Microsoft Store 앱으로 설치합니다. Pro의 블록·미디어 개수 제한 해제와 별개로 파일 용량·구조·메모리 등 기술적 제한은 계속 적용됩니다.</p><p><a href="download.html#editions">Windows 에디션 비교와 다운로드</a></p></section>
      <section id="android">
        <h2>Android 개발 상태</h2>
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
