export function calculateEstimate(category, data) {
  let baseRate = 0;

  if (category.id === "tile_fixing") {
    baseRate = data.tileType === "marble" ? 150 :
               data.tileType === "vitrified" ? 120 : 90;
  }

  if (category.id === "bathroom_renovation") {
    baseRate = 200;
    if (data.plumbingWork === "yes") baseRate += 50;
  }

  return data.area * baseRate;
}
