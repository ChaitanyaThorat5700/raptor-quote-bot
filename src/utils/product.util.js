export const CATEGORIES = [
  {
    id: "tile_fixing",
    name: "Tile Fixing",
    requiredFields: ["area", "tileType", "location"]
  },
  {
    id: "bathroom_renovation",
    name: "Bathroom Renovation",
    requiredFields: ["area", "tileType", "plumbingWork"]
  }
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id);
}
