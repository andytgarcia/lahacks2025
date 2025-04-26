# CodeMentor - AI-Powered Pull Request Review and Learning Platform

CodeMentor is an interactive platform that leverages Google Gemini's AI capabilities to provide intelligent code review, suggestions, and programming assistance. Built as a comprehensive solution for developers, it offers real-time feedback on code quality, formatting, logic, and performance.

## 🌟 Features

- **AI-Powered Code Assistance**: Chat with Google Gemini to get help with coding issues, best practices, and more
- **Interactive Code Sandbox**: Test and experiment with code snippets in various programming languages
- **Real-time Code Suggestions**: Receive intelligent suggestions to improve your code quality
- **Code Diff View**: Compare original code with suggested improvements
- **Dark/Light Mode Support**: Comfortable viewing experience in any environment
- **GitHub PR Integration**: Analyze and provide feedback on GitHub pull requests
- **Markdown Support**: Rich text formatting in chat messages
- **Code Error Analysis**: Detects formatting, logic, and performance issues

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Google Gemini API key
- (Optional) GitHub token for PR analysis

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CodeMentor.git
cd lahacks2025
```

2. Install dependencies for each component:

```bash
# Web App
cd web-app
npm install

# GitHub Crawler (optional, for PR integration)
cd ../github-crawler
npm install
```

3. Set up environment variables:
   - Create `.env.local` in the `web-app` directory with:
   ```
   GEMINI_KEY=your_gemini_api_key
   GITHUB_TOKEN=your_github_token
   ```

4. Start the development server:
```bash
cd web-app
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to access the application

## 🏗️ Project Structure

- **web-app/**: Next.js application with the main user interface
  - **src/app/**: Core application components
    - **chat/**: Chat interface with Gemini AI
    - **components/**: Reusable components including code editor, sandbox, diff view
    - **api/geminichat/**: API endpoint for Gemini interactions
  - **lib/**: Utility functions and theme context

- **github-crawler/**: Integration with GitHub PRs
  - **src/**: Source code for GitHub interaction
  - **testing/**: Test files

- **gemini-prompts/**: Prompts and shared types for the Gemini AI model

## 💻 Usage

1. **Chat Interface**: Use the chat window to ask coding questions or get feedback on code
2. **Code Sandbox**: Experiment with code snippets in various languages
3. **PR Review**: Enter repository and PR details for automated code review
4. **Code Suggestions**: Accept or reject code improvements suggested by the AI

## 🧰 Technologies

- **Frontend**: Next.js, React, Material-UI
- **AI**: Google Gemini AI
- **Code Analysis**: Custom parsers and diff tools
- **GitHub Integration**: Octokit for GitHub API interaction

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Google Gemini for AI capabilities
- Next.js team for the excellent framework
- All contributors to the project