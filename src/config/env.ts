// 环境配置文件
interface EnvConfig {
    API_BASE_URL: string;
    ENV: string;
    DEBUG: boolean;
}

export const envConfig: EnvConfig = {
    API_BASE_URL: '/api', // 使用 Vite 代理
    ENV: 'development',
    DEBUG: true,
};

