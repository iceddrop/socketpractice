import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [text, setText] = useState<string>('');

  useEffect(() => {
    // Connect to the Socket.IO server
    const newSocket = io('https://socketpractice-nestjs.onrender.com');
    setSocket(newSocket);

    // Receive a message from the server
    newSocket.on('hello', (arg: string) => {
      console.log(arg); // prints "world"
      setReceivedMessages(prev => [...prev, `${arg}`]);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Send a message to the server
  const sendMessage = (): void => {
    if (socket) {
      socket.emit('howdy', `${text}`);
      setReceivedMessages(prev => [...prev, `${text}`]);
    }
  }; console.log(receivedMessages)

  return (
    <div className="h-screen bg-gray-900 text-white py-8 px-4">
      <div className="h-full flex flex-col justify-end mb-4">
        {/* <h1 className="text-3xl font-bold mb-6">Socket.IO React Demo</h1> */}

        {/* <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className="text-green-400">
            {socket ? '✓ Connected to ws://localhost:3000' : '⟳ Connecting...'}
          </p>
        </div> */}



        {/* <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Send Message</h2>
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Send 
          </button>
        </div> */}
        <div className="space-y-2 pb-2">
          {receivedMessages.length === 0 ? (
            <p className="text-gray-400">No messages yet...</p>
          ) : (
            receivedMessages.map((msg, index) => (
              <div
                key={index}
                className="bg-gray-700 p-3 rounded text-sm font-mono"
              >
                {msg}
              </div>
            ))
          )}
        </div>
        <div className="flex justify-between bg-gray-800 rounded-lg p-6">
          {/* <h2 className="text-xl font-semibold mb-4">Messages</h2> */}
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
            className="flex-grow  text-white rounded-lg px-4 py-2 mr-4 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}