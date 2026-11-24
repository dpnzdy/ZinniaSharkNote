import { config } from './config.mjs';

function officialStoreUrl(value) {
  try {
    const url = new URL(value);
    const product = /^\/detail\/([A-Za-z0-9]+)\/?$/.exec(url.pathname);
    if (url.origin !== 'https://apps.microsoft.com' || url.username || url.password || !product) return null;
    return `https://apps.microsoft.com/detail/${product[1].toUpperCase()}`;
  } catch { return null; }
}

export function releaseInfo(settings = config) {
  if (!['coming-soon', 'released'].includes(settings.releaseStatus)) throw new Error('Unknown releaseStatus');
  const released = settings.releaseStatus === 'released';
  const storeUrl = officialStoreUrl(settings.storeUrl);
  const editions = settings.windowsEditions;
  const proStoreUrl = officialStoreUrl(editions?.proStoreUrl);
  if (released && (!proStoreUrl || proStoreUrl === storeUrl || !Number.isInteger(editions?.trialDays) || editions.trialDays <= 0 || !Number.isFinite(editions?.proPriceUSD) || editions.proPriceUSD <= 0)) {
    throw new Error('Windows editions require a distinct official Pro Store URL, trial duration and reference price.');
  }
  const date = settings.releaseDate;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date || '') && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  if (released && (!storeUrl || !/^\d+\.\d+(?:\.\d+){0,2}$/.test(settings.releaseVersion || '') || !validDate)) {
    throw new Error('A released app requires its verified official Store URL, public version and release date.');
  }
  const version = released ? settings.releaseVersion : settings.plannedVersion;
  const firstDate=settings.firstReleaseDate || '2026-11-03';
  const firstDateLabel=`${firstDate.slice(0,4)}년 ${Number(firstDate.slice(5,7))}월 ${Number(firstDate.slice(8,10))}일`;
  const dateLabel = validDate ? `${date.slice(0,4)}년 ${Number(date.slice(5,7))}월 ${Number(date.slice(8,10))}일` : null;
  return {
    released,
    storeUrl: released ? storeUrl : null,
    proStoreUrl: released ? proStoreUrl : null,
    editions,
    proPrice: `USD $${editions.proPriceUSD.toFixed(2)}`,
    status: released ? 'Windows Free·Pro · Microsoft Store' : 'Microsoft Store 출시 준비 중',
    action: released ? 'Free 받기' : '출시 안내 보기',
    actionUrl: released ? storeUrl : 'download.html',
    version,
    date: released ? date : null,
    firstReleaseDate: firstDate,
    firstReleaseDateLabel: firstDateLabel,
    dateLabel: released ? dateLabel : null,
    systemRequirements: released ? 'Windows 10 22H2(빌드 19045) 이상 · Windows 11 / x64 PC' : 'Windows 10 22H2 x64 · Windows 11 x64 개발·검증 대상',
    systemAnswer: released ? '현재 Store 패키지는 Windows x64 PC용입니다. Store에 등록된 최소 OS는 Windows 10 빌드 19045.0 이상이며 Windows 11에서도 사용할 수 있습니다. 편집 화면에는 WebView2 Evergreen Runtime이 필요합니다. 현재 공개 다운로드는 Windows x64용입니다. Android는 Google Play 공개를 준비하고 있습니다.' : 'Windows 10 22H2 x64와 Windows 11 x64를 대상으로 개발·호환성 검증을 진행하고 있습니다. Microsoft Store 출시 버전의 최종 시스템 요구 사항은 공개 시 다운로드 페이지에 안내합니다. macOS·모바일·웹 편집기는 현재 제공하지 않습니다.',
    summary: released ? 'Windows용 Free와 Pro를 각각 Microsoft Store에서 설치할 수 있습니다. 무료로 시작하거나 Pro 기능을 체험해보세요.' : `첫 공개 버전 ${version}은 무료로 제공할 예정입니다. 대한민국 Microsoft Store 출시를 준비하고 있으며 출시일은 아직 정하지 않았습니다.`,
    freeAnswer: `Free는 무료로 사용할 수 있으며, 문서 한 개에 최상위 블록을 최대 ${editions.blockLimit}개, 미디어를 최대 ${editions.mediaLimit}개까지 추가할 수 있습니다.`,
    priceAnswer: released ? `Pro는 ${editions.trialDays}일 무료 체험을 제공하며, 일회성 구매 가격은 USD $${editions.proPriceUSD.toFixed(2)}입니다. 체험 기간과 구매 후에는 이 두 개수 제한이 해제됩니다. 지역별 가격은 Microsoft Store에서 확인하세요.` : '가격과 체험 조건은 공개 시 안내합니다.',
    downloadAnswer: released ? `Microsoft Store에서 ZinniaShark Note(Free)와 ZinniaShark Note Pro를 각각 설치할 수 있습니다. 무료로 시작하려면 Free를, Pro 기능을 ${editions.trialDays}일 동안 체험하려면 Pro를 선택하세요.` : '대한민국 Microsoft Store를 통한 첫 출시를 준비하고 있습니다. 아직 공개 다운로드 링크는 제공하지 않으며 공개를 확인한 후 이 사이트에서 연결합니다.',
  };
}
export const release = releaseInfo();
