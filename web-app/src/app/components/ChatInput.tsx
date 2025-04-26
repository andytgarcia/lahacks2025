import { ChangeEvent, FormEvent, useState } from 'react';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled: boolean;
  }

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        disabled={disabled}
        placeholder="Type your message..."
        className="flex-1 rounded-lg p-2 bg-white bg-opacity-10 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}