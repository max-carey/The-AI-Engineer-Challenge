'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [developerMessage, setDeveloperMessage] = useState('You are a helpful AI assistant.');
  const [showSettings, setShowSettings] = useState(false);
  const [useRag, setUseRag] = useState(false);
  const [isPdfUploaded, setIsPdfUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPdfName, setCurrentPdfName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !apiKey) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);

    try {
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await response.json();
      setIsPdfUploaded(true);
      setUseRag(true);
      setCurrentPdfName(file.name);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `🌲 I've processed your PDF "${file.name}" successfully! I found ${result.chunks} sections to learn from. You can now ask me questions about it.` 
      }]);
    } catch (error) {
      console.error('Upload error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error uploading your PDF.' 
      }]);
    } finally {
      setIsUploading(false);
    }
  };

  const clearPdfContext = () => {
    setIsPdfUploaded(false);
    setUseRag(false);
    setCurrentPdfName('');
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '🌲 PDF context has been cleared. I will no longer use it for answering questions.'
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: developerMessage },
            ...messages,
            { role: 'user', content: userMessage }
          ],
          model: model,
          api_key: apiKey.trim(),
          use_rag: useRag,
        }),
      });

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
      <div 
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 
          ${showSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setShowSettings(false)} 
      />
      <aside 
        className={`fixed top-0 left-0 h-full w-[90vw] max-w-[340px] bg-white/10 backdrop-blur-2xl 
          border-r border-white/10 z-40 transition-transform duration-300 
          ${showSettings ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col p-8 gap-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌲</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Forest AI</h1>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
            <div>
              <label className="text-xs text-gray-300">PDF Upload</label>
              <div className="mt-2 flex flex-col gap-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={!apiKey || isUploading}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className={`w-full h-12 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed 
                    ${isPdfUploaded ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/20 hover:border-white/40'} 
                    cursor-pointer transition-all ${(!apiKey || isUploading) && 'opacity-50 cursor-not-allowed'}`}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>Uploading...</span>
                    </div>
                  ) : isPdfUploaded ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>PDF Uploaded</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Upload PDF</span>
                    </div>
                  )}
                </label>
                {isPdfUploaded && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate">{currentPdfName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="use-rag"
                          checked={useRag}
                          onChange={e => setUseRag(e.target.checked)}
                          className="rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-400/40"
                        />
                        <label htmlFor="use-rag" className="text-sm">Use PDF knowledge</label>
                      </div>
                      <button
                        onClick={clearPdfContext}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Clear PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-white/10 text-xs text-gray-400">Powered by OpenAI</div>
        </div>
      </aside>

      {/* Settings toggle button */}
      <button 
        onClick={() => setShowSettings(true)} 
        className={`fixed top-6 left-6 z-50 bg-emerald-500 hover:bg-emerald-400 
          text-white rounded-xl shadow-xl px-4 py-3 transition-all flex items-center gap-2
          ${showSettings ? 'hidden' : 'block'}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        <span className="text-sm font-medium">Enter API Key</span>
      </button>

      {/* Main Content */}
      <main className="relative flex min-h-screen z-10 w-full">
        {/* Chat Area */}
        <section className={`flex-1 flex flex-col justify-end w-full min-h-screen pb-24 pt-8
          transition-[padding] duration-300
          ${showSettings ? 'lg:pl-[340px]' : 'lg:pl-0'}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-8 px-4 lg:px-16 xl:px-32 2xl:px-64 pb-2">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-6 opacity-80">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 mx-auto flex items-center justify-center shadow-xl">
                    <span className="text-4xl">🌲</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Welcome to Forest AI</h2>
                    {!apiKey.trim() ? (
                      <div className="space-y-4">
                        <p className="text-red-300 max-w-sm mx-auto">Please enter your OpenAI API key to start chatting</p>
                        <button
                          onClick={() => setShowSettings(true)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl px-6 py-3 transition-all flex items-center gap-2 mx-auto"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Open Settings</span>
                        </button>
                        <p className="text-gray-400 text-sm max-w-sm mx-auto mt-4">
                          Don't have an API key? Get one from{' '}
                          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">
                            OpenAI's website
                          </a>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-400 max-w-sm mx-auto">Start typing below to chat with the AI!</p>
                        <button
                          onClick={() => setShowSettings(true)}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-white rounded-xl px-6 py-3 transition-all flex items-center gap-2 mx-auto border border-emerald-500/40"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Upload a PDF to chat about</span>
                        </button>
                      </div>
                    )}
                  </div>
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
          <div className={`fixed bottom-0 z-20 bg-white/10 backdrop-blur-xl border-t border-white/10 w-full
            transition-[left,right] duration-300
            ${showSettings ? 'left-[340px] right-0' : 'left-0 right-0'}`}>
            <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 max-w-[100%] mx-auto">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={useRag ? "Ask me about the PDF..." : "Type your message..."}
                className="flex-1 h-12 bg-white/20 border-none rounded-xl px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 text-base transition-all min-w-0"
                disabled={isLoading || !apiKey.trim()}
              />
              <button
                type="submit"
                disabled={isLoading || !apiKey.trim()}
                className="h-12 px-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-white text-base font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 whitespace-nowrap shadow-lg flex-shrink-0"
              >
                <span className="hidden sm:inline">Send</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-4-4l4 4-4 4" />
                </svg>
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
