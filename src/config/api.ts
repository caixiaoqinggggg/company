// API 配置文件
export const API_CONFIG = {
    // 接口路径
    ENDPOINTS: {
        // 健康检查
        HEALTH_CHECK: '/health',
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
    const backendApi = localStorage.getItem('backend_api');
    return `${backendApi}${endpoint}`;
};

// 默认请求配置
export const DEFAULT_REQUEST_CONFIG = {
    timeout: 30000, // 30秒超时
    headers: {
        'Content-Type': 'application/json',
    },
};
