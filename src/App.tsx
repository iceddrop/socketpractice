import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { initSocket } from './components/Socket/Socket';
import { Menu, MoveLeft } from 'lucide-react';
interface ChatMessage {
  room: string;
  author: string;
  text: string;
  isPrivate?: boolean;
}

interface User {
  id: string;
  name: string;
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [text, setText] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [room, setRoom] = useState<string>('lobby');
  const [privateRoomId, setPrivateRoomId] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [privateChats, setPrivateChats] = useState<Record<string, string[]>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const s = initSocket();
    setSocket(s);

    // remove any previous handlers to avoid duplicates
    s.off('connect');
    s.off('connect_error');
    s.off('disconnect');
    s.off('reconnect');
    s.off('message');
    s.off('welcome');
    s.off('users');
    s.off('private-invite');

    s.on('connect', () => {
      console.log('Connected', s.id);
      setIsConnected(true);

      // restore previous join if present
      const saved = localStorage.getItem('chat:join');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { room?: string; name?: string };
          if (parsed.room) {
            setRoom(parsed.room);
            if (parsed.name) setName(parsed.name);
            // emit simple join with room string (keeps compatibility)
            s.emit('join', parsed.room);
            setJoined(true);
            setReceivedMessages(prev => [...prev, `System: restored join to ${parsed.room}`]);
          }
        } catch (err) {
          console.warn('Failed to parse saved join info', err);
        }
      }
    });

    s.on('users', (users: User[]) => {
      setOnlineUsers(users.filter(u => u.id !== s.id));
    });

    s.on('private-invite', ({ from, roomId, fromName }: { from: string; roomId: string; fromName: string }) => {
      const accept = window.confirm(`${fromName || from} invited you to a private chat (room: ${roomId}). Accept?`);
      if (accept) {
        // join private room
        s.emit('join', roomId);
        setRoom(roomId);
        setJoined(true);
        setReceivedMessages(prev => [...prev, `System: joined private room ${roomId}`]);
      }
    });

    s.on('message', (payload: ChatMessage | string | undefined) => {
      if (!payload) return;

      // if server sent a plain string
      if (typeof payload === 'string') {
        setReceivedMessages(prev => [...prev, `Server: ${payload}`]);
        return;
      }

      // Handle messages based on type and current room
      if (payload.isPrivate) {
        // Store private messages only in privateChats
        setPrivateChats(prev => ({
          ...prev,
          [payload.room]: [...(prev[payload.room] || []), `${payload.author}: ${payload.text}`]
        }));
      } else {
        // Store public messages only in receivedMessages
        setReceivedMessages(prev => [...prev, `${payload.author}: ${payload.text}`]);
      }
    });

    s.on('welcome', (msg: string) => {
      setReceivedMessages(prev => [...prev, `System: ${msg}`]);
    });

    s.on('connect_error', (err) => {
      console.error('connect_error', err);
      setIsConnected(false);
    });

    s.on('disconnect', (reason) => {
      console.log('disconnect', reason);
      setIsConnected(false);
    });

    s.on('reconnect', (attempt) => {
      console.log('reconnect', attempt);
      setIsConnected(true);
      // optionally re-emit join if needed: if (joined) s.emit('join', room);
    });

    return () => {
      // remove handlers we added; do not close singleton socket
      s.off('connect');
      s.off('connect_error');
      s.off('disconnect');
      s.off('reconnect');
      s.off('message');
      s.off('welcome');
      s.off('users');
      s.off('private-invite');
    };
  }, [room, joined]);

  // register name only (keeps server informed of username)
  const registerUser = () => {
    if (!socket || !name) return;
    socket.emit('register-user', { name });
    localStorage.setItem('chat:join', JSON.stringify({ name }));
  };

  const goToLobby = () => {
    if (!socket) return;

    // tell server we are leaving current room (server should remove from room tracking)
    if (room && room !== 'lobby') {
      socket.emit('leave', { room });
    }

    // join lobby
    socket.emit('join', 'lobby');
    setRoom('lobby');
    setJoined(true);
    localStorage.setItem('chat:join', JSON.stringify({ room: 'lobby', name }));
    setReceivedMessages(prev => [...prev, `System: returned to lobby`]);
  };

  // joins public group room (simple join)
  const joinRoom = () => {
    if (!socket || !room || !name) return;
    socket.emit('register-user', { name }); // ensure server knows name
    socket.emit('join', room);
    setJoined(true);
    localStorage.setItem('chat:join', JSON.stringify({ room, name }));
    setReceivedMessages(prev => [...prev, `System: joined ${room}`]);
  };

  // join any private room by id (manual)
  const joinPrivateById = () => {
    if (!socket || !privateRoomId || !name) return;
    socket.emit('register-user', { name });
    socket.emit('join', privateRoomId);
    setRoom(privateRoomId);
    setJoined(true);
    localStorage.setItem('chat:join', JSON.stringify({ room: privateRoomId, name }));
    setReceivedMessages(prev => [...prev, `System: joined private room ${privateRoomId}`]);
    setPrivateRoomId('');
  };

  console.log(joinPrivateById)

  // create a private room with a user id (server should forward invite)
  const createPrivateChat = (targetUser: User) => {
    if (!socket) return;
    const roomId = [socket.id, targetUser.id].sort().join('_');
    // server should notify the other user via 'private-invite'
    socket.emit('create-private-chat', { targetUserId: targetUser.id, roomId });
    // join locally
    socket.emit('join', roomId);
    setRoom(roomId);
    setJoined(true);
    setReceivedMessages(prev => [...prev, `System: created/joined private room ${roomId}`]);
  };

  // const sendMessage = (): void => {
  //   if (!socket || !joined || !text.trim()) return;
  //   const isPrivate = room !== 'lobby' && room.length > 0;
  //   const payload: ChatMessage = { room, author: name || 'anon', text: text.trim(), isPrivate };
  //   socket.emit('message', payload);
  //   // echo locally so sender sees immediate message
  //   if (isPrivate) {
  //     setPrivateChats(prev => ({
  //       ...prev,
  //       [room]: [...(prev[room] || []), `${payload.author}: ${payload.text}`]
  //     }));
  //   } else {
  //     setReceivedMessages(prev => [...prev, `${payload.author}: ${payload.text}`]);
  //   }
  //   setText('');
  // };

  const sendMessage = (): void => {
    if (!socket || !joined || !text.trim()) return;
    const isPrivate = room !== 'lobby' && room.length > 0;
    const payload: ChatMessage = { room, author: name || 'anon', text: text.trim(), isPrivate };
    socket.emit('message', payload);
    setText('');
  };

  console.log(room)

  return (
    <div className="h-screen w-full bg-gray-900 text-white py-8 px-2 overflow-x-hidden">
      <div className="h-full flex gap-4">
        {/* Left: controls / users */}
        {isSidebarOpen ?
            <div className="z-1 fixed left-0 top-0 h-full w-72 bg-gray-800 p-4 rounded-lg flex flex-col gap-4 overflow-y-auto">
            <div className='flex flex-col h-full'>
              <div className=''>
                <MoveLeft className='my-4 cursor-pointer' onClick={() => setIsSidebarOpen(false)} />
                <h3 className="text-lg font-semibold mb-2">Join the general chat</h3>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 rounded bg-gray-700 mb-2"
                  disabled={joined}
                />
                <div className="grid grid-cols-1 gap-2 mb-2">
                  <input
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    placeholder="Public room (lobby)"
                    className="flex-1 px-3 py-2 rounded bg-gray-700"
                    disabled={joined}
                  />
                  <button
                    onClick={joinRoom}
                    disabled={joined || !name || !room}
                    className="bg-blue-600 p-3 rounded disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
                <div className="mt-3">
                  <button
                    onClick={registerUser}
                    disabled={!name}
                    className="bg-gray-600 px-3 py-1 rounded disabled:opacity-50"
                  >
                    Register Name
                  </button>
                </div>
              </div>



              <div className='mt-4'>
                <h3 className="text-lg font-semibold mb-2">Online Users</h3>
                <div className="max-h-48 overflow-auto space-y-2">
                  {onlineUsers.length === 0 ? (
                    <p className="text-gray-400 text-sm">No other users online</p>
                    ) : (
                    onlineUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                        <span className="truncate">{u.name || u.id}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => createPrivateChat(u)}
                            className="bg-indigo-600 px-2 py-1 rounded text-sm"
                          >
                            send a DM
                          </button>
                          {/* <a
                        href={`/dm/${u.id}`}
                        className="bg-blue-600 px-2 py-1 rounded text-sm"
                      >
                        General server
                      </a> */}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button
                onClick={goToLobby}
                className="bg-green-600 text-sm p-3 mt-4 rounded disabled:opacity-50"
                disabled={!socket || room === 'lobby'}
              >
                Go to Lobby
              </button>

              {/* <div className=''>
                <h3 className="text-lg font-semibold mb-2">Private Room (by ID)</h3>
                <div className="">
                  <input
                    value={privateRoomId}
                    onChange={e => setPrivateRoomId(e.target.value)}
                    placeholder="Private room ID"
                    className="flex-1 px-3 py-2 rounded bg-gray-700"
                    disabled={joined}
                  />
                  <button
                    onClick={joinPrivateById}
                    disabled={!name || !privateRoomId}
                    className="bg-green-600 p-3 mt-4 rounded disabled:opacity-50"
                  >
                    Join Private
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Share the room ID with another user to chat privately.
                </p>
              </div> */}
            </div>
          </div>
          :
          <div className="bg-gray-800 rounded-lg h-8 pt-1 px-1 cursor-pointer">
            <Menu onClick={() => setIsSidebarOpen(true)} />
          </div>
        }

        {/* Right: chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!isConnected && (
            <div className="bg-red-500 text-white p-2 rounded mb-2">
              Disconnected. Reconnecting...
            </div>
          )}

          <div className="mb-6 overflow-y-auto space-y-2 p-4 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Room: {room}</div>

            {room === 'lobby'
              ? (receivedMessages.length === 0
                ? <p className="text-gray-400">No messages yet in lobby.</p>
                : receivedMessages.map((m, i) => (
                  <div key={i} className="bg-gray-700 p-2 rounded text-sm break-words">{m}</div>
                ))
              )
              : ((privateChats[room] || []).length === 0
                ? <p className="text-gray-400">No messages yet in private room.</p>
                : (privateChats[room] || []).map((m, i) => (
                  <div key={i} className="bg-gray-700 p-2 rounded text-sm break-words">{m}</div>
                )))
            }
          </div>

          <div className="mb-2 md:w-[90%] fixed bottom-0 flex gap-1 mx-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={joined ? "Type a message..." : "Join a room first"}
              className="flex-1 px-4 py-2 rounded bg-gray-700 focus:outline-none"
              disabled={!joined}
            />
            <button
              onClick={sendMessage}
              disabled={!joined || !text.trim()}
              className="bg-blue-600 px-6 py-2 rounded disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}