import React, { useMemo } from 'react';
import type { CompanyClassificationResponse } from '../types/api';

interface CompanyStructuredSummaryProps {
    data: CompanyClassificationResponse | null;
    height?: number;
}

function buildSrcDoc(data: CompanyClassificationResponse | null): string {
    if (!data) return '';

    const getSafe = (value: unknown) => (value ?? '').toString().trim();

    // 解析经营范围 - 支持字符串或数组格式
    const parseBusinessScope = (businessScope: any) => {
        if (typeof businessScope === 'string') {
            return { text: businessScope, from: '' };
        }
        if (Array.isArray(businessScope)) {
            const text = getSafe(businessScope[0]?.[0]?.['经营范围'] || businessScope[0]);
            const from = businessScope.length > 1 ? getSafe(businessScope[1]) : '';
            return { text, from };
        }
        return { text: '', from: '' };
    };

    // 解析主营业务 - 支持字符串或数组格式
    const parseMainBusiness = (mainBusiness: any) => {
        if (typeof mainBusiness === 'string') {
            return { text: mainBusiness, from: '' };
        }
        if (Array.isArray(mainBusiness)) {
            const text = getSafe(mainBusiness[0]?.[0]?.['主营业务'] || mainBusiness[0]);
            const from = mainBusiness.length > 1 ? getSafe(mainBusiness[1]) : '';
            return { text, from };
        }
        return { text: '', from: '' };
    };

    // 解析主要产品 - 支持三种不同格式
    const parseMainProducts = (mainProducts: any): string[] => {
        if (!mainProducts) return [];

        const products: string[] = [];

        try {
            if (Array.isArray(mainProducts)) {
                if (mainProducts.length > 0 && typeof mainProducts[0] === 'object' && 
                    mainProducts[0] !== null && 
                    (mainProducts[0]['名称'] || mainProducts[0]['功能'])) {
                    
                    // 直接对象数组格式 - 按照图片样式处理
                    for (const p of mainProducts) {
                        const name = getSafe(p?.['名称']);
                        const typeInfo = p?.['类型'];
                        const func = getSafe(p?.['功能']);
                        
                        if (name) {
                            let productHtml = `<li><strong>${name}</strong>`;
                            
                            // 处理类型信息
                            if (typeInfo) {
                                const typeStr = Array.isArray(typeInfo) ? 
                                    `（${typeInfo.join('、')}）` : 
                                    `（${getSafe(typeInfo)}）`;
                                productHtml += typeStr;
                            }
                            
                            // 处理功能信息，按照图片样式换行显示
                            if (func) {
                                productHtml += `<br><span class="function-desc">${func}</span>`;
                            }
                            
                            productHtml += '</li>';
                            products.push(productHtml);
                        }
                    }
                    return products;
                }

                const list = mainProducts[0]?.[0]?.['主要产品与服务的详细列表'];
                if (Array.isArray(list)) {
                    for (const p of list) {
                        if (typeof p === 'object' && p !== null) {
                            const name = getSafe(p?.['名称']);
                            const typeInfo = p?.['类型'];
                            const typeStr = Array.isArray(typeInfo) ? typeInfo.join('、') : getSafe(typeInfo);
                            const func = getSafe(p?.['功能']);
                            if (name) {
                                products.push(`<li><strong>${name}</strong>${typeStr ? `（${typeStr}）` : ''}${func ? `<br><em>${func}</em>` : ''}</li>`);
                            }
                        }
                    }
                    return products;
                }

                if (mainProducts.every(item => typeof item === 'string')) {
                    return mainProducts.map(product => `<li><strong>${getSafe(product)}</strong></li>`);
                }

                for (const categoryObj of mainProducts) {
                    if (typeof categoryObj === 'object' && categoryObj !== null) {
                        for (const [category, items] of Object.entries(categoryObj)) {
                            if (Array.isArray(items)) {
                                if (items.length > 0) {
                                    products.push(`<li><strong>${category}</strong><ul>${items.map(item => `<li>${getSafe(item)}</li>`).join('')}</ul></li>`);
                                } else {
                                    products.push(`<li><strong>${category}</strong></li>`);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('解析产品数据时出错:', error);
        }

        return products;
    };

    const businessScope = parseBusinessScope(data.classification_result?.business_scope);
    const mainBusiness = parseMainBusiness(data.classification_result?.main_business);
    const products = parseMainProducts(data.classification_result?.main_products);

    const sections: string[] = [];
    if (businessScope.text) {
        sections.push(`<div class="card"><h2>经营范围</h2><p>${businessScope.text}</p>${businessScope.from ? `<small>来源：${businessScope.from}</small>` : ''}</div>`);
    }
    if (mainBusiness.text) {
        sections.push(`<div class="card"><h2>主营业务</h2><p>${mainBusiness.text}</p>${mainBusiness.from ? `<small>来源：${mainBusiness.from}</small>` : ''}</div>`);
    }
    if (products.length > 0) {
        sections.push(`<div class="card"><h2>主要产品与服务</h2><ul>${products.join('')}</ul></div>`);
    }

    const style = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>企业信息展示</title><style>body{font-family:Arial,sans-serif;background:#f4f6f8;padding:20px}.card{background:#fff;border-radius:10px;padding:1em 1.5em;margin:1em 0;box-shadow:0 2px 8px rgba(0,0,0,0.1)}h2{margin-top:0;color:#2c3e50}ul{padding-left:1.2em}ul ul{margin-top:0.5em}li{margin-bottom:1em;line-height:1.5}.function-desc{color:#666;font-size:0.9em;font-style:normal;display:block;margin-top:0.3em}small{display:block;margin-top:.5em;color:#888}</style></head><body>`;
    const endHtml = `</body></html>`;
    return style + sections.join('') + endHtml;
}

const CompanyStructuredSummary: React.FC<CompanyStructuredSummaryProps> = ({ data, height = 400 }) => {
    const srcDoc = useMemo(() => buildSrcDoc(data), [data]);
    return (
        <div style={{ border: '1px solid #eee', borderRadius: 6, overflow: 'hidden', height: `${height}px` }}>
            <iframe
                title="company-structured-view"
                style={{ width: '100%', border: 'none', height: '100%' }}
                srcDoc={srcDoc}
            />
        </div>
    );
};

export default CompanyStructuredSummary;






