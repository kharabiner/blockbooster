export type FieldSchema = {
  type: "string" | "number" | "boolean" | "array";
  default: unknown;
  label: string;
};

export type FeatureModuleDef = {
  id: string;
  name: string;
  description: string;
  configSchema: Record<string, FieldSchema>;
};

export const MODULE_REGISTRY: Record<string, FeatureModuleDef> = {
  // ── 점수 입력 ────────────────────────────────────────────────────────────────
  // 하나의 인스턴스 = 하나의 점수 항목.
  // 심사 기준이 여러 개라면 이 모듈을 여러 번 활성화(복수 인스턴스 지원 예정).
  "score-input": {
    id: "score-input",
    name: "점수 입력",
    description: "부스에 점수를 부여합니다. 범위와 라벨을 자유롭게 설정하세요.",
    configSchema: {
      label:         { type: "string",  default: "점수 입력",  label: "항목 이름" },
      min:           { type: "number",  default: 0,            label: "최솟값" },
      max:           { type: "number",  default: 100,          label: "최댓값" },
      allowedEmails: { type: "array",   default: [],           label: "입력 허용 이메일 (비워두면 모두 가능)" },
    },
  },

  // ── 정보 보드 ─────────────────────────────────────────────────────────────────
  // 부스 운영자가 항목을 정의하고 내용을 채우면 방문자에게 표시됩니다.
  // 팀 소개, 포트폴리오, 상품 목록, 연락처 등 무엇이든 사용 가능.
  "info-board": {
    id: "info-board",
    name: "정보 보드",
    description: "운영자가 자유롭게 항목을 정의해 정보를 올리고 방문자에게 보여줍니다.",
    configSchema: {
      title:      { type: "string",  default: "부스 정보",                    label: "섹션 제목" },
      fields:     { type: "array",   default: ["소개", "링크", "연락처"],      label: "입력 항목 목록" },
      allowEmbed: { type: "boolean", default: false,                          label: "URL 임베드 허용" },
    },
  },

  // ── 스탬프 ────────────────────────────────────────────────────────────────────
  "stamp": {
    id: "stamp",
    name: "스탬프",
    description: "부스를 방문하면 스탬프를 획득합니다.",
    configSchema: {
      icon:  { type: "string", default: "⭐", label: "스탬프 아이콘" },
      label: { type: "string", default: "방문 완료!", label: "획득 메시지" },
    },
  },

  // ── 실시간 채팅 ───────────────────────────────────────────────────────────────
  "chat": {
    id: "chat",
    name: "실시간 채팅",
    description: "부스 방문객과 운영자가 실시간으로 소통합니다.",
    configSchema: {
      allowAnonymous: { type: "boolean", default: false, label: "비로그인 채팅 허용" },
    },
  },

  // ── 반응 ──────────────────────────────────────────────────────────────────────
  // 가장 단순한 피드백 단위. 이모지 버튼 클릭 한 번.
  "reaction": {
    id: "reaction",
    name: "반응",
    description: "방문자가 이모지 반응을 남깁니다.",
    configSchema: {
      options: { type: "array", default: ["👍", "🔥", "💡"], label: "반응 목록" },
    },
  },

  // ── 공지사항 ──────────────────────────────────────────────────────────────────
  // 이벤트 수준 공지. eventId 기반으로 동작 (slotId 무관).
  "announcement": {
    id: "announcement",
    name: "공지사항",
    description: "이벤트 전체 공지를 실시간으로 전달합니다.",
    configSchema: {},
  },
};

export function getModule(id: string): FeatureModuleDef | undefined {
  return MODULE_REGISTRY[id];
}

export function getAllModules(): FeatureModuleDef[] {
  return Object.values(MODULE_REGISTRY);
}
