import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  BackHandler,
  AppState,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { testService } from '../services/testService';
import { Question } from '../types';
import { Colors } from '../constants/colors';

interface RouteParams {
  testId: string;
  testTitle: string;
}

interface QuestionResponse {
  questionId: string;
  selectedOptions: string[];
  textAnswer?: string;
  timeSpent: number;
  isCorrect?: boolean;
  explanation?: string;
}

const TestTakingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { testId, testTitle } = route.params as RouteParams;

  // State management
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Refs for timers
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load test session
  const loadTestSession = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to resume existing session first
      let testSession = await testService.resumeTestSession(testId);
      
      if (!testSession) {
        // Start new session
        testSession = await testService.startTestSession(testId);
      }

      setSession(testSession);
      setTimeRemaining(testSession.timeRemaining);
      
      // Load current question
      const question = testSession.questions[testSession.currentQuestionIndex];
      setCurrentQuestion(question);
      
      // Load saved answer if exists
      const savedAnswer = await testService.getQuestionAnswer(question._id);
      if (savedAnswer) {
        setSelectedOptions(savedAnswer.selectedOptions || []);
        setTextAnswer(savedAnswer.textAnswer || '');
      }
      
      setQuestionStartTime(Date.now());
      
    } catch (error) {
      console.error('Error loading test session:', error);
      Alert.alert('Error', 'Failed to load test. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [testId, navigation]);

  // Save current answer (defined first to avoid dependency issues)
  const saveCurrentAnswer = useCallback(async () => {
    if (!session || !currentQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    const answer: Omit<QuestionResponse, 'questionId'> = {
      selectedOptions: selectedOptions,
      textAnswer: textAnswer.trim(),
      timeSpent: timeSpent
    };

    try {
      await testService.answerQuestion(currentQuestion._id, answer);
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  }, [session, currentQuestion, selectedOptions, textAnswer, questionStartTime]);

  // Auto submit when time runs out
  const handleAutoSubmit = useCallback(async () => {
    try {
      await saveCurrentAnswer();
      const result = await testService.submitTest();
      
      Alert.alert(
        'Time Up!',
        'The test has been automatically submitted.',
        [
          {
            text: 'View Results',
            onPress: () => navigation.replace('TestResult', { resultId: result.id })
          }
        ]
      );
    } catch (error) {
      console.error('Error auto-submitting test:', error);
      Alert.alert('Error', 'Failed to submit test automatically.');
    }
  }, [navigation, saveCurrentAnswer]);

  // Timer management
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev: any) => {
        if (prev <= 0) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleAutoSubmit]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Navigate to question
  const navigateToQuestion = useCallback(async (questionIndex: number) => {
    if (!session) return;

    // Save current answer before navigating
    await saveCurrentAnswer();
    
    // Navigate to new question
    await testService.navigateToQuestion(questionIndex);
    
    const question = session.questions[questionIndex];
    setCurrentQuestion(question);
    
    // Load answer for new question
    const savedAnswer = await testService.getQuestionAnswer(question._id);
    if (savedAnswer) {
      setSelectedOptions(savedAnswer.selectedOptions || []);
      setTextAnswer(savedAnswer.textAnswer || '');
    } else {
      setSelectedOptions([]);
      setTextAnswer('');
    }
    
    setQuestionStartTime(Date.now());
    setShowQuestionList(false);
  }, [session, saveCurrentAnswer]);

  // Navigate to next question
  const navigateNext = useCallback(async () => {
    if (!session) return;
    
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex < session.questions.length) {
      await navigateToQuestion(nextIndex);
      
      // Update session state
      setSession((prev: any) => ({ ...prev, currentQuestionIndex: nextIndex }));
    }
  }, [session, navigateToQuestion]);

  // Navigate to previous question
  const navigatePrevious = useCallback(async () => {
    if (!session) return;
    
    const prevIndex = session.currentQuestionIndex - 1;
    if (prevIndex >= 0) {
      await navigateToQuestion(prevIndex);
      
      // Update session state
      setSession((prev: any) => ({ ...prev, currentQuestionIndex: prevIndex }));
    }
  }, [session, navigateToQuestion]);

  // Handle option selection
  const handleOptionSelect = useCallback((optionId: string) => {
    if (!currentQuestion) return;

    if (currentQuestion.type === 'mcq' || currentQuestion.type === 'true_false') {
      // Single selection
      setSelectedOptions([optionId]);
    } else if (currentQuestion.type === 'multiple_select') {
      // Multiple selection
      setSelectedOptions(prev => {
        if (prev.includes(optionId)) {
          return prev.filter(id => id !== optionId);
        } else {
          return [...prev, optionId];
        }
      });
    }
  }, [currentQuestion]);

  // Submit test
  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      
      // Save current answer
      await saveCurrentAnswer();
      
      // Submit test
      const result = await testService.submitTest();
      
      Alert.alert(
        'Test Submitted!',
        'Your test has been submitted successfully.',
        [
          {
            text: 'View Results',
            onPress: () => navigation.replace('TestResult', { resultId: result.id })
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting test:', error);
      Alert.alert('Error', 'Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  }, [saveCurrentAnswer, navigation]);

  // Handle back button
  const handleBackPress = useCallback(() => {
    setShowExitConfirm(true);
    return true;
  }, []);

  // Exit test
  const exitTest = useCallback(async () => {
    try {
      await saveCurrentAnswer();
      await testService.pauseTestSession();
      navigation.goBack();
    } catch (error) {
      console.error('Error exiting test:', error);
      navigation.goBack();
    }
  }, [saveCurrentAnswer, navigation]);

  // Format time
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }, []);

  // Get answered questions count
  const getAnsweredCount = useCallback(() => {
    if (!session) return 0;
    return session.answers ? session.answers.size : 0;
  }, [session]);

  // App state change handler
  const handleAppStateChange = useCallback((nextAppState: string) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // Pause timer and save progress when app goes to background
      stopTimer();
      saveCurrentAnswer();
    } else if (nextAppState === 'active') {
      // Resume timer when app becomes active
      startTimer();
    }
  }, [stopTimer, saveCurrentAnswer, startTimer]);

  // Effects
  useEffect(() => {
    loadTestSession();
  }, [loadTestSession]);

  useEffect(() => {
    if (!loading && session) {
      startTimer();
    }
    
    return () => stopTimer();
  }, [loading, session, startTimer, stopTimer]);

  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      
      return () => {
        subscription?.remove();
        backHandler.remove();
      };
    }, [handleAppStateChange, handleBackPress])
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading test...</Text>
      </View>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load test</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowExitConfirm(true)} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.testTitle} numberOfLines={1}>{testTitle}</Text>
          <Text style={styles.questionCounter}>
            Question {session.currentQuestionIndex + 1} of {session.questions.length}
          </Text>
        </View>
        
        <TouchableOpacity onPress={() => setShowQuestionList(true)} style={styles.headerButton}>
          <Ionicons name="list" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Timer and Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${((session.currentQuestionIndex + 1) / session.questions.length) * 100}%` }
            ]}
          />
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="time" size={16} color={timeRemaining <= 300 ? Colors.error : Colors.textSecondary} />
            <Text style={[
              styles.statText,
              timeRemaining <= 300 && styles.urgentText
            ]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
          
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.statText}>
              {getAnsweredCount()}/{session.questions.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.questionContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.questionHeader}>
          <View style={styles.questionBadge}>
            <Text style={styles.questionBadgeText}>
              {currentQuestion.points} {currentQuestion.points === 1 ? 'mark' : 'marks'}
            </Text>
          </View>
          
          <View style={styles.questionType}>
            <Text style={styles.questionTypeText}>
              {currentQuestion.type === 'mcq' ? 'Single Choice' :
               currentQuestion.type === 'multiple_select' ? 'Multiple Choice' :
               currentQuestion.type === 'true_false' ? 'True/False' :
               currentQuestion.type === 'fill_blank' ? 'Fill in the Blank' :
               'Essay Question'}
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>{currentQuestion.content}</Text>

        {currentQuestion.media && (
          <View style={styles.questionImageContainer}>
            <Text style={styles.questionImagePlaceholder}>
              [Question Media: {currentQuestion.media.url}]
            </Text>
          </View>
        )}

        {/* Options for MCQ/Multiple Select/True-False */}
        {(currentQuestion.type === 'mcq' || 
          currentQuestion.type === 'multiple_select' || 
          currentQuestion.type === 'true_false') && (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.option, isSelected && styles.selectedOption]}
                  onPress={() => handleOptionSelect(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIndicator}>
                    {currentQuestion.type === 'multiple_select' ? (
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={24}
                        color={isSelected ? Colors.primary : Colors.textSecondary}
                      />
                    ) : (
                      <View style={[
                        styles.radioButton,
                        isSelected && styles.radioButtonSelected
                      ]}>
                        {isSelected && <View style={styles.radioButtonInner} />}
                      </View>
                    )}
                  </View>
                  
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText
                  ]}>
                    {option.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Text Input for Essay/Fill in the Blank */}
        {(currentQuestion.type === 'essay' || currentQuestion.type === 'fill_blank') && (
          <View style={styles.textInputContainer}>
            <Text style={styles.textInputLabel}>Your Answer:</Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                currentQuestion.type === 'essay' 
                  ? 'Write your detailed answer here...'
                  : 'Fill in the blank...'
              }
              value={textAnswer}
              onChangeText={setTextAnswer}
              multiline={currentQuestion.type === 'essay'}
              numberOfLines={currentQuestion.type === 'essay' ? 6 : 1}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              session.currentQuestionIndex === 0 && styles.navButtonDisabled
            ]}
            onPress={navigatePrevious}
            disabled={session.currentQuestionIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.white} />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          {session.currentQuestionIndex === session.questions.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.submitButton]}
              onPress={() => setShowSubmitConfirm(true)}
            >
              <Text style={styles.navButtonText}>Submit Test</Text>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={navigateNext}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Exit Test?</Text>
            <Text style={styles.modalMessage}>
              Your progress will be saved and you can resume this test later.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowExitConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={exitTest}
              >
                <Text style={styles.confirmButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal
        visible={showSubmitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Submit Test?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to submit your test? You won't be able to change your answers after submission.
            </Text>
            <Text style={styles.submissionStats}>
              Answered: {getAnsweredCount()}/{session.questions.length} questions
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSubmitConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Review</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Question List Modal */}
      <Modal
        visible={showQuestionList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuestionList(false)}
      >
        <SafeAreaView style={styles.questionListModal}>
          <View style={styles.questionListHeader}>
            <Text style={styles.questionListTitle}>Questions</Text>
            <TouchableOpacity onPress={() => setShowQuestionList(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.questionList}>
            {session.questions.map((question: any, index: number) => {
              const isAnswered = session.answers && session.answers.has(question._id);
              const isCurrent = index === session.currentQuestionIndex;
              
              return (
                <TouchableOpacity
                  key={question._id}
                  style={[
                    styles.questionListItem,
                    isCurrent && styles.currentQuestionItem,
                    isAnswered && styles.answeredQuestionItem
                  ]}
                  onPress={() => navigateToQuestion(index)}
                >
                  <View style={styles.questionListItemContent}>
                    <Text style={[
                      styles.questionListItemNumber,
                      isCurrent && styles.currentQuestionNumber,
                      isAnswered && styles.answeredQuestionNumber
                    ]}>
                      {index + 1}
                    </Text>
                    
                    <Text 
                      style={[
                        styles.questionListItemText,
                        isCurrent && styles.currentQuestionText
                      ]} 
                      numberOfLines={2}
                    >
                      {question.question}
                    </Text>
                  </View>
                  
                  <View style={styles.questionListItemIndicators}>
                    {isAnswered && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    )}
                    {isCurrent && (
                      <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  questionCounter: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  urgentText: {
    color: Colors.error,
    fontWeight: 'bold',
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  questionBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
  questionType: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questionTypeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
    marginBottom: 24,
    fontWeight: '500',
  },
  questionImageContainer: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  questionImagePlaceholder: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  optionIndicator: {
    marginRight: 12,
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  textInputContainer: {
    marginBottom: 32,
  },
  textInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  prevButton: {
    backgroundColor: Colors.textSecondary,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.success,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  submissionStats: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  questionListModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  questionListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  questionListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  questionList: {
    flex: 1,
    padding: 16,
  },
  questionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentQuestionItem: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  answeredQuestionItem: {
    backgroundColor: `${Colors.success}10`,
  },
  questionListItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionListItemNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    width: 32,
    textAlign: 'center',
  },
  currentQuestionNumber: {
    color: Colors.primary,
  },
  answeredQuestionNumber: {
    color: Colors.success,
  },
  questionListItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
  },
  currentQuestionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  questionListItemIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default TestTakingScreen;