'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  Send, 
  Search, 
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock
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

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      redirect('/signin');
    }

    fetchConversations({ showSpinner: true });
  }, [session, status]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
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
          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.partner.id === conversationId
                ? { ...conversation, lastMessage: latestMessage }
                : conversation
            )
          );
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        
        // Update conversations list
        await fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

  const filteredConversations = conversations.filter(conv =>
    conv.partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-[70vh] md:h-[75vh] lg:h-[80vh] overflow-y-auto lg:overflow-hidden">
            {/* Conversations List */}
            <Card className="flex h-full max-h-full flex-col overflow-hidden lg:col-span-1">
              <CardHeader>
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
              <CardContent className="flex-1 min-h-0 space-y-1 overflow-y-auto p-0">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.partner.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedConversation === conversation.partner.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation.partner.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          {conversation.partner.image && (
                            <AvatarImage src={conversation.partner.image} alt={conversation.partner.name} />
                          )}
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                            {conversation.partner.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {conversation.partner.name}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {getMessagePreview(conversation.lastMessage)}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2 text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredConversations.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="flex h-full max-h-full flex-col overflow-hidden lg:col-span-2">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          {conversations.find(c => c.partner.id === selectedConversation)?.partner.image && (
                            <AvatarImage 
                              src={conversations.find(c => c.partner.id === selectedConversation)?.partner.image} 
                              alt={conversations.find(c => c.partner.id === selectedConversation)?.partner.name} 
                            />
                          )}
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                            {conversations.find(c => c.partner.id === selectedConversation)?.partner.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {conversations.find(c => c.partner.id === selectedConversation)?.partner.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
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

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md rounded-lg px-4 py-3 ${
                                isCurrentUser
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                              }`}
                            >
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
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="min-h-[40px] max-h-[120px] resize-none"
                          rows={1}
                        />
                      </div>
                      <Button variant="ghost" size="sm">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Send className="h-4 w-4" />
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

