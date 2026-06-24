import { isOfficialAccountUsername } from "@/lib/profile-verified";

export interface PlateTier {
  name: string;
  color: string;
  description: string;
}

export function getPlateTier(
  averageScore: number,
  totalPlates: number,
  username?: string | null
): PlateTier {
  if (totalPlates === 0) {
    return {
      name: "Newcomer",
      color: "#6b7280",
      description: "Post a plate to earn your title",
    };
  }

  if (averageScore >= 9 && isOfficialAccountUsername(username)) {
    return {
      name: "Elite Foodie",
      color: "#ff4d4d",
      description: "Top 1%. The feed bows down",
    };
  }

  if (averageScore >= 8) {
    return {
      name: "Gourmet Chaser",
      color: "#ff4d4d",
      description: "Always hunting the next great plate",
    };
  }

  if (averageScore >= 7) {
    return {
      name: "Certified Heat",
      color: "#f59e0b",
      description: "Consistently serving looks and flavor",
    };
  }

  if (averageScore >= 6) {
    return {
      name: "Solid Eater",
      color: "#f59e0b",
      description: "Above average. Keep climbing",
    };
  }

  if (averageScore >= 4) {
    return {
      name: "Midplate Muncher",
      color: "#6b7280",
      description: "Room to level up your plate game",
    };
  }

  if (averageScore >= 2) {
    return {
      name: "Down Bad Dining",
      color: "#4b5563",
      description: "The struggle plate is real",
    };
  }

  return {
    name: "Kitchen Disaster",
    color: "#374151",
    description: "Delete the app. Just kidding. Post again.",
  };
}
