/**
 * Codette Feedback & Learning System
 * React component for user ratings, A/B testing, and preference tracking
 */

import React, { useState, useEffect } from 'react';

export interface CodetteResponse {
  query: string;
  category: string;
  perspectives: Array<{
    perspective: string;
    emoji: string;
    name: string;
    response: string;
    confidence: number;
    color: string;
    user_preference_score: number;
  }>;
  combined_confidence: number;
  source: string;
  is_real_ai: boolean;
  deterministic: boolean;
  learning_enabled: boolean;
  user_id: string;
  timestamp: string;
  ab_test_variant?: string;
}

export enum UserRating {
  UNHELPFUL = 0,
  SLIGHTLY_HELPFUL = 1,
  HELPFUL = 2,
  VERY_HELPFUL = 3,
  EXACTLY_WHAT_NEEDED = 4,
}

interface CodetteFeedbackComponentProps {
  response: CodetteResponse;
  onFeedbackSubmitted?: (feedback: any) => void;
}

/**
 * Feedback rating component
 */
export const CodetteFeedbackComponent: React.FC<CodetteFeedbackComponentProps> = ({
  response,
  onFeedbackSubmitted,
}) => {
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [selectedPerspective, setSelectedPerspective] = useState<string>(response.perspectives[0].perspective);
  const [helpfulComment, setHelpfulComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const ratingLabels = {
    [UserRating.UNHELPFUL]: '?? Not helpful',
    [UserRating.SLIGHTLY_HELPFUL]: '?? Slightly helpful',
    [UserRating.HELPFUL]: '?? Helpful',
    [UserRating.VERY_HELPFUL]: '?? Very helpful',
    [UserRating.EXACTLY_WHAT_NEEDED]: '?? Exactly what I needed!',
  };

  const ratingColors = {
    [UserRating.UNHELPFUL]: '#ef4444',
    [UserRating.SLIGHTLY_HELPFUL]: '#f97316',
    [UserRating.HELPFUL]: '#eab308',
    [UserRating.VERY_HELPFUL]: '#84cc16',
    [UserRating.EXACTLY_WHAT_NEEDED]: '#22c55e',
  };

  const handleSubmitFeedback = async () => {
    if (userRating === null) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackPayload = {
        user_id: response.user_id || 'anonymous',
        response_id: `${response.timestamp}-${response.category}`,
        category: response.category,
        perspective: selectedPerspective,
        rating: userRating,
        rating_name: UserRating[userRating],
        helpful_score: (userRating / 4.0) * 100,
        helpful_comment: helpfulComment,
        timestamp: new Date().toISOString(),
      };

      // Send to backend
      const response_feedback = await fetch('/api/codette/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload),
      });

      if (response_feedback.ok) {
        setFeedbackSubmitted(true);
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(feedbackPayload);
        }

        // Reset after delay
        setTimeout(() => {
          setUserRating(null);
          setHelpfulComment('');
          setFeedbackSubmitted(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="codette-feedback-container" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h4 style={styles.title}>Was this helpful?</h4>
        <p style={styles.subtitle}>Your feedback helps Codette learn</p>
      </div>

      {/* Perspective Selector */}
      <div style={styles.section}>
        <label style={styles.label}>Which perspective was most helpful?</label>
        <div style={styles.perspectiveButtons}>
          {response.perspectives.map((persp) => (
            <button
              key={persp.perspective}
              onClick={() => setSelectedPerspective(persp.perspective)}
              style={{
                ...styles.perspectiveButton,
                ...(selectedPerspective === persp.perspective
                  ? styles.perspectiveButtonActive
                  : styles.perspectiveButtonInactive),
                borderColor: persp.color,
              }}
            >
              <span style={styles.emoji}>{persp.emoji}</span>
              <span style={styles.perspectiveName}>{persp.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rating Selector */}
      <div style={styles.section}>
        <label style={styles.label}>Rate this response</label>
        <div style={styles.ratingButtons}>
          {Object.entries(ratingLabels).map(([ratingValue, label]) => {
            const rating = parseInt(ratingValue) as UserRating;
            return (
              <button
                key={rating}
                onClick={() => setUserRating(rating)}
                style={{
                  ...styles.ratingButton,
                  ...(userRating === rating
                    ? { ...styles.ratingButtonActive, backgroundColor: ratingColors[rating] }
                    : styles.ratingButtonInactive),
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment Input */}
      {userRating !== null && (
        <div style={styles.section}>
          <label style={styles.label}>Any additional feedback? (optional)</label>
          <textarea
            value={helpfulComment}
            onChange={(e) => setHelpfulComment(e.target.value)}
            placeholder="What could be improved? What did you like most?"
            style={styles.textarea}
            maxLength={200}
          />
          <div style={styles.charCount}>{helpfulComment.length}/200</div>
        </div>
      )}

      {/* Submit Button */}
      <div style={styles.actions}>
        <button
          onClick={handleSubmitFeedback}
          disabled={userRating === null || isSubmitting || feedbackSubmitted}
          style={{
            ...styles.submitButton,
            ...(userRating === null || isSubmitting || feedbackSubmitted
              ? styles.submitButtonDisabled
              : styles.submitButtonActive),
          }}
        >
          {feedbackSubmitted ? '? Thank you!' : isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>

      {/* Learning Score */}
      {response.learning_enabled && (
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            ?? <strong>Codette is learning:</strong> Your feedback helps personalize future responses.
          </p>
          <p style={styles.infoSmall}>
            Confidence: {(response.combined_confidence * 100).toFixed(0)}% • Category: {response.category}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * User Learning Profile Display
 */
interface UserLearningProfileProps {
  userId: string;
  onProfileLoaded?: (profile: any) => void;
}

export const UserLearningProfile: React.FC<UserLearningProfileProps> = ({ userId, onProfileLoaded }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/codette/user-profile/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          if (onProfileLoaded) {
            onProfileLoaded(data);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  if (!profile) {
    return <div style={styles.error}>Could not load user profile</div>;
  }

  return (
    <div style={styles.profileContainer}>
      <h3 style={styles.profileTitle}>?? Your Learning Profile</h3>

      {/* Most Preferred Perspective */}
      <div style={styles.profileSection}>
        <div style={styles.profileLabel}>Most Preferred Perspective</div>
        <div style={styles.profileValue}>
          <strong>{profile.most_preferred_perspective.name}</strong>
          <div style={styles.scoreBar}>
            <div
              style={{
                ...styles.scoreBarFill,
                width: `${profile.most_preferred_perspective.score * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Least Preferred Perspective */}
      <div style={styles.profileSection}>
        <div style={styles.profileLabel}>Least Preferred Perspective</div>
        <div style={styles.profileValue}>
          <strong>{profile.least_preferred_perspective.name}</strong>
          <div style={styles.scoreBar}>
            <div
              style={{
                ...styles.scoreBarFill,
                width: `${profile.least_preferred_perspective.score * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Responses Rated */}
      <div style={styles.profileSection}>
        <div style={styles.profileLabel}>Responses Rated</div>
        <div style={styles.profileValue}>{profile.responses_rated}</div>
      </div>

      {/* Learning Recommendation */}
      <div style={styles.recommendationBox}>
        <p style={styles.recommendationText}>?? {profile.learning_recommendation}</p>
      </div>

      {/* All Preferences */}
      <div style={styles.allPreferencesSection}>
        <div style={styles.profileLabel}>Perspective Preferences</div>
        {Object.entries(profile.all_perspective_preferences).map(([perspective, score]: [string, any]) => (
          <div key={perspective} style={styles.preferenceRow}>
            <span style={styles.preferenceName}>{perspective.replace(/_/g, ' ')}</span>
            <div style={styles.scoreBar}>
              <div
                style={{
                  ...styles.scoreBarFill,
                  width: `${score * 100}%`,
                }}
              />
            </div>
            <span style={styles.scoreValue}>{(score * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * System Analytics Dashboard
 */
interface CodetteAnalyticsDashboardProps {
  onAnalyticsLoaded?: (analytics: any) => void;
}

export const CodetteAnalyticsDashboard: React.FC<CodetteAnalyticsDashboardProps> = ({ onAnalyticsLoaded }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/codette/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
          if (onAnalyticsLoaded) {
            onAnalyticsLoaded(data);
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Loading analytics...</div>;
  }

  if (!analytics) {
    return <div style={styles.error}>Could not load analytics</div>;
  }

  return (
    <div style={styles.dashboardContainer}>
      <h2 style={styles.dashboardTitle}>?? Codette Analytics</h2>

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Responses Generated</div>
          <div style={styles.metricValue}>{analytics.total_responses_generated}</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Ratings Received</div>
          <div style={styles.metricValue}>{analytics.total_ratings_received}</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Average Rating</div>
          <div style={styles.metricValue}>{analytics.average_rating.toFixed(2)}/4</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Active Users</div>
          <div style={styles.metricValue}>{analytics.active_users}</div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Rating Distribution</h3>
        <div style={styles.ratingDistribution}>
          {Object.entries(analytics.rating_distribution).map(([rating, count]: [string, any]) => (
            <div key={rating} style={styles.ratingBar}>
              <span style={styles.ratingName}>{rating.replace(/_/g, ' ')}</span>
              <div style={styles.barContainer}>
                <div
                  style={{
                    ...styles.bar,
                    width: `${Math.min(count * 2, 100)}%`,
                  }}
                />
              </div>
              <span style={styles.ratingCount}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Used */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Top Categories</h3>
        <div style={styles.categoriesList}>
          {analytics.categories_used.slice(0, 8).map((category: string) => (
            <span key={category} style={styles.categoryTag}>
              {category.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Most/Least Helpful */}
      <div style={styles.section}>
        <div style={styles.twoColumn}>
          <div>
            <h4 style={styles.subTitle}>Most Helpful Perspective</h4>
            <p style={styles.perspectiveValue}>{analytics.most_helpful_perspective}</p>
          </div>
          <div>
            <h4 style={styles.subTitle}>Least Helpful Perspective</h4>
            <p style={styles.perspectiveValue}>{analytics.least_helpful_perspective}</p>
          </div>
        </div>
      </div>

      {/* Quality Status */}
      <div style={styles.qualityBox}>
        <p style={styles.qualityText}>
          ?? Response Quality: <strong>{analytics.response_quality_trend.toUpperCase()}</strong>
        </p>
        <p style={styles.qualitySmall}>
          Based on {analytics.total_ratings_received} ratings. A/B tests: {analytics.ab_tests_completed} completed
        </p>
      </div>
    </div>
  );
};

// ==============================================================================
// STYLES
// ==============================================================================

const styles: any = {
  // Feedback Component
  container: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #334155',
    fontFamily: 'inherit',
  },
  header: {
    marginBottom: '16px',
    borderBottom: '1px solid #334155',
    paddingBottom: '12px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  subtitle: {
    margin: '0',
    fontSize: '13px',
    color: '#94a3b8',
  },
  section: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#cbd5e1',
    marginBottom: '8px',
  },
  perspectiveButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '8px',
  },
  perspectiveButton: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '2px solid',
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  perspectiveButtonActive: {
    backgroundColor: '#1e3a8a',
    color: '#f1f5f9',
  },
  perspectiveButtonInactive: {
    backgroundColor: '#0f172a',
    color: '#94a3b8',
  },
  emoji: {
    fontSize: '16px',
  },
  perspectiveName: {
    fontSize: '11px',
  },
  ratingButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '8px',
  },
  ratingButton: {
    padding: '12px 8px',
    borderRadius: '6px',
    border: '2px solid #334155',
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  ratingButtonActive: {
    border: '2px solid',
    color: '#f1f5f9',
  },
  ratingButtonInactive: {
    backgroundColor: '#0f172a',
    color: '#94a3b8',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    minHeight: '60px',
    resize: 'vertical' as const,
  },
  charCount: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
    textAlign: 'right' as const,
  },
  actions: {
    marginTop: '16px',
    display: 'flex',
    gap: '8px',
  },
  submitButton: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitButtonActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  },
  submitButtonDisabled: {
    backgroundColor: '#334155',
    color: '#94a3b8',
    cursor: 'not-allowed',
  },
  infoBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#1e3a8a',
    borderRadius: '4px',
    borderLeft: '4px solid #3b82f6',
  },
  infoText: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    color: '#f1f5f9',
  },
  infoSmall: {
    margin: '0',
    fontSize: '12px',
    color: '#cbd5e1',
  },

  // Profile & Analytics
  profileContainer: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #334155',
  },
  profileTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#f1f5f9',
    borderBottom: '2px solid #3b82f6',
    paddingBottom: '8px',
  },
  profileSection: {
    marginBottom: '12px',
  },
  profileLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  profileValue: {
    fontSize: '14px',
    color: '#f1f5f9',
  },
  scoreBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#0f172a',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '4px',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s',
  },
  recommendationBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#1e3a8a',
    borderRadius: '4px',
    borderLeft: '4px solid #22c55e',
  },
  recommendationText: {
    margin: '0',
    fontSize: '13px',
    color: '#f1f5f9',
    lineHeight: '1.4',
  },
  allPreferencesSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #334155',
  },
  preferenceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
    fontSize: '12px',
  },
  preferenceName: {
    width: '140px',
    color: '#cbd5e1',
    textTransform: 'capitalize' as const,
  },
  scoreValue: {
    width: '40px',
    textAlign: 'right' as const,
    color: '#94a3b8',
  },

  // Dashboard
  dashboardContainer: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '24px',
    minHeight: '600px',
  },
  dashboardTitle: {
    margin: '0 0 24px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9',
    borderBottom: '3px solid #3b82f6',
    paddingBottom: '12px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  metricCard: {
    backgroundColor: '#1e293b',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #334155',
    textAlign: 'center' as const,
  },
  metricLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#3b82f6',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  ratingDistribution: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  ratingBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
  },
  ratingName: {
    width: '140px',
    color: '#cbd5e1',
    textTransform: 'capitalize' as const,
  },
  barContainer: {
    flex: 1,
    height: '24px',
    backgroundColor: '#1e293b',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s',
  },
  ratingCount: {
    width: '40px',
    textAlign: 'right' as const,
    color: '#94a3b8',
  },
  categoriesList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  categoryTag: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#1e3a8a',
    color: '#3b82f6',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize' as const,
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  subTitle: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  perspectiveValue: {
    margin: '0',
    fontSize: '14px',
    color: '#f1f5f9',
    fontWeight: '600',
    padding: '8px',
    backgroundColor: '#1e293b',
    borderRadius: '4px',
    borderLeft: '3px solid #3b82f6',
  },
  qualityBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#1e3a8a',
    borderRadius: '4px',
    borderLeft: '4px solid #22c55e',
  },
  qualityText: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  qualitySmall: {
    margin: '0',
    fontSize: '12px',
    color: '#cbd5e1',
  },

  // Common
  loading: {
    padding: '24px',
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontSize: '14px',
  },
  error: {
    padding: '24px',
    textAlign: 'center' as const,
    color: '#ef4444',
    fontSize: '14px',
  },
};

export default {
  CodetteFeedbackComponent,
  UserLearningProfile,
  CodetteAnalyticsDashboard,
};
