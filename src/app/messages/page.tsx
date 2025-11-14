'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Check,
  CheckCheck,
  Loader2,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getMessagePreview, parseMessageContent } from '@/lib/messages';
import { toast } from 'react-hot-toast';
import { EmojiPicker } from '@/components/messages/EmojiPicker';

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
  receiver: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Conversation {
  partner: {
    id: string;
    name: string;
    image?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

interface GroupChat {
  id: string;
  name: string;
  description?: string;
  eventId: string;
  event?: {
    id: string;
    title: string;
    imageUrl?: string;
  };
  lastMessage: Message | null;
  memberCount: number;
  messageCount: number;
  updatedAt: string;
}

function MessagesPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedGroupChat, setSelectedGroupChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);
  const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      redirect('/signin');
    }

    fetchConversations({ showSpinner: true });
    fetchGroupChats({ showSpinner: false });

    // Check for groupChat query parameter
    const groupChatParam = searchParams?.get('groupChat');
    if (groupChatParam) {
      setSelectedGroupChat(groupChatParam);
      setSelectedConversation(null);
    }

    // Poll for new messages every 10 seconds to update conversation order
    const pollInterval = setInterval(() => {
      fetchConversations({ showSpinner: false });
      fetchGroupChats({ showSpinner: false });
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [session, status, searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      setSelectedGroupChat(null);
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedGroupChat) {
      setSelectedConversation(null);
      fetchGroupChatMessages(selectedGroupChat);
    }
  }, [selectedGroupChat]);

  useEffect(() => {
    setIsEmojiPickerOpen(false);
  }, [selectedConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };

  const fetchConversations = async ({ showSpinner = false }: { showSpinner?: boolean } = {}) => {
    try {
      if (showSpinner) {
        setIsLoading(true);
      }
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  };

  const fetchGroupChats = async ({ showSpinner = false }: { showSpinner?: boolean } = {}) => {
    try {
      if (showSpinner) {
        setIsLoading(true);
      }
      const response = await fetch('/api/group-chats');
      if (response.ok) {
        const data = await response.json();
        setGroupChats(data.groupChats);
      }
    } catch (error) {
      console.error('Error fetching group chats:', error);
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  };

  const fetchGroupChatMessages = async (eventId: string) => {
    try {
      const response = await fetch(`/api/group-chats/${eventId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const sortedMessages = [...data.messages].sort(
          (a: Message, b: Message) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
        requestAnimationFrame(() => scrollToBottom('auto'));

        // Update group chat and move to top if it's not already there
        if (sortedMessages.length > 0) {
          const latestMessage = sortedMessages[sortedMessages.length - 1];
          setGroupChats((prev) => {
            const updated = prev.map((gc) =>
              gc.eventId === eventId
                ? { 
                    ...gc, 
                    lastMessage: latestMessage,
                    updatedAt: latestMessage.createdAt
                  }
                : gc
            );
            // Move the updated group chat to top
            const groupChatIndex = updated.findIndex(
              (gc) => gc.eventId === eventId
            );
            if (groupChatIndex > 0) {
              const [movedGroupChat] = updated.splice(groupChatIndex, 1);
              return [movedGroupChat, ...updated];
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching group chat messages:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        const sortedMessages = [...data.messages].sort(
          (a: Message, b: Message) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
        requestAnimationFrame(() => scrollToBottom('auto'));

        if (sortedMessages.length > 0) {
          const latestMessage = sortedMessages[sortedMessages.length - 1];
          // Update conversation and move to top if it's not already there
          setConversations((prev) => {
            const updated = prev.map((conversation) =>
              conversation.partner.id === conversationId
                ? { ...conversation, lastMessage: latestMessage }
                : conversation
            );
            // Move the updated conversation to top
            const conversationIndex = updated.findIndex(
              (conv) => conv.partner.id === conversationId
            );
            if (conversationIndex > 0) {
              const [movedConversation] = updated.splice(conversationIndex, 1);
              return [movedConversation, ...updated];
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const canSendMessage = newMessage.trim().length > 0 || Boolean(selectedFile);

  const sendMessage = async () => {
    if (isSending || !canSendMessage) return;
    if (!selectedConversation && !selectedGroupChat) return;

    try {
      setIsSending(true);
      const trimmedMessage = newMessage.trim();
      let response: Response;

      if (selectedGroupChat) {
        // Send to group chat
        if (selectedFile) {
          const formData = new FormData();
          formData.append('eventId', selectedGroupChat);
          if (trimmedMessage) {
            formData.append('content', trimmedMessage);
          }
          formData.append('file', selectedFile);

          response = await fetch(`/api/group-chats/${selectedGroupChat}/messages`, {
            method: 'POST',
            body: formData,
          });
        } else {
          response = await fetch(`/api/group-chats/${selectedGroupChat}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: trimmedMessage,
            }),
          });
        }
      } else {
        // Send to individual conversation
        if (selectedFile) {
          const formData = new FormData();
          formData.append('receiverId', selectedConversation!);
          if (trimmedMessage) {
            formData.append('content', trimmedMessage);
          }
          formData.append('file', selectedFile);

          response = await fetch('/api/messages', {
            method: 'POST',
            body: formData,
          });
        } else {
          response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receiverId: selectedConversation!,
              content: trimmedMessage,
            }),
          });
        }
      }

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setSelectedFile(null);
        setIsEmojiPickerOpen(false);
        
        // Immediately move the conversation/group chat to the top (like WhatsApp)
        if (selectedConversation) {
          setConversations((prev) => {
            const conversationIndex = prev.findIndex(
              (conv) => conv.partner.id === selectedConversation
            );
            
            if (conversationIndex === -1) {
              // If conversation doesn't exist, create it using receiver from the message
              return [
                {
                  partner: data.message.receiver,
                  lastMessage: data.message,
                  unreadCount: 0,
                },
                ...prev,
              ];
            }
            
            // Move conversation to top and update lastMessage
            const updatedConversations = [...prev];
            const [movedConversation] = updatedConversations.splice(conversationIndex, 1);
            movedConversation.lastMessage = data.message;
            return [movedConversation, ...updatedConversations];
          });
        } else if (selectedGroupChat) {
          // Move group chat to top
          setGroupChats((prev) => {
            const groupChatIndex = prev.findIndex(
              (gc) => gc.eventId === selectedGroupChat
            );
            
            if (groupChatIndex === -1) {
              // If group chat doesn't exist in list, it will be added by server fetch
              return prev;
            }
            
            // Move group chat to top and update lastMessage
            const updatedGroupChats = [...prev];
            const [movedGroupChat] = updatedGroupChats.splice(groupChatIndex, 1);
            // Create a message-like object for the group chat
            // Group chat messages only have sender, so we use sender as receiver for compatibility
            const lastMessage: Message = {
              id: data.message.id,
              content: data.message.content,
              type: data.message.type,
              isRead: true,
              createdAt: data.message.createdAt,
              sender: data.message.sender,
              receiver: data.message.receiver || data.message.sender, // Group chats don't have receiver, use sender
            };
            movedGroupChat.lastMessage = lastMessage;
            movedGroupChat.updatedAt = data.message.createdAt;
            return [movedGroupChat, ...updatedGroupChats];
          });
        }
        
        // Update conversations/group chats list from server in background
        // This ensures data consistency but doesn't override the immediate reordering
        fetchConversations({ showSpinner: false }).then(() => {
          // After server fetch, ensure the active conversation stays at top
          if (selectedConversation) {
            setConversations((prev) => {
              const conversationIndex = prev.findIndex(
                (conv) => conv.partner.id === selectedConversation
              );
              if (conversationIndex > 0) {
                const updatedConversations = [...prev];
                const [movedConversation] = updatedConversations.splice(conversationIndex, 1);
                return [movedConversation, ...updatedConversations];
              }
              return prev;
            });
          }
        });
        fetchGroupChats({ showSpinner: false }).then(() => {
          // After server fetch, ensure the active group chat stays at top
          if (selectedGroupChat) {
            setGroupChats((prev) => {
              const groupChatIndex = prev.findIndex(
                (gc) => gc.eventId === selectedGroupChat
              );
              if (groupChatIndex > 0) {
                const updatedGroupChats = [...prev];
                const [movedGroupChat] = updatedGroupChats.splice(groupChatIndex, 1);
                return [movedGroupChat, ...updatedGroupChats];
              }
              return prev;
            });
          }
        });
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || 'Failed to send message.';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSendMessage) {
        sendMessage();
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!textareaRef.current) {
      setNewMessage((prev) => `${prev}${emoji}`);
      return;
    }

    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;

    setNewMessage((prev) => {
      const before = prev.slice(0, selectionStart);
      const after = prev.slice(selectionEnd);
      return `${before}${emoji}${after}`;
    });

    requestAnimationFrame(() => {
      if (!textareaRef.current) {
        return;
      }
      const cursorPosition = selectionStart + emoji.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  const isAllowedFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('File is too large. Maximum size is 10MB.');
      return false;
    }

    if (file.type && file.type.startsWith('image/')) {
      return true;
    }

    if (file.type && ALLOWED_MIME_TYPES.has(file.type)) {
      return true;
    }

    const extensionIndex = file.name.lastIndexOf('.');
    if (extensionIndex !== -1) {
      const extension = file.name.slice(extensionIndex).toLowerCase();
      if (ALLOWED_EXTENSIONS.has(extension)) {
        return true;
      }
    }

    toast.error('Unsupported file type. Please upload a PDF, Word document, or image.');
    return false;
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isAllowedFile(file)) {
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    event.target.value = '';
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getReadStatus = (message: Message) => {
    if (message.sender.id === session?.user?.id) {
      return message.isRead ? <CheckCheck className="h-4 w-4 text-blue-500" /> : <Check className="h-4 w-4 text-gray-400" />;
    }
    return null;
  };

  // Create a unified list of all conversations (individual + group chats) sorted by last message time
  type UnifiedConversation = {
    type: 'individual' | 'group';
    id: string;
    name: string;
    image?: string;
    lastMessage: Message | null;
    unreadCount?: number;
    memberCount?: number;
    updatedAt?: string;
    eventId?: string;
    event?: {
      id: string;
      title: string;
      imageUrl?: string;
    };
  };

  const createUnifiedList = (): UnifiedConversation[] => {
    const individualList: UnifiedConversation[] = conversations.map(conv => ({
      type: 'individual' as const,
      id: conv.partner.id,
      name: conv.partner.name,
      image: conv.partner.image,
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount,
    }));

    const groupList: UnifiedConversation[] = groupChats.map(gc => ({
      type: 'group' as const,
      id: gc.id,
      name: gc.name,
      image: gc.event?.imageUrl,
      lastMessage: gc.lastMessage,
      memberCount: gc.memberCount,
      updatedAt: gc.updatedAt,
      eventId: gc.eventId,
      event: gc.event,
    }));

    // Merge and sort by last message time (most recent first)
    const merged = [...individualList, ...groupList].sort((a, b) => {
      const timeA = a.lastMessage 
        ? new Date(a.lastMessage.createdAt).getTime() 
        : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const timeB = b.lastMessage 
        ? new Date(b.lastMessage.createdAt).getTime() 
        : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      return timeB - timeA; // Descending order (newest first)
    });

    return merged;
  };

  const allConversations = createUnifiedList();

  // Filter the unified list based on search query
  const filteredConversations = allConversations.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.event?.title && item.event.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentChat = selectedGroupChat 
    ? groupChats.find(gc => gc.eventId === selectedGroupChat)
    : selectedConversation
    ? conversations.find(c => c.partner.id === selectedConversation)
    : null;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-[10px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pt-2 pb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Send className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Messages
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Connect with other volunteers and organizations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="pt-3 pb-8">
          <div className="flex flex-col lg:flex-row gap-6 h-[70vh] md:h-[75vh] lg:h-[80vh] overflow-y-auto lg:overflow-y-hidden">
            {/* Conversations List */}
            <Card className="flex h-full max-h-full flex-col overflow-hidden lg:w-[380px] lg:flex-shrink-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Conversations</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 space-y-1 overflow-y-auto overflow-x-hidden p-0">
                  {/* Unified Conversations List (Individual + Group Chats sorted by last message time) */}
                  {filteredConversations.map((item) => {
                    if (item.type === 'group') {
                      return (
                        <div
                          key={`group-${item.id}`}
                          className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            selectedGroupChat === item.eventId ? 'bg-green-50 dark:bg-green-900/20 border-r-2 border-green-500' : ''
                          }`}
                          onClick={() => {
                            if (item.eventId) {
                              setSelectedGroupChat(item.eventId);
                              setSelectedConversation(null);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              {item.image && (
                                <AvatarImage src={item.image} alt={item.name} />
                              )}
                              <AvatarFallback className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold text-sm">
                                {item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {item.name}
                                  </h3>
                                  <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 flex-shrink-0">
                                    Group
                                  </Badge>
                                </div>
                                {item.lastMessage && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
                                    {formatTime(item.lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 mt-1">
                                {item.lastMessage ? (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 min-w-0">
                                    {getMessagePreview(item.lastMessage)}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    No messages yet
                                  </p>
                                )}
                                {item.memberCount !== undefined && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 whitespace-nowrap">
                                    {item.memberCount} members
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`individual-${item.id}`}
                          className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            selectedConversation === item.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                          }`}
                          onClick={() => {
                            setSelectedConversation(item.id);
                            setSelectedGroupChat(null);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              {item.image && (
                                <AvatarImage src={item.image} alt={item.name} />
                              )}
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                                {item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
                                  {item.name}
                                </h3>
                                {item.lastMessage && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
                                    {formatTime(item.lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 mt-1">
                                {item.lastMessage ? (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 min-w-0">
                                    {getMessagePreview(item.lastMessage)}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    No messages yet
                                  </p>
                                )}
                                {item.unreadCount !== undefined && item.unreadCount > 0 && (
                                  <Badge variant="default" className="flex-shrink-0 text-xs ml-2">
                                    {item.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                  
                  {filteredConversations.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="flex h-full max-h-full flex-col overflow-hidden lg:flex-1 lg:min-w-0">
              {(selectedConversation || selectedGroupChat) ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          {selectedGroupChat ? (
                            <>
                              {currentChat && 'event' in currentChat && currentChat.event?.imageUrl && (
                                <AvatarImage 
                                  src={currentChat.event.imageUrl} 
                                  alt={currentChat.name} 
                                />
                              )}
                              <AvatarFallback className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold text-sm">
                                {currentChat && 'name' in currentChat ? currentChat.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'GC'}
                              </AvatarFallback>
                            </>
                          ) : (
                            <>
                              {conversations.find(c => c.partner.id === selectedConversation)?.partner.image && (
                                <AvatarImage 
                                  src={conversations.find(c => c.partner.id === selectedConversation)?.partner.image} 
                                  alt={conversations.find(c => c.partner.id === selectedConversation)?.partner.name} 
                                />
                              )}
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                                {conversations.find(c => c.partner.id === selectedConversation)?.partner.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {selectedGroupChat 
                              ? (currentChat && 'name' in currentChat ? currentChat.name : 'Group Chat')
                              : conversations.find(c => c.partner.id === selectedConversation)?.partner.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedGroupChat 
                              ? `${currentChat && 'memberCount' in currentChat ? currentChat.memberCount : 0} members`
                              : 'Online'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Block User</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete Conversation</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent
                    ref={messagesContainerRef}
                    className="flex-1 min-h-0 overflow-y-auto p-4"
                  >
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isCurrentUser = message.sender.id === session?.user?.id;
                        const parsedContent = parseMessageContent(message.content);
                        const hasText = Boolean(parsedContent.text);
                        const hasAttachment = Boolean(parsedContent.url);
                        const isGroupChat = !!selectedGroupChat;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isGroupChat ? 'items-start' : ''}`}
                          >
                            {isGroupChat && !isCurrentUser && (
                              <Avatar className="h-6 w-6 mr-2 mt-1">
                                {message.sender.image && (
                                  <AvatarImage src={message.sender.image} alt={message.sender.name} />
                                )}
                                <AvatarFallback className="bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs">
                                  {message.sender.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-xs lg:max-w-md rounded-lg px-4 py-3 ${
                                isCurrentUser
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                              }`}
                            >
                              {isGroupChat && !isCurrentUser && (
                                <div className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                  {message.sender.name}
                                </div>
                              )}
                              <div className="space-y-2">
                                {hasText && (
                                  <p className="text-sm whitespace-pre-line leading-relaxed">
                                    {parsedContent.text}
                                  </p>
                                )}
                                {hasAttachment && parsedContent.url && (
                                  <>
                                    {message.type === 'IMAGE' ? (
                                      <a
                                        href={parsedContent.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block overflow-hidden rounded-lg"
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={parsedContent.url}
                                          alt={parsedContent.name || 'Image attachment'}
                                          className="max-h-64 w-full rounded-lg object-cover"
                                          loading="lazy"
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        href={parsedContent.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                          isCurrentUser
                                            ? 'border-white/30 bg-white/10 hover:bg-white/20'
                                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/60 dark:hover:bg-gray-700'
                                        }`}
                                      >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="truncate">
                                          {parsedContent.name || 'Attachment'}
                                        </span>
                                      </a>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="mt-2 flex items-center justify-end space-x-1 text-xs opacity-80">
                                <span>{formatTime(message.createdAt)}</span>
                                {getReadStatus(message)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={handleFileButtonClick} aria-label="Attach a file">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="flex-1">
                        {selectedFile && (
                          <div className="mb-2 flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                            <div className="flex items-center gap-2 min-w-0">
                              {selectedFile.type.startsWith('image/') ? (
                                <ImageIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                              ) : (
                                <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatFileSize(selectedFile.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              onClick={removeSelectedFile}
                              aria-label="Remove attachment"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <Textarea
                          ref={textareaRef}
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyPress}
                          className="min-h-[40px] max-h-[120px] resize-none"
                          onFocus={() => setIsEmojiPickerOpen(false)}
                          rows={1}
                        />
                      </div>
                      <EmojiPicker
                        open={isEmojiPickerOpen}
                        onOpenChange={setIsEmojiPickerOpen}
                        onEmojiSelect={handleEmojiSelect}
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!canSendMessage || isSending}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}

