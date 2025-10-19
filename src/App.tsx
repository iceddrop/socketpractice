// ...existing code...
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [text, setText] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [room, setRoom] = useState<string>('lobby');
  const [joined, setJoined] = useState<boolean>(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('message', (payload: { author: string; text: string }) => {
      setReceivedMessages(prev => [...prev, `${payload.author}: ${payload.text}`]);
    });

    // optional legacy listener
    newSocket.on('hello', (arg: string) => {
      setReceivedMessages(prev => [...prev, `server: ${arg}`]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = () => {
    if (!socket || !room) return;
    socket.emit('join', room);
    setJoined(true);
    setReceivedMessages(prev => [...prev, `System: joined ${room}`]);
  };

  const sendMessage = (): void => {
    if (!socket || !joined) return;
    const payload = { room, author: name || 'anon', text };
    socket.emit('message', payload);
    setReceivedMessages(prev => [...prev, `${payload.author}: ${payload.text}`]);
    setText('');
  };

  return (
    <div className="h-screen bg-gray-900 text-white py-8 px-4">
      <div className="h-full flex flex-col justify-end mb-4">
        <div className="mb-4 flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="px-3 py-2 rounded"
          />
          <input
            value={room}
            onChange={e => setRoom(e.target.value)}
            placeholder="Room (e.g. lobby)"
            className="px-3 py-2 rounded"
          />
          <button onClick={joinRoom} className="bg-blue-600 px-4 rounded">
            Join
          </button>
        </div>

        <div className="space-y-2 pb-2">
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
            className="flex-grow text-white rounded-lg px-4 py-2 mr-4 focus:outline-none"
            disabled={!joined}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
            disabled={!joined}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
// ...existing code...