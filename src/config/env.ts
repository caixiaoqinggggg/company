// 环境配置文件
interface EnvConfig {
    API_BASE_URL: string;
    ENV: string;
    DEBUG: boolean;
}

// 支持从环境变量读取 API 地址，便于 Docker 部署
export const envConfig: EnvConfig = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api', // 优先使用环境变量，默认使用 Vite 代理
    ENV: import.meta.env.MODE || 'development',
    DEBUG: import.meta.env.DEV || false,
};

