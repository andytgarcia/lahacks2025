"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CodeIcon from "@mui/icons-material/Code";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { AutoAwesome } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@/lib/theme-context";
import CodeEditor from "@/app/components/ui/code-editor";
import CodeDiffView from "@/app/components/ui/CodeDiffView";
import CodeSandbox from "@/app/components/code-sandbox";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "next/navigation";

type Message = {
  role: string;
  content: string;
  timestamp: Date;
  isCode?: boolean;
  language?: string;
  codeSuggestions?: Array<{
    code: string;
    language: string;
    description?: string;
    fileId?: string;
  }>;
};

export default function ChatWindow() {
  // Update the message interface to include potential code suggestions
  const searchParams = useSearchParams();

  const repoName = useMemo(() => searchParams.get("repo"), [searchParams]);
  const prNumber = useMemo(() => searchParams.get("pr"), [searchParams]);
  const owner = useMemo(() => searchParams.get("owner"), [searchParams]);

  const { mode, toggleTheme } = useTheme();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const [codeFiles, setCodeFiles] = useState([
    {
      id: "file1",
      name: "index.js",
      language: "javascript",
      content: "// Your code here\nconsole.log('Hello, world!');",
    },
    {
      id: "file2",
      name: "styles.css",
      language: "css",
      content:
        "body {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 20px;\n  border-radius: 8px;\n  background-color: white;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n}",
    },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeSandbox, setActiveSandbox] = useState("sandbox1");
  const [sandboxes, setSandboxes] = useState<{
    [key: string]: {
      name: string;
      files: string[];
      activeFile: string;
    };
  }>({
    sandbox1: {
      name: "Main Sandbox",
      files: ["file1", "file2"],
      activeFile: "file1",
    },
  });
  // New state for code suggestions
  const [codeSuggestion, setCodeSuggestion] = useState<{
    fileId: string;
    originalCode: string;
    suggestedCode: string;
    language: string;
    message?: string;
    isActive: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const localStorageKey = useMemo(
    () => `geminiChatMessages-${repoName}-${prNumber}-${owner}`,
    [repoName, prNumber, owner]
  );

  // Function to process code suggestions
  const processCodeSuggestion = useCallback(
    (suggestion: { code: string; language: string; description?: string }) => {
      // Try to find a suitable file based on language
      let targetFileId = "";

      // Match file by language
      const findFileByLanguage = codeFiles.find((file) => {
        const fileLanguage = file.language.toLowerCase();
        const suggestionLanguage = suggestion.language.toLowerCase();

        return (
          fileLanguage === suggestionLanguage ||
          (fileLanguage === "javascript" && suggestionLanguage === "js") ||
          (fileLanguage === "typescript" && suggestionLanguage === "ts") ||
          (fileLanguage === "jsx" && suggestionLanguage.includes("jsx")) ||
          (fileLanguage === "tsx" && suggestionLanguage.includes("tsx"))
        );
      });

      if (findFileByLanguage) {
        targetFileId = findFileByLanguage.id;
      } else {
        // If no matching file found, we'll use the active file in the current sandbox
        const currentSandbox = sandboxes[activeSandbox];
        targetFileId = currentSandbox.activeFile;
      }

      // Set up the code suggestion with the found file
      const currentFile = codeFiles.find((file) => file.id === targetFileId);

      if (currentFile) {
        setCodeSuggestion({
          fileId: targetFileId,
          originalCode: currentFile.content,
          suggestedCode: suggestion.code,
          language: suggestion.language,
          message: suggestion.description,
          isActive: true,
        });
      } else {
        // If we can't find a suitable file, create a new file
        const fileExtension = getFileExtensionFromLanguage(suggestion.language);
        const newFileName = `suggestion.${fileExtension}`;
        const newFileId = `file${codeFiles.length + 1}`;

        // Add to files
        setCodeFiles((prev) => [
          ...prev,
          {
            id: newFileId,
            name: newFileName,
            language: suggestion.language,
            content: "", // Empty original content since it's a new file
          },
        ]);

        // Add to current sandbox
        const updatedSandboxes = { ...sandboxes };
        updatedSandboxes[activeSandbox].files.push(newFileId);
        updatedSandboxes[activeSandbox].activeFile = newFileId;
        setSandboxes(updatedSandboxes);

        // Set the suggestion for the new file
        setCodeSuggestion({
          fileId: newFileId,
          originalCode: "",
          suggestedCode: suggestion.code,
          language: suggestion.language,
          message: suggestion.description,
          isActive: true,
        });
      }
    },
    [codeFiles, sandboxes, activeSandbox]
  );

  const handleSendMessage = useCallback(
    async (dontSave?: boolean, message?: string) => {
      if (!input.trim() && !message) return;

      // Add user message
      const userMessage = {
        role: "user",
        content: message || input,
        timestamp: new Date(),
      };
      if (!dontSave) {
        setMessages((prev) => [...prev, userMessage]);
      }
      setInput("");
      setIsLoading(true);

      console.log(userMessage);

      try {
        // Format messages for the API
        const formattedMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch("/api/geminichat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message || input,
            messages: formattedMessages, // Include chat history
            repo: repoName,
            prNumber: prNumber,
            owner: owner,
          }),
        });

        console.log("response", response);

        if (!response.ok) {
          throw new Error("Failed to get response from Gemini");
        }

        const data = await response.json();

        console.log("data", data);

        // Add assistant's response to messages
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.result.text || "Sorry, I couldn't process that request.",
            timestamp: new Date(),
            // Add code suggestions if they exist
            ...(data.result.codeSuggestions && {
              codeSuggestions: data.result.codeSuggestions,
            }),
          },
        ]);

        // If there are code suggestions, process the first one immediately
        if (
          data.result.codeSuggestions &&
          data.result.codeSuggestions.length > 0
        ) {
          processCodeSuggestion(data.result.codeSuggestions[0]);
        }
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, there was an error processing your request.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, input, owner, prNumber, repoName, processCodeSuggestion]
  );

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(localStorageKey);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert string timestamps back to Date objects
        const messagesWithDates = parsedMessages.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error("Error loading messages from localStorage:", error);
        // If there's an error, start with the default message
        setMessages([
          {
            role: "assistant",
            content:
              "Hi there! I'm your coding assistant. How can I help you today?",
            timestamp: new Date(),
          },
        ]);
      }
    } else {
      if (!messages.length) {
        console.log("No messages found, getting first message");
        async function getFirstMessage() {
          await handleSendMessage(true, "Please tell me how my code looks");
        }
        getFirstMessage();
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!messages.length) return;
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages, localStorageKey]);

  // Add a function to clear chat history
  const clearChatHistory = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi there! I'm your coding assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
    localStorage.removeItem(localStorageKey);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper function to get file extension from language
  const getFileExtensionFromLanguage = (language: string): string => {
    const languageMap: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      jsx: "jsx",
      tsx: "tsx",
      python: "py",
      ruby: "rb",
      java: "java",
      html: "html",
      css: "css",
      json: "json",
    };

    return languageMap[language.toLowerCase()] || "js";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCodeChange = (value: string) => {
    const currentSandbox = sandboxes[activeSandbox];
    const currentFileId = currentSandbox.activeFile;
    const fileIndex = codeFiles.findIndex((file) => file.id === currentFileId);

    if (fileIndex !== -1) {
      const updatedFiles = [...codeFiles];
      updatedFiles[fileIndex].content = value;
      setCodeFiles(updatedFiles);
    }
  };

  // const executeCode = () => {
  //   setIsExecuting(true)
  //   setConsoleOutput("Executing code...\n")

  //   // Get current file
  //   const currentSandbox = sandboxes[activeSandbox]
  //   const currentFileId = currentSandbox.activeFile
  //   const currentFile = codeFiles.find((file) => file.id === currentFileId)
  //   if (!currentFile) return

  //   // Simulate code execution
  //   setTimeout(() => {
  //     try {
  //       let output = ""

  //       if (currentFile.language === "javascript" || currentFile.language === "jsx") {
  //         output = "✅ Code executed successfully!\n\n"

  //         if (currentFile.content.includes("console.log")) {
  //           const logMatches = currentFile.content.match(/console\.log$$['"](.+?)['"]$$/g)
  //           if (logMatches) {
  //             logMatches.forEach((match) => {
  //               const content = match.match(/console\.log$$['"](.+?)['"]$$/)?.[1] ?? ""
  //               output += `> ${content}\n`
  //             })
  //           } else {
  //             output += "> Hello, world!\n"
  //           }
  //         } else {
  //           output += "> Function defined successfully\n"
  //         }

  //         if (currentFile.content.includes("Button")) {
  //           output += "> Component rendered\n"
  //         }
  //       } else {
  //         output = "✅ File processed successfully!\n"
  //       }

  //       setConsoleOutput((prev) => prev + output)
  //     } catch (error) {
  //       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
  //       setConsoleOutput((prev) => prev + `❌ Error: ${errorMessage}\n`)
  //     }

  //     setIsExecuting(false)
  //   }, 1500)
  // }

  const addCodeToSandbox = (code: string, language: string) => {
    // Create a new file
    const newFileId = `file${codeFiles.length + 1}`;
    const fileName =
      language === "jsx"
        ? "Component.jsx"
        : language === "javascript"
        ? "script.js"
        : language === "css"
        ? "styles.css"
        : "file.txt";

    // Add to files
    setCodeFiles((prev) => [
      ...prev,
      {
        id: newFileId,
        name: fileName,
        language,
        content: code,
      },
    ]);

    // Add to current sandbox
    const updatedSandboxes = { ...sandboxes };
    updatedSandboxes[activeSandbox].files.push(newFileId);
    updatedSandboxes[activeSandbox].activeFile = newFileId;
    setSandboxes(updatedSandboxes);
  };

  const createNewSandbox = () => {
    const newSandboxId = `sandbox${Object.keys(sandboxes).length + 1}`;
    const newFileId = `file${codeFiles.length + 1}`;

    // Create a new file
    setCodeFiles((prev) => [
      ...prev,
      {
        id: newFileId,
        name: "main.js",
        language: "javascript",
        content: "// New sandbox\nconsole.log('Hello from new sandbox!');",
      },
    ]);

    // Create new sandbox
    setSandboxes((prev) => ({
      ...prev,
      [newSandboxId]: {
        name: `Sandbox ${Object.keys(sandboxes).length + 1}`,
        files: [newFileId],
        activeFile: newFileId,
      },
    }));

    setActiveSandbox(newSandboxId);
  };

  // Get current file content
  const getCurrentFileContent = () => {
    const currentSandbox = sandboxes[activeSandbox];
    if (!currentSandbox) return "";

    const currentFileId = currentSandbox.activeFile;
    const currentFile = codeFiles.find((file) => file.id === currentFileId);
    return currentFile ? currentFile.content : "";
  };

  // Get current file language
  const getCurrentFileLanguage = () => {
    const currentSandbox = sandboxes[activeSandbox];
    if (!currentSandbox) return "javascript";

    const currentFileId = currentSandbox.activeFile;
    const currentFile = codeFiles.find((file) => file.id === currentFileId);
    return currentFile ? currentFile.language : "javascript";
  };

  // Get files for current sandbox
  const getCurrentSandboxFiles = () => {
    const currentSandbox = sandboxes[activeSandbox];
    if (!currentSandbox) return [];
    return currentSandbox.files
      .map((fileId) => codeFiles.find((file) => file.id === fileId))
      .filter(
        (
          file
        ): file is {
          id: string;
          name: string;
          language: string;
          content: string;
        } => file !== undefined
      );
  };

  const getCodeHeaderGradient = () => {
    return mode === "light"
      ? "linear-gradient(90deg, #6B66FF 0%, #9370DB 100%)"
      : "linear-gradient(90deg, #5550E3 0%, #7952D1 100%)";
  };

  /* CHANGE */

  // Function to demonstrate code suggestion feature
  const generateSampleSuggestion = () => {
    // Get current file content
    const currentSandbox = sandboxes[activeSandbox];
    const currentFileId = currentSandbox.activeFile;
    const currentFile = codeFiles.find((file) => file.id === currentFileId);

    if (!currentFile) return;

    // Create a sample suggestion
    let suggestedCode = currentFile.content;

    // Make different suggestions based on file type
    if (
      currentFile.language === "javascript" ||
      currentFile.language === "jsx"
    ) {
      // Suggest adding comments and improving variable names
      if (suggestedCode.includes("console.log")) {
        suggestedCode = suggestedCode.replace(
          /console\.log\((.*)\)/g,
          "// Output the result to console\nconsole.log($1) // Consider using more descriptive logging"
        );
      } else {
        // Add a sample function with good practices
        suggestedCode +=
          "\n\n/**\n * Calculate sum of two numbers\n * @param {number} a - First number\n * @param {number} b - Second number\n * @returns {number} Sum of a and b\n */\nfunction calculateSum(a, b) {\n  return a + b;\n}\n";
      }
    } else if (currentFile.language === "css") {
      // Suggest using variables and better practices
      suggestedCode = suggestedCode.replace(
        /background: linear-gradient.*;/g,
        "/* Use CSS variables for consistent theming */\n--primary-gradient: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);\nbackground: var(--primary-gradient);"
      );
    }

    // Set the suggestion
    setCodeSuggestion({
      fileId: currentFileId,
      originalCode: currentFile.content,
      suggestedCode: suggestedCode,
      language: currentFile.language,
      isActive: true,
    });
  };

  const handleInlineSuggestion = (suggestion: {
    fileId: string;
    originalCode: string;
    suggestedCode: string;
    language: string;
    message?: string;
  }) => {
    // Update the code in the sandbox
    const fileIndex = codeFiles.findIndex(
      (file) => file.id === suggestion.fileId
    );
    if (fileIndex !== -1) {
      const updatedFiles = [...codeFiles];
      updatedFiles[fileIndex].content = suggestion.suggestedCode;
      setCodeFiles(updatedFiles);
    }

    // Add a message to the chat indicating the suggestion was accepted
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `The code suggestion has been applied to ${
          codeFiles.find((f) => f.id === suggestion.fileId)?.name ||
          suggestion.fileId
        }.`,
        timestamp: new Date(),
      },
    ]);

    // Clear the active suggestion
    setCodeSuggestion(null);
  };

  const messagesStartRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    messagesStartRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        overflow: "hidden",
        background:
          mode === "light"
            ? "linear-gradient(135deg, #FF6B6B 0%, #6B66FF 50%, #FF9E2C 100%)"
            : "linear-gradient(135deg, #CC4B4B 0%, #4B46CC 50%, #CC7E0C 100%)",
      }}
    >
      {/* Chat panel - 60% */}
      <Box
        sx={{
          width: "60%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRight: 1,
          borderColor:
            mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">Chat With Mr. Gemini !</Typography>
          <Box>
            <IconButton onClick={clearChatHistory} title="Clear chat history">
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={toggleTheme}>
              {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Messages area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            padding: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            backgroundColor: mode === "light" ? "#f9fafc" : "#1a1a1a",
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent:
                  message.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 1,
                opacity: 1,
                animation: "fadeIn 0.5s ease-in-out",
                "@keyframes fadeIn": {
                  "0%": { opacity: 0, transform: "translateY(10px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {/* Message content */}
              <Paper
                elevation={3}
                sx={{
                  maxWidth: "85%",
                  padding: 3,
                  borderRadius:
                    message.role === "user"
                      ? "18px 18px 6px 18px"
                      : "18px 18px 18px 6px",
                  background:
                    message.role === "user"
                      ? "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)"
                      : mode === "light"
                      ? "linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%)"
                      : "linear-gradient(135deg, #2e2e2e 0%, #1f1f1f 100%)",
                  color: message.role === "user" ? "white" : "inherit",
                  position: "relative",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  "&::before":
                    message.role === "user"
                      ? {
                          content: '""',
                          position: "absolute",
                          bottom: 0,
                          right: "-8px",
                          width: "18px",
                          height: "18px",
                          background:
                            "linear-gradient(135deg, transparent 50%, #4A00E0 50%)",
                          transform: "rotate(45deg)",
                          borderRadius: "0 0 5px 0",
                        }
                      : {},
                  "&::after":
                    message.role === "assistant"
                      ? {
                          content: '""',
                          position: "absolute",
                          bottom: 0,
                          left: "-8px",
                          width: "18px",
                          height: "18px",
                          background:
                            mode === "light"
                              ? "linear-gradient(135deg, #ffffff 50%, transparent 50%)"
                              : "linear-gradient(135deg, #1f1f1f 50%, transparent 50%)",
                          transform: "rotate(45deg)",
                          borderRadius: "0 0 0 5px",
                        }
                      : {},
                }}
              >
                {message.role === "assistant" && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                      gap: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        background:
                          "linear-gradient(135deg, #FF6B6B 0%, #9370DB 50%, #FF9E2C 100%)",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      G
                    </Avatar>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: mode === "light" ? "#555" : "#ddd",
                      }}
                    >
                      Google Gemini
                    </Typography>
                  </Box>
                )}

                {message.isCode && message.language ? (
                  <Box sx={{ position: "relative" }}>
                    <CodeSandbox
                      code={message.content}
                      language={message.language}
                      isDarkMode={mode === "dark"}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() =>
                        addCodeToSandbox(
                          message.content,
                          message.language || "javascript"
                        )
                      }
                      sx={{
                        position: "absolute",
                        bottom: 12,
                        right: 12,
                        background:
                          "linear-gradient(90deg, #FF6B6B 0%, #9370DB 100%)",
                        fontSize: "0.7rem",
                        py: 0.5,
                        borderRadius: 2,
                        textTransform: "none",
                        "&:hover": {
                          background:
                            "linear-gradient(90deg, #FF6B6B 20%, #9370DB 80%)",
                        },
                      }}
                    >
                      Try in Sandbox
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      "& pre": {
                        backgroundColor:
                          mode === "light" ? "#f0f0f5" : "#242424",
                        padding: "1rem",
                        borderRadius: "8px",
                        overflowX: "auto",
                        fontSize: "0.95rem",
                      },
                      "& code": {
                        fontFamily: "Fira Code, monospace",
                        fontSize: "0.9rem",
                      },
                      "& p": {
                        margin: "0.75em 0",
                        lineHeight: 1.6,
                      },
                      "& ul, & ol": {
                        paddingLeft: "1.5em",
                        margin: "0.75em 0",
                      },
                      "& h1, & h2, & h3, & h4, & h5, & h6": {
                        margin: "1.25em 0 0.75em 0",
                        fontWeight: 700,
                      },
                      "& blockquote": {
                        borderLeft: "4px solid #9370DB",
                        paddingLeft: "1em",
                        margin: "1em 0",
                        color: mode === "light" ? "#555" : "#aaa",
                        fontStyle: "italic",
                      },
                    }}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </Box>
                )}

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "right",
                    marginTop: 2,
                    opacity: 0.7,
                    color:
                      message.role === "user"
                        ? "rgba(255,255,255,0.85)"
                        : mode === "light"
                        ? "#999"
                        : "#aaa",
                    fontSize: "0.75rem",
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Paper>
            </Box>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: 1,
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  padding: 2,
                  borderRadius: "20px 20px 20px 5px",
                  background: mode === "light" ? "#ffffff" : "#2a2a2a",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CircularProgress size={20} sx={{ color: "#9370DB" }} />
                <Typography
                  variant="body2"
                  sx={{ color: mode === "light" ? "#666" : "#aaa" }}
                >
                  Thinking...
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input area */}
        <Box
          sx={{
            padding: 2,
            borderTop: "1px solid",
            borderColor:
              mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            background: mode === "light" ? "white" : "#2a2a2a",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Google Gemini something..."
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.3s",
                  backgroundColor: mode === "light" ? "white" : "#333",
                  "&:hover": {
                    borderColor: "#9370DB",
                  },
                  "&.Mui-focused": {
                    boxShadow: `0 0 0 2px ${
                      mode === "light"
                        ? "rgba(147,112,219,0.3)"
                        : "rgba(147,112,219,0.5)"
                    }`,
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setInput((prev) => prev + "\n```js\n\n```");
                    }}
                    sx={{ color: "text.secondary" }}
                  >
                    <CodeIcon />
                  </IconButton>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              sx={{
                borderRadius: 2,
                padding: "10px 20px",
                background: "linear-gradient(90deg, #FF6B6B 0%, #9370DB 100%)",
                boxShadow: "0 4px 10px rgba(147,112,219,0.3)",
                transition: "all 0.3s",
                "&:hover": {
                  background:
                    "linear-gradient(90deg, #FF5151 0%, #8A60D0 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 15px rgba(147,112,219,0.4)",
                },
              }}
              startIcon={<SendIcon />}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Code sandbox panel - 40% */}
      <Box
        sx={{
          width: "40%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sandbox tabs */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "16px 24px",
            background: getCodeHeaderGradient(),
            color: "white",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Code Sandboxes
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {Object.entries(sandboxes).map(([id, sandbox]) => (
              <Chip
                key={id}
                label={sandbox.name}
                onClick={() => setActiveSandbox(id)}
                sx={{
                  backgroundColor:
                    activeSandbox === id
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.1)",
                  color: "white",
                  fontWeight: activeSandbox === id ? 600 : 400,
                  borderRadius: "16px",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.25)",
                  },
                }}
              />
            ))}
            <IconButton
              size="small"
              onClick={createNewSandbox}
              sx={{
                color: "white",
                backgroundColor: "rgba(255,255,255,0.1)",
                width: 32,
                height: 32,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Action buttons for code sandbox */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "8px 24px",
            background:
              mode === "light"
                ? "linear-gradient(90deg, rgba(107,102,255,0.05) 0%, rgba(147,112,219,0.05) 100%)"
                : "linear-gradient(90deg, rgba(107,102,255,0.1) 0%, rgba(147,112,219,0.1) 100%)",
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(getCurrentFileContent());
            }}
            sx={{
              background:
                mode === "light"
                  ? "rgba(255,255,255,0.8)"
                  : "rgba(50,50,50,0.8)",
              color: mode === "light" ? "text.secondary" : "#e0e0e0",
              "&:hover": {
                background:
                  mode === "light"
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(60,60,60,0.95)",
              },
            }}
            startIcon={<ContentCopyIcon />}
          >
            Copy
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={generateSampleSuggestion}
            sx={{
              background: "linear-gradient(90deg, #9370DB 0%, #6B66FF 100%)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(90deg, #8360CB 0%, #5B56EF 100%)",
              },
            }}
          >
            <AutoAwesome />
          </Button>
          <Button
            variant="contained"
            size="small"
            // onClick={executeCode}
            disabled={isExecuting}
            sx={{
              background: "linear-gradient(90deg, #FF9E2C 0%, #FF6B6B 100%)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(90deg, #FF8E1C 0%, #FF5B5B 100%)",
              },
            }}
            startIcon={<PlayArrowIcon />}
          >
            Run
          </Button>
        </Box>

        {/* File tabs */}
        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor:
              mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            background:
              mode === "light"
                ? "linear-gradient(90deg, rgba(107,102,255,0.05) 0%, rgba(147,112,219,0.05) 100%)"
                : "linear-gradient(90deg, rgba(107,102,255,0.1) 0%, rgba(147,112,219,0.1) 100%)",
            padding: "8px 16px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {getCurrentSandboxFiles().map((file) => (
              <Chip
                key={file.id}
                label={file.name}
                icon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        file.language === "javascript" ||
                        file.language === "jsx"
                          ? "#F7DF1E"
                          : file.language === "css"
                          ? "#2965F1"
                          : file.language === "html"
                          ? "#E34F26"
                          : "#9370DB",
                      display: "inline-block",
                    }}
                  />
                }
                onClick={() => {
                  const updatedSandboxes = { ...sandboxes };
                  updatedSandboxes[activeSandbox].activeFile = file.id;
                  setSandboxes(updatedSandboxes);
                }}
                sx={{
                  backgroundColor:
                    sandboxes[activeSandbox]?.activeFile === file.id
                      ? mode === "light"
                        ? "rgba(107,102,255,0.1)"
                        : "rgba(107,102,255,0.2)"
                      : "transparent",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  height: 28,
                  borderRadius: "4px",
                  transition: "all 0.2s",
                  color: mode === "light" ? "inherit" : "#e0e0e0",
                  "&:hover": {
                    backgroundColor:
                      mode === "light"
                        ? "rgba(107,102,255,0.05)"
                        : "rgba(107,102,255,0.15)",
                  },
                }}
              />
            ))}
            <IconButton
              size="small"
              onClick={() => {
                const newFileId = `file${codeFiles.length + 1}`;
                setCodeFiles((prev) => [
                  ...prev,
                  {
                    id: newFileId,
                    name: "newfile.js",
                    language: "javascript",
                    content: "// New file\n",
                  },
                ]);

                const updatedSandboxes = { ...sandboxes };
                updatedSandboxes[activeSandbox].files.push(newFileId);
                updatedSandboxes[activeSandbox].activeFile = newFileId;
                setSandboxes(updatedSandboxes);
              }}
              sx={{
                color: "text.secondary",
                width: 24,
                height: 24,
                "&:hover": {
                  backgroundColor:
                    mode === "light"
                      ? "rgba(0,0,0,0.05)"
                      : "rgba(255,255,255,0.05)",
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Code editor */}
        <Box sx={{ flexGrow: 1, overflow: "hidden", position: "relative" }}>
          {/* Show code suggestion if available */}
          {codeSuggestion &&
            codeSuggestion.isActive &&
            codeSuggestion.fileId === sandboxes[activeSandbox]?.activeFile && (
              <CodeDiffView
                originalCode={codeSuggestion.originalCode}
                suggestedCode={codeSuggestion.suggestedCode}
                language={codeSuggestion.language}
                message={codeSuggestion.message}
                isDarkMode={mode === "dark"}
                onAccept={() => {
                  // Update current file content with the suggested code
                  const fileIndex = codeFiles.findIndex(
                    (file) => file.id === codeSuggestion.fileId
                  );
                  if (fileIndex !== -1) {
                    const updatedFiles = [...codeFiles];
                    updatedFiles[fileIndex].content =
                      codeSuggestion.suggestedCode;
                    setCodeFiles(updatedFiles);
                  }
                  // Clear the suggestion
                  setCodeSuggestion(null);
                }}
                onReject={() => {
                  // Just dismiss the suggestion
                  setCodeSuggestion(null);
                }}
              />
            )}

          {/* Only show the editor when there's no active suggestion or if we're viewing a different file */}
          {!codeSuggestion?.isActive ||
          codeSuggestion.fileId !== sandboxes[activeSandbox]?.activeFile ? (
            <CodeEditor
              value={getCurrentFileContent()}
              language={getCurrentFileLanguage()}
              onChange={handleCodeChange}
              isDarkMode={mode === "dark"}
            />
          ) : null}
        </Box>

        {/* Console output */}
        {/* <Box
          sx={{
            height: "30%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderTop: "1px solid",
            borderColor: mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              background: "linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.8) 100%)",
              color: "white",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TerminalIcon sx={{ fontSize: 18, marginRight: 1 }} />
              <Typography variant="subtitle2">Console Output</Typography>
            </Box>
            <IconButton size="small" onClick={() => setConsoleOutput("")} sx={{ color: "rgba(255,255,255,0.7)" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              padding: 2,
              fontFamily: "monospace",
              fontSize: "0.875rem",
              backgroundColor: "#282c34",
              color: "#abb2bf",
              whiteSpace: "pre-wrap",
            }}
          >
            {consoleOutput || "Run your code to see output here..."}
          </Box>
        </Box> */}
      </Box>
    </Box>
  );
}
