import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { courseService } from '../services/courseService';
import { Course } from '../types';
// Colors import removed - module not found

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface CourseSearchParams {
  query?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  level?: string;
  sortBy?: 'popularity' | 'rating' | 'price' | 'date' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface FilterState {
  categories: string[];
  difficulties: string[];
  priceRange: [number, number];
  rating: number;
  showFilters: boolean;
}

const CourseBrowsingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  // const dispatch = useDispatch(); // Unused
  
  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'price' | 'date' | 'alphabetical'>('popularity');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  });
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    difficulties: [],
    priceRange: [0, 1000],
    rating: 0,
    showFilters: false
  });

  // Search and filter parameters
  const searchParams = useMemo<CourseSearchParams>(() => ({
    query: searchQuery,
    category: selectedCategory,
    difficulty: selectedDifficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
    sortBy,
    page: pagination.currentPage,
    limit: 10
  }), [searchQuery, selectedCategory, selectedDifficulty, sortBy, pagination.currentPage]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesResponse, featuredResponse, categoriesResponse] = await Promise.all([
        courseService.searchCourses(searchParams),
        courseService.getFeaturedCourses(),
        courseService.getCourseCategories()
      ]);

      setCourses(coursesResponse.data);
      setFeaturedCourses(featuredResponse);
      setCategories(categoriesResponse);
      setPagination({
        currentPage: coursesResponse.pagination.currentPage,
        totalPages: coursesResponse.pagination.totalPages,
        hasMore: coursesResponse.pagination.hasNext
      });
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Load more courses
  const loadMore = useCallback(async () => {
    if (loadingMore || !pagination.hasMore) return;

    try {
      setLoadingMore(true);
      const nextParams = { ...searchParams, page: pagination.currentPage + 1 };
      const response = await courseService.searchCourses({...nextParams, difficulty: nextParams.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined});
      
      setCourses(prev => [...prev, ...response.data]);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasNext
      });
    } catch (error) {
      console.error('Error loading more courses:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, pagination.hasMore, searchParams, pagination.currentPage]);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    await loadInitialData();
    setRefreshing(false);
  }, [loadInitialData]);

  // Search handler
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    try {
      const response = await courseService.searchCourses({ ...searchParams, query, page: 1 });
      setCourses(response.data);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasNext
      });
    } catch (error) {
      console.error('Error searching courses:', error);
    }
  }, [searchParams]);

  // Category filter
  const handleCategoryFilter = useCallback(async (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    try {
      const response = await courseService.searchCourses({ 
        ...searchParams, 
        category: category === selectedCategory ? '' : category, 
        page: 1 
      });
      setCourses(response.data);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasNext
      });
    } catch (error) {
      console.error('Error filtering courses:', error);
    }
  }, [selectedCategory, searchParams]);

  // Difficulty filter
  const handleDifficultyFilter = useCallback(async (difficulty: string) => {
    setSelectedDifficulty(difficulty === selectedDifficulty ? '' : difficulty);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    try {
      const response = await courseService.searchCourses({ 
        ...searchParams, 
        difficulty: (difficulty === selectedDifficulty ? undefined : difficulty) as 'beginner' | 'intermediate' | 'advanced' | undefined, 
        page: 1 
      });
      setCourses(response.data);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasNext
      });
    } catch (error) {
      console.error('Error filtering courses:', error);
    }
  }, [selectedDifficulty, searchParams]);

  // Sort handler
  const handleSort = useCallback(async (sortOption: string) => {
    setSortBy(sortOption as 'popularity' | 'rating' | 'price' | 'date' | 'alphabetical');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    try {
      const response = await courseService.searchCourses({ ...searchParams, sortBy: sortOption as 'popularity' | 'rating' | 'price' | 'date' | 'alphabetical', page: 1 });
      setCourses(response.data);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasNext
      });
    } catch (error) {
      console.error('Error sorting courses:', error);
    }
  }, [searchParams]);

  // Navigate to course detail
  const navigateToCourseDetail = useCallback((courseId: string) => {
    navigation.navigate('CourseDetail', { courseId });
  }, [navigation]);

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [loadInitialData])
  );

  // Course card component
  const CourseCard: React.FC<{ course: Course; featured?: boolean }> = ({ course, featured = false }) => (
    <TouchableOpacity
      style={[styles.courseCard, featured && styles.featuredCard]}
      onPress={() => navigateToCourseDetail(course._id)}
      activeOpacity={0.7}
    >
      <View style={styles.courseImageContainer}>
        <Image 
          source={{ uri: course.thumbnail }} 
          style={styles.courseImage}
          resizeMode="cover"
        />
        <View style={styles.courseBadge}>
          <Text style={styles.courseBadgeText}>{course.level.toUpperCase()}</Text>
        </View>
        {course.price === 0 && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>
        )}
      </View>

      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title}
        </Text>
        
        <Text style={styles.courseInstructor} numberOfLines={1}>
          {course.instructor.firstName} {course.instructor.lastName}
        </Text>

        <View style={styles.courseRating}>
          <Text style={{ color: '#f59e0b', fontSize: 16 }}>★</Text>
          <Text style={styles.ratingText}>
            {course.rating.average.toFixed(1)} ({course.rating.count})
          </Text>
        </View>

        <View style={styles.courseFooter}>
          <View style={styles.courseDuration}>
            <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>⏱</Text>
            <Text style={styles.durationText}>{course.duration}h</Text>
          </View>
          
          <View style={styles.priceContainer}>
            {course.discount ? (
              <View style={styles.priceRow}>
                <Text style={styles.originalPrice}>${course.price}</Text>
                <Text style={styles.discountPrice}>
                  ${(course.price * (1 - course.discount.percentage / 100)).toFixed(2)}
                </Text>
              </View>
            ) : (
              <Text style={styles.coursePrice}>
                {course.price === 0 ? 'Free' : `$${course.price}`}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.courseCategory}>
          <Text style={styles.categoryText}>{course.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Category chip component
  const CategoryChip: React.FC<{ category: string; selected: boolean; onPress: () => void }> = ({
    category,
    selected,
    onPress
  }) => (
    <TouchableOpacity
      style={[styles.categoryChip, selected && styles.selectedChip]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.categoryChipText, selected && styles.selectedChipText]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  // Filter modal component
  const FilterModal: React.FC = () => (
    <Modal
      visible={filters.showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setFilters(prev => ({ ...prev, showFilters: false }))}
    >
      <SafeAreaView style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, showFilters: false }))}>
            <Text style={{ color: Colors.text, fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.clearFilters}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* Categories */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categories</Text>
            <View style={styles.filterChips}>
              {categories.map((category) => (
                <CategoryChip
                  key={category}
                  category={category}
                  selected={selectedCategory === category}
                  onPress={() => handleCategoryFilter(category)}
                />
              ))}
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Difficulty</Text>
            <View style={styles.filterChips}>
              {['beginner', 'intermediate', 'advanced'].map((difficulty) => (
                <CategoryChip
                  key={difficulty}
                  category={difficulty}
                  selected={selectedDifficulty === difficulty}
                  onPress={() => handleDifficultyFilter(difficulty)}
                />
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'popularity', label: 'Popularity' },
                { key: 'rating', label: 'Rating' },
                { key: 'price', label: 'Price' },
                { key: 'date', label: 'Latest' },
                { key: 'alphabetical', label: 'A-Z' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.sortOption, sortBy === option.key && styles.selectedSortOption]}
                  onPress={() => handleSort(option.key)}
                >
                  <Text style={[styles.sortOptionText, sortBy === option.key && styles.selectedSortText]}>
                    {option.label}
                  </Text>
                  {sortBy === option.key && (
                    <Text style={{ color: Colors.primary, fontSize: 20 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Courses</Text>
        <TouchableOpacity 
          onPress={() => setFilters(prev => ({ ...prev, showFilters: true }))}
          style={styles.filterButton}
        >
          <Text style={{ color: Colors.text, fontSize: 24 }}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={{ color: Colors.textSecondary, fontSize: 20 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={{ color: Colors.textSecondary, fontSize: 20 }}>✖</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <CategoryChip
            category="All"
            selected={selectedCategory === ''}
            onPress={() => handleCategoryFilter('')}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category}
              category={category}
              selected={selectedCategory === category}
              onPress={() => handleCategoryFilter(category)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Courses</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
            {featuredCourses.map((course) => (
              <View key={course._id} style={styles.featuredCardContainer}>
                <CourseCard course={course} featured />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* All Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results (${courses.length})` : 'All Courses'}
          </Text>
          <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, showFilters: true }))}>
            <Text style={styles.sortText}>Sort: {sortBy}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={courses}
          renderItem={({ item }) => (
            <View style={styles.courseCardContainer}>
              <CourseCard course={item} />
            </View>
          )}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.coursesGrid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: Colors.textSecondary, fontSize: 64 }}>🏦</Text>
              <Text style={styles.emptyTitle}>No courses found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new courses'}
              </Text>
            </View>
          }
        />
      </View>

      {/* Filter Modal */}
      <FilterModal />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  selectedChipText: {
    color: Colors.white,
  },
  section: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sortText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  featuredScroll: {
    paddingLeft: 24,
    gap: 16,
  },
  featuredCardContainer: {
    width: CARD_WIDTH + 40,
  },
  coursesGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  courseCardContainer: {
    flex: 1,
    margin: 8,
  },
  courseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredCard: {
    elevation: 4,
    shadowOpacity: 0.15,
  },
  courseImageContainer: {
    position: 'relative',
  },
  courseImage: {
    width: '100%',
    height: 120,
  },
  courseBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  freeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  courseInfo: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  courseInstructor: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  courseRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  coursePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  courseCategory: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  filterModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  clearFilters: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  filterSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sortOptions: {
    gap: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  selectedSortOption: {
    backgroundColor: `${Colors.primary}20`,
  },
  sortOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedSortText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default CourseBrowsingScreen;