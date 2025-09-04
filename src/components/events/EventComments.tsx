// home/ubuntu/impaktrweb/src/components/events/EventComments.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  MessageCircle, 
  Send, 
  Heart, 
  MoreVertical, 
  Flag, 
  Edit3, 
  Trash2,
  Reply
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatTimeAgo, getInitials } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
    email: string;
    currentRank?: string;
  };
  likes: {
    id: string;
    userId: string;
  }[];
  replies: Comment[];
  parentId?: string;
}

interface EventCommentsProps {
  eventId: string;
  isParticipant?: boolean;
  canComment?: boolean;
}

export function EventComments({ eventId, isParticipant = false, canComment = true }: EventCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!session?.user || !replyText.trim()) return;

    try {
      const response = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyText.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(comment => 
          comment.id === parentId
            ? { ...comment, replies: [...comment.replies, data.comment] }
            : comment
        ));
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/events/${eventId}/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, likes: data.likes };
          }
          // Handle likes on replies
          const updatedReplies = comment.replies.map(reply =>
            reply.id === commentId ? { ...reply, likes: data.likes } : reply
          );
          return { ...comment, replies: updatedReplies };
        }));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      const response = await fetch(`/api/events/${eventId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editText.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? data.comment : comment
        ));
        setEditingComment(null);
        setEditText('');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
      <div className="flex space-x-3">
        <Avatar className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} flex-shrink-0`}>
          <AvatarImage src={comment.user.image} alt={comment.user.name} />
          <AvatarFallback>
            {getInitials(comment.user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{comment.user.name}</span>
                {isParticipant && comment.user.id === session?.user?.id && (
                  <Badge variant="secondary" className="text-xs">
                    Participant
                  </Badge>
                )}
                {comment.user.currentRank && (
                  <Badge variant="outline" className="text-xs">
                    {comment.user.currentRank}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(comment.createdAt)}
                  {comment.updatedAt !== comment.createdAt && ' (edited)'}
                </span>
                
                {session?.user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {session.user.id === comment.user.id ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditText(comment.content);
                            }}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem>
                          <Flag className="w-4 h-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingComment(null);
                      setEditText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleLikeComment(comment.id)}
            >
              <Heart 
                className={`w-3 h-3 mr-1 ${
                  comment.likes.some(like => like.userId === session?.user?.id)
                    ? 'fill-red-500 text-red-500'
                    : ''
                }`} 
              />
              {comment.likes.length > 0 && comment.likes.length}
            </Button>

            {!isReply && session?.user && canComment && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyText('');
                }}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] text-sm"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyText.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Comment Form */}
        {session?.user && canComment && (
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={session.user.image || undefined} alt={session.user.name || undefined} />
                <AvatarFallback>
                  {getInitials(session.user.name || '')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this event..."
                  className="min-h-[80px]"
                />
                
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {newComment.length}/500 characters
                  </p>
                  
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={!newComment.trim() || isSubmitting || newComment.length > 500}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {!session?.user && (
          <div className="text-center p-6 bg-muted/30 rounded-lg">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              Please sign in to join the discussion
            </p>
          </div>
        )}

        {!canComment && session?.user && (
          <div className="text-center p-6 bg-muted/30 rounded-lg">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              Comments are disabled for this event
            </p>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-medium mb-1">No comments yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to share your thoughts about this event!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}