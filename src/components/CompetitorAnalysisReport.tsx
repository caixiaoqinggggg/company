import React from 'react';
import ReactMarkdown from 'react-markdown';

interface CompetitorAnalysisReportProps {
    data: string;
}

const CompetitorAnalysisReport: React.FC<CompetitorAnalysisReportProps> = ({ data }) => {
    return (
        <div className="markdown-content">
            <ReactMarkdown>{data}</ReactMarkdown>
        </div>
    );
};

export default CompetitorAnalysisReport;
