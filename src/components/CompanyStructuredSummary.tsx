import React, { useMemo } from 'react';
import type { CompanyClassificationResponse } from '../types/api';

interface CompanyStructuredSummaryProps {
    data: CompanyClassificationResponse | null;
    height?: number;
}

function buildSrcDoc(data: CompanyClassificationResponse | null): string {
    if (!data) return '';

    const getSafe = (value: unknown) => (value ?? '').toString().trim();

    const businessScopeText = Array.isArray(data.classification_result?.business_scope)
        ? getSafe((data.classification_result.business_scope as any[])[0]?.[0]?.['经营范围'])
        : '';
    const businessScopeFrom = Array.isArray(data.classification_result?.business_scope) && (data.classification_result.business_scope as any[]).length > 1
        ? getSafe((data.classification_result.business_scope as any[])[1])
        : '';

    const mainBusinessText = Array.isArray(data.classification_result?.main_business)
        ? getSafe((data.classification_result.main_business as any[])[0]?.[0]?.['主营业务'])
        : '';
    const mainBusinessFrom = Array.isArray(data.classification_result?.main_business) && (data.classification_result.main_business as any[]).length > 1
        ? getSafe((data.classification_result.main_business as any[])[1])
        : '';

    const products: string[] = [];
    try {
        const mp = data.classification_result?.main_products as any[];
        const list = Array.isArray(mp) ? mp[0]?.[0]?.['主要产品与服务的详细列表'] || [] : [];
        if (Array.isArray(list)) {
            for (const p of list) {
                const name = getSafe(p?.['名称']);
                const typeInfo = p?.['类型'];
                const typeStr = Array.isArray(typeInfo) ? typeInfo.join('、') : getSafe(typeInfo);
                const func = getSafe(p?.['功能']);
                if (name) {
                    products.push(`<li><strong>${name}</strong>${typeStr ? `（${typeStr}）` : ''}${func ? `<em>${func}</em>` : ''}</li>`);
                }
            }
        }
    } catch {
        // ignore parse errors
    }

    const sections: string[] = [];
    if (businessScopeText) {
        sections.push(`<div class="card"><h2>经营范围</h2><p>${businessScopeText}</p>${businessScopeFrom ? `<small>来源：${businessScopeFrom}</small>` : ''}</div>`);
    }
    if (mainBusinessText) {
        sections.push(`<div class="card"><h2>主营业务</h2><p>${mainBusinessText}</p>${mainBusinessFrom ? `<small>来源：${mainBusinessFrom}</small>` : ''}</div>`);
    }
    if (products.length > 0) {
        sections.push(`<div class="card"><h2>主要产品与服务</h2><ul>${products.join('')}</ul></div>`);
    }

    const style = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset=\"UTF-8\"><title>企业信息展示</title><style>body{font-family:Arial,sans-serif;background:#f4f6f8;padding:20px}.card{background:#fff;border-radius:10px;padding:1em 1.5em;margin:1em 0;box-shadow:0 2px 8px rgba(0,0,0,0.1)}h2{margin-top:0;color:#2c3e50}ul{padding-left:1.2em}li{margin-bottom:.8em}em{display:block;color:#555;font-style:normal;margin-top:.3em}small{display:block;margin-top:.5em;color:#888}</style></head><body>`;
    const endHtml = `</body></html>`;
    return style + sections.join('') + endHtml;
}

const CompanyStructuredSummary: React.FC<CompanyStructuredSummaryProps> = ({ data, height = 380 }) => {
    const srcDoc = useMemo(() => buildSrcDoc(data), [data]);
    return (
        <div style={{ border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
            <iframe
                title="company-structured-view"
                style={{ width: '100%', border: 'none' }}
                srcDoc={srcDoc}
            />
        </div>
    );
};

export default CompanyStructuredSummary;






