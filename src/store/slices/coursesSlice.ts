import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CoursesState, Course, CourseFilters } from '../../types';

// Initial state
const initialState: CoursesState = {
  courses: [],
  enrolledCourses: [],
  currentCourse: null,
  categories: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    hasMore: true,
  },
};

// Courses slice
const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
    },
    addCourses: (state, action: PayloadAction<Course[]>) => {
      // Append new courses (for pagination)
      const newCourses = action.payload.filter(
        newCourse => !state.courses.some(existingCourse => existingCourse._id === newCourse._id)
      );
      state.courses.push(...newCourses);
    },
    updateCourse: (state, action: PayloadAction<Course>) => {
      const index = state.courses.findIndex(course => course._id === action.payload._id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },
    removeCourse: (state, action: PayloadAction<string>) => {
      state.courses = state.courses.filter(course => course._id !== action.payload);
    },
    setEnrolledCourses: (state, action: PayloadAction<Course[]>) => {
      state.enrolledCourses = action.payload;
    },
    addEnrolledCourse: (state, action: PayloadAction<Course>) => {
      const exists = state.enrolledCourses.find(course => course._id === action.payload._id);
      if (!exists) {
        state.enrolledCourses.push(action.payload);
      }
    },
    removeEnrolledCourse: (state, action: PayloadAction<string>) => {
      state.enrolledCourses = state.enrolledCourses.filter(course => course._id !== action.payload);
    },
    setCurrentCourse: (state, action: PayloadAction<Course | null>) => {
      state.currentCourse = action.payload;
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    setFilters: (state, action: PayloadAction<CourseFilters>) => {
      state.filters = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<CourseFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<{ page: number; hasMore: boolean }>) => {
      state.pagination = action.payload;
    },
    incrementPage: (state) => {
      state.pagination.page += 1;
    },
    resetPagination: (state) => {
      state.pagination = { page: 1, hasMore: true };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCourses: (state) => {
      state.courses = [];
      state.currentCourse = null;
      state.error = null;
      state.pagination = { page: 1, hasMore: true };
    },
    // Course interaction actions
    likeCourse: (state, action: PayloadAction<string>) => {
      const course = state.courses.find(c => c._id === action.payload);
      if (course) {
        // Update like status (this would normally come from API)
        // For now, just mark as updated
      }
    },
    bookmarkCourse: (state, action: PayloadAction<string>) => {
      const course = state.courses.find(c => c._id === action.payload);
      if (course) {
        // Update bookmark status
      }
    },
    rateCourse: (state, action: PayloadAction<{ courseId: string; rating: number }>) => {
      const course = state.courses.find(c => c._id === action.payload.courseId);
      if (course) {
        // Update course rating (this would normally be handled by API)
      }
    },
  },
});

// Export actions
export const {
  setCourses,
  addCourses,
  updateCourse,
  removeCourse,
  setEnrolledCourses,
  addEnrolledCourse,
  removeEnrolledCourse,
  setCurrentCourse,
  setCategories,
  setFilters,
  updateFilters,
  clearFilters,
  setPagination,
  incrementPage,
  resetPagination,
  setLoading,
  setError,
  clearError,
  clearCourses,
  likeCourse,
  bookmarkCourse,
  rateCourse,
} = coursesSlice.actions;

// Selectors
export const selectCourses = (state: { courses: CoursesState }) => state.courses;
export const selectAllCourses = (state: { courses: CoursesState }) => state.courses.courses;
export const selectEnrolledCourses = (state: { courses: CoursesState }) => state.courses.enrolledCourses;
export const selectCurrentCourse = (state: { courses: CoursesState }) => state.courses.currentCourse;
export const selectCourseCategories = (state: { courses: CoursesState }) => state.courses.categories;
export const selectCourseFilters = (state: { courses: CoursesState }) => state.courses.filters;
export const selectCoursePagination = (state: { courses: CoursesState }) => state.courses.pagination;
export const selectCoursesLoading = (state: { courses: CoursesState }) => state.courses.isLoading;
export const selectCoursesError = (state: { courses: CoursesState }) => state.courses.error;

export const selectCourseById = (courseId: string) => (state: { courses: CoursesState }) =>
  state.courses.courses.find(course => course._id === courseId);

export const selectIsEnrolled = (courseId: string) => (state: { courses: CoursesState }) =>
  state.courses.enrolledCourses.some(course => course._id === courseId);

export const selectFilteredCourses = (state: { courses: CoursesState }) => {
  const { courses, filters } = state.courses;
  
  return courses.filter(course => {
    // Filter by category
    if (filters.category && course.category !== filters.category) {
      return false;
    }
    
    // Filter by level
    if (filters.level && course.level !== filters.level) {
      return false;
    }
    
    // Filter by price
    if (filters.price) {
      if (filters.price === 'free' && course.price > 0) {
        return false;
      }
      if (filters.price === 'paid' && course.price === 0) {
        return false;
      }
    }
    
    // Filter by rating
    if (filters.rating && course.rating.average < filters.rating) {
      return false;
    }
    
    // Filter by duration
    if (filters.duration) {
      if (course.duration < filters.duration.min || course.duration > filters.duration.max) {
        return false;
      }
    }
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesTitle = course.title.toLowerCase().includes(searchTerm);
      const matchesDescription = course.description.toLowerCase().includes(searchTerm);
      const matchesTags = course.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }
    
    return true;
  });
};

export const selectCoursesByCategory = (category: string) => (state: { courses: CoursesState }) =>
  state.courses.courses.filter(course => course.category === category);

export const selectPopularCourses = (state: { courses: CoursesState }) =>
  [...state.courses.courses]
    .sort((a, b) => b.enrollment.current - a.enrollment.current)
    .slice(0, 10);

export const selectRecommendedCourses = (state: { courses: CoursesState }) =>
  state.courses.courses
    .filter(course => course.rating.average >= 4.5)
    .slice(0, 5);

// Export reducer
export default coursesSlice.reducer;