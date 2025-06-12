import { CreditCard, FileCheck, User, Users, Heart, CheckCircle2, Clock, UsersRound, Baby, Medal, Star, Award } from "lucide-react";

export type AchievementType = 
  | "complete_step"   // Complete a step of the application
  | "all_details"     // Completed all personal details
  | "add_dependent"   // Added a dependent
  | "add_beneficiary" // Added a beneficiary
  | "select_plan"     // Selected a plan
  | "setup_payment"   // Set up payment details
  | "complete_policy" // Completed a full policy application
  | "speed_master"    // Completed application in record time
  | "multiple_dependents" // Added multiple dependents
  | "verification"    // Verified all details
  | "perfect_application"; // Perfect application (no validation errors)

export type Achievement = {
  id: AchievementType;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  points: number;
};

// Main function to create all achievements (with unlock status)
export const createAchievements = (unlockedAchievements: AchievementType[] = []): Achievement[] => [
  {
    id: "complete_step",
    title: "Step Completer",
    description: "Completed a step in the policy application process",
    icon: <CheckCircle2 className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("complete_step"),
    points: 5
  },
  {
    id: "all_details",
    title: "Identity Verified",
    description: "Provided all personal details correctly",
    icon: <User className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("all_details"),
    points: 10
  },
  {
    id: "add_dependent",
    title: "Family First",
    description: "Added a dependent to your policy",
    icon: <Baby className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("add_dependent"),
    points: 15
  },
  {
    id: "add_beneficiary",
    title: "Legacy Planner",
    description: "Added a beneficiary to your policy",
    icon: <Heart className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("add_beneficiary"),
    points: 15
  },
  {
    id: "select_plan",
    title: "Plan Selector",
    description: "Selected a funeral policy plan",
    icon: <FileCheck className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("select_plan"),
    points: 10
  },
  {
    id: "setup_payment",
    title: "Payment Ready",
    description: "Set up your payment details",
    icon: <CreditCard className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("setup_payment"),
    points: 10
  },
  {
    id: "complete_policy",
    title: "Policy Complete",
    description: "Completed a full policy application",
    icon: <Medal className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("complete_policy"),
    points: 50
  },
  {
    id: "speed_master",
    title: "Speed Master",
    description: "Completed application in record time",
    icon: <Clock className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("speed_master"),
    points: 25
  },
  {
    id: "multiple_dependents",
    title: "Extended Coverage",
    description: "Added multiple dependents to your policy",
    icon: <UsersRound className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("multiple_dependents"),
    points: 20
  },
  {
    id: "verification",
    title: "Verified Member",
    description: "All your details passed verification",
    icon: <Star className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("verification"),
    points: 15
  },
  {
    id: "perfect_application",
    title: "Perfect Application",
    description: "Completed application with no errors",
    icon: <Award className="h-5 w-5 text-primary-foreground" />,
    unlocked: unlockedAchievements.includes("perfect_application"),
    points: 30
  }
];

// Helper function to get achievements for a specific step
export const getStepAchievements = (step: number, unlockedAchievements: AchievementType[] = []): Achievement[] => {
  const allAchievements = createAchievements(unlockedAchievements);
  
  switch (step) {
    case 1: // Personal details
      return allAchievements.filter(a => a.id === "all_details" || a.id === "complete_step");
    case 2: // Children dependents
    case 3: // Extended family dependents
    case 4: // Spouse details
      return allAchievements.filter(a => 
        a.id === "add_dependent" || 
        a.id === "multiple_dependents" || 
        a.id === "complete_step"
      );
    case 5: // Beneficiary
      return allAchievements.filter(a => a.id === "add_beneficiary" || a.id === "complete_step");
    case 6: // Policy selection
      return allAchievements.filter(a => a.id === "select_plan" || a.id === "complete_step");
    case 7: // Bank details
      return allAchievements.filter(a => 
        a.id === "setup_payment" || 
        a.id === "complete_step" || 
        a.id === "complete_policy" || 
        a.id === "perfect_application" || 
        a.id === "speed_master"
      );
    default:
      return [];
  }
};