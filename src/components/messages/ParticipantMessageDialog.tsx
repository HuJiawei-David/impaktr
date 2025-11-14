'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Paperclip, Smile, Loader2, X, FileText, Image as ImageIcon, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';
import { parseMessageContent } from '@/lib/messages';

type MessageType = 'TEXT' | 'IMAGE' | 'FILE';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

interface MessageParticipant {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
}

interface MessageSender {
  id: string;
  name: string;
  image?: string | null;
}

interface Message {
  id: string;
  content: string;
  type: MessageType;
  isRead: boolean;
  createdAt: string;
  sender: MessageSender;
  receiver: MessageSender;
}

interface ParticipantMessageDialogProps {
  participant: MessageParticipant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

export function ParticipantMessageDialog({
  participant,
  open,
  onOpenChange,
  currentUserId,
}: ParticipantMessageDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const participantInitials = useMemo(() => {
    if (!participant?.name) return 'U';
    const parts = participant.name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }, [participant]);

  useEffect(() => {
    if (open && participant?.id) {
      fetchMessages(participant.id);
    } else if (!open) {
      setMessages([]);
      setNewMessage('');
      setShowEmojiPicker(false);
    }
  }, [open, participant?.id]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showEmojiPicker]);

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
      // Defer focus to ensure the element is in the DOM.
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
    setShowEmojiPicker(false);
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
      window.dispatchEvent(new Event('messages-updated'));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Unable to load conversation. Please try again.');
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
    if (!participant?.id || isSending) return;

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
        formData.append('receiverId', participant.id);
        if (hasText) {
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: participant.id,
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

      // Refresh conversation metadata for unread counts on other clients
      await fetchMessages(participant.id);
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

  if (!open || !participant) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="participant-message-dialog-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        ref={dialogRef}
        className="relative z-10 flex justify-center w-full"
        tabIndex={-1}
      >
        <div
          className="relative flex h-[800px] max-h-[90vh] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          style={{ width: '400px', minWidth: '400px', maxWidth: '95vw' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                {participant?.image ? (
                  <AvatarImage src={participant.image} alt={participant.name} />
                ) : (
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                    {participantInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  id="participant-message-dialog-title"
                  className="text-sm font-semibold text-gray-900 dark:text-white truncate"
                >
                  {participant?.name || 'Participant'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Active now
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close conversation dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 px-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner text="Loading conversation..." size="sm" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start the conversation
                  </p>
                  <p className="text-sm">
                    Send a message to {participant?.name || 'this participant'} to begin chatting.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Date separator - you can add logic to group messages by date */}
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
                
                {messages.map((message, index) => {
                  const isCurrentUser = message.sender.id === currentUserId;
                  const parsedContent = parseMessageContent(message.content);
                  const hasText = Boolean(parsedContent.text);
                  const hasAttachment = Boolean(parsedContent.url);
                  
                  // Show avatar only for first message or when sender changes
                  const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id;

                  return (
                    <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                      {showAvatar ? (
                        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                          {message.sender.image ? (
                            <AvatarImage src={message.sender.image} alt={message.sender.name} />
                          ) : (
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {message.sender.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ) : (
                        <div className="w-8"></div>
                      )}
                      
                      <div className={`flex-1 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                        {showAvatar && (
                          <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {message.sender.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`inline-block max-w-[85%] ${!showAvatar ? 'ml-10' : ''} ${isCurrentUser ? 'mr-0' : ''}`}>
                          <div className={`rounded-lg px-3 py-2 ${
                            isCurrentUser
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}>
                            {hasText && (
                              <p className="text-sm leading-relaxed whitespace-pre-line">
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
                          {!showAvatar && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block ml-3">
                              {formatTime(message.createdAt)}
                            </span>
                          )}
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
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
            {selectedFile && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
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
                  className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
                  onClick={removeSelectedFile}
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {/* Text input on its own line */}
            <div className="mb-2">
              <Textarea
                ref={textareaRef}
                placeholder="Write a message..."
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full min-h-[40px] max-h-[120px] resize-none border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500"
                rows={1}
              />
            </div>
            
            {/* Controls below the text input */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleFileButtonClick}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Attach image"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleFileButtonClick}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <div className="relative emoji-picker-container">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Add emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 w-64 h-48 overflow-y-auto z-50 emoji-picker-container">
                      <div className="grid grid-cols-8 gap-1">
                        {['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewMessage(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!canSendMessage || isSending}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  canSendMessage && !isSending
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

