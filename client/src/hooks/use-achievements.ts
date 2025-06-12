import { useState, useEffect } from "react";
import { AchievementType, createAchievements } from "@/components/achievement-icons";
import { useToast } from "./use-toast";

// Achievements local storage key
const ACHIEVEMENTS_STORAGE_KEY = "funeral-policy-achievements";
const ACHIEVEMENTS_POINTS_KEY = "funeral-policy-points";

// Get stored achievements from local storage
const getStoredAchievements = (): AchievementType[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error retrieving achievements from storage:", error);
    return [];
  }
};

// Get stored points from local storage
const getStoredPoints = (): number => {
  if (typeof window === "undefined") return 0;
  
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_POINTS_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error("Error retrieving points from storage:", error);
    return 0;
  }
};

export function useAchievements() {
  const { toast } = useToast();
  const [points, setPoints] = useState<number>(getStoredPoints());
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementType[]>(getStoredAchievements());
  const [recentAchievement, setRecentAchievement] = useState<AchievementType | null>(null);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  
  // Save achievements and points to local storage
  useEffect(() => {
    try {
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(unlockedAchievements));
      localStorage.setItem(ACHIEVEMENTS_POINTS_KEY, points.toString());
    } catch (error) {
      console.error("Error saving achievements to storage:", error);
    }
  }, [unlockedAchievements, points]);
  
  // Method to unlock an achievement
  const unlockAchievement = (achievementId: AchievementType) => {
    // Check if achievement is already unlocked
    if (unlockedAchievements.includes(achievementId)) {
      return false;
    }
    
    // Get achievement details
    const allAchievements = createAchievements(unlockedAchievements);
    const achievement = allAchievements.find(a => a.id === achievementId);
    
    if (achievement) {
      // Update unlocked achievements list
      const newUnlockedAchievements = [...unlockedAchievements, achievementId];
      setUnlockedAchievements(newUnlockedAchievements);
      
      // Add points
      const newPoints = points + achievement.points;
      setPoints(newPoints);
      
      // Show notification
      setRecentAchievement(achievementId);
      setShowAchievementNotification(true);
      
      return true;
    }
    
    return false;
  };
  
  // Helper method to check if an achievement is unlocked
  const isAchievementUnlocked = (achievementId: AchievementType): boolean => {
    return unlockedAchievements.includes(achievementId);
  };
  
  // Handle notification close
  const closeAchievementNotification = () => {
    setShowAchievementNotification(false);
  };
  
  // Get all achievement objects (unlocked and locked)
  const getAchievements = () => {
    return createAchievements(unlockedAchievements);
  };
  
  return {
    points,
    unlockedAchievements,
    getAchievements,
    unlockAchievement,
    isAchievementUnlocked,
    recentAchievement,
    showAchievementNotification,
    closeAchievementNotification,
  };
}