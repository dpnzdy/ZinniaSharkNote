import { config } from './config.mjs';

export const consentPolicies = Object.fromEntries([['windows','app-privacy','Windows'],['android','android-app-privacy','Android']].map(([platform,id,name])=>[platform,{
  name, date:config.policies[id].effectiveDate, version:config.policies[id].version, href:`${id}.html`,
}]));

const strings = {
  feedback: ['항목: 회신 이메일 주소와 제공하는 제안 내용. 목적: 제안 확인·회신. 보유 기간: 문의 종결 후 1년 이내이며 불필요해지거나 동의를 철회하면 법적 보존 사유가 없는 한 먼저 삭제합니다.', 'Information: reply email address and the suggestion you provide. Purpose: reviewing and replying to suggestions. Retention: within 1 year after inquiry closure, with earlier deletion when no longer needed or consent is withdrawn, unless legally required to retain it.'],
  diagnostic: ['항목: 회신 이메일 주소·문의 번호 및 별도 제공하는 앱/OS 버전·오류 정보·개인정보를 제거한 화면과 최소 재현 사본. 목적: 요청한 오류의 재현·해결. 보유 기간: 해당 문의 종결 후 90일 이내이며 불필요해지거나 동의를 철회하면 법적 보존 사유가 없는 한 먼저 삭제합니다.', 'Information: reply email address, case number and separately provided app/OS versions, error information, screenshots with personal information removed and minimum reproduction copies. Purpose: reproducing and resolving the requested error. Retention: within 90 days after that inquiry closes, with earlier deletion when no longer needed or consent is withdrawn, unless legally required to retain it.'],
  policy: ['{platform} 앱 개인정보처리방침','{platform} App Privacy Policy'],
  policyDate: ['시행일 {date} / 버전 {version}','Effective {date} / version {version}'],
  ready: ['메일 앱에서 아래 동의 문구와 내용을 확인한 뒤 직접 전송하세요.','Review the consent statements and content in your email app, then send it yourself.'],
  pending: ['각 동의를 직접 선택하고, 진단 자료라면 담당자가 안내한 문의 번호를 입력하세요.','Select each consent yourself. For diagnostic materials, also enter the case number provided by support.'],
  diagnosticTopic: ['선택 진단 자료 {case}','Optional diagnostic materials {case}'],
  feedbackTopic: ['의견 및 기능 제안','Feedback and feature suggestions'],
  diagnosticName: ['선택 진단 자료','Optional diagnostic materials'],
  feedbackName: ['의견·기능 제안','Feedback and feature suggestions'],
  typeLine: ['자료 종류: {type}','Material type: {type}'],
  caseLine: ['문의 번호: {case}','Case number: {case}'],
  platformLine: ['이용하는 앱: {platform}','App platform: {platform}'],
  policyLine: ['개인정보처리방침: {platform} {version} / 시행일 {date}','Privacy policy: {platform} {version} / effective {date}'],
  urlLine: ['공식 방침: {url}','Policy URL: {url}'],
  languageLine: ['동의 언어: 한국어 (ko)','Consent language: English (en); reference translation of the Korean original'],
  dateLine: ['동의 확인일: {date} (한국 시간)','Consent confirmation date: {date} (Korea Standard Time)'],
  collection: ['수집·이용 동의: 안내된 항목·목적·보유 기간과 거부 영향을 확인하고 동의합니다.','Collection/use consent: I have reviewed the disclosed information, purposes, retention periods and consequences of refusal, and I consent.'],
  overseas: ['국외 이전 별도 동의: 안내된 수탁자·국가·항목·목적·기간·시기·방법과 거부 영향을 확인하고 별도로 동의합니다.','Separate overseas transfer consent: I have reviewed the disclosed processors, countries, information, purposes, periods, timing, methods and consequences of refusal, and I separately consent.'],
  diagnosticBody: ['진단 자료는 담당자가 요청한 범위만 별도로 첨부합니다. 원본 문서·비밀번호·민감정보는 보내지 않습니다.','I will separately attach only diagnostic materials requested by support, without original documents, passwords or sensitive information.'],
  feedbackBody: ['제안 내용:','Suggestion:'],
};
export const consentMessages = (locale='ko') => Object.fromEntries(Object.entries(strings).map(([key,values])=>[key, values[locale==='en'?1:0]]));
