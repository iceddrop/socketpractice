import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { initSocket, getSocket } from './components/Socket/Socket';

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
    const s = initSocket(); // persistent singleton socket
    setSocket(s);

    // ensure no duplicate handlers
    s.off('connect');
    s.off('connect_error');
    s.off('disconnect');
    s.off('reconnect');
    s.off('message');
    s.off('welcome');

    s.on('connect', () => {
      console.log('Connected to server', s.id);
      setIsConnected(true);

      // attempt restore join info
      const saved = localStorage.getItem('chat:join');
      if (saved) {
        try {
          const { room: savedRoom, name: savedName } = JSON.parse(saved) as { room?: string; name?: string };
          if (savedRoom) {
            setRoom(savedRoom);
            if (savedName) setName(savedName);
            s.emit('join', savedRoom);
            setJoined(true);
            setReceivedMessages(prev => [...prev, `System: restored join to ${savedRoom}`]);
          }
        } catch (err) {
          console.warn('Failed to parse saved join info', err);
        }
      }
    });

    s.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setIsConnected(false);
    });

    s.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setIsConnected(false);
    });

    s.on('reconnect', (attempt) => {
      console.log('Reconnected after', attempt);
      setIsConnected(true);
    });

    s.on('message', (payload: ChatMessage | { author?: string; text?: string }) => {
      // handle string messages too
      if (!payload) return;
      // If server sent a string (e.g., "Server received: ..."), normalize
      if (typeof payload === 'string') {
        setReceivedMessages(prev => [...prev, `Server: ${payload}`]);
        return;
      }

      // payload may be an object with author/text
      const author = (payload as any).author ?? 'Server';
      const txt = (payload as any).text ?? String(payload);
      if (!author || !txt) {
        console.error('Invalid message format:', payload);
        return;
      }
      setReceivedMessages(prev => [...prev, `${author}: ${txt}`]);
    });

    s.on('welcome', (msg: string) => {
      setReceivedMessages(prev => [...prev, `System: ${msg}`]);
    });

    // do not close the socket on component unmount — keep persistent connection
    return () => {
      // remove listeners we added (but don't close singleton socket)
      s.off('connect');
      s.off('connect_error');
      s.off('disconnect');
      s.off('reconnect');
      s.off('message');
      s.off('welcome');
      setSocket(getSocket());
    };
  }, []);

  const joinRoom = () => {
    if (!socket || !room || !name) return;
    socket.emit('join', room);
    setJoined(true);
    localStorage.setItem('chat:join', JSON.stringify({ room, name }));
    setReceivedMessages(prev => [...prev, `System: joined ${room}`]);
  };

  const sendMessage = (): void => {
    if (!socket || !joined || !text.trim()) return;
    const payload = { room, author: name || 'anon', text };
    socket.emit('message', payload);
    setText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="h-screen bg-gray-900 text-white py-8 px-4">
      <div className="h-full flex flex-col justify-end mb-4">
        {!isConnected && (
          <div className="bg-red-500 text-white p-2 rounded mb-4">
            Disconnected from server. Attempting to reconnect...
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-4">
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
            className="bg-blue-600 p-4 rounded hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50"
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

        <div className="flex justify-between bg-gray-800 rounded-lg p-4 mt-4">
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
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 cursor-pointer rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={!joined || !text.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
