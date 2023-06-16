import puppeteer from "puppeteer";

interface NutritionFacts {
  protein: string[];
  totalFat: string[];
  saturatedFat: string[];
  carbohydrate: string[];
  sugars: string[];
  dietaryFibre: string[];
  sodium: string[];
  calories: string[];
  [key: string]: string[];
}

export const scrapePage = async (url: string): Promise<NutritionFacts> => {
  const browser = await puppeteer.launch({
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"
  );
  await page.goto(url);
  let test;

  const nutritionFacts: NutritionFacts = await page.evaluate(() => {
    let nutritionTable = document.querySelector(".nutrition-table");
    let nutritionRows = nutritionTable?.querySelectorAll(".nutrition-row");
    // Mapping table names to property names
    const nameMapping: { [key: string]: string } = {
      energy: "calories",
      protein: "protein",
      fattotal: "totalFat",
      "–saturated": "saturatedFat",
      carbohydrate: "carbohydrate",
      "–sugars": "sugars",
      dietaryfibre: "dietaryFibre",
      sodium: "sodium",
    };

    let facts: NutritionFacts = {
      calories: [],
      protein: [],
      totalFat: [],
      saturatedFat: [],
      carbohydrate: [],
      sugars: [],
      dietaryFibre: [],
      sodium: [],
    };

    nutritionRows?.forEach((row) => {
      let columns = row.querySelectorAll(".nutrition-column");
      let nutrient = columns[0]?.textContent
        ?.trim()
        .toLowerCase()
        .replace(" ", "")
        .replace(",", "");

      let perServing = columns[1]?.textContent?.trim();
      let per100g = columns[2]?.textContent?.trim();
      // Check if the nutrient exists in the mapping and then update the facts object
      if (nutrient && nameMapping.hasOwnProperty(nutrient)) {
        facts[nameMapping[nutrient]] = [perServing || "", per100g || ""];
      }
    });

    return facts;
  });

  await browser.close();
  console.log("nutrition facts", nutritionFacts);
  console.log(nutritionFacts);
  return nutritionFacts;
};
