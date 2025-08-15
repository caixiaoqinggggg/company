import React, { useMemo } from 'react';
import { Card, Descriptions, Space, Typography, Tag } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import type { CompanyClassificationResponse } from '../types/api';
import { CLASSIFICATION_CRITERIA_LABELS } from '../types/api';
import CompanyStructuredSummary from './CompanyStructuredSummary';

const { Text } = Typography;

interface CompanySummaryReportProps {
    data: CompanyClassificationResponse | null;
}

const CompanySummaryReport: React.FC<CompanySummaryReportProps> = ({ data }) => {
    if (!data) return null;
    return (

        <Descriptions
            bordered
            column={1}
            size="small"
            styles={{ label: { fontWeight: '600', width: '120px' }, header: { height: '100%' } }}
        >
            <Descriptions.Item label="公司名称">
                <Text strong>{data.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="分类标准">
                {CLASSIFICATION_CRITERIA_LABELS[data.classification_criterion] || data.classification_criterion}
            </Descriptions.Item>
            <Descriptions.Item label="分类层级">
                {data.tier === '一' ? '一级分类' : '二级分类'}
            </Descriptions.Item>
            {data.classification_result?.main_business && (
                <Descriptions.Item label="主营业务">
                    {Array.isArray(data.classification_result.main_business)
                        ? (data.classification_result.main_business as any[])[0]?.[0]?.["主营业务"] || '暂无数据'
                        : (data.classification_result.main_business as unknown as string)}
                </Descriptions.Item>
            )}
            {/* 结构化摘要组件 */}
            <Descriptions.Item label="结构化摘要">
                <CompanyStructuredSummary data={data} height={300} />
            </Descriptions.Item>
        </Descriptions>
    );
};

export default CompanySummaryReport;
