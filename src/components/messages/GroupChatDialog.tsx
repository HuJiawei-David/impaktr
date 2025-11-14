'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Paperclip, Loader2, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';
import { parseMessageContent } from '@/lib/messages';
import { EmojiPicker } from '@/components/messages/EmojiPicker';

type MessageType = 'TEXT' | 'IMAGE' | 'FILE';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

interface MessageSender {
  id: string;
  name: string;
  image?: string | null;
}

interface Message {
  id: string;
  content: string;
  type: MessageType;
  createdAt: string;
  sender: MessageSender;
}

interface GroupChatDialogProps {
  eventId: string;
  eventTitle: string;
  eventImage?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

export function GroupChatDialog({
  eventId,
  eventTitle,
  eventImage,
  open,
  onOpenChange,
  currentUserId,
}: GroupChatDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  const eventInitials = useMemo(() => {
    if (!eventTitle) return 'GC';
    const parts = eventTitle.trim().split(/\s+/);
    return parts.map(p => p.charAt(0).toUpperCase()).join('').slice(0, 2);
  }, [eventTitle]);

  useEffect(() => {
    if (open && eventId) {
      fetchMessages();
      fetchMemberCount();
    } else if (!open) {
      setMessages([]);
      setNewMessage('');
      setIsEmojiPickerOpen(false);
    }
  }, [open, eventId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [open]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetComposer = () => {
    setNewMessage('');
    setSelectedFile(null);
    setIsEmojiPickerOpen(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const fetchMemberCount = async () => {
    try {
      const response = await fetch(`/api/group-chats/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.groupChat) {
          // Use _count if available, otherwise use members array length
          const count = data.groupChat._count?.members ?? data.groupChat.members?.length ?? 0;
          setMemberCount(count);
        }
      }
    } catch (error) {
      console.error('Error fetching member count:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/group-chats/${eventId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      const data = await response.json();
      const sortedMessages = [...(data.messages || [])].sort(
        (a: Message, b: Message) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
      window.dispatchEvent(new Event('messages-updated'));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Unable to load group chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleSendMessage = async () => {
    if (!eventId || isSending) return;

    const trimmedMessage = newMessage.trim();
    const hasText = trimmedMessage.length > 0;
    const hasFile = Boolean(selectedFile);

    if (!hasText && !hasFile) {
      return;
    }

    try {
      setIsSending(true);
      let response: Response;

      if (hasFile && selectedFile) {
        const formData = new FormData();
        formData.append('eventId', eventId);
        if (hasText) {
          formData.append('content', trimmedMessage);
        }
        formData.append('file', selectedFile);

        response = await fetch(`/api/group-chats/${eventId}/messages`, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(`/api/group-chats/${eventId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: trimmedMessage,
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      resetComposer();

      // Refresh messages
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
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

  const canSendMessage = newMessage.trim().length > 0 || Boolean(selectedFile);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-chat-dialog-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={handleClose}
      />
      <div
        ref={dialogRef}
        className="relative z-10 flex justify-center w-full"
        tabIndex={-1}
      >
        <div
          className="relative flex w-full flex-col rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 animate-in fade-in-0 zoom-in-95 duration-200"
          style={{ minWidth: '600px', maxWidth: '95vw', height: '85vh', maxHeight: '900px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                {eventImage ? (
                  <AvatarImage src={eventImage} alt={eventTitle} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold text-sm">
                    {eventInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  id="group-chat-dialog-title"
                  className="text-sm font-semibold text-gray-900 dark:text-white truncate"
                >
                  {eventTitle || 'Group Chat'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close group chat dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900 px-4 py-4 rounded-t-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner text="Loading messages..." size="sm" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                    No messages yet
                  </p>
                  <p className="text-sm">
                    Start the conversation by sending a message to the group.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.length > 0 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1 w-20"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                        {new Date(messages[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1 w-20"></div>
                    </div>
                  </div>
                )}
                
                {messages.map((message) => {
                  const isCurrentUser = message.sender.id === currentUserId;
                  const parsedContent = parseMessageContent(message.content);
                  const hasText = Boolean(parsedContent.text);
                  const hasAttachment = Boolean(parsedContent.url);

                  return (
                    <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''} items-start`}>
                      {!isCurrentUser && (
                        <Avatar className="h-6 w-6 flex-shrink-0 mt-1">
                          {message.sender.image ? (
                            <AvatarImage src={message.sender.image} alt={message.sender.name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs">
                              {message.sender.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      
                      <div className={`flex-1 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                        {!isCurrentUser && (
                          <div className="mb-1">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                              {message.sender.name}
                            </span>
                          </div>
                        )}
                        
                        <div className={`inline-block max-w-[85%] ${isCurrentUser ? '' : ''}`}>
                          <div className={`rounded-lg px-3 py-2 ${
                            isCurrentUser
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}>
                            {hasText && (
                              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ 
                                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                                wordSpacing: 'normal',
                                letterSpacing: 'normal'
                              }}>
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
                                    className="block overflow-hidden rounded-lg mt-2"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={parsedContent.url}
                                      alt={parsedContent.name || 'Image attachment'}
                                      className="max-h-48 w-full rounded-lg object-cover"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={parsedContent.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm mt-2 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block" style={{ textAlign: isCurrentUser ? 'right' : 'left' }}>
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
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
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[40px] max-h-[120px] resize-none"
                  style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    whiteSpace: 'pre-wrap',
                    wordSpacing: 'normal',
                    letterSpacing: 'normal'
                  }}
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
                onClick={handleSendMessage}
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
        </div>
      </div>
    </div>
  );
}

