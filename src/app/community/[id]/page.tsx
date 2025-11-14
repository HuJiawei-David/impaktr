'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users,
  MessageCircle,
  Calendar,
  Globe,
  Lock,
  Settings,
  Plus,
  Share2,
  UserPlus,
  CheckCircle,
  Star,
  Pin,
  MoreHorizontal,
  Search,
  MapPin,
  Award,
  Clock,
  Building2,
  Heart,
  Trash2,
  X,
  UserCheck,
  UserX
} from 'lucide-react';
import { getSDGById } from '@/constants/sdgs';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ParticipantMessageDialog } from '@/components/messages/ParticipantMessageDialog';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  sdgFocus: number[];
  privacy: string;
  isPublic: boolean;
  bannerImage?: string;
  avatar?: string;
  tags: string[];
  rules: string[];
  whoShouldJoin?: string;
  whatWeDo?: string;
  location?: string;
  language?: string;
  memberCount: number;
  postCount: number;
  resourceCount: number;
  isJoined: boolean;
  userRole: string | null;
  isModerator: boolean;
  moderatorRole: string | null;
  createdBy: string;
  createdAt: string;
  memberAvatars?: string[];
  createdByUser: {
    id: string;
    name: string;
    image?: string;
  };
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      image?: string;
      impactScore: number;
      tier: string;
    };
  }>;
  moderators: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  posts: Array<{
    id: string;
    content: string;
    type: string;
    imageUrl?: string;
    mediaUrls: string[];
    tags: string[];
    isPinned: boolean;
    createdAt: string;
    likes?: number;
    isLiked?: boolean;
    likedBy?: Array<{
      id: string;
      name: string;
      image: string | null;
    }>;
    user: {
      id: string;
      name: string;
      image?: string;
      impactScore: number;
      tier: string;
      role?: string | null;
    };
    comments?: Array<{
      id: string;
      content: string;
      createdAt: string;
      user: {
        id: string;
        name: string;
        image?: string | null;
        impactScore: number;
        tier: string;
        role?: string | null;
      };
      likes?: number;
      replies?: Array<{
        id: string;
        content: string;
        createdAt: string;
        user: {
          id: string;
          name: string;
          image?: string | null;
          impactScore: number;
          tier: string;
          role?: string | null;
        };
        likes?: number;
      }>;
    }>;
  }>;
  resources: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    url?: string;
    fileUrl?: string;
    createdAt: string;
    uploader: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
}

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'about' | 'requests'>('feed');
  const [membersTab, setMembersTab] = useState<'all' | 'admins' | 'members'>('all');
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{postId: string, commentId?: string, replyId?: string, userName: string, isReplyToReply?: boolean} | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [postLikes, setPostLikes] = useState<Map<string, { liked: boolean; count: number }>>(new Map());
  const [commentLikes, setCommentLikes] = useState<Map<string, { liked: boolean; count: number }>>(new Map());
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [likesList, setLikesList] = useState<Array<{ id: string; userId: string; userName: string; userImage: string | null; createdAt: string }>>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [joinRequests, setJoinRequests] = useState<Array<{
    id: string;
    requesterId: string;
    requesterName: string;
    requesterImage: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string;
      image: string | null;
      email: string;
      bio: string | null;
      impactScore: number;
      tier: string;
    } | null;
  }>>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [connectionStates, setConnectionStates] = useState<Map<string, 'none' | 'pending' | 'connected'>>(new Map());
  const [connectionLoading, setConnectionLoading] = useState<Map<string, boolean>>(new Map());
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedMessageParticipant, setSelectedMessageParticipant] = useState<{
    id: string;
    name: string | null;
    image: string | null;
  } | null>(null);

  const fetchCommunity = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch community data and posts in parallel
      const [communityResponse, postsResponse] = await Promise.all([
        fetch(`/api/communities/${communityId}`),
        fetch(`/api/communities/posts?communityId=${communityId}&limit=50`)
      ]);
      
      if (!communityResponse.ok) {
        throw new Error('Failed to fetch community');
      }
      
      const data = await communityResponse.json();
      let posts = data.community.posts || [];
      
      // If posts endpoint is available, use it to get all posts
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        posts = postsData.posts || [];
      }
      
      // Format posts to match expected structure
      const formattedPosts = posts.map((post: {
        id: string;
        content: string;
        type: string;
        imageUrl?: string | null;
        mediaUrls?: string[];
        tags?: string[];
        isPinned?: boolean;
        createdAt: string;
        likes?: number;
        isLiked?: boolean;
        likedBy?: Array<{
          id: string;
          name: string;
          image: string | null;
        }>;
                      user: {
          id: string;
          name: string;
          image?: string | null;
          impactScore?: number;
          tier?: string;
          role?: string | null;
        };
      }) => ({
        id: post.id,
        content: post.content,
        type: post.type,
        imageUrl: post.imageUrl || post.mediaUrls?.[0] || null,
        mediaUrls: post.mediaUrls || [],
        likes: post.likes || 0,
        isLiked: post.isLiked || false,
        likedBy: post.likedBy || [],
        tags: post.tags || [],
        isPinned: post.isPinned || false,
        createdAt: post.createdAt,
                      user: {
          id: post.user.id,
          name: post.user.name,
          image: post.user.image,
          impactScore: post.user.impactScore || 0,
          tier: post.user.tier || 'Contributor',
          role: post.user.role || null
        },
        comments: [] // Comments will be loaded separately if needed
      }));

      // Initialize like state for all posts
      setPostLikes(prev => {
        const newMap = new Map(prev);
        formattedPosts.forEach((post: { id: string; likes?: number; isLiked?: boolean }) => {
          if (!newMap.has(post.id)) {
            newMap.set(post.id, {
              liked: post.isLiked || false,
              count: post.likes || 0
            });
          }
        });
        return newMap;
      });
      
      const communityWithPosts = {
        ...data.community,
        posts: formattedPosts
      };
        
        setCommunity(communityWithPosts);
        // Reset requestSent if user is now a member
        if (communityWithPosts.isJoined) {
          setRequestSent(false);
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  const fetchPostComments = useCallback(async (postId: string) => {
    try {
      setLoadingComments(prev => {
        if (prev.has(postId)) return prev;
        return new Set(prev).add(postId);
      });
      
      const response = await fetch(`/api/communities/posts/${postId}/comments`);
      
      if (response.ok) {
        const data = await response.json();
        const comments = data.comments || [];
        
        // Initialize comment likes state
        comments.forEach((comment: { id: string; likes: number; isLiked?: boolean; replies?: Array<{ id: string; likes: number; isLiked?: boolean }> }) => {
          setCommentLikes(prev => {
            const newMap = new Map(prev);
            if (!newMap.has(comment.id)) {
              newMap.set(comment.id, { liked: comment.isLiked || false, count: comment.likes || 0 });
            }
            // Initialize likes for replies
            comment.replies?.forEach((reply: { id: string; likes: number; isLiked?: boolean }) => {
              if (!newMap.has(reply.id)) {
                newMap.set(reply.id, { liked: reply.isLiked || false, count: reply.likes || 0 });
              }
            });
            return newMap;
          });
        });
        
        // Update the post with comments
        setCommunity(prev => {
          if (!prev) return null;
          return {
            ...prev,
            posts: prev.posts.map(post => 
              post.id === postId 
                ? { ...post, comments }
                : post
            )
          };
        });
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  }, []);

  // Fetch comments for posts when community is loaded
  useEffect(() => {
    if (community?.posts && community.posts.length > 0) {
      community.posts.forEach((post) => {
        fetchPostComments(post.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community?.posts?.length, fetchPostComments]);

  const handleLike = async (postId: string) => {
    if (!session?.user) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      // Optimistic update
      const currentLike = postLikes.get(postId) || { liked: false, count: 0 };
      const newLiked = !currentLike.liked;
      const newCount = newLiked ? currentLike.count + 1 : Math.max(0, currentLike.count - 1);
      
      setPostLikes(prev => new Map(prev).set(postId, { liked: newLiked, count: newCount }));

      const response = await fetch(`/api/communities/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Revert on error
        setPostLikes(prev => new Map(prev).set(postId, currentLike));
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error liking post:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to like post');
      }

      const data = await response.json();
      setPostLikes(prev => new Map(prev).set(postId, { 
        liked: data.liked, 
        count: data.count || newCount 
      }));
    } catch (err) {
      console.error('Error liking post:', err);
      toast.error('Failed to like post');
    }
  };

  const handleShare = async (postId: string) => {
    if (!navigator.share) {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}/community/${communityId}?post=${postId}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      return;
    }

    try {
      const url = `${window.location.origin}/community/${communityId}?post=${postId}`;
      await navigator.share({
        title: 'Check out this post',
        text: community?.posts.find(p => p.id === postId)?.content.substring(0, 100) || 'Check out this post',
        url: url,
      });
    } catch (err) {
      // User cancelled or error
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const handleShowLikes = async (postId: string) => {
    console.log('Opening likes dialog for post:', postId);
    setSelectedPostId(postId);
    setShowLikesDialog(true);
    setLoadingLikes(true);
    
    try {
      const response = await fetch(`/api/communities/posts/${postId}/likes`);
      if (response.ok) {
        const data = await response.json();
        console.log('Likes data received:', data);
        setLikesList(data.likes || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load likes:', errorData);
        toast.error('Failed to load likes');
      }
    } catch (err) {
      console.error('Error fetching likes:', err);
      toast.error('Failed to load likes');
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!session?.user) {
      toast.error('Please sign in to like comments');
      return;
    }

    try {
      // Optimistic update
      const currentLike = commentLikes.get(commentId) || { liked: false, count: 0 };
      const newLiked = !currentLike.liked;
      const newCount = newLiked ? currentLike.count + 1 : Math.max(0, currentLike.count - 1);
      
      setCommentLikes(prev => new Map(prev).set(commentId, { liked: newLiked, count: newCount }));

      const response = await fetch(`/api/communities/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Revert on error
        setCommentLikes(prev => new Map(prev).set(commentId, currentLike));
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error liking comment:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to like comment');
      }

      const data = await response.json();
      setCommentLikes(prev => new Map(prev).set(commentId, { 
        liked: data.liked || false, 
        count: data.count || newCount 
      }));

      // Update the comment in the community state (handles both comments and replies)
      if (community) {
        setCommunity(prev => {
          if (!prev) return null;
          return {
            ...prev,
            posts: prev.posts.map(p => 
              p.id === postId 
                ? {
                    ...p,
                    comments: p.comments?.map(c => {
                      // Check if this is the comment being liked
                      if (c.id === commentId) {
                        return { ...c, likes: data.count || newCount };
                      }
                      // Check if any reply is being liked
                      if (c.replies) {
                        return {
                          ...c,
                          replies: c.replies.map(r =>
                            r.id === commentId
                              ? { ...r, likes: data.count || newCount }
                              : r
                          )
                        };
                      }
                      return c;
                    })
                  }
                : p
            )
          };
        });
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      toast.error('Failed to like comment');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !community) return;
    try {
      setIsCreatingPost(true);
      
      // Create FormData to send files
      const formData = new FormData();
      formData.append('communityId', communityId);
      formData.append('content', newPostContent);
      formData.append('type', selectedMedia.length > 0 ? 'IMAGE' : 'TEXT');
      formData.append('isPinned', String(isPinned && (community.userRole === 'OWNER' || community.userRole === 'ADMIN')));
      
      // Add media files
      selectedMedia.forEach((file) => {
        formData.append('media', file);
      });

      const res = await fetch('/api/communities/posts', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowCreatePost(false);
        setNewPostContent('');
        setSelectedMedia([]);
        setIsPinned(false);
        // Refresh community data to show new post
        await fetchCommunity();
      } else {
        const errorData = await res.json();
        console.error('Error creating post:', errorData.error || 'Failed to create post');
        alert(errorData.error || 'Failed to create post');
      }
    } catch (e) {
      console.error('Error creating post:', e);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedMedia(Array.from(files));
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }
    fetchCommunity();
  }, [session, status, communityId, fetchCommunity, router]);


  const handleJoin = async () => {
    if (!community) return;
    
    // If request is already sent, cancel it
    if (requestSent) {
      try {
        setJoining(true);
        const response = await fetch(`/api/communities/request-join?communityId=${community.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to cancel join request');
        }

        setRequestSent(false);
        toast.success('Join request cancelled');
      } catch (err) {
        console.error('Error cancelling join request:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to cancel join request');
      } finally {
        setJoining(false);
      }
      return;
    }
    
    try {
      setJoining(true);
      
      // Check if community is private
      if (!community.isPublic || community.privacy === 'PRIVATE') {
        // Send join request for private communities
        const response = await fetch('/api/communities/request-join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ communityId: community.id })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to send join request');
        }

        setRequestSent(true);
        toast.success('Join request sent! The community admin will review your request.');
      } else if (community.privacy === 'INVITE_ONLY') {
        // INVITE_ONLY communities require an invitation
        toast.error('This community is invite-only. You need an invitation to join.');
        return;
      } else {
        // Join public community directly
        const response = await fetch('/api/communities/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ communityId: community.id })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to join community');
        }

        toast.success('Successfully joined the community!');
      }

      // Refresh community data
      await fetchCommunity();
    } catch (err) {
      console.error('Error joining community:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to join community');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!community) return;
    
    try {
      setLeaving(true);
      const response = await fetch(`/api/communities/join?communityId=${community.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Leave community error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.message || `Failed to leave community (${response.status})`);
      }

      // Refresh community data
      await fetchCommunity();
      setShowLeaveConfirm(false);
    } catch (err) {
      console.error('Error leaving community:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to leave community');
    } finally {
      setLeaving(false);
    }
  };

  const fetchJoinRequests = useCallback(async () => {
    if (!community || (community.userRole !== 'OWNER' && community.userRole !== 'ADMIN')) {
      return;
    }

    try {
      setLoadingRequests(true);
      const response = await fetch(`/api/communities/${communityId}/requests`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch join requests');
      }

      const data = await response.json();
      setJoinRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching join requests:', err);
      toast.error('Failed to load join requests');
    } finally {
      setLoadingRequests(false);
    }
  }, [community, communityId]);

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'requests' && community && (community.userRole === 'OWNER' || community.userRole === 'ADMIN')) {
      setActiveTab('requests');
      fetchJoinRequests();
    }
  }, [searchParams, community, fetchJoinRequests]);

  const handleApproveRequest = async (requestId: string) => {
    if (!community) return;

    try {
      setProcessingRequest(requestId);
      const response = await fetch(`/api/communities/${communityId}/requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve request');
      }

      toast.success('Join request approved');
      await fetchJoinRequests();
      await fetchCommunity(); // Refresh to update member count
    } catch (err) {
      console.error('Error approving request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!community) return;

    try {
      setProcessingRequest(requestId);
      const response = await fetch(`/api/communities/${communityId}/requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reject request');
      }

      toast.success('Join request rejected');
      await fetchJoinRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Fetch connection status for members
  const fetchConnectionStatuses = useCallback(async () => {
    if (!session?.user?.id || !community?.members) return;

    try {
      const memberIds = community.members
        .filter(m => m.user.id !== session.user.id)
        .map(m => m.user.id);

      if (memberIds.length === 0) return;

      // Fetch all connections for the current user
      const response = await fetch('/api/users/connections');
      if (response.ok) {
        const data = await response.json();
        const connections = data.connections || [];
        
        // Create a map of connection statuses
        const statusMap = new Map<string, 'none' | 'pending' | 'connected'>();
        
        memberIds.forEach(memberId => {
          const connection = connections.find((conn: { requesterId: string; addresseeId: string; status: string }) => 
            (conn.requesterId === session.user.id && conn.addresseeId === memberId) ||
            (conn.requesterId === memberId && conn.addresseeId === session.user.id)
          );
          
          if (connection) {
            if (connection.status === 'ACCEPTED') {
              statusMap.set(memberId, 'connected');
            } else if (connection.status === 'PENDING') {
              // Check if current user is the requester
              statusMap.set(memberId, connection.requesterId === session.user.id ? 'pending' : 'none');
            } else {
              statusMap.set(memberId, 'none');
            }
          } else {
            statusMap.set(memberId, 'none');
          }
        });
        
        setConnectionStates(statusMap);
      }
    } catch (err) {
      console.error('Error fetching connection statuses:', err);
    }
  }, [session, community]);

  // Fetch connection statuses when community or members change
  useEffect(() => {
    if (community?.members && activeTab === 'members') {
      fetchConnectionStatuses();
    }
  }, [community?.members, activeTab, fetchConnectionStatuses]);

  const handleConnect = async (memberId: string) => {
    if (!session?.user?.id) return;

    try {
      setConnectionLoading(prev => new Map(prev).set(memberId, true));
      
      const response = await fetch(`/api/users/${memberId}/connect`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to manage connection');
      }

      const data = await response.json();
      
      // Update connection state
      if (data.connectionStatus === 'PENDING') {
        setConnectionStates(prev => new Map(prev).set(memberId, 'pending'));
        toast.success('Connection request sent!');
      } else if (data.connectionStatus === 'ACCEPTED') {
        setConnectionStates(prev => new Map(prev).set(memberId, 'connected'));
        toast.success('Connection request accepted!');
      } else if (data.connectionStatus === null) {
        setConnectionStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(memberId);
          return newMap;
        });
        toast.success('Connection request cancelled');
      }
    } catch (err) {
      console.error('Error managing connection:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to manage connection');
    } finally {
      setConnectionLoading(prev => {
        const newMap = new Map(prev);
        newMap.delete(memberId);
        return newMap;
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleReply = async (postId: string, commentId?: string, replyId?: string) => {
    if (!replyContent.trim() || !session?.user) return;
    
    try {
      setIsSubmittingReply(true);
      
      // Determine parentId: if replying to a reply, use replyId; if replying to a comment, use commentId
      const parentId = replyId || commentId || undefined;
      
      // Call API to create comment/reply
      const response = await fetch(`/api/communities/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId: parentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit reply' }));
        throw new Error(errorData.error || 'Failed to submit reply');
      }

      const newComment = await response.json();

      // Update the community state with the new comment/reply
      if (community) {
        const updatedPosts = community.posts.map(post => {
          if (post.id === postId) {
            if (commentId || replyId) {
              // If replying to a comment or reply, add to the appropriate comment's replies
            const updatedComments = post.comments?.map(comment => {
              if (commentId && comment.id === commentId) {
                  // Replying to a comment
                return {
                  ...comment,
                    replies: [...(comment.replies || []), {
                      id: newComment.id,
                      content: newComment.content,
                      createdAt: newComment.createdAt,
                      user: newComment.user,
                      likes: newComment.likes || 0,
                    }]
                  };
                }
                // Check if replying to a reply within this comment
                if (replyId && comment.replies) {
                  const updatedReplies = comment.replies.map(reply => {
                    if (reply.id === replyId) {
                      // This is the reply we're replying to, but we add the new reply to the comment's replies
                      return reply;
                    }
                    return reply;
                  });
                  // Add the new reply to the comment's replies
                  if (comment.replies.some(r => r.id === replyId)) {
                    return {
                      ...comment,
                      replies: [...updatedReplies, {
                        id: newComment.id,
                        content: newComment.content,
                        createdAt: newComment.createdAt,
                        user: newComment.user,
                        likes: newComment.likes || 0,
                      }]
                    };
                  }
                }
              return comment;
            }) || [];
            
            return {
              ...post,
              comments: updatedComments
            };
            } else {
              // New top-level comment
              return {
                ...post,
                comments: [...(post.comments || []), {
                  id: newComment.id,
                  content: newComment.content,
                  createdAt: newComment.createdAt,
                  user: newComment.user,
                  likes: newComment.likes || 0,
                  replies: []
                }]
              };
            }
          }
          return post;
        });
        
        setCommunity({
          ...community,
          posts: updatedPosts
        });
      }

      // Reset reply state
      setReplyContent('');
      setReplyingTo(null);
      
      // Refresh comments for this post
      await fetchPostComments(postId);
    } catch (err) {
      console.error('Error submitting reply:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'PUBLIC':
        return <Globe className="w-4 h-4" />;
      case 'PRIVATE':
        return <Lock className="w-4 h-4" />;
      case 'INVITE_ONLY':
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case 'PUBLIC':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PRIVATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'INVITE_ONLY':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case 'PUBLIC':
        return 'Public';
      case 'PRIVATE':
        return 'Private';
      case 'INVITE_ONLY':
        return 'Invite Only';
      default:
        return privacy.charAt(0).toUpperCase() + privacy.slice(1).toLowerCase();
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading community..." />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Community Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'The community you\'re looking for doesn\'t exist or you don\'t have access to it.'}
            </p>
            <Button 
              onClick={() => router.push('/community')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Back to Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Community Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-64 md:h-80 relative overflow-hidden">
          {community.bannerImage ? (
            <>
              <Image 
                src={community.bannerImage} 
                alt={community.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 relative">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-7xl md:text-9xl font-bold opacity-20">
                  {community.name.charAt(0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Community Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-48 pb-6">
            <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                {/* Privacy Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  <Badge 
                    className={`px-3 py-1 text-xs font-medium flex items-center gap-1 ${getPrivacyColor(community.privacy)}`}
                  >
                    {getPrivacyIcon(community.privacy)}
                    <span>{formatPrivacyLabel(community.privacy)}</span>
                  </Badge>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-75"></div>
                    <Avatar className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-gray-900 shadow-lg rounded-2xl">
                      <AvatarImage src={community.avatar} alt={community.name} />
                      <AvatarFallback className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl">
                        {community.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Community Details */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="flex items-start gap-3 flex-wrap">
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                          {community.name}
                        </h1>
                        {community.userRole === 'OWNER' && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-md">
                            <Star className="w-4 h-4 mr-1.5 fill-current" />
                            Owner
                          </Badge>
                        )}
                        {community.userRole === 'ADMIN' && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-md">
                            Admin
                          </Badge>
                        )}
                      </div>
                      
                      {/* Description */}
                      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
                        {community.description}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-6 text-base">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold">{community.memberCount}</span>
                          <span className="text-gray-500 dark:text-gray-400">members</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-semibold">{community.postCount}</span>
                          <span className="text-gray-500 dark:text-gray-400">posts</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            {new Date(community.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>

                      {/* SDG Alignments */}
                      {community.sdgFocus && community.sdgFocus.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {community.sdgFocus.map((sdgId) => {
                            const sdg = getSDGById(sdgId);
                            return (
                              <Badge 
                                key={sdgId} 
                                variant="outline" 
                                className="px-3 py-1 text-sm flex items-center gap-1.5"
                                style={{ borderColor: sdg?.color }}
                              >
                                <Image src={sdg?.image || ''} alt="" width={16} height={16} className="w-4 h-4" />
                                <span>SDG {sdg?.id}: {sdg?.title}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Tags */}
                      {community.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {community.tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="px-3 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Bottom Right of Profile Header */}
                <div className="flex justify-end mt-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {community.isJoined ? (
                      <>
                        <Button 
                          onClick={() => setShowLeaveConfirm(true)}
                          className="flex-1 sm:flex-none whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Joined
                        </Button>
                        {community.userRole && ['OWNER', 'ADMIN'].includes(community.userRole) && (
                          <Button 
                            variant="outline" 
                            className="flex-1 sm:flex-none whitespace-nowrap border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => router.push(`/community/${communityId}/settings`)}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Button>
                        )}
                      </>
                    ) : community.privacy === 'INVITE_ONLY' ? (
                      <Button 
                        disabled
                        variant="outline"
                        className="flex-1 sm:flex-none whitespace-nowrap"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Invite Only
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleJoin}
                        disabled={joining}
                        className={`flex-1 sm:flex-none whitespace-nowrap border-0 shadow-lg hover:shadow-xl transition-all ${
                          requestSent 
                            ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                        }`}
                      >
                        {community.isPublic ? (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            {joining ? 'Joining...' : 'Join Community'}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            {joining ? (requestSent ? 'Cancelling...' : 'Requesting...') : requestSent ? 'Requested' : 'Request to Join'}
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className="flex-1 sm:flex-none whitespace-nowrap border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Pill Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeTab === 'feed' ? 'default' : 'outline'}
            onClick={() => setActiveTab('feed')}
            className={`rounded-full px-6 py-2 ${
              activeTab === 'feed' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Feed
          </Button>
          <Button
            variant={activeTab === 'members' ? 'default' : 'outline'}
            onClick={() => setActiveTab('members')}
            className={`rounded-full px-6 py-2 ${
              activeTab === 'members' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Members ({community.memberCount})
          </Button>
          <Button
            variant={activeTab === 'about' ? 'default' : 'outline'}
            onClick={() => setActiveTab('about')}
            className={`rounded-full px-6 py-2 ${
              activeTab === 'about' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Globe className="w-4 h-4 mr-2" />
            About
          </Button>
          {(community?.userRole === 'OWNER' || community?.userRole === 'ADMIN') && (
            <Button
              variant={activeTab === 'requests' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('requests');
                fetchJoinRequests();
              }}
              className={`rounded-full px-6 py-2 relative ${
                activeTab === 'requests' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Requests
              {joinRequests.length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {joinRequests.length}
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'feed' && (
            <>
              {!community.isJoined && !community.isPublic ? (
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                      <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Private Community</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      This is a private community. Join to view the feed and connect with members.
                    </p>
                    <Button 
                      onClick={handleJoin}
                      disabled={joining}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-6"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {joining ? 'Requesting...' : 'Request to Join'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Sidebar */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Community Stats */}
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          Community Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Members</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{community.memberCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Posts</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{community.postCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Resources</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{community.resourceCount.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {new Date(community.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    {community.isJoined && (
                      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5 text-green-600" />
                            Quick Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button 
                            className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            onClick={() => setShowCreatePost(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Post
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Community
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Community Info */}
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Globe className="w-5 h-5 text-purple-600" />
                          Community Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
                          <div className="mt-1">
                            <Badge 
                              variant="outline" 
                              className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                            >
                              {community.category}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Privacy</span>
                          <div className="mt-1">
                            <Badge 
                              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium ${getPrivacyColor(community.privacy)}`}
                            >
                              {getPrivacyIcon(community.privacy)}
                              <span>{formatPrivacyLabel(community.privacy)}</span>
                            </Badge>
                          </div>
                        </div>
                        {community.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{community.location}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recent Members */}
                    {community.memberAvatars && community.memberAvatars.length > 0 && (
                      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-pink-600" />
                            Recent Members
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex -space-x-2">
                            {community.memberAvatars.slice(0, 5).map((avatar: string, index: number) => (
                              <Avatar key={index} className="w-8 h-8 border-2 border-white dark:border-gray-900">
                                <AvatarImage src={avatar} />
                                <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                  {community.name.charAt(index)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {community.memberCount.toLocaleString()} total members
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Main Feed */}
                  <div className="lg:col-span-6 space-y-3">
                  {/* Post Composer - LinkedIn Style */}
                  {community.isJoined && (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardContent className="p-4">
                        {!showCreatePost ? (
                          <>
                            <div className="flex items-center space-x-3 mb-4">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={session?.user?.image || undefined} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                                  {session?.user?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <Button 
                                variant="outline" 
                                className="flex-1 justify-start text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 pl-4 rounded-full"
                                onClick={() => setShowCreatePost(true)}
                              >
                                Start a post...
                              </Button>
                            </div>
                            <div className="flex items-center justify-around pt-2 border-t border-gray-200 dark:border-gray-700">
                              <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowCreatePost(true)}>
                                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium">Photo</span>
                              </Button>
                              <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowCreatePost(true)}>
                                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium">Event</span>
                              </Button>
                              <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowCreatePost(true)}>
                                <Pin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium">Article</span>
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={session?.user?.image || undefined} />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                                    {session?.user?.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900 dark:text-white">{session?.user?.name}</p>
                                    {community.userRole === 'OWNER' && (
                                      <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 font-semibold">
                                        <Star className="w-3 h-3 mr-1 fill-current" />
                                        Owner
                                      </Badge>
                                    )}
                                    {community.userRole === 'ADMIN' && (
                                      <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 font-semibold">
                                        Admin
                                      </Badge>
                                    )}
                                  </div>
                                  {!community.userRole && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Community Member
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => { setShowCreatePost(false); setNewPostContent(''); }}>
                                ✕
                              </Button>
                            </div>
                            <textarea
                              value={newPostContent}
                              onChange={(e) => setNewPostContent(e.target.value)}
                              placeholder="What do you want to talk about?"
                              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-base min-h-[120px]"
                              autoFocus
                            />
                            {selectedMedia.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {selectedMedia.map((file, index) => (
                                  <div key={index} className="relative">
                                    {file.type.startsWith('image/') ? (
                                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt={`Preview ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          onClick={() => setSelectedMedia(selectedMedia.filter((_, i) => i !== index))}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="relative w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{file.name}</span>
                                        <button
                                          onClick={() => setSelectedMedia(selectedMedia.filter((_, i) => i !== index))}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                <label htmlFor="media-upload">
                                  <input
                                    id="media-upload"
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleMediaSelect}
                                    className="hidden"
                                  />
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => {
                                      const input = document.getElementById('media-upload') as HTMLInputElement;
                                      input?.click();
                                    }}
                                  >
                                  <Plus className="w-5 h-5" />
                                </Button>
                                </label>
                                {(community.userRole === 'OWNER' || community.userRole === 'ADMIN') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 ${isPinned ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' : ''}`}
                                    onClick={() => setIsPinned(!isPinned)}
                                  >
                                    <Pin className={`w-5 h-5 ${isPinned ? 'fill-current' : ''}`} />
                                </Button>
                                )}
                              </div>
                              <Button 
                                onClick={handleCreatePost} 
                                disabled={isCreatingPost || !newPostContent.trim()} 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full px-6"
                              >
                                {isCreatingPost ? 'Posting...' : 'Post'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Community Posts */}
                  {community.posts.length === 0 ? (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardContent className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                          <MessageCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No posts yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Be the first to share something with the community!
                        </p>
                        {community.isJoined && (
                          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Post
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {community.posts.map((post) => (
                        <Card key={post.id} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm">
                          <CardContent className="p-4">
                            {/* Post Header */}
                            <div className="flex items-start space-x-3 mb-3">
                              <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                                <AvatarImage src={post.user.image} />
                                <AvatarFallback className="bg-blue-500 text-white text-sm">
                                  {post.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                    {post.user.name}
                                  </h4>
                                  {post.user.role === 'OWNER' && (
                                    <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 font-semibold">
                                      <Star className="w-3 h-3 mr-1 fill-current" />
                                      Owner
                                    </Badge>
                                  )}
                                  {post.user.role === 'ADMIN' && (
                                    <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 font-semibold">
                                      Admin
                                    </Badge>
                                  )}
                                    <Badge className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    {post.user.tier}
                                  </Badge>
                                  {post.isPinned && (
                                      <Badge className="text-xs px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                      <Pin className="w-3 h-3 mr-1" />
                                      Pinned
                                    </Badge>
                                    )}
                                  </div>
                                  {post.user.id !== session?.user?.id && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-3 py-1 h-7 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                                    >
                                      <UserPlus className="w-3 h-3 mr-1" />
                                      Follow
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(post.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-7 px-2"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Post Content */}
                            <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
                              {post.content}
                            </p>
                            
                            {/* Post Image */}
                            {post.imageUrl && (
                              <div className="mb-3 rounded-lg overflow-hidden">
                                <Image 
                                  src={post.imageUrl} 
                                  alt="Post image"
                                  width={600}
                                  height={400}
                                  className="w-full h-auto"
                                />
                              </div>
                            )}
                            
                            {/* Post Tags */}
                            {post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {post.tags.map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Liked By Section */}
                            {post.likedBy && post.likedBy.length > 0 && (postLikes.get(post.id)?.count ?? 0) > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowLikes(post.id);
                                }}
                                className="w-full flex items-center space-x-2 mb-3 pt-2 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-2 -m-2 transition-colors"
                              >
                                <div className="flex items-center -space-x-2">
                                  {post.likedBy.slice(0, 3).map((user, index) => (
                                    <Avatar 
                                      key={user.id} 
                                      className="w-6 h-6 border-2 border-white dark:border-gray-800"
                                    >
                                      <AvatarImage src={user.image || undefined} />
                                      <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                        {user.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                                  <span>
                                    {post.likedBy.length === 1 && (
                                      <span>{post.likedBy[0].name}</span>
                                    )}
                                    {post.likedBy.length === 2 && (
                                      <span>{post.likedBy[0].name} and {post.likedBy[1].name}</span>
                                    )}
                                    {post.likedBy.length === 3 && (
                                      <span>{post.likedBy[0].name}, {post.likedBy[1].name}, and {post.likedBy[2].name}</span>
                                    )}
                                    {post.likedBy.length > 3 && (
                                      <span>
                                        {post.likedBy[0].name}, {post.likedBy[1].name}, and {(postLikes.get(post.id)?.count ?? 0) - 2} others
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </button>
                            )}

                            {/* Interaction Buttons */}
                            <div className="flex items-center justify-between w-full">
                              <button 
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                                  postLikes.get(post.id)?.liked
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                                }`}
                              >
                                <Heart className={`w-5 h-5 ${postLikes.get(post.id)?.liked ? 'fill-current' : ''}`} />
                                <span>
                                  {(postLikes.get(post.id)?.count ?? 0) > 0 
                                    ? `${postLikes.get(post.id)?.count} ` 
                                    : ''}Like
                                </span>
                              </button>
                              
                              <button 
                                onClick={() => {
                                  setExpandedComments(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(post.id)) {
                                      newSet.delete(post.id);
                                    } else {
                                      newSet.add(post.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="flex items-center space-x-1 text-sm font-medium text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <MessageCircle className="w-5 h-5" />
                                <span>
                                  {post.comments && post.comments.length > 0 
                                    ? `${post.comments.length} ` 
                                    : '0 '}
                                  {post.comments && post.comments.length === 1 ? 'Comment' : 'Comments'}
                                </span>
                              </button>
                              
                              <button 
                                onClick={() => handleShare(post.id)}
                                className="flex items-center space-x-1 text-sm font-medium text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              >
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                              </button>
                            </div>

                            {/* Comments Section */}
                            {post.comments && post.comments.length > 0 && expandedComments.has(post.id) && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="space-y-3">
                                  {post.comments.map((comment) => (
                                    <div key={comment.id}>
                                      <div className="flex items-start space-x-3">
                                        <Avatar className="w-8 h-8 flex-shrink-0">
                                          <AvatarImage src={comment.user.image || undefined} />
                                          <AvatarFallback className="text-xs bg-blue-500 text-white">
                                            {comment.user.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center space-x-2">
                                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {comment.user.name}
                                              </h4>
                                              {comment.user.role === 'OWNER' && (
                                                <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 font-semibold">
                                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                                  Owner
                                                </Badge>
                                              )}
                                              {comment.user.role === 'ADMIN' && (
                                                <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 font-semibold">
                                                  Admin
                                                </Badge>
                                              )}
                                              <Badge className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                {comment.user.tier}
                                              </Badge>
                                            </div>
                                            {comment.user.id !== session?.user?.id && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs px-2 py-1 h-6 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                              >
                                                <UserPlus className="w-3 h-3 mr-1" />
                                                Follow
                                              </Button>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                                            {comment.content}
                                          </p>
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {new Date(comment.createdAt).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                            <div className="flex items-center space-x-3">
                                              <button 
                                                onClick={() => handleLikeComment(post.id, comment.id)}
                                                className={`flex items-center space-x-1 text-sm transition-colors ${
                                                  commentLikes.get(comment.id)?.liked
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                                                }`}
                                              >
                                                <Heart className={`w-4 h-4 ${commentLikes.get(comment.id)?.liked ? 'fill-current' : ''}`} />
                                                <span>{commentLikes.get(comment.id)?.count ?? comment.likes ?? 0}</span>
                                              </button>
                                              <button 
                                                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                                                onClick={() => setReplyingTo({postId: post.id, commentId: comment.id, userName: comment.user.name})}
                                              >
                                                Reply
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Replies to this comment */}
                                      {comment.replies && comment.replies.length > 0 && (
                                        <div className="ml-11 mt-3">
                                          {comment.replies.length > 2 && !expandedReplies.has(comment.id) ? (
                                            <div className="space-y-3">
                                              {comment.replies.slice(0, 2).map((reply) => (
                                                <div key={reply.id} className="flex items-start space-x-3">
                                                  <Avatar className="w-6 h-6 flex-shrink-0">
                                                    <AvatarImage src={reply.user.image || undefined} />
                                                    <AvatarFallback className="text-xs bg-green-500 text-white">
                                                      {reply.user.name.charAt(0)}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                      <div className="flex items-center space-x-2">
                                                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                                                          {reply.user.name}
                                                        </h4>
                                                        {reply.user.role === 'OWNER' && (
                                                          <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 font-semibold">
                                                            <Star className="w-3 h-3 mr-1 fill-current" />
                                                            Owner
                                                          </Badge>
                                                        )}
                                                        {reply.user.role === 'ADMIN' && (
                                                          <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 font-semibold">
                                                            Admin
                                                          </Badge>
                                                        )}
                                                        <Badge className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                          {reply.user.tier}
                                                        </Badge>
                                                      </div>
                                                      {reply.user.id !== session?.user?.id && (
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          className="text-xs px-1.5 py-0.5 h-5 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                        >
                                                          <UserPlus className="w-2.5 h-2.5 mr-0.5" />
                                                          Follow
                                                        </Button>
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-gray-700 dark:text-gray-200 mb-1">
                                                      {reply.content}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(reply.createdAt).toLocaleDateString('en-US', { 
                                                          month: 'short', 
                                                          day: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit'
                                                        })}
                                                      </p>
                                                      <div className="flex items-center space-x-3">
                                                        <button 
                                                          onClick={() => handleLikeComment(post.id, reply.id)}
                                                          className={`flex items-center space-x-1 text-sm transition-colors ${
                                                            commentLikes.get(reply.id)?.liked
                                                              ? 'text-red-600 dark:text-red-400'
                                                              : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                                                          }`}
                                                        >
                                                          <Heart className={`w-4 h-4 ${commentLikes.get(reply.id)?.liked ? 'fill-current' : ''}`} />
                                                          <span>{commentLikes.get(reply.id)?.count ?? 0}</span>
                                                        </button>
                                                        <button 
                                                          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                                                          onClick={() => setReplyingTo({postId: post.id, commentId: comment.id, replyId: reply.id, userName: reply.user.name, isReplyToReply: true})}
                                                        >
                                                          Reply
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                              <button 
                                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                                onClick={() => toggleReplies(comment.id)}
                                              >
                                                View {comment.replies.length - 2} more replies
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="space-y-3">
                                              {comment.replies.map((reply) => (
                                                <div key={reply.id} className="flex items-start space-x-3">
                                                  <Avatar className="w-6 h-6 flex-shrink-0">
                                                    <AvatarImage src={reply.user.image || undefined} />
                                                    <AvatarFallback className="text-xs bg-green-500 text-white">
                                                      {reply.user.name.charAt(0)}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                      <div className="flex items-center space-x-2">
                                                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                                                          {reply.user.name}
                                                        </h4>
                                                        {reply.user.role === 'OWNER' && (
                                                          <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 font-semibold">
                                                            <Star className="w-3 h-3 mr-1 fill-current" />
                                                            Owner
                                                          </Badge>
                                                        )}
                                                        {reply.user.role === 'ADMIN' && (
                                                          <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 font-semibold">
                                                            Admin
                                                          </Badge>
                                                        )}
                                                        <Badge className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                          {reply.user.tier}
                                                        </Badge>
                                                      </div>
                                                      {reply.user.id !== session?.user?.id && (
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          className="text-xs px-1.5 py-0.5 h-5 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                        >
                                                          <UserPlus className="w-2.5 h-2.5 mr-0.5" />
                                                          Follow
                                                        </Button>
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-gray-700 dark:text-gray-200 mb-1">
                                                      {reply.content}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(reply.createdAt).toLocaleDateString('en-US', { 
                                                          month: 'short', 
                                                          day: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit'
                                                        })}
                                                      </p>
                                                      <div className="flex items-center space-x-3">
                                                        <button 
                                                          onClick={() => handleLikeComment(post.id, reply.id)}
                                                          className={`flex items-center space-x-1 text-sm transition-colors ${
                                                            commentLikes.get(reply.id)?.liked
                                                              ? 'text-red-600 dark:text-red-400'
                                                              : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                                                          }`}
                                                        >
                                                          <Heart className={`w-4 h-4 ${commentLikes.get(reply.id)?.liked ? 'fill-current' : ''}`} />
                                                          <span>{commentLikes.get(reply.id)?.count ?? 0}</span>
                                                        </button>
                                                        <button 
                                                          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                                                          onClick={() => setReplyingTo({postId: post.id, commentId: comment.id, replyId: reply.id, userName: reply.user.name, isReplyToReply: true})}
                                                        >
                                                          Reply
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                              {comment.replies.length > 2 && (
                                                <button 
                                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                                  onClick={() => toggleReplies(comment.id)}
                                                >
                                                  Show less
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Add Comment Input */}
                                {expandedComments.has(post.id) && !replyingTo && (
                                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start space-x-3">
                                      <Avatar className="w-8 h-8 flex-shrink-0">
                                        <AvatarImage src={session?.user?.image || undefined} />
                                        <AvatarFallback className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                          {session?.user?.name?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <textarea
                                          value={replyContent}
                                          onChange={(e) => setReplyContent(e.target.value)}
                                          placeholder="Write a comment..."
                                          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-sm min-h-[80px]"
                                        />
                                        <div className="flex items-center justify-end gap-2 mt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setReplyContent('');
                                            }}
                                            disabled={!replyContent.trim()}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => handleReply(post.id)}
                                            disabled={isSubmittingReply || !replyContent.trim()}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                          >
                                            {isSubmittingReply ? 'Posting...' : 'Post'}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Reply Input */}
                            {replyingTo && replyingTo.postId === post.id && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-start space-x-3">
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={session?.user?.image || undefined} />
                                    <AvatarFallback className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                      {session?.user?.name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                      {replyingTo.isReplyToReply 
                                        ? `Replying to ${replyingTo.userName}'s reply`
                                        : `Replying to ${replyingTo.userName}`
                                      }
                                    </p>
                                    <textarea
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder="Write a reply..."
                                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-sm min-h-[80px]"
                                      autoFocus
                                    />
                                    <div className="flex items-center justify-end gap-2 mt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setReplyingTo(null);
                                          setReplyContent('');
                                        }}
                                        disabled={isSubmittingReply}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleReply(post.id, replyingTo.commentId, replyingTo.replyId)}
                                        disabled={isSubmittingReply || !replyContent.trim()}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                      >
                                        {isSubmittingReply ? 'Replying...' : 'Reply'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  </div>

                  {/* Right Sidebar */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* SDG Focus Areas */}
                    {community.sdgFocus && community.sdgFocus.length > 0 && (
                      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Award className="w-5 h-5 text-green-600" />
                            SDG Focus
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {community.sdgFocus.map((sdgId) => {
                              const sdg = getSDGById(sdgId);
                              return sdg ? (
                                <div key={sdgId} className="flex items-center space-x-3 p-3 border-2 rounded-lg bg-white dark:bg-gray-800" style={{ borderColor: sdg.color }}>
                                  <div className="w-12 h-12 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                                    <Image 
                                      src={sdg.image} 
                                      alt={`SDG ${sdg.id}: ${sdg.title}`}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        if (target.parentElement) {
                                          target.parentElement.style.backgroundColor = sdg.color;
                                          target.parentElement.innerHTML = `
                                            <div class="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                                              ${sdg.id}
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">SDG {sdg.id}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{sdg.title}</p>
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Community Tags */}
                    {community.tags && community.tags.length > 0 && (
                      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Pin className="w-5 h-5 text-purple-600" />
                            Community Tags
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {community.tags.map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="px-3 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Pinned Posts */}
                    {community.posts.filter(post => post.isPinned).length > 0 && (
                      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Pin className="w-5 h-5 text-yellow-600" />
                            Pinned Posts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {community.posts.filter(post => post.isPinned).map((post) => (
                            <div key={post.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={post.user.image} />
                                  <AvatarFallback className="text-xs bg-blue-500 text-white">
                                    {post.user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{post.user.name}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{post.content}</p>
                              <div className="flex items-center gap-1 mt-2">
                                <Pin className="w-3 h-3 text-yellow-600" />
                                <span className="text-xs text-yellow-600 font-medium">Pinned</span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Community Resources */}
                    {community.resources && community.resources.length > 0 && (
                      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Resources
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {community.resources.slice(0, 3).map((resource) => (
                            <div key={resource.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{resource.type}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{resource.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                by {resource.uploader.name}
                              </p>
                            </div>
                          ))}
                          {community.resources.length > 3 && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                              +{community.resources.length - 3} more resources
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Community Rules */}
                    {community.rules && community.rules.length > 0 && (
                      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="w-5 h-5 text-red-600" />
                            Community Rules
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {community.rules.slice(0, 3).map((rule, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="line-clamp-2">{rule}</span>
                              </li>
                            ))}
                            {community.rules.length > 3 && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                +{community.rules.length - 3} more rules
                              </p>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Community Owner */}
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-indigo-600" />
                          Community Owner
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={community.createdByUser.image} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {community.createdByUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{community.createdByUser.name}</h4>
                              {community.createdByUser.id === session?.user?.id && community.userRole === 'OWNER' && (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-2 py-0.5 text-xs font-semibold">
                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                  You (Owner)
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Created {new Date(community.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'members' && (
            <>
              {!community.isJoined && !community.isPublic ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Private Community</h3>
                    <p className="text-muted-foreground mb-6">
                      This is a private community. You need to be a member to view members.
                    </p>
                    <Button 
                      onClick={handleJoin}
                      disabled={joining}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {joining ? 'Requesting...' : 'Request to Join'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          Community Members ({community.memberCount})
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Connect and collaborate with fellow members
                        </p>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Members Tabs */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={membersTab === 'all' ? 'default' : 'outline'}
                      onClick={() => setMembersTab('all')}
                      className={`rounded-full px-6 py-2 ${
                        membersTab === 'all' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      All ({community.members.length})
                    </Button>
                    <Button
                      variant={membersTab === 'admins' ? 'default' : 'outline'}
                      onClick={() => setMembersTab('admins')}
                      className={`rounded-full px-6 py-2 ${
                        membersTab === 'admins' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Admins ({community.members.filter(m => m.role === 'OWNER' || m.role === 'ADMIN').length})
                    </Button>
                    <Button
                      variant={membersTab === 'members' ? 'default' : 'outline'}
                      onClick={() => setMembersTab('members')}
                      className={`rounded-full px-6 py-2 ${
                        membersTab === 'members' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Members ({community.members.filter(m => m.role !== 'OWNER' && m.role !== 'ADMIN').length})
                    </Button>
                  </div>

                  {/* Search */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search members by name, organization, or occupation..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Members List */}
                  <div className="space-y-4">
                    {(() => {
                      // Filter members based on selected tab
                      let filteredMembers = [...community.members];
                      if (membersTab === 'admins') {
                        filteredMembers = community.members.filter(m => m.role === 'OWNER' || m.role === 'ADMIN');
                      } else if (membersTab === 'members') {
                        filteredMembers = community.members.filter(m => m.role !== 'OWNER' && m.role !== 'ADMIN');
                      }
                      
                      // Sort members
                      filteredMembers.sort((a, b) => {
                        const roleOrder = { 'OWNER': 0, 'ADMIN': 1, 'MEMBER': 2, 'MODERATOR': 2 };
                        const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
                        const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
                        if (aOrder !== bOrder) return aOrder - bOrder;
                        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
                      });

                      if (filteredMembers.length === 0) {
                        return (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                              <h3 className="text-lg font-semibold mb-2">No {membersTab === 'admins' ? 'admins' : membersTab === 'members' ? 'members' : 'members'} found</h3>
                          <p className="text-muted-foreground">
                                {membersTab === 'admins' 
                                  ? 'This community doesn\'t have any admins yet.' 
                                  : membersTab === 'members'
                                  ? 'This community doesn\'t have any regular members yet.'
                                  : 'Be the first to join this community!'}
                          </p>
                        </CardContent>
                      </Card>
                        );
                      }

                      return (
                      <div className="grid gap-4">
                          {filteredMembers.map((member) => (
                          <Card key={member.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                {/* Member Info */}
                                <div className="flex items-center space-x-4">
                                  <div className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all rounded-full">
                                    <Avatar className="w-14 h-14">
                                      <AvatarImage 
                                        src={member.user.image} 
                                        alt={member.user.name} 
                                      />
                                      <AvatarFallback className="text-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                        {member.user.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <h3 className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                        {member.user.name}
                                      </h3>
                                      <Badge className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                        {member.user.tier}
                                      </Badge>
                                      {member.role === 'OWNER' && (
                                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs px-3 py-1 font-semibold">
                                          <Star className="w-3 h-3 mr-1 fill-current" />
                                          Owner
                                        </Badge>
                                      )}
                                      {member.role === 'ADMIN' && (
                                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-xs px-3 py-1 font-semibold">
                                          Admin
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                      <div className="flex items-center">
                                        <Star className="w-4 h-4 mr-1" />
                                        <span>Score: {member.user.impactScore.toLocaleString()}</span>
                                      </div>
                                      <div className="text-muted-foreground">
                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                {member.user.id !== session?.user?.id && (
                                <div className="flex items-center space-x-2">
                                  {connectionStates.get(member.user.id) === 'connected' ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center h-10 px-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                                      disabled
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Connected
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConnect(member.user.id)}
                                      disabled={connectionLoading.get(member.user.id)}
                                      className={`flex items-center h-10 px-4 ${
                                        connectionStates.get(member.user.id) === 'pending'
                                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                          : ''
                                      }`}
                                    >
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      {connectionLoading.get(member.user.id) 
                                        ? 'Processing...' 
                                        : connectionStates.get(member.user.id) === 'pending'
                                        ? 'Requested'
                                        : 'Connect'}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMessageParticipant({
                                        id: member.user.id,
                                        name: member.user.name,
                                        image: member.user.image || null
                                      });
                                      setMessageDialogOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-10 px-4"
                                  >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Message
                                  </Button>
                                </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      About {community.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                      {community.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Who Should Join Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      Who Should Join
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {community.whoShouldJoin ? (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {community.whoShouldJoin}
                      </p>
                    ) : (
                      <>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      This community is perfect for individuals who are passionate about {community.category.toLowerCase()} and want to make a meaningful impact. 
                      Whether you&apos;re a beginner looking to learn or an experienced advocate wanting to share your knowledge, 
                      we welcome anyone who shares our commitment to creating positive change.
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Passionate about {community.category.toLowerCase()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Committed to making a difference</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Open to learning and sharing</span>
                      </div>
                    </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* What We Do Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      What We Do
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {community.whatWeDo ? (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                        {community.whatWeDo}
                      </p>
                    ) : (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      Our {community.category.toLowerCase()} community brings together passionate individuals to create meaningful impact through collaborative initiatives and regular engagement.
                    </p>
                    )}
                    
                    {/* SDG Focus Areas */}
                    {community.sdgFocus.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Our Focus Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {community.sdgFocus.map((sdgId) => {
                            const sdg = getSDGById(sdgId);
                            return (
                              <Badge 
                                key={sdgId} 
                                variant="outline" 
                                className="px-3 py-1 text-sm font-medium flex items-center gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                                style={{ borderColor: sdg?.color }}
                              >
                                <Image src={sdg?.image || ''} alt="" width={16} height={16} className="w-4 h-4" />
                                <span className="text-gray-700 dark:text-gray-300">{sdg?.title}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Community Interests/Tags */}
                    {community.tags.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Community Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {community.tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="px-3 py-1 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Community Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-red-600" />
                      Community Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {community.rules.length > 0 ? (
                      <ul className="space-y-3">
                        {community.rules.map((rule, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6">
                        <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">No specific guidelines set</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          This community follows general respectful behavior guidelines.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Simplified Community Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Community Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Category */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Category
                      </h4>
                      <Badge 
                        variant="outline" 
                        className="px-3 py-1 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                      >
                        {community.category}
                      </Badge>
                    </div>
                    
                    {/* SDG Focus */}
                    {community.sdgFocus.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          SDG Focus
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {community.sdgFocus.map((sdgId) => {
                            const sdg = getSDGById(sdgId);
                            return (
                              <Badge 
                                key={sdgId} 
                                variant="outline" 
                                className="px-3 py-1 text-sm font-medium flex items-center gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                                style={{ borderColor: sdg?.color }}
                              >
                                <Image src={sdg?.image || ''} alt="" width={16} height={16} className="w-4 h-4" />
                                <span className="text-gray-700 dark:text-gray-300">{sdg?.title}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Privacy Status */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Privacy
                      </h4>
                      <Badge 
                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium ${getPrivacyColor(community.privacy)}`}
                      >
                        {getPrivacyIcon(community.privacy)}
                        <span>{formatPrivacyLabel(community.privacy)}</span>
                      </Badge>
                    </div>

                    {/* Member Count & Avatars */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        Members
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {community.memberAvatars?.slice(0, 3).map((avatar: string, index: number) => (
                            <Avatar key={index} className="w-8 h-8 border-2 border-white dark:border-gray-900">
                              <AvatarImage src={avatar} />
                              <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                {community.name.charAt(index)}
                              </AvatarFallback>
                            </Avatar>
                          )) || (
                            <div className="flex -space-x-2">
                              {[1, 2, 3].map((i) => (
                                <Avatar key={i} className="w-8 h-8 border-2 border-white dark:border-gray-900 bg-gray-200">
                                  <AvatarFallback className="text-xs">
                                    {community.name.charAt(i - 1)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-pink-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {community.memberCount.toLocaleString()} members
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    {community.location && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Location
                        </h4>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{community.location}</span>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {community.tags && community.tags.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {community.tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="px-3 py-1 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Created By */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-purple-600" />
                      Created By
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={community.createdByUser.image} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {community.createdByUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{community.createdByUser.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Community Owner</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Created {new Date(community.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (community?.userRole === 'OWNER' || community?.userRole === 'ADMIN') && (
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Join Requests
                  {joinRequests.length > 0 && (
                    <Badge className="ml-2">{joinRequests.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : joinRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                      <UserCheck className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Pending Requests</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      There are no pending join requests at this time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {joinRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.user?.image || request.requesterImage || undefined} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {request.user?.name?.charAt(0) || request.requesterName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {request.user?.name || request.requesterName}
                            </h4>
                            {request.user?.email && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {request.user.email}
                              </p>
                            )}
                            {request.user?.bio && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {request.user.bio}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(request.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {request.user?.impactScore !== undefined && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Impact Score: {request.user.impactScore}
                                </span>
                              )}
                              {request.user?.tier && (
                                <Badge variant="outline" className="text-xs">
                                  {request.user.tier}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={processingRequest === request.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {processingRequest === request.id ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={processingRequest === request.id}
                            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {processingRequest === request.id ? 'Processing...' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Likes Modal - Simple Custom Implementation */}
      {showLikesDialog && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => {
            setShowLikesDialog(false);
            setLikesList([]);
            setSelectedPostId(null);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div 
            className="relative z-[101] bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  People who liked this post
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowLikesDialog(false);
                  setLikesList([]);
                  setSelectedPostId(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="px-6 pt-2 pb-4 text-sm text-gray-600 dark:text-gray-400">
              {likesList.length > 0 ? `${likesList.length} ${likesList.length === 1 ? 'person' : 'people'} liked this post` : 'No likes yet'}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
              {loadingLikes ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : likesList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No likes yet
                </div>
              ) : (
                <div className="space-y-2">
                  {likesList.map((like) => (
                    <div
                      key={like.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                      onClick={() => {
                        router.push(`/profile/${like.userId}`);
                        setShowLikesDialog(false);
                      }}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={like.userImage || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {like.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {like.userName}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(like.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave Community Confirmation Dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leave Community</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Are you sure you want to leave?</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              {community.userRole === 'OWNER' ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Owner Restriction</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        As the community owner, you cannot leave the community. You must either transfer ownership to another member or delete the community entirely.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/community/${communityId}/settings?tab=members`)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Transfer Ownership
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/community/${communityId}/settings?tab=danger`)}
                          className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Community
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Important Notice</h4>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        <li>• You&apos;ll lose access to community posts and discussions</li>
                        <li>• Your community activity history will be preserved</li>
                        <li>• You can rejoin anytime if the community is public</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Community Impact</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You&apos;re leaving <strong>{community?.name}</strong> with {community?.memberCount.toLocaleString()} members. 
                      Your contributions have made a difference!
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1"
                disabled={leaving}
              >
                Cancel
              </Button>
              {community.userRole === 'OWNER' ? (
                <Button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-0"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Community
                </Button>
              ) : (
                <Button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  {leaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Leaving...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Leave Community
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Dialog */}
      <ParticipantMessageDialog
        participant={selectedMessageParticipant ? {
          id: selectedMessageParticipant.id,
          name: selectedMessageParticipant.name || 'Unknown User',
          image: selectedMessageParticipant.image || undefined
        } : null}
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        currentUserId={session?.user?.id}
      />
    </div>
  );
}