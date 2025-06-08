import React from 'react';
import { Paper, Typography } from '@mui/material';
import Markdown from 'react-markdown';

interface ComparisonResultProps {
    result: string;
}

const ComparisonResult: React.FC<ComparisonResultProps> = ({ result }) => {
    if (!result) return null;

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