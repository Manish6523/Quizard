'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Bot, User, Send, Paperclip, XCircle, FileQuestion, FilePlus, FileEdit } from 'lucide-react';

// Main App Component
export default function App() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState('chat'); // 'chat', 'create', 'edit'
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initial greeting message from the bot
  useEffect(() => {
    setMessages([
      {
        sender: 'bot',
        text: 'Hello! I am your AI Document Assistant. You can chat with a PDF, create a new one from a prompt, or edit an existing one.',
      },
    ]);
  }, []);

  // Scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper function to convert a file to a base64 string
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

  // Generic function to call the Gemini API
  const callGeminiAPI = async (prompt, file = null) => {
    try {
      let parts = [{ text: prompt }];
      if (file) {
        const base64Data = await fileToBase64(file);
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        });
      }

      const payload = {
        contents: [{ role: 'user', parts }],
      };

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error('Invalid response structure from the API.');
      }
    } catch (e) {
      console.error('Error calling Gemini API:', e);
      throw e;
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setMessages(prev => [...prev, { sender: 'bot', text: `Attached "${file.name}".` }]);
    }
  };
  
  const handleDownload = (downloadable) => {
    const blob = new Blob([downloadable.content], { type: downloadable.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadable.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAction = async () => {
    if (!userInput.trim() || isProcessing) return;

    const userMessage = { sender: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsProcessing(true);

    try {
      let botResponse;
      let prompt;

      switch (mode) {
        case 'chat':
          if (!uploadedFile) {
            throw new Error('Please upload a PDF file first to chat with it.');
          }
          prompt = `Based on the content of the provided PDF, please answer the following question: "${currentInput}"\n\nIf the answer cannot be found in the document, say "I could not find an answer to that in the document."`;
          const answer = await callGeminiAPI(prompt, uploadedFile);
          botResponse = { sender: 'bot', text: answer };
          break;

        case 'create':
          if (uploadedFile) {
            prompt = `You are a document creation expert specializing in LaTeX. Your task is to perform a style transfer.
            1. First, deeply analyze the style, layout, formatting, fonts, and structure of the attached PDF document.
            2. Next, generate a completely new, well-structured LaTeX document on the following topic: "${currentInput}".
            3. The new document's design MUST mimic the style of the provided PDF as closely as possible.
            4. The output must be only the raw LaTeX code, ready to be compiled. Start with \\documentclass{article} (or a more appropriate class if you can infer it) and end with \\end{document}. Do not include any explanations or markdown.`;
          } else {
            prompt = `You are a document creation expert. Generate a complete, well-structured LaTeX document on the following topic: "${currentInput}". The output must be only the raw LaTeX code, ready to be compiled. Start with \\documentclass{article} and end with \\end{document}.`;
          }
          const latexCode = await callGeminiAPI(prompt, uploadedFile);
          handleDownload({ content: latexCode, filename: 'document.tex', type: 'text/latex' });
          botResponse = {
            sender: 'bot',
            text: 'I have generated the LaTeX code for your document. Your download for the .tex file should start automatically. You can use a site like Overleaf to compile it into a PDF.',
          };
          break;

        case 'edit':
          if (!uploadedFile) {
            throw new Error('Please upload a PDF file first to edit it.');
          }
          prompt = `You are a document editing expert. Analyze the attached PDF. Your task is to rewrite the entire document, applying the following instruction: "${currentInput}". Return only the full, edited text content of the new document. Do not add any commentary.`;
          const editedText = await callGeminiAPI(prompt, uploadedFile);
          handleDownload({ content: editedText, filename: 'edited_document.txt', type: 'text/plain' });
          botResponse = {
            sender: 'bot',
            text: 'I have applied your edits. The download for the revised text should start automatically.',
          };
          break;
        
        default:
          throw new Error("Invalid mode selected.");
      }
      setMessages(prev => [...prev, botResponse]);

    } catch (e) {
      const errorMessage = { sender: 'bot', text: e.message || 'Sorry, I encountered an error. Please try again.', isError: true };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setMessages(prev => [...prev, { sender: 'bot', text: 'File removed.' }]);
  };

  const getPlaceholderText = () => {
    switch(mode) {
        case 'chat': return uploadedFile ? "Ask a question about the PDF..." : "Upload a PDF to start chatting...";
        case 'create': return uploadedFile ? "Describe new doc with style from PDF..." : "Describe the PDF you want to create...";
        case 'edit': return uploadedFile ? "Describe the edits you want to make..." : "Upload a PDF to start editing...";
        default: return "Select a mode to begin...";
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans pt-20">
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 text-center">AI Document Assistant</h1>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && <Bot className={`w-8 h-8 text-white rounded-full p-1.5 flex-shrink-0 ${msg.isError ? 'bg-red-500' : 'bg-indigo-500'}`} />}
              <div className={`rounded-xl p-4 max-w-lg ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white text-gray-700 rounded-bl-none border'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.sender === 'user' && <User className="w-8 h-8 text-white bg-gray-400 rounded-full p-1.5 flex-shrink-0" />}
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-start gap-3 justify-start">
              <Bot className="w-8 h-8 text-white bg-indigo-500 rounded-full p-1.5 flex-shrink-0" />
              <div className="rounded-xl p-4 bg-white text-gray-700 rounded-bl-none border">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 p-4 ">
        <div className="max-w-3xl mx-auto space-y-3">
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-200 p-1">
                <button onClick={() => setMode('chat')} className={`flex justify-center items-center gap-2 p-2 text-sm font-medium rounded-md transition-colors ${mode === 'chat' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-300'}`}><FileQuestion className="w-4 h-4"/> Chat</button>
                <button onClick={() => setMode('create')} className={`flex justify-center items-center gap-2 p-2 text-sm font-medium rounded-md transition-colors ${mode === 'create' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-300'}`}><FilePlus className="w-4 h-4"/> Create</button>
                <button onClick={() => setMode('edit')} className={`flex justify-center items-center gap-2 p-2 text-sm font-medium rounded-md transition-colors ${mode === 'edit' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-300'}`}><FileEdit className="w-4 h-4"/> Edit</button>
            </div>
            {uploadedFile && (mode === 'chat' || mode === 'edit' || mode === 'create') && (
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md text-sm">
                    <div className="flex items-center gap-2"><Paperclip className="w-4 h-4 text-gray-600" /><span className="text-gray-800 font-medium">{uploadedFile.name}</span></div>
                    <button onClick={removeFile} className="p-1 hover:bg-gray-200 rounded-full"><XCircle className="w-5 h-5 text-gray-500" /></button>
                </div>
            )}
          <div className="flex items-center gap-2">
             {(mode === 'chat' || mode === 'edit' || mode === 'create') && (
                <>
                    <input type="file" ref={fileInputRef} className="hidden" id="file-upload" onChange={handleFileChange} accept=".pdf" />
                    <label htmlFor="file-upload" className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full cursor-pointer transition-colors"><Upload className="w-5 h-5 text-gray-600" /></label>
                </>
             )}
            <input
              type="text"
              className="flex-1 w-full p-3 border border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={getPlaceholderText()}
              onKeyDown={(e) => e.key === 'Enter' && handleAction()}
              disabled={isProcessing}
            />
            <button onClick={handleAction} disabled={!userInput.trim() || isProcessing} className="p-3 bg-indigo-600 text-white rounded-full disabled:bg-indigo-300 hover:bg-indigo-700 transition-colors"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </footer>
    </div>
  );
}
