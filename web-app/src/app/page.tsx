// File: app/page.js
'use client';
import { useState, useRef, useEffect } from 'react';
import ChatMessage from '@/app/components/ChatMessage';
import ChatInput from '@/app/components/ChatInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Call your API endpoint
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      

      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-8">
      <div className="z-10 w-full max-w-3xl flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Gemini Chat</h1>
        
        <div className="flex-1 w-full bg-white bg-opacity-10 rounded-lg p-4 overflow-y-auto max-h-[70vh] min-h-[70vh]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-24">
              <p>Start a conversation with Gemini!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-pulse">Gemini is thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </main>
  );
}