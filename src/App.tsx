import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export default function App() {
  interface ChatMessage {
    room: string;
    author: string;
    text: string;
  }

  const [socket, setSocket] = useState<Socket | null>(null);
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [text, setText] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [room, setRoom] = useState<string>('lobby');
  const [joined, setJoined] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const newSocket = io('https://socketpractice-nestjs.onrender.com', {
      transports: ['websocket'],
      reconnection: true
    });

    console.log('Attempting connection...');

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('message', (payload: ChatMessage) => {
      console.log('Received message:', JSON.stringify(payload, null, 2));
      if (!payload?.author || !payload?.text) {
        console.error('Invalid message format:', payload);
        return;
      }
      setReceivedMessages(prev => [...prev, `${payload.author}: ${payload.text}`]);
    });

    newSocket.on('welcome', (msg: string) => {
      console.log('Welcome:', msg);
      setReceivedMessages(prev => [...prev, `System: ${msg}`]);
    });

    return () => {
      newSocket.close();
      setIsConnected(false);
    };
  }, []);

  const joinRoom = () => {
    if (!socket || !room || !name) return;
    socket.emit('join', room);
    setJoined(true);
    setReceivedMessages(prev => [...prev, `System: joined ${room}`]);
  };

  const sendMessage = (): void => {
    if (!socket || !joined || !text.trim()) return;
    const payload = { room, author: name || 'anon', text };
    socket.emit('message', payload);
    setText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white py-8 px-4">
      <div className="h-full flex flex-col justify-end mb-4">
        {!isConnected && (
          <div className="bg-red-500 text-white p-2 rounded mb-4">
            Disconnected from server. Attempting to reconnect...
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="px-3 py-2 rounded bg-gray-700"
            disabled={joined}
          />
          <input
            value={room}
            onChange={e => setRoom(e.target.value)}
            placeholder="Room (e.g. lobby)"
            className="px-3 py-2 rounded bg-gray-700"
            disabled={joined}
          />
          <button
            onClick={joinRoom}
            className="bg-blue-600 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={joined || !name || !room}
          >
            Join
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 pb-2">
          {receivedMessages.length === 0 ? (
            <p className="text-gray-400">No messages yet...</p>
          ) : (
            receivedMessages.map((msg, i) => (
              <div key={i} className="bg-gray-700 p-3 rounded text-sm font-mono">
                {msg}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between bg-gray-800 rounded-lg p-6">
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow text-white bg-gray-700 rounded-lg px-4 py-2 mr-4 focus:outline-none"
            disabled={!joined}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={!joined || !text.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}