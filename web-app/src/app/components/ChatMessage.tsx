interface Message {
    role: 'user' | 'assistant';
    content: string;
  }
  
  interface ChatMessageProps {
    message: Message;
  }


export default function ChatMessage({ message } : ChatMessageProps) {
    const isUser = message.role === 'user'
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div 
          className={`p-3 rounded-lg max-w-[80%] ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          {message.content}
        </div>
      </div>
    );
  }