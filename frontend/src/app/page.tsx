'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [developerMessage, setDeveloperMessage] = useState('You are a helpful AI assistant.');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          model: model,
          api_key: apiKey.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let assistantMessage = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        assistantMessage += text;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = assistantMessage;
            return [...newMessages];
          } else {
            return [...newMessages, { role: 'assistant', content: assistantMessage }];
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800">
      {/* Header */}
      <header className="bg-green-950/50 backdrop-blur-sm border-b border-green-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-green-100">Forest AI Assistant</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-green-950/30 backdrop-blur-sm rounded-lg shadow-lg border border-green-800/50 p-6 h-[calc(100vh-12rem)] flex flex-col">
          {/* Settings */}
          <div className="mb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-green-100 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="w-full rounded-lg bg-green-900/50 border border-green-700 text-green-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-400/50"
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-green-100 mb-1">
                  Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg bg-green-900/50 border border-green-700 text-green-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="developerMessage" className="block text-sm font-medium text-green-100 mb-1">
                System Prompt
              </label>
              <textarea
                id="developerMessage"
                value={developerMessage}
                onChange={(e) => setDeveloperMessage(e.target.value)}
                placeholder="Enter the system prompt..."
                className="w-full rounded-lg bg-green-900/50 border border-green-700 text-green-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-400/50 h-20 resize-none"
              />
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-900/50 text-green-100 border border-green-800/50'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-green-900/50 text-green-100 rounded-lg px-4 py-2 border border-green-800/50">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg bg-green-900/50 border border-green-700 text-green-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-400/50"
              disabled={isLoading || !apiKey.trim()}
            />
            <button
              type="submit"
              disabled={isLoading || !apiKey.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:hover:bg-green-600"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
