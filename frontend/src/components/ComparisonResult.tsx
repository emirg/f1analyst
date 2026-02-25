import React from 'react';
import { Paper, Typography } from '@mui/material';
import Markdown from 'react-markdown';

interface ComparisonResultProps {
    result: string;
    isInPanel?: boolean;
}

const ComparisonResult: React.FC<ComparisonResultProps> = ({ result, isInPanel = false }) => {
    if (!result) return null;

    // When in panel, don't show the paper wrapper or title (handled by parent)
    if (isInPanel) {
        return <Markdown>{result}</Markdown>;
    }

    // Traditional standalone display for mobile
    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h4" gutterBottom>
                Comparison Result
            </Typography>
            <Markdown>{result}</Markdown>
        </Paper>
    );
};

export default ComparisonResult; 