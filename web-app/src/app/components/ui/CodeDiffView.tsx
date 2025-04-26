import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { diffLines } from 'diff';

interface CodeDiffViewProps {
  originalCode: string;
  suggestedCode: string;
  language: string;
  message?: string;
  isDarkMode: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const CodeDiffView: React.FC<CodeDiffViewProps> = ({
  originalCode,
  suggestedCode,
  language,
  message,
  isDarkMode,
  onAccept,
  onReject,
}) => {
  const codeStyle = isDarkMode ? tomorrow : oneLight;
  const normalizedLanguage = normalizeLanguage(language);
  
  // Generate the diff between original and suggested code
  const differences = diffLines(originalCode, suggestedCode);
  
  return (
    <Box 
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 2, 
          mb: 2, 
          backgroundColor: isDarkMode ? 'rgba(42,42,42,0.95)' : 'rgba(255,255,255,0.95)',
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Code Suggestion
        </Typography>
        
        {message && (
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 2, 
              fontStyle: 'italic',
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' 
            }}
          >
            {message}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button 
            variant="outlined" 
            color="error" 
            size="small" 
            onClick={onReject}
            startIcon={<CloseIcon />}
          >
            Reject
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            size="small" 
            onClick={onAccept}
            startIcon={<CheckIcon />}
          >
            Accept
          </Button>
        </Box>
      </Paper>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Paper
          sx={{
            overflow: 'auto',
            backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f8f8',
            height: '100%',
          }}
        >
          <Box sx={{ padding: '0.5rem' }}>
            {differences.map((part, index) => (
              <div key={index}>
                {part.added && (
                  <div
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(0, 100, 0, 0.3)' : 'rgba(0, 200, 0, 0.15)',
                      padding: '2px 0',
                      position: 'relative',
                      borderLeft: '3px solid',
                      borderColor: '#4caf50',
                      paddingLeft: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <SyntaxHighlighter
                      language={normalizedLanguage}
                      style={codeStyle}
                      customStyle={{
                        margin: 0,
                        padding: '5px',
                        backgroundColor: 'transparent',
                        borderRadius: 0,
                      }}
                    >
                      {part.value}
                    </SyntaxHighlighter>
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        right: '5px',
                        top: '0',
                        color: isDarkMode ? '#4caf50' : '#2e7d32',
                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                        padding: '0 4px',
                        borderRadius: '2px',
                      }}
                    >
                      + Added
                    </Typography>
                  </div>
                )}
                {part.removed && (
                  <div
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(100, 0, 0, 0.3)' : 'rgba(200, 0, 0, 0.15)',
                      padding: '2px 0',
                      position: 'relative',
                      borderLeft: '3px solid',
                      borderColor: '#f44336',
                      paddingLeft: '8px',
                      marginBottom: '4px',
                      textDecoration: 'line-through',
                      opacity: 0.7,
                    }}
                  >
                    <SyntaxHighlighter
                      language={normalizedLanguage}
                      style={codeStyle}
                      customStyle={{
                        margin: 0,
                        padding: '5px',
                        backgroundColor: 'transparent',
                        borderRadius: 0,
                        textDecoration: 'line-through',
                        opacity: 0.7,
                      }}
                    >
                      {part.value}
                    </SyntaxHighlighter>
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        right: '5px',
                        top: '0',
                        color: isDarkMode ? '#f44336' : '#c62828',
                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                        padding: '0 4px',
                        borderRadius: '2px',
                      }}
                    >
                      - Removed
                    </Typography>
                  </div>
                )}
                {!part.added && !part.removed && (
                  <div>
                    <SyntaxHighlighter
                      language={normalizedLanguage}
                      style={codeStyle}
                      customStyle={{
                        margin: 0,
                        padding: '5px',
                        backgroundColor: 'transparent',
                        borderRadius: 0,
                      }}
                    >
                      {part.value}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

// Helper function to normalize language identifiers
const normalizeLanguage = (language: string): string => {
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
  };

  return languageMap[language.toLowerCase()] || language.toLowerCase();
};

export default CodeDiffView;