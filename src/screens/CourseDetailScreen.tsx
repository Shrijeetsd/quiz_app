import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { courseService } from '../services/courseService';
import { Course, CourseProgress } from '../types';
import { Colors } from '../constants/colors';
// Colors import removed - module not found

interface RouteParams {
  courseId: string;
}

const CourseDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { courseId } = route.params as RouteParams;

  // State management
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [expandedSyllabus, setExpandedSyllabus] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'reviews'>('overview');

  // Load course data
  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const [courseData, enrollmentStatus, wishlistStatus, progressData] = await Promise.all([
        courseService.getCourseById(courseId),
        courseService.isEnrolledInCourse(courseId),
        courseService.isInWishlist(courseId),
        courseService.getCourseProgress(courseId)
      ]);

      setCourse(courseData);
      setIsEnrolled(enrollmentStatus);
      setInWishlist(wishlistStatus);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading course data:', error);
      Alert.alert('Error', 'Failed to load course details. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [courseId, navigation]);

  // Enroll in course
  const handleEnroll = useCallback(async () => {
    if (!course) return;

    try {
      setEnrolling(true);
      
      if (course.price > 0) {
        // Navigate to payment screen
        navigation.navigate('Payment', {
          courseId: course._id,
          courseTitle: course.title,
          price: course.price,
          discount: course.discount
        });
      } else {
        // Free course enrollment
        await courseService.enrollInCourse({
          courseId: course._id,
          paymentMethod: 'free'
        });
        
        setIsEnrolled(true);
        Alert.alert('Success', 'Successfully enrolled in the course!');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      Alert.alert('Error', 'Failed to enroll in course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  }, [course, navigation]);

  // Toggle wishlist
  const toggleWishlist = useCallback(async () => {
    if (!course) return;

    try {
      if (inWishlist) {
        await courseService.removeFromWishlist(course._id);
        setInWishlist(false);
      } else {
        await courseService.addToWishlist(course._id);
        setInWishlist(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      Alert.alert('Error', 'Failed to update wishlist. Please try again.');
    }
  }, [course, inWishlist]);

  // Share course
  const shareCourse = useCallback(async () => {
    if (!course) return;

    try {
      await Share.share({
        message: `Check out this amazing course: ${course.title}\n\n${course.description}`,
        url: `https://commercegate.app/courses/${course._id}`,
        title: course.title
      });
    } catch (error) {
      console.error('Error sharing course:', error);
    }
  }, [course]);

  // Navigate to learning
  const startLearning = useCallback(() => {
    if (!course) return;

    navigation.navigate('CourseLearning', {
      courseId: course._id,
      courseTitle: course.title
    });
  }, [course, navigation]);

  // Preview lesson
  const previewLesson = useCallback((lessonId: string) => {
    navigation.navigate('LessonPreview', {
      courseId,
      lessonId
    });
  }, [courseId, navigation]);

  // Play preview video
  const playPreviewVideo = useCallback(() => {
    if (course?.media?.[0]?.url) {
      Linking.openURL(course.media[0].url);
    }
  }, [course]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading course details...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Course not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discountedPrice = course.discount 
    ? course.price * (1 - course.discount.percentage / 100)
    : course.price;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleWishlist} style={styles.headerButton}>
            <Ionicons 
              name={inWishlist ? "heart" : "heart-outline"} 
              size={24} 
              color={inWishlist ? Colors.error : Colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareCourse} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: course.thumbnail }} style={styles.heroImage} resizeMode="cover" />
          
          {course.media?.[0] && (
            <TouchableOpacity style={styles.playButton} onPress={playPreviewVideo}>
              <Ionicons name="play" size={32} color={Colors.white} />
            </TouchableOpacity>
          )}
          
          <View style={styles.heroOverlay}>
            <View style={styles.courseBadges}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{course.level.toUpperCase()}</Text>
              </View>
              {course.price === 0 && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Course Info */}
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          
          <View style={styles.courseMetrics}>
            <View style={styles.metric}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.metricText}>
                {course.rating.average.toFixed(1)} ({course.rating.count})
              </Text>
            </View>
            
            <View style={styles.metric}>
              <Ionicons name="people" size={16} color={Colors.textSecondary} />
              <Text style={styles.metricText}>{course.enrollment.current} students</Text>
            </View>
            
            <View style={styles.metric}>
              <Ionicons name="time" size={16} color={Colors.textSecondary} />
              <Text style={styles.metricText}>{course.duration}h total</Text>
            </View>
          </View>

          <View style={styles.instructor}>
            <Image 
              source={{ uri: course.instructor.avatar || 'https://via.placeholder.com/40' }} 
              style={styles.instructorAvatar}
            />
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorName}>{course.instructor.firstName} {course.instructor.lastName}</Text>
              <Text style={styles.instructorTitle}>Course Instructor</Text>
            </View>
          </View>

          {/* Progress Bar (if enrolled) */}
          {isEnrolled && progress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Your Progress</Text>
                <Text style={styles.progressPercent}>{Math.round(progress.progress)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress.progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {progress.completedLessons.length} of {course.syllabus.reduce((acc, section) => acc + section.lessons.length, 0)} lessons completed
              </Text>
            </View>
          )}

          {/* Price and Enrollment */}
          <View style={styles.priceContainer}>
            <View style={styles.priceInfo}>
              {course.discount ? (
                <View>
                  <Text style={styles.originalPrice}>${course.price}</Text>
                  <Text style={styles.discountPrice}>${discountedPrice.toFixed(2)}</Text>
                  <Text style={styles.discountBadge}>{course.discount.percentage}% OFF</Text>
                </View>
              ) : (
                <Text style={styles.coursePrice}>
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </Text>
              )}
            </View>

            {isEnrolled ? (
              <TouchableOpacity style={styles.continueButton} onPress={startLearning}>
                <Text style={styles.continueButtonText}>
                  {progress && progress.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.enrollButton, enrolling && styles.enrollButtonDisabled]}
                onPress={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.enrollButtonText}>
                    {course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'syllabus', label: 'Syllabus' },
            { key: 'reviews', label: 'Reviews' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View style={styles.overviewContent}>
              <Text style={styles.sectionTitle}>About This Course</Text>
              <Text style={styles.courseDescription}>{course.description}</Text>

              <Text style={styles.sectionTitle}>What You'll Learn</Text>
              <View style={styles.learningOutcomes}>
                {course.learningOutcomes.map((outcome, index) => (
                  <View key={index} style={styles.outcomeItem}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    <Text style={styles.outcomeText}>{outcome}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Requirements</Text>
              <View style={styles.requirements}>
                {course.requirements.map((requirement, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <Text style={styles.requirementText}>• {requirement}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tags}>
                {course.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'syllabus' && (
            <View style={styles.syllabusContent}>
              <Text style={styles.sectionTitle}>Course Curriculum</Text>
              
              {course.syllabus.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.syllabusSection}>
                  <TouchableOpacity
                    style={styles.syllabusHeader}
                    onPress={() => setExpandedSyllabus(
                      expandedSyllabus === sectionIndex ? null : sectionIndex
                    )}
                  >
                    <View style={styles.syllabusHeaderContent}>
                      <Text style={styles.syllabusTitle}>{section.title}</Text>
                      <Text style={styles.syllabusLessonCount}>
                        {section.lessons.length} lessons • {section.duration}min
                      </Text>
                    </View>
                    <Ionicons 
                      name={expandedSyllabus === sectionIndex ? "chevron-up" : "chevron-down"}
                      size={20} 
                      color={Colors.textSecondary} 
                    />
                  </TouchableOpacity>

                  {expandedSyllabus === sectionIndex && (
                    <View style={styles.syllabusLessons}>
                      {section.lessons.map((lesson, lessonIndex) => (
                        <TouchableOpacity
                          key={lessonIndex}
                          style={styles.lessonItem}
                          onPress={() => lesson.isPreview ? previewLesson(`${sectionIndex}-${lessonIndex}`) : null}
                          disabled={!lesson.isPreview && !isEnrolled}
                        >
                          <View style={styles.lessonIcon}>
                            <Ionicons 
                              name={
                                lesson.type === 'video' ? 'play-circle' :
                                lesson.type === 'quiz' ? 'help-circle' :
                                'document-text'
                              }
                              size={20} 
                              color={lesson.isPreview || isEnrolled ? Colors.primary : Colors.textSecondary} 
                            />
                          </View>
                          
                          <View style={styles.lessonInfo}>
                            <Text style={[
                              styles.lessonTitle,
                              (!lesson.isPreview && !isEnrolled) && styles.lessonTitleDisabled
                            ]}>
                              {lesson.title}
                            </Text>
                            <Text style={styles.lessonDuration}>{lesson.duration}min</Text>
                          </View>

                          {lesson.isPreview && (
                            <View style={styles.previewBadge}>
                              <Text style={styles.previewBadgeText}>Preview</Text>
                            </View>
                          )}

                          {!lesson.isPreview && !isEnrolled && (
                            <Ionicons name="lock-closed" size={16} color={Colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.reviewsContent}>
              <Text style={styles.sectionTitle}>Student Reviews</Text>
              
              <View style={styles.ratingOverview}>
                <View style={styles.ratingScore}>
                  <Text style={styles.ratingNumber}>{course.rating.average.toFixed(1)}</Text>
                  <View style={styles.ratingStars}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Ionicons
                        key={index}
                        name={index < Math.floor(course.rating.average) ? "star" : "star-outline"}
                        size={16}
                        color={Colors.warning}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingCount}>{course.rating.count} reviews</Text>
                </View>

                <View style={styles.ratingDistribution}>
                  {Object.entries(course.rating.distribution)
                    .reverse()
                    .map(([stars, count]) => (
                    <View key={stars} style={styles.ratingRow}>
                      <Text style={styles.ratingRowStars}>{stars}★</Text>
                      <View style={styles.ratingBar}>
                        <View 
                          style={[
                            styles.ratingBarFill,
                            { width: `${(count / course.rating.count) * 100}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.ratingRowCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Individual Reviews */}
              <View style={styles.reviewsList}>
                <Text style={styles.reviewsPlaceholder}>
                  Individual reviews will be loaded here...
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  hero: {
    position: 'relative',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 16,
  },
  courseBadges: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
  },
  levelBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
  freeBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
  courseInfo: {
    padding: 24,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 32,
  },
  courseMetrics: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  instructor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  instructorTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceInfo: {
    flex: 1,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  discountBadge: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  coursePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  continueButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  enrollButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  enrollButtonDisabled: {
    opacity: 0.6,
  },
  enrollButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: 24,
  },
  overviewContent: {
    gap: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  courseDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  learningOutcomes: {
    gap: 12,
  },
  outcomeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  outcomeText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
  requirements: {
    gap: 8,
  },
  requirementItem: {
    paddingLeft: 16,
  },
  requirementText: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  syllabusContent: {
    gap: 16,
  },
  syllabusSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  syllabusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  syllabusHeaderContent: {
    flex: 1,
  },
  syllabusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  syllabusLessonCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  syllabusLessons: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lessonIcon: {
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  lessonTitleDisabled: {
    color: Colors.textSecondary,
  },
  lessonDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  previewBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  previewBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  reviewsContent: {
    gap: 24,
  },
  ratingOverview: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  ratingScore: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ratingDistribution: {
    flex: 1,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingRowStars: {
    fontSize: 14,
    color: Colors.textSecondary,
    width: 24,
  },
  ratingBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 3,
  },
  ratingRowCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  reviewsList: {
    padding: 20,
    alignItems: 'center',
  },
  reviewsPlaceholder: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default CourseDetailScreen;