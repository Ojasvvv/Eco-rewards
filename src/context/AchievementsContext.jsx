import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  initializeUserStats, 
  getUserStats, 
  updateUserStats 
} from '../services/rewardsService';

const AchievementsContext = createContext({});

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementsProvider');
  }
  return context;
};

// Define all achievements
export const ACHIEVEMENTS = {
  FIRST_TIMER: {
    id: 'FIRST_TIMER',
    title: 'First Steps',
    description: 'Complete your first recycling',
    icon: '🌱',
    category: 'beginner',
    reward: 5,
    requirement: 1,
    checkProgress: (stats) => stats.totalDeposits >= 1
  },
  EARLY_BIRD: {
    id: 'EARLY_BIRD',
    title: 'Early Bird',
    description: 'Recycle before 8 AM',
    icon: '🌅',
    category: 'time',
    reward: 10,
    requirement: 1,
    checkProgress: (stats) => stats.earlyBirdDeposits >= 1
  },
  NIGHT_OWL: {
    id: 'NIGHT_OWL',
    title: 'Night Owl',
    description: 'Recycle after 8 PM',
    icon: '🦉',
    category: 'time',
    reward: 10,
    requirement: 1,
    checkProgress: (stats) => stats.nightOwlDeposits >= 1
  },
  ECO_STARTER: {
    id: 'ECO_STARTER',
    title: 'Eco Starter',
    description: 'Complete 10 recycling deposits',
    icon: '♻️',
    category: 'milestone',
    reward: 15,
    requirement: 10,
    checkProgress: (stats) => stats.totalDeposits >= 10
  },
  ECO_WARRIOR: {
    id: 'ECO_WARRIOR',
    title: 'Eco Warrior',
    description: 'Complete 50 recycling deposits',
    icon: '⚔️',
    category: 'milestone',
    reward: 50,
    requirement: 50,
    checkProgress: (stats) => stats.totalDeposits >= 50
  },
  ECO_CHAMPION: {
    id: 'ECO_CHAMPION',
    title: 'Eco Champion',
    description: 'Complete 100 recycling deposits',
    icon: '🏆',
    category: 'milestone',
    reward: 100,
    requirement: 100,
    checkProgress: (stats) => stats.totalDeposits >= 100
  },
  WEEKEND_WARRIOR: {
    id: 'WEEKEND_WARRIOR',
    title: 'Weekend Warrior',
    description: 'Recycle 5 times on weekends',
    icon: '🎉',
    category: 'special',
    reward: 25,
    requirement: 5,
    checkProgress: (stats) => stats.weekendDeposits >= 5
  },
  CONSISTENT_RECYCLER: {
    id: 'CONSISTENT_RECYCLER',
    title: 'Consistent Recycler',
    description: 'Maintain a 7-day streak',
    icon: '📅',
    category: 'streak',
    reward: 30,
    requirement: 7,
    checkProgress: (stats) => stats.currentStreak >= 7
  },
  STREAK_MASTER: {
    id: 'STREAK_MASTER',
    title: 'Streak Master',
    description: 'Maintain a 25-day streak',
    icon: '🔥',
    category: 'streak',
    reward: 100,
    requirement: 25,
    checkProgress: (stats) => stats.currentStreak >= 25
  },
  LOYALTY_LEGEND: {
    id: 'LOYALTY_LEGEND',
    title: 'Loyalty Legend',
    description: 'Maintain a 50-day streak',
    icon: '👑',
    category: 'streak',
    reward: 250,
    requirement: 50,
    checkProgress: (stats) => stats.currentStreak >= 50
  },
  MULTI_OUTLET: {
    id: 'MULTI_OUTLET',
    title: 'Explorer',
    description: 'Use dustbins at 5 different outlets',
    icon: '🗺️',
    category: 'special',
    reward: 40,
    requirement: 5,
    checkProgress: (stats) => Object.keys(stats.outletsVisited || {}).length >= 5
  },
  GENEROUS_SOUL: {
    id: 'GENEROUS_SOUL',
    title: 'Generous Soul',
    description: 'Redeem 5 rewards',
    icon: '💝',
    category: 'special',
    reward: 20,
    requirement: 5,
    checkProgress: (stats) => stats.rewardsRedeemed >= 5
  }
};

// Define streak milestones with rewards
export const STREAK_MILESTONES = {
  3: { reward: 10, icon: '🎁', message: '3-Day Streak Bonus!' },
  7: { reward: 25, icon: '🎁', message: '7-Day Streak Bonus!' },
  14: { reward: 50, icon: '🎁', message: '14-Day Streak Bonus!' },
  25: { reward: 100, icon: '🎁', message: '25-Day Streak Bonus!' },
  50: { reward: 250, icon: '🎁', message: '50-Day Streak Bonus!' },
  100: { reward: 500, icon: '🎁', message: '100-Day Streak Bonus!' }
};

export const AchievementsProvider = ({ children }) => {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    earlyBirdDeposits: 0,
    nightOwlDeposits: 0,
    weekendDeposits: 0,
    outletsVisited: {},
    rewardsRedeemed: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastDepositDate: null,
    streakRewardsCollected: []
  });
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);
  const [congratsPopup, setCongratsPopup] = useState(null);
  const [notificationTrigger, setNotificationTrigger] = useState(0);
  const [rewardsRefreshTrigger, setRewardsRefreshTrigger] = useState(0);

  // Load achievements and stats from Firestore (secure, server-side storage)
  useEffect(() => {
    const loadStats = async () => {
      if (user?.uid) {
        try {
          setStatsLoading(true);
          
          // Load achievements from localStorage (can migrate to Firestore later)
          const savedAchievements = localStorage.getItem(`achievements_${user.uid}`);
          if (savedAchievements) {
            setUnlockedAchievements(JSON.parse(savedAchievements));
          }
          
          // Initialize user stats in Firestore if first time
          await initializeUserStats(user.uid);
          
          // Load stats from Firestore
          const firestoreStats = await getUserStats(user.uid);
          setStats(firestoreStats);
          
          // Check streak on load
          checkStreak(firestoreStats);
        } catch (error) {
          console.error('Error loading stats:', error);
          // Fallback to localStorage if Firestore fails
          const savedStats = localStorage.getItem(`stats_${user.uid}`);
          if (savedStats) {
            const parsedStats = JSON.parse(savedStats);
            setStats(parsedStats);
            checkStreak(parsedStats);
          }
        } finally {
          setStatsLoading(false);
        }
      }
    };
    
    loadStats();
  }, [user]);

  // Save achievements to localStorage (keep for now, can migrate later)
  useEffect(() => {
    if (user?.uid && unlockedAchievements.length > 0) {
      localStorage.setItem(`achievements_${user.uid}`, JSON.stringify(unlockedAchievements));
    }
  }, [unlockedAchievements, user]);

  // Check and update streak
  const checkStreak = (currentStats) => {
    if (!currentStats.lastDepositDate) return currentStats;

    const today = new Date().toDateString();
    const lastDeposit = new Date(currentStats.lastDepositDate).toDateString();
    
    if (today === lastDeposit) {
      // Same day, no change
      return currentStats;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastDeposit === yesterdayStr) {
      // Streak continues - but don't increment here, will be done on deposit
      return currentStats;
    } else {
      // Streak broken
      return {
        ...currentStats,
        currentStreak: 0
      };
    }
  };

  // Record a new deposit
  // SECURITY FIX: Stats are now calculated SERVER-SIDE
  // This function just triggers a refresh of stats from Firestore
  const recordDeposit = async (outletId) => {
    // Stats are calculated server-side in addRewardPoints API
    // Just reload stats from Firestore after a short delay
    setTimeout(async () => {
      if (user?.uid) {
        try {
          const updatedStats = await getUserStats(user.uid);
          
          setStats(prevStats => {
            // Check for newly unlocked achievements
            checkAchievements(updatedStats);
            
            // Check for streak milestone rewards
            const newStreak = updatedStats.currentStreak;
            const prevStreak = prevStats.currentStreak;
            
            if (newStreak > prevStreak && STREAK_MILESTONES[newStreak]) {
              const milestone = STREAK_MILESTONES[newStreak];
              const collectedRewards = updatedStats.streakRewardsCollected || [];
              
              if (!collectedRewards.includes(newStreak)) {
                setPendingNotifications(prev => [...prev, {
                  type: 'streak_milestone',
                  streak: newStreak,
                  reward: milestone.reward,
                  icon: milestone.icon,
                  message: milestone.message
                }]);
              }
            }
            
            return updatedStats;
          });
        } catch (error) {
          console.error('Error refreshing stats after deposit:', error);
        }
      }
    }, 1000); // 1 second delay to allow server to update
  };

  // Record a reward redemption
  // SECURITY FIX: Stats are updated SERVER-SIDE in redeemRewardPoints API
  const recordRewardRedemption = async () => {
    // Stats are automatically updated server-side in redeemRewardPoints API
    // Just reload stats from Firestore after a short delay
    setTimeout(async () => {
      if (user?.uid) {
        try {
          const updatedStats = await getUserStats(user.uid);
          setStats(prevStats => {
            checkAchievements(updatedStats);
            return updatedStats;
          });
        } catch (error) {
          console.error('Error refreshing stats after redemption:', error);
        }
      }
    }, 1000); // 1 second delay to allow server to update
  };

  // Check for newly unlocked achievements
  const checkAchievements = (currentStats) => {
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (!unlockedAchievements.includes(achievement.id) && achievement.checkProgress(currentStats)) {
        unlockAchievement(achievement);
      }
    });
  };

  // Unlock an achievement
  const unlockAchievement = (achievement) => {
    console.log('🏆 Achievement unlocked:', achievement.title);
    setUnlockedAchievements(prev => [...prev, achievement.id]);
    setPendingNotifications(prev => {
      const newQueue = [...prev, {
        type: 'achievement',
        achievement: achievement
      }];
      console.log('📝 Pending notifications queue:', newQueue.length);
      return newQueue;
    });
  };

  // Get notification to display
  const getNextNotification = useCallback(() => {
    if (pendingNotifications.length > 0) {
      return pendingNotifications[0];
    }
    return null;
  }, [pendingNotifications]);

  // Clear current notification
  const clearNotification = useCallback(() => {
    setPendingNotifications(prev => prev.slice(1));
  }, []);

  // Get achievement progress
  const getAchievementProgress = (achievementId) => {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return 0;
    
    if (unlockedAchievements.includes(achievementId)) {
      return 100;
    }

    // Calculate progress based on achievement type
    switch (achievement.id) {
      case 'FIRST_TIMER':
      case 'ECO_STARTER':
      case 'ECO_WARRIOR':
      case 'ECO_CHAMPION':
        return Math.min(100, (stats.totalDeposits / achievement.requirement) * 100);
      case 'EARLY_BIRD':
        return Math.min(100, (stats.earlyBirdDeposits / achievement.requirement) * 100);
      case 'NIGHT_OWL':
        return Math.min(100, (stats.nightOwlDeposits / achievement.requirement) * 100);
      case 'WEEKEND_WARRIOR':
        return Math.min(100, (stats.weekendDeposits / achievement.requirement) * 100);
      case 'CONSISTENT_RECYCLER':
      case 'STREAK_MASTER':
      case 'LOYALTY_LEGEND':
        return Math.min(100, (stats.currentStreak / achievement.requirement) * 100);
      case 'MULTI_OUTLET':
        return Math.min(100, (Object.keys(stats.outletsVisited).length / achievement.requirement) * 100);
      case 'GENEROUS_SOUL':
        return Math.min(100, (stats.rewardsRedeemed / achievement.requirement) * 100);
      default:
        return 0;
    }
  };

  // Block notifications (e.g., when congrats popup is showing)
  const blockNotifications = useCallback(() => {
    setNotificationsBlocked(true);
  }, []);

  // Unblock notifications
  const unblockNotifications = useCallback(() => {
    console.log('🔓 Unblocking notifications, pending count:', pendingNotifications.length);
    setNotificationsBlocked(false);
    // Trigger a re-check for pending notifications after state updates
    // Increased delay to ensure state has settled
    setTimeout(() => {
      console.log('🔔 Triggering notification check');
      setNotificationTrigger(prev => prev + 1);
    }, 150);
  }, [pendingNotifications.length]);

  // Show congrats popup
  const showCongratsPopup = useCallback((points) => {
    setCongratsPopup({ points });
  }, []);

  // Close congrats popup
  const closeCongratsPopup = useCallback(() => {
    setCongratsPopup(null);
  }, []);

  // Trigger rewards refresh (for use after claiming achievement rewards)
  const triggerRewardsRefresh = useCallback(() => {
    setRewardsRefreshTrigger(prev => prev + 1);
  }, []);

  const value = {
    unlockedAchievements,
    stats,
    recordDeposit,
    recordRewardRedemption,
    getNextNotification,
    clearNotification,
    getAchievementProgress,
    achievements: ACHIEVEMENTS,
    streakMilestones: STREAK_MILESTONES,
    pendingNotificationsCount: pendingNotifications.length,
    notificationsBlocked,
    blockNotifications,
    unblockNotifications,
    congratsPopup,
    showCongratsPopup,
    closeCongratsPopup,
    notificationTrigger,
    triggerRewardsRefresh,
    rewardsRefreshTrigger
  };

  return (
    <AchievementsContext.Provider value={value}>
      {children}
    </AchievementsContext.Provider>
  );
};

