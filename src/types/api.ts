// API 响应数据类型定义

// 企业分类分析响应
export interface CompanyClassificationResponse {
    name: string;
    classification_criterion: string;
    tier: string;
    classification_result: {
        business_scope: any[];
        main_business: any[];
        main_products: any[];
        production_process: any[];
        industry_category: any[];
    };
    formatted_prompt: string;
    info: string;
}

// Top-N分类预测响应
export interface TopNClassificationResponse {
    name: string;
    classification_criterion: string;
    tier: string;
    top_k: number;
    predictions: Record<string, number>;
    formatted_prompt: string;
    constraints_used: string[];
    backend_type: string;
    backend_port: number;
    info: string;
}

// 竞争对手召回响应
export interface CompetitorRecallResponse {
    name: string;
    topk: number;
    competitors: string[];
    info: string;
}

// 分类标准枚举
export const CLASSIFICATION_CRITERIA = {
    NEW3_INVEST: 'new3_invest', // 新三板投资分类
    GZ: 'gz', // 国证行业分类
    SW: 'sw', // 申万行业分类
    ZX: 'zx', // 中信行业分类
    NEW3_ADMIN: 'new3_admin', // 新三板管理层分类
    LISTING_COMP: 'listing_comp', // 上市公司分类
    GMJJ: 'gmjj', // 国民经济分类
} as const;

// 分类标准中文名称映射
export const CLASSIFICATION_CRITERIA_LABELS: Record<string, string> = {
    [CLASSIFICATION_CRITERIA.NEW3_INVEST]: '新三板投资分类',
    [CLASSIFICATION_CRITERIA.GZ]: '国证行业分类',
    [CLASSIFICATION_CRITERIA.SW]: '申万行业分类',
    [CLASSIFICATION_CRITERIA.ZX]: '中信行业分类',
    [CLASSIFICATION_CRITERIA.NEW3_ADMIN]: '新三板管理层分类',
    [CLASSIFICATION_CRITERIA.LISTING_COMP]: '上市公司分类',
    [CLASSIFICATION_CRITERIA.GMJJ]: '国民经济分类',
};

// 分类层级枚举
export const CLASSIFICATION_TIER = {
    TIER1: '一', // 一级
    TIER2: '二', // 二级
} as const;
