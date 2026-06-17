// Popular US restaurant chains and widely recognized dining brands
const US_RESTAURANTS = [
  "Applebee's",
  "Arby's",
  "Au Bon Pain",
  "Bahama Breeze",
  "Baja Fresh",
  "Baskin-Robbins",
  "Benihana",
  "BJ's Restaurant & Brewhouse",
  "Blaze Pizza",
  "Bojangles",
  "Bonefish Grill",
  "Boston Market",
  "Buffalo Wild Wings",
  "Burger King",
  "Cafe Rio",
  "California Pizza Kitchen",
  "Captain D's",
  "Caribou Coffee",
  "Carl's Jr.",
  "Carrabba's Italian Grill",
  "Cava",
  "Checkers",
  "The Cheesecake Factory",
  "Chick-fil-A",
  "Chicken Express",
  "Chili's",
  "Chipotle",
  "Church's Chicken",
  "Cinnabon",
  "Cold Stone Creamery",
  "Cook Out",
  "Corner Bakery Cafe",
  "Costa Vida",
  "Cracker Barrel",
  "Culver's",
  "Dairy Queen",
  "Dave & Buster's",
  "Del Taco",
  "Denny's",
  "Domino's",
  "Dunkin'",
  "Einstein Bros. Bagels",
  "El Pollo Loco",
  "Fazoli's",
  "Firehouse Subs",
  "Five Guys",
  "Freddy's Frozen Custard",
  "Golden Corral",
  "Great American Cookies",
  "Hardee's",
  "Hooters",
  "Huddle House",
  "IHOP",
  "In-N-Out Burger",
  "Jack in the Box",
  "Jason's Deli",
  "Jersey Mike's Subs",
  "Jimmy John's",
  "Joe's Crab Shack",
  "KFC",
  "Krispy Kreme",
  "Krystal",
  "La Madeleine",
  "Little Caesars",
  "LongHorn Steakhouse",
  "Maggiano's Little Italy",
  "Marco's Pizza",
  "McAlister's Deli",
  "McDonald's",
  "Mellow Mushroom",
  "Moe's Southwest Grill",
  "Mooyah Burgers",
  "Mortons The Steakhouse",
  "Nando's",
  "Noodles & Company",
  "O'Charley's",
  "Olive Garden",
  "On the Border",
  "Outback Steakhouse",
  "P.F. Chang's",
  "Panda Express",
  "Panera Bread",
  "Papa John's",
  "Papa Murphy's",
  "Peet's Coffee",
  "Pei Wei Asian Kitchen",
  "Perkins Restaurant & Bakery",
  "Peter Piper Pizza",
  "Pizza Hut",
  "Pizza Inn",
  "Pollo Tropical",
  "Popeyes",
  "Potbelly Sandwich Shop",
  "Qdoba",
  "Quiznos",
  "Raising Cane's",
  "Rally's",
  "Red Lobster",
  "Red Robin",
  "Romano's Macaroni Grill",
  "Round Table Pizza",
  "Ruby Tuesday",
  "Ruth's Chris Steak House",
  "Saladworks",
  "Schlotzsky's",
  "Shake Shack",
  "Shoney's",
  "Smashburger",
  "Smoothie King",
  "Sonic Drive-In",
  "Starbucks",
  "Steak 'n Shake",
  "Subway",
  "Sweetgreen",
  "Taco Bell",
  "Taco Cabana",
  "Taco John's",
  "Texas Roadhouse",
  "TGI Fridays",
  "The Habit Burger Grill",
  "Tim Hortons",
  "Torchy's Tacos",
  "Twin Peaks",
  "Waffle House",
  "Wendy's",
  "Whataburger",
  "Which Wich",
  "White Castle",
  "Wingstop",
  "Yard House",
  "Zaxby's",
  "Zoe's Kitchen",
];

const POPULAR_RESTAURANTS = [
  "Chipotle",
  "McDonald's",
  "Starbucks",
  "Chick-fil-A",
  "Olive Garden",
  "Panera Bread",
  "Taco Bell",
  "The Cheesecake Factory",
  "In-N-Out Burger",
  "Shake Shack",
];

export function getUSRestaurants(): string[] {
  return US_RESTAURANTS;
}

export function getPopularRestaurants(limit = 8): string[] {
  return POPULAR_RESTAURANTS.slice(0, limit);
}

export function mergeRestaurantSuggestions(
  ...lists: string[][]
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const list of lists) {
    for (const name of list) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(trimmed);
    }
  }

  return result;
}

export function searchUSRestaurants(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches = US_RESTAURANTS.filter((name) => name.toLowerCase().includes(q));

  matches.sort((a, b) => rankMatch(a, q) - rankMatch(b, q) || a.localeCompare(b));

  return matches.slice(0, limit);
}

function rankMatch(name: string, q: string) {
  const lower = name.toLowerCase();
  if (lower.startsWith(q)) return 0;
  if (lower.split(/\s+/).some((word) => word.startsWith(q))) return 1;
  return 2;
}
