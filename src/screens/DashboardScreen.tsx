// Dashboard Screen Component for Commerce Gate App
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';
import type { RootState } from '../store';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const user = useSelector((state: RootState) => state.auth.user);

  const quickActions = [
    {
      id: 'courses',
      title: 'Browse Courses',
      subtitle: 'Explore available courses',
      icon: 'school',
      color: COLORS.PRIMARY,
      onPress: () => navigation.navigate('CourseSelection'),
    },
    {
      id: 'tests',
      title: 'Take Test',
      subtitle: 'Practice with mock tests',
      icon: 'quiz',
      color: COLORS.SECONDARY,
      onPress: () => navigation.navigate('LevelSelection', { courseId: 'sample' }),
    },
    {
      id: 'progress',
      title: 'View Progress',
      subtitle: 'Track your performance',
      icon: 'trending-up',
      color: COLORS.ACCENT,
      onPress: () => console.log('Progress pressed'),
    },
    {
      id: 'community',
      title: 'Community',
      subtitle: 'Connect with learners',
      icon: 'people',
      color: COLORS.INFO,
      onPress: () => navigation.navigate('Community'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.firstName || 'Student'}!</Text>
            <Text style={styles.subGreeting}>Ready to learn something new today?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="account-circle" size={40} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="school" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="quiz" size={24} color={COLORS.SECONDARY} />
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Tests Taken</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="star" size={24} color={COLORS.WARNING} />
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Icon name={action.icon} size={24} color={COLORS.WHITE} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.activityCard}>
            <Card.Content>
              <View style={styles.activityItem}>
                <Icon name="quiz" size={20} color={COLORS.SUCCESS} />
                <View style={styles.activityText}>
                  <Text style={styles.activityTitle}>Completed: Math Quiz</Text>
                  <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
                <Text style={styles.activityScore}>92%</Text>
              </View>
            </Card.Content>
          </Card>
          
          <Card style={styles.activityCard}>
            <Card.Content>
              <View style={styles.activityItem}>
                <Icon name="school" size={20} color={COLORS.INFO} />
                <View style={styles.activityText}>
                  <Text style={styles.activityTitle}>Started: Physics Course</Text>
                  <Text style={styles.activityTime}>1 day ago</Text>
                </View>
                <Text style={styles.activityProgress}>25%</Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Continue Learning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          <Card style={styles.courseCard}>
            <Card.Content>
              <View style={styles.courseHeader}>
                <View>
                  <Text style={styles.courseTitle}>Advanced Mathematics</Text>
                  <Text style={styles.courseProgress}>Progress: 65%</Text>
                </View>
                <Button
                  mode="contained"
                  compact
                  onPress={() => console.log('Continue course')}
                  buttonColor={COLORS.PRIMARY}
                >
                  Continue
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.LG,
  },
  greeting: {
    fontSize: FONT_SIZES.XL,
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY_LIGHT,
  },
  subGreeting: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    marginTop: 4,
  },
  profileButton: {
    padding: SPACING.XS,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  statCard: {
    flex: 1,
    marginHorizontal: SPACING.XS,
    backgroundColor: COLORS.WHITE,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  statNumber: {
    fontSize: FONT_SIZES.LG,
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginTop: SPACING.XS,
  },
  statLabel: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginBottom: SPACING.MD,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  actionTitle: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: COLORS.WHITE,
    marginBottom: SPACING.SM,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  activityTitle: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY_LIGHT,
  },
  activityTime: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    marginTop: 2,
  },
  activityScore: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.BOLD,
    color: COLORS.SUCCESS,
  },
  activityProgress: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.BOLD,
    color: COLORS.INFO,
  },
  courseCard: {
    backgroundColor: COLORS.WHITE,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseTitle: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY_LIGHT,
  },
  courseProgress: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    marginTop: 4,
  },
});

export default DashboardScreen;