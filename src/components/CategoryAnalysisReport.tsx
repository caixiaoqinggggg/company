import React from 'react';
import ReactMarkdown from 'react-markdown';

interface CategoryAnalysisReportProps {
    data: string;
}

const CategoryAnalysisReport: React.FC<CategoryAnalysisReportProps> = ({ data }) => {
    return (
        <div className="markdown-content">
            <ReactMarkdown>{data}</ReactMarkdown>
        </div>
    );
};

export default CategoryAnalysisReport;
