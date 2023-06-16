import puppeteer from "puppeteer";
import { convertKjToKcal } from "../util";

interface NutritionFacts {
  calories: number;
  protein: number;
  totalFat: number;
  saturatedFat: number;
  carbohydrate: number;
  sugars: number;
  dietaryFibre: number;
  sodium: number;
}

export const scrapePage = async (url: string): Promise<NutritionFacts[]> => {
  const browser = await puppeteer.launch({
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"
  );
  await page.goto(url);

  const nutritionFacts: NutritionFacts[] = await page.evaluate(() => {
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
    let factsPerServing: NutritionFacts = {
      calories: 0,
      protein: 0,
      totalFat: 0,
      saturatedFat: 0,
      carbohydrate: 0,
      sugars: 0,
      dietaryFibre: 0,
      sodium: 0,
    };

    let factsPer100g: NutritionFacts = {
      calories: 0,
      protein: 0,
      totalFat: 0,
      saturatedFat: 0,
      carbohydrate: 0,
      sugars: 0,
      dietaryFibre: 0,
      sodium: 0,
    };
    nutritionRows?.forEach((row) => {
      let columns = row.querySelectorAll(".nutrition-column");
      let nutrient = columns[0].textContent
        ?.trim()
        .toLowerCase()
        .replace(/ /g, "")
        .replace(",", "");
      let perServing = parseFloat(columns[1].textContent?.trim() || "0");
      let per100g = parseFloat(columns[2].textContent?.trim() || "0");

      if (nutrient && nameMapping.hasOwnProperty(nutrient)) {
        factsPerServing[nameMapping[nutrient] as keyof NutritionFacts] =
          perServing;
        factsPer100g[nameMapping[nutrient] as keyof NutritionFacts] = per100g;
      }
    });

    return [factsPerServing, factsPer100g];
  });
  await browser.close();
  nutritionFacts.forEach((facts) => {
    facts.calories = convertKjToKcal(facts.calories);
  });
  console.log(nutritionFacts);
  return nutritionFacts;
};
