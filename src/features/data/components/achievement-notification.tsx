import { cn } from "@/utils";
import { Achievement } from "./achievement-icons";
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Star } from "lucide-react";
import confetti from "canvas-confetti";

type AchievementNotificationProps = {
  achievement: Achievement | null;
  show: boolean;
  onClose?: () => void;
  className?: string;
};

export function AchievementNotification({ 
  achievement, 
  show, 
  onClose,
  className 
}: AchievementNotificationProps) {
  const [visible, setVisible] = useState(show);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  
  // Handle show/hide animation
  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Fire confetti only once per achievement notification
      if (!hasTriggeredConfetti && achievement) {
        setTimeout(() => {
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            setHasTriggeredConfetti(true);
          } catch (error) {
            console.error("Could not trigger confetti", error);
          }
        }, 300);
      }
      
      // Auto-hide after a delay
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          onClose?.();
          setHasTriggeredConfetti(false);
        }, 500); // Wait for exit animation to complete
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setHasTriggeredConfetti(false);
    }
  }, [show, achievement, onClose, hasTriggeredConfetti]);
  
  // If no achievement, don't render
  if (!achievement) return null;
  
  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-500 transform",
        visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0",
        "pointer-events-none", // Don't capture mouse events
        className
      )}
    >
      <Card className="bg-primary text-primary-foreground shadow-lg p-4 border-0 rounded-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary-foreground/5 opacity-40" />
        
        <div className="relative z-10">
          <div className="flex items-center">
            <div className="flex items-center justify-center bg-primary-foreground/20 p-2 rounded-full mr-3">
              {achievement.icon}
            </div>
            
            <div>
              <div className="flex items-center gap-1 mb-1">
                <h3 className="font-bold">Achievement Unlocked!</h3>
                <div className="flex items-center gap-1 bg-primary-foreground/20 rounded-full px-2 py-0.5 text-xs">
                  <Star className="h-3 w-3" />
                  <span>+{achievement.points}</span>
                </div>
              </div>
              <p className="font-semibold">{achievement.title}</p>
              <p className="text-sm text-primary-foreground/80">{achievement.description}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}