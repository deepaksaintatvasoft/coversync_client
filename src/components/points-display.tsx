import { cn } from "@/lib/utils";
import { Star, Trophy, Award } from "lucide-react";
import { Achievement } from "./achievement-icons";
import { useEffect, useState } from "react";
import { Progress } from "./ui/progress";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

type PointsDisplayProps = {
  points: number;
  achievements: Achievement[];
  className?: string;
  onPointsChange?: (newPoints: number) => void;
  showLevel?: boolean;
};

// Helper function to calculate level from points
export const getLevelDetails = (points: number) => {
  const levels = [
    { level: 1, threshold: 0, title: "Beginner" },
    { level: 2, threshold: 50, title: "Bronze" },
    { level: 3, threshold: 100, title: "Silver" },
    { level: 4, threshold: 200, title: "Gold" },
    { level: 5, threshold: 300, title: "Platinum" },
    { level: 6, threshold: 500, title: "Diamond" },
  ];
  
  const currentLevel = levels.reduce((result, level) => {
    if (points >= level.threshold) {
      return level;
    }
    return result;
  }, levels[0]);
  
  const nextLevel = levels.find(level => level.threshold > points) || levels[levels.length - 1];
  const pointsToNextLevel = nextLevel.threshold - points;
  const progress = nextLevel === currentLevel 
    ? 100 
    : Math.min(100, Math.floor(((points - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100));
    
  return {
    currentLevel,
    nextLevel,
    pointsToNextLevel,
    progress: Math.max(0, progress),
  };
};

export function PointsDisplay({ 
  points, 
  achievements,
  className,
  onPointsChange,
  showLevel = true
}: PointsDisplayProps) {
  const [displayedPoints, setDisplayedPoints] = useState(points);
  const { currentLevel, nextLevel, pointsToNextLevel, progress } = getLevelDetails(points);
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  
  // Animate points change
  useEffect(() => {
    if (points !== displayedPoints) {
      const diff = points - displayedPoints;
      const step = Math.sign(diff) * Math.ceil(Math.abs(diff) / 10);
      
      const timer = setTimeout(() => {
        const newPoints = displayedPoints + step;
        
        if ((diff > 0 && newPoints >= points) || (diff < 0 && newPoints <= points)) {
          setDisplayedPoints(points);
          if (onPointsChange) onPointsChange(points);
        } else {
          setDisplayedPoints(newPoints);
          if (onPointsChange) onPointsChange(newPoints);
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [points, displayedPoints, onPointsChange]);
  
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Points display */}
      <div className="flex items-center gap-2 mb-2">
        <Star className="h-5 w-5 text-primary fill-primary" />
        <span className="text-lg font-bold">{displayedPoints} Points</span>
        
        {showLevel && (
          <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {currentLevel.title}
          </Badge>
        )}
      </div>
      
      {/* Level progress */}
      {showLevel && nextLevel.level !== currentLevel.level && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Level {currentLevel.level}</span>
            <span>{pointsToNextLevel} points to Level {nextLevel.level}</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted" />
        </div>
      )}
      
      {/* Achievements summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Award className="h-4 w-4" />
          {unlockedAchievements.length} / {achievements.length} Achievements
        </span>
      </div>
    </div>
  );
}