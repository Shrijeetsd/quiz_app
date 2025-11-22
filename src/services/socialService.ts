import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';

// Social and community types
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinedDate: string;
  stats: {
    coursesCompleted: number;
    testsCompleted: number;
    totalScore: number;
    rank: number;
    streakDays: number;
    badgesEarned: number;
  };
  achievements: Achievement[];
  isFollowing: boolean;
  isFollowed: boolean;
  followersCount: number;
  followingCount: number;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'social' | 'performance' | 'milestone';
  earnedDate: string;
  progress?: number;
  maxProgress?: number;
  isUnlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  image?: string;
  category: string;
  tags: string[];
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  adminId: string;
  moderators: string[];
  createdDate: string;
  lastActivity: string;
  members: StudyGroupMember[];
  isJoined: boolean;
  isPending: boolean;
  settings: {
    allowMemberPosts: boolean;
    requireApproval: boolean;
    allowFileSharing: boolean;
    allowVideoChat: boolean;
  };
}

export interface StudyGroupMember {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedDate: string;
  contributionScore: number;
  isOnline: boolean;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  createdDate: string;
  updatedDate: string;
  viewCount: number;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isSolved: boolean;
  isPinned: boolean;
  attachments: PostAttachment[];
  replies: ForumReply[];
}

export interface ForumReply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdDate: string;
  updatedDate: string;
  likeCount: number;
  isLiked: boolean;
  isSolution: boolean;
  attachments: PostAttachment[];
  replies: ForumReply[]; // Nested replies
}

export interface PostAttachment {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId?: string; // For direct messages
  groupId?: string; // For group messages
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'system';
  timestamp: string;
  readBy: string[];
  isEdited: boolean;
  replyTo?: string;
  attachments: PostAttachment[];
  reactions: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string; // Group name
  avatar?: string;
  participants: UserProfile[];
  lastMessage: ChatMessage;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  score: number;
  coursesCompleted: number;
  testsCompleted: number;
  streakDays: number;
  badgesCount: number;
  isCurrentUser: boolean;
}

export interface SocialNotification {
  id: string;
  type: 'follow' | 'like' | 'reply' | 'mention' | 'group_invite' | 'achievement' | 'message';
  title: string;
  message: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  targetId?: string; // Post ID, group ID, etc.
  createdDate: string;
  isRead: boolean;
  actionUrl?: string;
}

class SocialService {
  private isInitialized: boolean = false;
  private currentUserId: string | null = null;

  /**
   * Initialize social service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Get current user ID
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        this.currentUserId = user.id;
      }

      // Sync social data
      await this.syncSocialData();

      this.isInitialized = true;
      console.log('Social service initialized');
    } catch (error) {
      console.error('Failed to initialize social service:', error);
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    try {
      const targetUserId = userId || this.currentUserId;
      if (!targetUserId) return null;

      const response: any = await apiService.get(`/social/users/${targetUserId}/profile`);
      return response.data.profile;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const response: any = await apiService.put('/social/profile', updates);
      return response.data.profile;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return null;
    }
  }

  /**
   * Search users
   */
  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<UserProfile[]> {
    try {
      const response: any = await apiService.get(`/social/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return response.data.users;
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  /**
   * Follow user
   */
  async followUser(userId: string): Promise<boolean> {
    try {
      await apiService.post(`/social/users/${userId}/follow`);
      return true;
    } catch (error) {
      console.error('Failed to follow user:', error);
      return false;
    }
  }

  /**
   * Unfollow user
   */
  async unfollowUser(userId: string): Promise<boolean> {
    try {
      await apiService.delete(`/social/users/${userId}/follow`);
      return true;
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      return false;
    }
  }

  /**
   * Get followers
   */
  async getFollowers(userId?: string, page: number = 1, limit: number = 20): Promise<UserProfile[]> {
    try {
      const targetUserId = userId || this.currentUserId;
      const response: any = await apiService.get(`/social/users/${targetUserId}/followers?page=${page}&limit=${limit}`);
      return response.data.followers;
    } catch (error) {
      console.error('Failed to get followers:', error);
      return [];
    }
  }

  /**
   * Get following
   */
  async getFollowing(userId?: string, page: number = 1, limit: number = 20): Promise<UserProfile[]> {
    try {
      const targetUserId = userId || this.currentUserId;
      const response: any = await apiService.get(`/social/users/${targetUserId}/following?page=${page}&limit=${limit}`);
      return response.data.following;
    } catch (error) {
      console.error('Failed to get following:', error);
      return [];
    }
  }

  /**
   * Get study groups
   */
  async getStudyGroups(
    category?: string,
    search?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<StudyGroup[]> {
    try {
      const response: any = await apiService.get(`/social/groups?category=${category || ''}&search=${search || ''}&page=${page}&limit=${limit}`);
      return response.data.groups;
    } catch (error) {
      console.error('Failed to get study groups:', error);
      return [];
    }
  }

  /**
   * Get joined study groups
   */
  async getJoinedStudyGroups(): Promise<StudyGroup[]> {
    try {
      const response: any = await apiService.get('/social/groups/joined');
      return response.data.groups;
    } catch (error) {
      console.error('Failed to get joined study groups:', error);
      return [];
    }
  }

  /**
   * Create study group
   */
  async createStudyGroup(groupData: Partial<StudyGroup>): Promise<StudyGroup | null> {
    try {
      const response: any = await apiService.post('/social/groups', groupData);
      return response.data.group;
    } catch (error) {
      console.error('Failed to create study group:', error);
      return null;
    }
  }

  /**
   * Join study group
   */
  async joinStudyGroup(groupId: string): Promise<boolean> {
    try {
      await apiService.post(`/social/groups/${groupId}/join`);
      return true;
    } catch (error) {
      console.error('Failed to join study group:', error);
      return false;
    }
  }

  /**
   * Leave study group
   */
  async leaveStudyGroup(groupId: string): Promise<boolean> {
    try {
      await apiService.delete(`/social/groups/${groupId}/leave`);
      return true;
    } catch (error) {
      console.error('Failed to leave study group:', error);
      return false;
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string): Promise<StudyGroupMember[]> {
    try {
      const response: any = await apiService.get(`/social/groups/${groupId}/members`);
      return response.data.members;
    } catch (error) {
      console.error('Failed to get group members:', error);
      return [];
    }
  }

  /**
   * Get forum posts
   */
  async getForumPosts(
    category?: string,
    tags?: string[],
    sort: 'latest' | 'popular' | 'trending' = 'latest',
    page: number = 1,
    limit: number = 20
  ): Promise<ForumPost[]> {
    try {
      const response: any = await apiService.get(`/social/forum/posts?category=${category || ''}&tags=${tags?.join(',') || ''}&sort=${sort}&page=${page}&limit=${limit}`);
      return response.data.posts;
    } catch (error) {
      console.error('Failed to get forum posts:', error);
      return [];
    }
  }

  /**
   * Get forum post by ID
   */
  async getForumPost(postId: string): Promise<ForumPost | null> {
    try {
      const response: any = await apiService.get(`/social/forum/posts/${postId}`);
      return response.data.post;
    } catch (error) {
      console.error('Failed to get forum post:', error);
      return null;
    }
  }

  /**
   * Create forum post
   */
  async createForumPost(postData: Partial<ForumPost>): Promise<ForumPost | null> {
    try {
      const response: any = await apiService.post('/social/forum/posts', postData);
      return response.data.post;
    } catch (error) {
      console.error('Failed to create forum post:', error);
      return null;
    }
  }

  /**
   * Update forum post
   */
  async updateForumPost(postId: string, updates: Partial<ForumPost>): Promise<ForumPost | null> {
    try {
      const response: any = await apiService.put(`/social/forum/posts/${postId}`, updates);
      return response.data.post;
    } catch (error) {
      console.error('Failed to update forum post:', error);
      return null;
    }
  }

  /**
   * Delete forum post
   */
  async deleteForumPost(postId: string): Promise<boolean> {
    try {
      await apiService.delete(`/social/forum/posts/${postId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete forum post:', error);
      return false;
    }
  }

  /**
   * Like/unlike forum post
   */
  async toggleForumPostLike(postId: string): Promise<boolean> {
    try {
      await apiService.post(`/social/forum/posts/${postId}/like`);
      return true;
    } catch (error) {
      console.error('Failed to toggle post like:', error);
      return false;
    }
  }

  /**
   * Bookmark/unbookmark forum post
   */
  async toggleForumPostBookmark(postId: string): Promise<boolean> {
    try {
      await apiService.post(`/social/forum/posts/${postId}/bookmark`);
      return true;
    } catch (error) {
      console.error('Failed to toggle post bookmark:', error);
      return false;
    }
  }

  /**
   * Add reply to forum post
   */
  async addForumReply(postId: string, replyData: Partial<ForumReply>): Promise<ForumReply | null> {
    try {
      const response: any = await apiService.post(`/social/forum/posts/${postId}/replies`, replyData);
      return response.data.reply;
    } catch (error) {
      console.error('Failed to add forum reply:', error);
      return null;
    }
  }

  /**
   * Get conversations
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response: any = await apiService.get('/social/chat/conversations');
      return response.data.conversations;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const response: any = await apiService.get(`/social/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
      return response.data.messages;
    } catch (error) {
      console.error('Failed to get conversation messages:', error);
      return [];
    }
  }

  /**
   * Send message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    attachments: PostAttachment[] = []
  ): Promise<ChatMessage | null> {
    try {
      const response: any = await apiService.post(`/social/chat/conversations/${conversationId}/messages`, {
        content,
        type,
        attachments,
      });
      return response.data.message;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  /**
   * Start direct conversation
   */
  async startDirectConversation(userId: string): Promise<Conversation | null> {
    try {
      const response: any = await apiService.post('/social/chat/conversations/direct', {
        participantId: userId,
      });
      return response.data.conversation;
    } catch (error) {
      console.error('Failed to start direct conversation:', error);
      return null;
    }
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<boolean> {
    try {
      await apiService.post(`/social/chat/conversations/${conversationId}/read`);
      return true;
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      return false;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: 'global' | 'friends' | 'course' = 'global',
    period: 'week' | 'month' | 'year' | 'all' = 'month',
    courseId?: string
  ): Promise<LeaderboardEntry[]> {
    try {
      const response: any = await apiService.get(`/social/leaderboard?type=${type}&period=${period}&courseId=${courseId || ''}`);
      return response.data.leaderboard;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  /**
   * Get achievements
   */
  async getAchievements(userId?: string): Promise<Achievement[]> {
    try {
      const targetUserId = userId || this.currentUserId;
      const response: any = await apiService.get(`/social/users/${targetUserId}/achievements`);
      return response.data.achievements;
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }

  /**
   * Get available achievements
   */
  async getAvailableAchievements(): Promise<Achievement[]> {
    try {
      const response: any = await apiService.get('/social/achievements');
      return response.data.achievements;
    } catch (error) {
      console.error('Failed to get available achievements:', error);
      return [];
    }
  }

  /**
   * Get social notifications
   */
  async getSocialNotifications(page: number = 1, limit: number = 20): Promise<SocialNotification[]> {
    try {
      const response: any = await apiService.get(`/social/notifications?page=${page}&limit=${limit}`);
      return response.data.notifications;
    } catch (error) {
      console.error('Failed to get social notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      await apiService.put(`/social/notifications/${notificationId}/read`);
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Get user stats
   */
  async getUserStats(userId?: string): Promise<UserProfile['stats'] | null> {
    try {
      const targetUserId = userId || this.currentUserId;
      const response: any = await apiService.get(`/social/users/${targetUserId}/stats`);
      return response.data.stats;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  /**
   * Update learning streak
   */
  async updateLearningStreak(): Promise<boolean> {
    try {
      await apiService.post('/social/streak/update');
      return true;
    } catch (error) {
      console.error('Failed to update learning streak:', error);
      return false;
    }
  }

  /**
   * Share achievement
   */
  async shareAchievement(achievementId: string, message?: string): Promise<boolean> {
    try {
      await apiService.post(`/social/achievements/${achievementId}/share`, { message });
      return true;
    } catch (error) {
      console.error('Failed to share achievement:', error);
      return false;
    }
  }

  /**
   * Report content
   */
  async reportContent(
    contentType: 'post' | 'reply' | 'message' | 'user',
    contentId: string,
    reason: string,
    description?: string
  ): Promise<boolean> {
    try {
      await apiService.post('/social/reports', {
        contentType,
        contentId,
        reason,
        description,
      });
      return true;
    } catch (error) {
      console.error('Failed to report content:', error);
      return false;
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string): Promise<boolean> {
    try {
      await apiService.post(`/social/users/${userId}/block`);
      return true;
    } catch (error) {
      console.error('Failed to block user:', error);
      return false;
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string): Promise<boolean> {
    try {
      await apiService.delete(`/social/users/${userId}/block`);
      return true;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      return false;
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(): Promise<UserProfile[]> {
    try {
      const response: any = await apiService.get('/social/users/blocked');
      return response.data.users;
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      return [];
    }
  }

  /**
   * Sync social data with server
   */
  private async syncSocialData(): Promise<void> {
    try {
      // Sync user profile
      const profile = await this.getUserProfile();
      if (profile) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
      }

      // Sync achievements
      const achievements = await this.getAchievements();
      await AsyncStorage.setItem('user_achievements', JSON.stringify(achievements));

      console.log('Social data synced');
    } catch (error) {
      console.error('Failed to sync social data:', error);
    }
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile(): Promise<UserProfile | null> {
    try {
      const cached = await AsyncStorage.getItem('user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached user profile:', error);
      return null;
    }
  }

  /**
   * Get cached achievements
   */
  async getCachedAchievements(): Promise<Achievement[]> {
    try {
      const cached = await AsyncStorage.getItem('user_achievements');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Failed to get cached achievements:', error);
      return [];
    }
  }
}

export const socialService = new SocialService();

