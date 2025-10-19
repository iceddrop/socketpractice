// // src/components/Chat.tsx
// import React, { useState, useEffect, useRef } from 'react';
// import chatService, { ReceivedMessage, TypingIndicator } from '../../components/chatService';
// import './Chat.css';

// interface Message {
//   id: number;
//   text: string;
//   senderId?: string;
//   timestamp: Date;
//   type: 'sent' | 'received' | 'system';
// }

// const Chat: React.FC = () => {
//   const [connected, setConnected] = useState<boolean>(false);
//   const [currentUserId] = useState<string>(`user_${Math.random().toString(36).substr(2, 9)}`);
//   const [recipientId, setRecipientId] = useState<string>('');
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [inputMessage, setInputMessage] = useState<string>('');
//   const [isTyping, setIsTyping] = useState<boolean>(false);
//   const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   // Auto-scroll to bottom
//   const scrollToBottom = (): void => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Connect on mount
//   useEffect(() => {
//     console.log('🚀 Initializing chat...');
//     console.log('👤 Current user ID:', currentUserId);

//     // Connect to server
//     const socket = chatService.connect(currentUserId);

//     // Listen for connection
//     socket.on('connect', () => {
//       setConnected(true);
//       addSystemMessage('Connected to chat server');
//     });

//     socket.on('disconnect', () => {
//       setConnected(false);
//       addSystemMessage('Disconnected from chat server');
//     });

//     // Listen for incoming messages
//     chatService.onReceiveMessage((data: ReceivedMessage) => {
//       console.log('📨 Message received:', data);
      
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now(),
//           text: data.message,
//           senderId: data.senderId,
//           timestamp: new Date(data.timestamp),
//           type: 'received',
//         },
//       ]);
//     });

//     // Listen for typing indicators
//     chatService.onUserTyping((data: TypingIndicator) => {
//       console.log('⌨️ User typing:', data);
      
//       if (data.isTyping) {
//         setTypingUsers((prev) => new Set(prev).add(data.senderId));
//       } else {
//         setTypingUsers((prev) => {
//           const newSet = new Set(prev);
//           newSet.delete(data.senderId);
//           return newSet;
//         });
//       }
//     });

//     // Cleanup on unmount
//     return () => {
//       chatService.disconnect();
//     };
//   }, [currentUserId]);

//   const addSystemMessage = (text: string): void => {
//     setMessages((prev) => [
//       ...prev,
//       {
//         id: Date.now(),
//         text,
//         type: 'system',
//         timestamp: new Date(),
//       },
//     ]);
//   };

//   const handleSendMessage = (): void => {
//     if (!inputMessage.trim() || !recipientId.trim()) {
//       alert('Please enter both message and recipient ID');
//       return;
//     }

//     // Send message
//     const success = chatService.sendDirectMessage(recipientId, inputMessage);

//     if (success) {
//       // Add to local messages
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now(),
//           text: inputMessage,
//           senderId: currentUserId,
//           timestamp: new Date(),
//           type: 'sent',
//         },
//       ]);

//       setInputMessage('');
      
//       // Stop typing indicator
//       chatService.sendTyping(recipientId, false);
//       setIsTyping(false);
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
//     setInputMessage(e.target.value);

//     if (!recipientId) return;

//     // Send typing indicator
//     if (!isTyping) {
//       chatService.sendTyping(recipientId, true);
//       setIsTyping(true);
//     }

//     // Clear existing timeout
//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//     }

//     // Stop typing after 2 seconds of inactivity
//     typingTimeoutRef.current = setTimeout(() => {
//       chatService.sendTyping(recipientId, false);
//       setIsTyping(false);
//     }, 2000);
//   };

//   const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const formatTime = (date: Date): string => {
//     return new Date(date).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   return (
//     <div className="chat-container">
//       {/* Header */}
//       <div className="chat-header">
//         <h2>Chat Application</h2>
//         <div className={`status ${connected ? 'online' : 'offline'}`}>
//           {connected ? '🟢 Online' : '🔴 Offline'}
//         </div>
//       </div>

//       {/* User Info */}
//       <div className="user-info">
//         <div>
//           <strong>Your ID:</strong> <code>{currentUserId}</code>
//         </div>
//         <div className="recipient-input">
//           <input
//             type="text"
//             placeholder="Recipient ID"
//             value={recipientId}
//             onChange={(e) => setRecipientId(e.target.value)}
//           />
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="messages-container">
//         {messages.map((msg) => (
//           <div
//             key={msg.id}
//             className={`message ${
//               msg.type === 'system'
//                 ? 'system-message'
//                 : msg.senderId === currentUserId
//                 ? 'sent-message'
//                 : 'received-message'
//             }`}
//           >
//             {msg.type !== 'system' && (
//               <div className="message-sender">
//                 {msg.senderId === currentUserId ? 'You' : msg.senderId}
//               </div>
//             )}
//             <div className="message-text">{msg.text}</div>
//             <div className="message-time">{formatTime(msg.timestamp)}</div>
//           </div>
//         ))}

//         {/* Typing indicator */}
//         {typingUsers.size > 0 && (
//           <div className="typing-indicator">
//             {Array.from(typingUsers).join(', ')} is typing...
//           </div>
//         )}

//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className="input-container">
//         <input
//           type="text"
//           placeholder="Type a message..."
//           value={inputMessage}
//           onChange={handleInputChange}
//           onKeyPress={handleKeyPress}
//           disabled={!connected || !recipientId}
//         />
//         <button
//           onClick={handleSendMessage}
//           disabled={!connected || !recipientId || !inputMessage.trim()}
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Chat;