import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type UserAvatarProps = {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  const fallbackText = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  };

  const fontSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-md",
    xl: "text-lg",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ''}`}>
      <AvatarImage src={src} alt={name || "User"} />
      <AvatarFallback className="bg-primary-50 text-primary">
        {!name ? <User className={iconSizes[size]} /> : <span className={fontSizes[size]}>{fallbackText}</span>}
      </AvatarFallback>
    </Avatar>
  );
}