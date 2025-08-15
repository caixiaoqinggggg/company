import { envConfig } from './env';

// API 配置文件
export const API_CONFIG = {
    // 基础 URL
    BASE_URL: envConfig.API_BASE_URL,

    // 接口路径
    ENDPOINTS: {
        // 企业分类分析
        COMPANY_CLASSIFICATION: '/company_classification/classify_company',
        // Top-N分类预测
        TOPN_CLASSIFICATION: '/company_classification/classify_topn',
        // 竞争对手召回
        COMPETITOR_RECALL: '/competitor_recall/get_competitors',
    }
};

// 构建完整的 API URL
export const buildApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// 默认请求配置
export const DEFAULT_REQUEST_CONFIG = {
    timeout: 30000, // 30秒超时
    headers: {
        'Content-Type': 'application/json',
    },
};
