import React, { useState, useCallback } from 'react';
import { Paper, Typography, Box, Button, CircularProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReactMarkdown from 'react-markdown';
import { ComparisonQueryParams } from '../../types/f1';
import { compareDrivers } from '../../services/api';

interface AIAnalysisPanelProps {
    params: ComparisonQueryParams | null;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ params }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        if (!params) return;

        setLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const result = await compareDrivers({
                year: params.year,
                grand_prix: params.gp,
                session: params.session,
                driver1: params.driver1,
                driver2: params.driver2,
            });
            // The API may return a string directly or an object with .analysis
            const text = typeof result === 'string' ? result : (result as any)?.analysis || JSON.stringify(result);
            setAnalysis(text);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate AI analysis');
        } finally {
            setLoading(false);
        }
    }, [params]);

    return (
        <Paper sx={{ p: 2, height: '100%', minHeight: 350 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">AI Analysis</Typography>
                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
                    onClick={handleAnalyze}
                    disabled={!params || loading}
                    size="small"
                >
                    {loading ? 'Analyzing...' : 'Analyze'}
                </Button>
            </Box>

            {!params && (
                <Typography variant="body2" sx={{ color: '#8b8b9e', py: 4, textAlign: 'center' }}>
                    Submit a comparison to enable AI analysis.
                </Typography>
            )}

            {error && (
                <Box sx={{ py: 2 }}>
                    <Typography color="error">{error}</Typography>
                </Box>
            )}

            {analysis && (
                <Box
                    sx={{
                        maxHeight: 400,
                        overflow: 'auto',
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                            mt: 2,
                            mb: 1,
                            fontWeight: 600,
                            color: '#e4e4e7',
                        },
                        '& p': {
                            mb: 1.5,
                            color: '#e4e4e7',
                            lineHeight: 1.6,
                        },
                        '& ul, & ol': {
                            pl: 2,
                            mb: 1.5,
                            color: '#e4e4e7',
                        },
                        '& code': {
                            fontFamily: '"JetBrains Mono", monospace',
                            bgcolor: '#1a1b25',
                            px: 0.5,
                            borderRadius: 0.5,
                        },
                        '& strong': {
                            color: '#3b82f6',
                        },
                    }}
                >
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                </Box>
            )}

            {!analysis && !error && params && !loading && (
                <Typography variant="body2" sx={{ color: '#8b8b9e', py: 4, textAlign: 'center' }}>
                    Click "Analyze" to get AI-powered insights on this comparison.
                </Typography>
            )}
        </Paper>
    );
};

export default AIAnalysisPanel;
