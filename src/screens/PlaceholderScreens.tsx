// Placeholder screens for Commerce Gate App Navigation
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';

const createPlaceholderScreen = (
  screenName: string,
  description: string,
  iconName: string = 'info'
) => {
  return ({ navigation }: { navigation: any }) => (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Icon name={iconName} size={64} color={COLORS.PRIMARY} />
        <Text style={styles.title}>{screenName}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color={COLORS.WHITE} />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Enhanced Explore Screen with navigation
export const ExploreScreen = ({ navigation }: { navigation: any }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Icon name="explore" size={64} color={COLORS.PRIMARY} />
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.description}>
        Discover new courses, topics, and learning materials. Browse our extensive catalog of courses and tests.
      </Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.backButton, { marginBottom: 12 }]}
          onPress={() => navigation.navigate('CourseBrowsing')}
        >
          <Icon name="school" size={20} color={COLORS.WHITE} />
          <Text style={styles.backButtonText}>Browse Courses</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.backButton, { marginBottom: 12 }]}
          onPress={() => navigation.navigate('TestBrowsing')}
        >
          <Icon name="quiz" size={20} color={COLORS.WHITE} />
          <Text style={styles.backButtonText}>Browse Tests</Text>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
);

export const CommunityScreen = createPlaceholderScreen(
  'Community',
  'Connect with fellow learners, participate in discussions, and share your knowledge. This screen will include forums, chat, and social features.',
  'people'
);

export const ProfileScreen = createPlaceholderScreen(
  'Profile',
  'Manage your account settings, view your progress, achievements, and learning statistics. Customize your learning preferences here.',
  'person'
);

export const CourseSelectionScreen = createPlaceholderScreen(
  'Course Selection',
  'Choose from available courses across different subjects. Browse by category, difficulty level, and popularity.',
  'school'
);

export const LevelSelectionScreen = createPlaceholderScreen(
  'Level Selection',
  'Select the difficulty level for your chosen course. Pick from beginner, intermediate, or advanced levels.',
  'trending-up'
);

export const MCQTestScreen = createPlaceholderScreen(
  'MCQ Test',
  'Take multiple choice question tests to assess your knowledge. Features include timer, question navigation, and instant feedback.',
  'quiz'
);

export const ResultsScreen = createPlaceholderScreen(
  'Results',
  'View your test results, detailed explanations, and performance analytics. Track your improvement over time.',
  'assessment'
);

export const SettingsScreen = createPlaceholderScreen(
  'Settings',
  'Configure app preferences, notification settings, account security, and privacy options. Customize your learning experience.',
  'settings'
);

// Test Browsing Screen with navigation
export const TestBrowsingScreen = ({ navigation }: { navigation: any }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Icon name="quiz" size={64} color={COLORS.PRIMARY} />
      <Text style={styles.title}>Browse Tests</Text>
      <Text style={styles.description}>
        Discover practice tests, mock exams, and quizzes across various subjects. Test your knowledge and track your progress.
      </Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('TestTaking', { 
            testId: 'sample-test', 
            testTitle: 'Sample Practice Test' 
          })}
        >
          <Icon name="play-circle-filled" size={20} color={COLORS.WHITE} />
          <Text style={styles.backButtonText}>Take Sample Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color={COLORS.WHITE} />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginTop: SPACING.LG,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.XL,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.WHITE,
    marginLeft: SPACING.XS,
  },
  actionButtons: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
});

// Default exports for individual screens
export default ExploreScreen;