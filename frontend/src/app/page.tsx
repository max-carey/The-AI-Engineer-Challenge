'use client';

import { useState, useRef, useEffect } from 'react';
import { Fragment } from 'react';

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [developerMessage, setDeveloperMessage] = useState('You are a helpful AI assistant.');
  const [showSettings, setShowSettings] = useState(false);
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
      console.log('Making request to:', `${apiUrl}/api/chat`);
      console.log('Request payload:', {
        developer_message: developerMessage,
        user_message: userMessage,
        model: model,
        api_key: apiKey.trim(),
      });
      
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

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Network response was not ok: ${response.status} ${errorText}`);
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] text-white font-sans relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-emerald-400/30 to-green-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-green-400/20 to-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Settings Sidebar/Drawer */}
      <div className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 ${showSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} lg:hidden`} onClick={() => setShowSettings(false)} />
      <aside className={`fixed top-0 left-0 h-full w-[90vw] max-w-[340px] bg-white/10 backdrop-blur-2xl border-r border-white/10 z-40 transition-transform duration-300 ${showSettings ? 'translate-x-0' : '-translate-x-[-100%]'} lg:translate-x-0 lg:static lg:w-[340px] lg:block`}>
        <div className="h-full flex flex-col p-8 gap-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🌲</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Forest AI</h1>
          </div>
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <label className="text-xs text-gray-300">API Key</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." className="w-full h-12 bg-white/10 border-none rounded-lg px-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all" />
            </div>
            <div>
              <label className="text-xs text-gray-300">Model</label>
              <select value={model} onChange={e => setModel(e.target.value)} className="w-full h-12 bg-white/10 border-none rounded-lg px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all">
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-300">System Prompt</label>
              <textarea value={developerMessage} onChange={e => setDeveloperMessage(e.target.value)} placeholder="Set the AI's behavior..." className="w-full h-24 bg-white/10 border-none rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all resize-none" />
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-white/10 text-xs text-gray-400">Powered by OpenAI</div>
        </div>
      </aside>

      {/* Settings FAB for mobile */}
      <button onClick={() => setShowSettings(true)} className="lg:hidden fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-xl p-4 transition-all">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
      </button>

      {/* Main Content */}
      <main className="relative flex flex-col lg:flex-row min-h-screen z-10 w-full">
        {/* Sidebar space for desktop */}
        <div className="hidden lg:block w-[340px] flex-shrink-0" />
        {/* Chat Area */}
        <section className="flex-1 flex flex-col justify-end w-full min-h-screen px-0 lg:px-0 pb-24 pt-8">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-8 px-4 lg:px-16 xl:px-32 2xl:px-64 pb-2">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 opacity-80">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 mx-auto flex items-center justify-center shadow-xl">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h2 className="text-2xl font-bold">Welcome to Forest AI</h2>
                  <p className="text-gray-400 max-w-sm mx-auto">Enter your API key in the settings panel to start chatting.</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}> 
                  <div className={`flex items-end gap-3 max-w-[70vw] md:max-w-[40vw] lg:max-w-[32vw] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-lg font-bold shadow-md shrink-0`}>{message.role === 'user' ? 'U' : 'A'}</div>
                    <div className={`rounded-2xl px-6 py-4 text-lg leading-relaxed ${message.role === 'user' ? 'bg-emerald-500 text-white rounded-br-md' : 'bg-white/10 text-white/90 rounded-bl-md'}`}>{message.content}</div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="flex items-end gap-3 max-w-[70vw] md:max-w-[40vw] lg:max-w-[32vw]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-lg font-bold shadow-md">A</div>
                  <div className="bg-white/10 rounded-2xl px-6 py-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150" />
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 right-0 lg:left-[340px] z-20 bg-white/10 backdrop-blur-xl border-t border-white/10 flex items-center gap-4 px-4 lg:px-16 xl:px-32 2xl:px-64 py-4 w-full">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 h-14 bg-white/20 border-none rounded-xl px-6 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 text-lg transition-all"
              disabled={isLoading || !apiKey.trim()}
            />
            <button
              type="submit"
              disabled={isLoading || !apiKey.trim()}
              className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-white text-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 whitespace-nowrap shadow-lg"
            >
              <span>Send</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-4-4l4 4-4 4" />
              </svg>
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
