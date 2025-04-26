"use client"

import { Box, Paper, Typography, Button } from "@mui/material"
import ThumbUpIcon from "@mui/icons-material/ThumbUp"
import ThumbDownIcon from "@mui/icons-material/ThumbDown"

interface CodeDiffViewProps {
  originalCode: string
  suggestedCode: string
  language: string
  title?: string
  message?: string
  isDarkMode?: boolean
  onAccept?: () => void
  onReject?: () => void
}

export default function CodeDiffView({
  originalCode,
  suggestedCode,
  message,
  isDarkMode = false,
  onAccept,
  onReject,
}: CodeDiffViewProps) {
  // Modified diff highlighting to show suggested changes on top of the original code
  const highlightDifferences = () => {
    const originalLines = originalCode.split('\n')
    const suggestedLines = suggestedCode.split('\n')
    
    const maxLines = Math.max(originalLines.length, suggestedLines.length)
    const result = []
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || ''
      const suggestedLine = suggestedLines[i] || ''
      
      if (originalLine !== suggestedLine) {
        result.push(
          <Box key={`line-${i}`} sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: 1 }}>
            {/* Suggested line (shown on top) */}
            <Box 
              component="span" 
              sx={{ 
                backgroundColor: 'rgba(80, 200, 120, 0.2)', 
                display: 'block',
                width: '100%',
                px: 1,
                py: 0.5,
                borderLeft: '3px solid #50c878',
                position: 'relative',
                '&::before': {
                  content: '"+  "',
                  color: '#50c878',
                  fontWeight: 'bold',
                }
              }}
            >
              {suggestedLine}
            </Box>
            
            {/* Original line (shown below) */}
            <Box 
              component="span" 
              sx={{ 
                backgroundColor: 'rgba(255, 80, 80, 0.2)', 
                display: 'block',
                width: '100%',
                px: 1,
                py: 0.5,
                borderLeft: '3px solid #ff5050',
                position: 'relative',
                '&::before': {
                  content: '"-  "',
                  color: '#ff5050',
                  fontWeight: 'bold',
                }
              }}
            >
              {originalLine}
            </Box>
          </Box>
        )
      } else {
        result.push(
          <div key={`line-${i}`} style={{ padding: '3px 0' }}>
            {suggestedLine}
          </div>
        )
      }
    }
    
    return result
  }

  return (
    <Paper
      elevation={3}
      sx={{
        overflow: "hidden",
        borderRadius: 2,
        border: "1px solid",
        borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        background: isDarkMode ? "#252525" : "#f8f9fa",
        marginTop: 1,
        marginBottom: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: isDarkMode
            ? "linear-gradient(90deg, rgba(80,200,120,0.2) 0%, rgba(147,112,219,0.2) 100%)"
            : "linear-gradient(90deg, rgba(80,200,120,0.1) 0%, rgba(147,112,219,0.1) 100%)",
          borderBottom: "1px solid",
          borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: "monospace",
              color: isDarkMode ? "#e0e0e0" : "text.secondary",
              fontWeight: 600,
            }}
          >
          </Typography>
        </Box>
      </Box>
      
      {message && (
        <Box
          sx={{
            padding: "8px 16px",
            backgroundColor: isDarkMode ? "rgba(80,200,120,0.1)" : "rgba(80,200,120,0.05)",
            borderBottom: "1px solid",
            borderColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: "italic", color: isDarkMode ? "#b0b0b0" : "#666" }}>
            {message}
          </Typography>
        </Box>
      )}
      
      <Box
        sx={{
          padding: 2,
          background: isDarkMode ? "#1e1e1e" : "#282c34",
          overflowX: "auto",
          overflowY: "auto", // Added vertical scrolling
          maxHeight: "400px", // Added maximum height to enable scrolling
          fontFamily: "monospace",
          fontSize: "0.875rem",
          color: "#abb2bf",
          position: "relative",
          lineHeight: 1.5,
        }}
      >
        <pre style={{ margin: 0 }}>
          {highlightDifferences()}
        </pre>
      </Box>
      
      <Box
        sx={{
          padding: 1,
          display: "flex",
          justifyContent: "flex-end",
          borderTop: "1px solid",
          borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          gap: 1,
        }}
      >
        <Button
          size="small"
          startIcon={<ThumbDownIcon />}
          onClick={onReject}
          sx={{
            textTransform: "none",
            color: isDarkMode ? "#e0e0e0" : "text.secondary",
          }}
        >
          Reject
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<ThumbUpIcon />}
          onClick={onAccept}
          sx={{
            textTransform: "none",
            background: "linear-gradient(90deg, #50c878 0%, #4CAF50 100%)",
            color: "white",
          }}
        >
          Accept Suggestion
        </Button>
      </Box>
    </Paper>
  )
}