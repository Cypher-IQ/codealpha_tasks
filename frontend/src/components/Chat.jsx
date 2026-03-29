import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import { Send, X, MessageSquare, Paperclip, FileText, Download } from 'lucide-react';

const Chat = ({ socket, roomId, isOpen, onClose }) => {
  const { user, token } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    };

    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const msgData = {
      text: input,
      sender: user.username,
      userId: user.id,
      timestamp: new Date().toISOString()
    };

    socket.emit('chat-message', roomId, msgData);
    setInput('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !socket) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const baseUrl = 'http://localhost:5000'; // Make sure this matches your deployed API if changed
      const res = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      const msgData = {
        text: '',
        file: data,
        sender: user.username,
        userId: user.id,
        timestamp: new Date().toISOString()
      };

      socket.emit('chat-message', roomId, msgData);
    } catch (err) {
      console.error("Error uploading file:", err);
      // In production, render a proper toast notification here
      alert("Failed to upload file"); 
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full w-80 bg-dark-900 border-l border-dark-700 flex flex-col absolute right-0 top-0 sm:relative z-40 transform transition-transform duration-300 shadow-2xl">
      
      {/* Header */}
      <div className="p-4 border-b border-dark-700 flex justify-between items-center bg-dark-800">
        <div className="flex items-center gap-2 font-bold">
           <MessageSquare size={18} className="text-primary-500" />
           In-Call Messages
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-dark-700 transition-colors text-dark-500 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 nice-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-dark-600 text-sm italic">
            No messages yet. Be the first to say hi!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.userId === user.id;
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-dark-500 mb-1 px-1">
                  {isMe ? 'You' : msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={`px-4 py-2 text-sm max-w-[90%] ${isMe ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm' : 'bg-dark-700 text-white rounded-2xl rounded-tl-sm'}`}>
                  {msg.text && <p className="mb-1">{msg.text}</p>}
                  {msg.file && (
                     <div className="mt-1">
                        {msg.file.fileType.startsWith('image/') ? (
                           <a href={msg.file.fileUrl} target="_blank" rel="noreferrer">
                             <img src={msg.file.fileUrl} alt={msg.file.fileName} className="max-w-full rounded-lg max-h-48 object-cover border border-white/10 hover:opacity-90 transition-opacity" />
                           </a>
                        ) : (
                           <a href={msg.file.fileUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${isMe ? 'bg-primary-700/50 border-primary-500 hover:bg-primary-700/80 cursor-pointer' : 'bg-dark-800 border-dark-600 hover:bg-dark-700 cursor-pointer'}`}>
                              <FileText size={20} className={isMe ? 'text-primary-200' : 'text-dark-400'} />
                              <div className="flex-1 min-w-0 pr-2">
                                 <p className="truncate font-medium text-[13px]">{msg.file.fileName}</p>
                                 <p className="text-[11px] opacity-70">{(msg.file.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <Download size={16} className={isMe ? 'text-primary-200' : 'text-dark-400'} />
                           </a>
                        )}
                     </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-dark-700 bg-dark-800">
        <form onSubmit={sendMessage} className="flex flex-col gap-2 relative">
          <div className="flex items-center relative">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading} 
              className="absolute left-3 p-1.5 text-dark-400 hover:text-white transition-colors disabled:opacity-50 z-10"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              // Removed accept attribute to allow all files; could limit to images/docs based on needs
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isUploading ? "Uploading..." : "Type a message..."}
              disabled={isUploading}
              className="input-field pl-11 pr-12 py-3 rounded-full bg-dark-900 text-sm focus:ring-1 w-full"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isUploading}
              className="absolute right-2 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:bg-dark-600 z-10"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
