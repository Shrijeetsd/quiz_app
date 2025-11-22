import { apiService } from './apiService';
import { storageService } from './storageService';
import { Course, CourseProgress, Enrollment, ApiPaginatedResponse } from '../types';

export interface CourseSearchParams {
  query?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  duration?: string;
  sortBy?: 'popularity' | 'rating' | 'price' | 'date' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  featured?: boolean;
  free?: boolean;
}

export interface CourseEnrollmentData {
  courseId: string;
  paymentMethod?: 'free' | 'stripe' | 'razorpay';
  paymentId?: string;
  discountCode?: string;
}

export interface CourseProgressUpdate {
  courseId: string;
  lessonId: string;
  progress: number;
  timeSpent: number;
  completed?: boolean;
  notes?: string;
}

export interface CourseReview {
  courseId: string;
  rating: number;
  review: string;
  anonymous?: boolean;
}

export interface WishlistItem {
  courseId: string;
  addedAt: Date;
}

export interface CourseStats {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  averageProgress: number;
  totalTimeSpent: number;
  favoriteCategory: string;
  achievements: string[];
}

class CourseService {
  private readonly CACHE_KEYS = {
    COURSES: 'courses_cache',
    COURSE_DETAIL: 'course_detail_',
    ENROLLMENTS: 'user_enrollments',
    PROGRESS: 'course_progress_',
    WISHLIST: 'user_wishlist',
    CATEGORIES: 'course_categories',
    RECENT_SEARCHES: 'recent_searches',
    OFFLINE_COURSES: 'offline_courses',
    COURSE_STATS: 'course_stats'
  };

  private readonly CACHE_DURATION = {
    COURSES: 30 * 60 * 1000, // 30 minutes
    COURSE_DETAIL: 60 * 60 * 1000, // 1 hour
    ENROLLMENTS: 24 * 60 * 60 * 1000, // 24 hours
    PROGRESS: 5 * 60 * 1000, // 5 minutes
    CATEGORIES: 24 * 60 * 60 * 1000, // 24 hours
    STATS: 30 * 60 * 1000 // 30 minutes
  };

  // Course browsing and search
  async searchCourses(params: CourseSearchParams = {}): Promise<ApiPaginatedResponse<Course>> {
    try {
      const cacheKey = `${this.CACHE_KEYS.COURSES}_${JSON.stringify(params)}`;
      
      // Try to get from cache first
      const cachedData = await storageService.getCachedItem<ApiPaginatedResponse<Course>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await apiService.get<ApiPaginatedResponse<Course>>('/api/courses');
      
      // Cache the results
      await storageService.setCachedItem(cacheKey, response, this.CACHE_DURATION.COURSES);
      
      // Save recent search if query exists
      if (params.query) {
        await this.saveRecentSearch(params.query);
      }

      return response;
    } catch (error) {
      console.error('Error searching courses:', error);
      // Try to return cached data on error
      const cacheKey = `${this.CACHE_KEYS.COURSES}_${JSON.stringify(params)}`;
      const cachedData = await storageService.getItem<ApiPaginatedResponse<Course>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      throw error;
    }
  }

  async getCourseById(courseId: string, forceRefresh: boolean = false): Promise<Course> {
    try {
      const cacheKey = `${this.CACHE_KEYS.COURSE_DETAIL}${courseId}`;
      
      if (!forceRefresh) {
        const cachedCourse = await storageService.getCachedItem<Course>(cacheKey);
        if (cachedCourse) {
          return cachedCourse;
        }
      }

      const course = await apiService.get<Course>(`/api/courses/${courseId}`);
      
      // Cache the course detail
      await storageService.setCachedItem(cacheKey, course, this.CACHE_DURATION.COURSE_DETAIL);
      
      return course;
    } catch (error) {
      console.error('Error getting course:', error);
      // Try to return cached data on error
      const cacheKey = `${this.CACHE_KEYS.COURSE_DETAIL}${courseId}`;
      const cachedCourse = await storageService.getItem<Course>(cacheKey);
      if (cachedCourse) {
        return cachedCourse;
      }
      throw error;
    }
  }

  async getFeaturedCourses(): Promise<Course[]> {
    try {
      const response = await this.searchCourses({ 
        featured: true, 
        limit: 10, 
        sortBy: 'popularity' 
      });
      return response.data;
    } catch (error) {
      console.error('Error getting featured courses:', error);
      throw error;
    }
  }

  async getCourseCategories(): Promise<string[]> {
    try {
      const cachedCategories = await storageService.getCachedItem<string[]>(this.CACHE_KEYS.CATEGORIES);
      if (cachedCategories) {
        return cachedCategories;
      }

      const categories = await apiService.get<string[]>('/api/courses/categories');
      
      // Cache categories
      await storageService.setCachedItem(
        this.CACHE_KEYS.CATEGORIES, 
        categories, 
        this.CACHE_DURATION.CATEGORIES
      );
      
      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      // Return default categories on error
      return ['Technology', 'Business', 'Language', 'Science', 'Arts', 'Health'];
    }
  }

  // Course enrollment
  async enrollInCourse(enrollmentData: CourseEnrollmentData): Promise<Enrollment> {
    try {
      const enrollment = await apiService.post<Enrollment>('/api/enrollments', enrollmentData);
      
      // Update local enrollments cache
      await this.updateLocalEnrollments();
      
      // Clear course cache to refresh enrollment status
      const courseDetailKey = `${this.CACHE_KEYS.COURSE_DETAIL}${enrollmentData.courseId}`;
      await storageService.removeItem(courseDetailKey);
      
      return enrollment;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  async getUserEnrollments(forceRefresh: boolean = false): Promise<Enrollment[]> {
    try {
      if (!forceRefresh) {
        const cachedEnrollments = await storageService.getCachedItem<Enrollment[]>(this.CACHE_KEYS.ENROLLMENTS);
        if (cachedEnrollments) {
          return cachedEnrollments;
        }
      }

      const enrollments = await apiService.get<Enrollment[]>('/api/enrollments/user');
      
      // Cache enrollments
      await storageService.setCachedItem(
        this.CACHE_KEYS.ENROLLMENTS,
        enrollments,
        this.CACHE_DURATION.ENROLLMENTS
      );
      
      return enrollments;
    } catch (error) {
      console.error('Error getting user enrollments:', error);
      // Try to return cached data on error
      const cachedEnrollments = await storageService.getItem<Enrollment[]>(this.CACHE_KEYS.ENROLLMENTS);
      if (cachedEnrollments) {
        return cachedEnrollments;
      }
      return [];
    }
  }

  async isEnrolledInCourse(courseId: string): Promise<boolean> {
    try {
      const enrollments = await this.getUserEnrollments();
      return enrollments.some(enrollment => 
        enrollment.courseId === courseId && enrollment.status === 'active'
      );
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  }

  // Progress tracking
  async updateCourseProgress(progressData: CourseProgressUpdate): Promise<CourseProgress> {
    try {
      const progress = await apiService.post<CourseProgress>('/api/progress', progressData);
      
      // Update local progress cache
      const cacheKey = `${this.CACHE_KEYS.PROGRESS}${progressData.courseId}`;
      await storageService.setCachedItem(cacheKey, progress, this.CACHE_DURATION.PROGRESS);
      
      return progress;
    } catch (error) {
      console.error('Error updating course progress:', error);
      
      // Store progress locally for offline sync
      await this.storeOfflineProgress(progressData);
      
      throw error;
    }
  }

  async getCourseProgress(courseId: string): Promise<CourseProgress | null> {
    try {
      const cacheKey = `${this.CACHE_KEYS.PROGRESS}${courseId}`;
      
      // Try cache first
      const cachedProgress = await storageService.getCachedItem<CourseProgress>(cacheKey);
      if (cachedProgress) {
        return cachedProgress;
      }

      const progress = await apiService.get<CourseProgress>(`/api/progress/course/${courseId}`);
      
      // Cache the progress
      await storageService.setCachedItem(cacheKey, progress, this.CACHE_DURATION.PROGRESS);
      
      return progress;
    } catch (error) {
      console.error('Error getting course progress:', error);
      // Try to return cached data
      const cacheKey = `${this.CACHE_KEYS.PROGRESS}${courseId}`;
      const cachedProgress = await storageService.getItem<CourseProgress>(cacheKey);
      return cachedProgress || null;
    }
  }

  async getAllProgress(): Promise<CourseProgress[]> {
    try {
      return await apiService.get<CourseProgress[]>('/api/progress/user');
    } catch (error) {
      console.error('Error getting all progress:', error);
      return [];
    }
  }

  // Wishlist management
  async addToWishlist(courseId: string): Promise<void> {
    try {
      await apiService.post('/api/wishlist', { courseId });
      
      // Update local wishlist
      const wishlist = await this.getWishlist();
      wishlist.push({ courseId, addedAt: new Date() });
      await storageService.setItem(this.CACHE_KEYS.WISHLIST, wishlist);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  async removeFromWishlist(courseId: string): Promise<void> {
    try {
      await apiService.delete(`/api/wishlist/${courseId}`);
      
      // Update local wishlist
      const wishlist = await this.getWishlist();
      const updatedWishlist = wishlist.filter(item => item.courseId !== courseId);
      await storageService.setItem(this.CACHE_KEYS.WISHLIST, updatedWishlist);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  async getWishlist(): Promise<WishlistItem[]> {
    try {
      const wishlist = await storageService.getItem<WishlistItem[]>(this.CACHE_KEYS.WISHLIST);
      if (wishlist) {
        return wishlist;
      }

      const serverWishlist = await apiService.get<WishlistItem[]>('/api/wishlist');
      await storageService.setItem(this.CACHE_KEYS.WISHLIST, serverWishlist);
      
      return serverWishlist;
    } catch (error) {
      console.error('Error getting wishlist:', error);
      return [];
    }
  }

  async isInWishlist(courseId: string): Promise<boolean> {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.some(item => item.courseId === courseId);
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  }

  // Course reviews
  async submitReview(reviewData: CourseReview): Promise<void> {
    try {
      await apiService.post('/api/reviews', reviewData);
      
      // Clear course cache to refresh reviews
      const courseDetailKey = `${this.CACHE_KEYS.COURSE_DETAIL}${reviewData.courseId}`;
      await storageService.removeItem(courseDetailKey);
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  // Search management
  async getRecentSearches(): Promise<string[]> {
    try {
      const searches = await storageService.getItem<string[]>(this.CACHE_KEYS.RECENT_SEARCHES);
      return searches || [];
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  }

  async saveRecentSearch(query: string): Promise<void> {
    try {
      const searches = await this.getRecentSearches();
      
      // Remove if already exists and add to front
      const filteredSearches = searches.filter(search => search !== query);
      const updatedSearches = [query, ...filteredSearches].slice(0, 10); // Keep only 10 recent searches
      
      await storageService.setItem(this.CACHE_KEYS.RECENT_SEARCHES, updatedSearches);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }

  async clearRecentSearches(): Promise<void> {
    try {
      await storageService.removeItem(this.CACHE_KEYS.RECENT_SEARCHES);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }

  // Statistics and analytics
  async getCourseStats(): Promise<CourseStats> {
    try {
      const cachedStats = await storageService.getCachedItem<any>(this.CACHE_KEYS.COURSE_STATS);
      if (cachedStats) {
        return cachedStats;
      }

      const stats = await apiService.get<CourseStats>('/api/courses/stats');
      
      // Cache stats
      await storageService.setCachedItem(
        this.CACHE_KEYS.COURSE_STATS,
        stats,
        this.CACHE_DURATION.STATS
      );
      
      return stats;
    } catch (error) {
      console.error('Error getting course stats:', error);
      // Return default stats on error
      return {
        totalCourses: 0,
        enrolledCourses: 0,
        completedCourses: 0,
        averageProgress: 0,
        totalTimeSpent: 0,
        favoriteCategory: 'Technology',
        achievements: []
      };
    }
  }

  // Offline support
  async downloadCourseForOffline(courseId: string): Promise<void> {
    try {
      // Get course details and content
      const course = await this.getCourseById(courseId);
      const progress = await this.getCourseProgress(courseId);
      
      // Store offline data
      const offlineCourses = await storageService.getItem<any[]>(this.CACHE_KEYS.OFFLINE_COURSES) || [];
      const offlineCourse = {
        course,
        progress,
        downloadedAt: new Date(),
        lastAccessed: new Date()
      };
      
      // Update or add offline course
      const existingIndex = offlineCourses.findIndex((oc: any) => oc.course.id === courseId);
      if (existingIndex >= 0) {
        offlineCourses[existingIndex] = offlineCourse;
      } else {
        offlineCourses.push(offlineCourse);
      }
      
      await storageService.setItem(this.CACHE_KEYS.OFFLINE_COURSES, offlineCourses);
    } catch (error) {
      console.error('Error downloading course for offline:', error);
      throw error;
    }
  }

  async getOfflineCourses(): Promise<any[]> {
    try {
      return await storageService.getItem<any[]>(this.CACHE_KEYS.OFFLINE_COURSES) || [];
    } catch (error) {
      console.error('Error getting offline courses:', error);
      return [];
    }
  }

  async removeOfflineCourse(courseId: string): Promise<void> {
    try {
      const offlineCourses = await this.getOfflineCourses();
      const updatedCourses = offlineCourses.filter((oc: any) => oc.course.id !== courseId);
      await storageService.setItem(this.CACHE_KEYS.OFFLINE_COURSES, updatedCourses);
    } catch (error) {
      console.error('Error removing offline course:', error);
      throw error;
    }
  }

  // Utility methods
  private async updateLocalEnrollments(): Promise<void> {
    try {
      const enrollments = await apiService.get<Enrollment[]>('/api/enrollments/user');
      await storageService.setCachedItem(
        this.CACHE_KEYS.ENROLLMENTS,
        enrollments,
        this.CACHE_DURATION.ENROLLMENTS
      );
    } catch (error) {
      console.error('Error updating local enrollments:', error);
    }
  }

  private async storeOfflineProgress(progressData: CourseProgressUpdate): Promise<void> {
    try {
      const offlineProgressKey = 'offline_progress_queue';
      const queue = await storageService.getItem<any[]>(offlineProgressKey) || [];
      queue.push({
        ...progressData,
        timestamp: new Date()
      });
      await storageService.setItem(offlineProgressKey, queue);
    } catch (error) {
      console.error('Error storing offline progress:', error);
    }
  }

  async syncOfflineProgress(): Promise<void> {
    try {
      const offlineProgressKey = 'offline_progress_queue';
      const queue = await storageService.getItem<any[]>(offlineProgressKey) || [];
      
      if (queue.length === 0) {
        return;
      }

      // Sync each progress update
      const syncPromises = queue.map(async (progressData: CourseProgressUpdate) => {
        try {
          await this.updateCourseProgress(progressData);
          return true;
        } catch (error) {
          console.error('Error syncing progress:', error);
          return false;
        }
      });

      const results = await Promise.all(syncPromises);
      
      // Remove successfully synced items
      const failedItems = queue.filter((_: any, index: number) => !results[index]);
      await storageService.setItem(offlineProgressKey, failedItems);
      
      console.log(`Synced ${results.filter(Boolean).length} progress updates`);
    } catch (error) {
      console.error('Error syncing offline progress:', error);
    }
  }

  // Cache management
  async clearCourseCache(): Promise<void> {
    try {
      const keys = Object.values(this.CACHE_KEYS);
      await Promise.all(keys.map(key => storageService.removeItem(key)));
    } catch (error) {
      console.error('Error clearing course cache:', error);
    }
  }

  async preloadCourseData(): Promise<void> {
    try {
      // Preload essential data
      await Promise.all([
        this.getCourseCategories(),
        this.getUserEnrollments(),
        this.getFeaturedCourses()
      ]);
    } catch (error) {
      console.error('Error preloading course data:', error);
    }
  }
}

export const courseService = new CourseService();