export type FeatureModuleDef = {
  id: string;
  name: string;
  description: string;
  configSchema: Record<string, unknown>;
};

// 개발자가 코드로 모듈을 등록하는 레지스트리
export const MODULE_REGISTRY: Record<string, FeatureModuleDef> = {
  "visitor-rating": {
    id: "visitor-rating",
    name: "방문객 별점",
    description: "방문객이 부스에 1~5점 별점을 부여할 수 있습니다.",
    configSchema: {
      maxStars: { type: "number", default: 5, label: "최대 별점" },
      label: { type: "string", default: "이 부스를 평가해주세요", label: "안내 문구" },
    },
  },
  "judge-scoring": {
    id: "judge-scoring",
    name: "심사위원 채점",
    description: "심사위원이 기준별로 점수를 입력해 채점할 수 있습니다.",
    configSchema: {
      criteria: {
        type: "array",
        default: ["창의성", "완성도", "발표력"],
        label: "채점 기준 항목",
      },
      maxScore: { type: "number", default: 10, label: "항목당 최대 점수" },
      allowedEmails: {
        type: "array",
        default: [],
        label: "채점 허용 이메일 목록 (비워두면 누구나 가능)",
      },
    },
  },
  "stamp-rally": {
    id: "stamp-rally",
    name: "스탬프 랠리",
    description: "부스를 방문하면 스탬프를 획득합니다.",
    configSchema: {
      stampIcon: { type: "string", default: "⭐", label: "스탬프 아이콘" },
    },
  },
  "product-showcase": {
    id: "product-showcase",
    name: "상품 진열",
    description: "부스 운영자가 상품/서비스 목록을 등록해 방문객에게 보여줍니다.",
    configSchema: {
      showPrice: { type: "boolean", default: true, label: "가격 표시" },
    },
  },
  "live-chat": {
    id: "live-chat",
    name: "실시간 채팅",
    description: "부스 방문객과 운영자가 실시간으로 소통합니다.",
    configSchema: {
      allowAnonymous: { type: "boolean", default: false, label: "비로그인 채팅 허용" },
    },
  },
  announcement: {
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
