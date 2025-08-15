import axios from 'axios';
import { buildApiUrl, DEFAULT_REQUEST_CONFIG, API_CONFIG } from '../config/api';

// 创建 axios 实例
const apiClient = axios.create({
    ...DEFAULT_REQUEST_CONFIG,
});

// 请求拦截器
apiClient.interceptors.request.use(
    (config) => {
        // 可以在这里添加认证 token
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // 统一错误处理
        if (error.response) {
            // 服务器返回错误状态码
            const { status, data } = error.response;
            switch (status) {
                case 422:
                    throw new Error(data?.message || '请求参数错误');
                default:
                    throw new Error(data?.message || `请求失败，请检查网络`);
            }
        } else if (error.request) {
            // 请求已发出但没有收到响应
            throw new Error('网络连接失败，请检查网络');
        } else {
            // 其他错误
            throw new Error(error.message || '请求失败');
        }
    }
);

// API 接口函数
export const companyApi = {
    // 企业分类分析
    async classifyCompany(params: {
        name: string;
        classification_criterion: string;
        tier: string;
    }) {
        return apiClient.post(buildApiUrl(API_CONFIG.ENDPOINTS.COMPANY_CLASSIFICATION), params);
    },

    // Top-N分类预测
    async classifyTopN(params: {
        name: string;
        classification_criterion: string;
        tier: string;
        top_k: number;
        use_tier1_constraint?: boolean;
        tier1_predictions?: Record<string, number>;
    }) {
        return apiClient.post(buildApiUrl(API_CONFIG.ENDPOINTS.TOPN_CLASSIFICATION), params);
    },

    // 竞争对手召回
    async getCompetitors(params: {
        name: string;
        topk: number;
    }) {
        return apiClient.post(buildApiUrl(API_CONFIG.ENDPOINTS.COMPETITOR_RECALL), params);
    },
};

export default apiClient;
