// src/services/chatService.ts
import { io, Socket } from 'socket.io-client';

// Type definitions for better type safety
interface MessageData {
  recipientId: string;
  message: string;
  senderId: string;
}

interface RoomMessageData {
  roomId: string;
  message: string;
  senderId: string;
}

interface TypingData {
  recipientId?: string;
  roomId?: string;
  isTyping: boolean;
}

interface ReceivedMessage {
  senderId: string;
  message: string;
  timestamp: string;
  type: 'direct' | 'room';
  roomId?: string;
}

interface TypingIndicator {
  senderId: string;
  isTyping: boolean;
  roomId?: string;
}

interface RegisteredData {
  success: boolean;
  userId: string;
  socketId: string;
}

interface RoomJoinedData {
  roomId: string;
}

interface UserRoomEvent {
  userId: string;
  roomId: string;
}

class ChatService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private eventListeners: Map<string, Function> = new Map();

  /**
   * STEP 1: Connect to WebSocket server
   */
  connect(userId: string, serverUrl: string = 'http://localhost:4000'): Socket {
    if (this.socket?.connected) {
      console.log('Already connected');
      return this.socket;
    }

    console.log(`🔌 Connecting to ${serverUrl}...`);
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.currentUserId = userId;

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ Connected! Socket ID:', this.socket?.id);
      
      // Register user
      if (this.socket) {
        this.socket.emit('register', userId);
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('🔴 Connection error:', error.message);
    });

    this.socket.on('welcome', (message: string) => {
      console.log('👋 Welcome:', message);
    });

    this.socket.on('registered', (data: RegisteredData) => {
      console.log('📝 Registered:', data);
    });

    return this.socket;
  }

  /**
   * STEP 2: Send direct message to specific user
   */
  sendDirectMessage(recipientId: string, message: string): boolean {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return false;
    }

    if (!this.currentUserId) {
      console.error('User ID not set');
      return false;
    }

    this.socket.emit('sendMessage', {
      recipientId,
      message,
      senderId: this.currentUserId,
    } as MessageData);

    return true;
  }

  /**
   * STEP 3: Join a chat room
   */
  joinRoom(roomId: string): boolean {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('joinRoom', roomId);
    return true;
  }

  /**
   * STEP 4: Leave a chat room
   */
  leaveRoom(roomId: string): boolean {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('leaveRoom', roomId);
    return true;
  }

  /**
   * STEP 5: Send message to room (group chat)
   */
  sendRoomMessage(roomId: string, message: string): boolean {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return false;
    }

    if (!this.currentUserId) {
      console.error('User ID not set');
      return false;
    }

    this.socket.emit('sendRoomMessage', {
      roomId,
      message,
      senderId: this.currentUserId,
    } as RoomMessageData);

    return true;
  }

  /**
   * STEP 6: Send typing indicator
   */
  sendTyping(recipientId?: string, isTyping: boolean = false, roomId?: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing', {
      recipientId,
      roomId,
      isTyping,
    } as TypingData);
  }

  /**
   * STEP 7: Listen for incoming messages
   */
  onReceiveMessage(callback: (data: ReceivedMessage) => void): void {
    if (!this.socket) return;

    this.socket.on('receiveMessage', callback);
    
    // Store listener for cleanup
    this.eventListeners.set('receiveMessage', callback);
  }

  /**
   * STEP 8: Listen for typing indicators
   */
  onUserTyping(callback: (data: TypingIndicator) => void): void {
    if (!this.socket) return;

    this.socket.on('userTyping', callback);
    this.eventListeners.set('userTyping', callback);
  }

  /**
   * STEP 9: Listen for room events
   */
  onRoomJoined(callback: (data: RoomJoinedData) => void): void {
    if (!this.socket) return;
    this.socket.on('roomJoined', callback);
  }

  onUserJoinedRoom(callback: (data: UserRoomEvent) => void): void {
    if (!this.socket) return;
    this.socket.on('userJoinedRoom', callback);
  }

  onUserLeftRoom(callback: (data: UserRoomEvent) => void): void {
    if (!this.socket) return;
    this.socket.on('userLeftRoom', callback);
  }

  /**
   * STEP 10: Get online users
   */
  getOnlineUsers(callback: (users: string[]) => void): void {
    if (!this.socket?.connected) return;

    this.socket.emit('getOnlineUsers');
    this.socket.once('onlineUsers', callback);
  }

  /**
   * STEP 11: Check connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * STEP 12: Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * STEP 13: Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * STEP 14: Disconnect
   */
  disconnect(): void {
    if (this.socket) {
      // Remove all event listeners
      this.eventListeners.forEach((callback, event) => {
        if (this.socket) {
          this.socket.off(event, callback as any);
        }
      });
      this.eventListeners.clear();

      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
      
      console.log('🔌 Disconnected from chat server');
    }
  }

  /**
   * STEP 15: Remove specific event listener
   */
  removeListener(eventName: string): void {
    if (this.socket && this.eventListeners.has(eventName)) {
      const callback = this.eventListeners.get(eventName);
      if (callback) {
        this.socket.off(eventName, callback as any);
        this.eventListeners.delete(eventName);
      }
    }
  }
}

// Export singleton instance
export default new ChatService();

// Also export the class for testing or multiple instances
export { ChatService };

// Export types for use in components
export type {
  MessageData,
  RoomMessageData,
  TypingData,
  ReceivedMessage,
  TypingIndicator,
  RegisteredData,
  RoomJoinedData,
  UserRoomEvent,
};