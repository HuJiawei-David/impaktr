'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Paperclip, Smile, Loader2, X, FileText, Image as ImageIcon } from 'lucide-react';
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
    }
  }, [open, participant?.id]);

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
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
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
        className="relative z-10 flex w-full justify-center"
        tabIndex={-1}
      >
        <div
          className="relative flex aspect-[2/1] w-full max-w-[1200px] max-h-[80vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-6 top-4 rounded-md p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            aria-label="Close conversation dialog"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <Avatar className="h-12 w-12">
              {participant?.image ? (
                <AvatarImage src={participant.image} alt={participant.name} />
              ) : (
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-base">
                  {participantInitials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span
                id="participant-message-dialog-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {participant?.name || 'Participant'}
              </span>
              {participant?.email && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {participant.email}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/40 p-6 space-y-4">
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
              <>
                {messages.map((message) => {
                  const isCurrentUser = message.sender.id === currentUserId;
                  const parsedContent = parseMessageContent(message.content);
                  const hasText = Boolean(parsedContent.text);
                  const hasAttachment = Boolean(parsedContent.url);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 shadow-sm ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <div className="space-y-2">
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
                        <span
                          className={`mt-2 block text-right text-xs ${
                            isCurrentUser ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 dark:text-gray-400"
                onClick={handleFileButtonClick}
                aria-label="Attach a file"
              >
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
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[48px] max-h-[120px] resize-none"
                />
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400" disabled>
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!canSendMessage || isSending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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

