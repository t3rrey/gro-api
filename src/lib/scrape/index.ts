import puppeteer from "puppeteer";
import { convertKjToKcal } from "../util";

interface NutritionFacts {
  servingSize: number;
  calories: number;
  protein: number;
  totalFat: number;
  saturatedFat: number;
  carbohydrate: number;
  sugars: number;
  dietaryFibre: number;
  sodium: number;
}

interface NewFood {
  name: string;
  nutritionFacts: NutritionFacts[];
}

export const scrapePage = async (url: string): Promise<NewFood | undefined> => {
  const browser = await puppeteer.launch({
    defaultViewport: null,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/113.0"
  );

  await page.goto(url);

  if (page.url().includes("woolworths.com.au")) {
    const foodName = await page.title().then((title) => {
      return title.split(" | ")[0];
    });
    const nutritionFacts: NutritionFacts[] = await page.evaluate(() => {
      let nutritionTable = document.querySelector(".nutrition-table");
      let nutritionRows = nutritionTable?.querySelectorAll(".nutrition-row");

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
        servingSize: 0,
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
        servingSize: 100,
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
    const servingSizeElementHandle = await page.$x(
      "//div[contains(@*,'productServingSize')]"
    );

    let servingSizeElement = servingSizeElementHandle[0];
    let servingSizeText = await page.evaluate(
      (el) => el.textContent,
      servingSizeElement
    );
    let servingSize = parseFloat(
      servingSizeText?.replace(/[^\d.]/g, "") || "0"
    );
    await browser.close();
    nutritionFacts.forEach((facts) => {
      facts.calories = convertKjToKcal(facts.calories);
    });
    nutritionFacts[0].servingSize = servingSize;
    const newFood = {
      name: foodName,
      nutritionFacts: nutritionFacts,
    };
    console.log(newFood);
    return newFood;
  } else if (page.url().includes("coles.com.au")) {
    const nutritionFacts = await page.evaluate((): NutritionFacts => {
      const tableRowElements = Array.from(
        document.querySelectorAll(
          ".sc-25c45942-0.juaCfV.coles-targeting-TableTableRowRowContainer"
        )
      );

      const mapping: { [key: string]: string } = {
        Energy: "calories",
        Protein: "protein",
        "Total Fat": "totalFat",
        "Saturated Fat": "saturatedFat",
        Carbohydrate: "carbohydrates",
        Sugars: "sugars",
        Sodium: "sodium",
        "Dietary Fibre (total)": "dietaryFibre",
      };

      const nutritionFacts: Partial<NutritionFacts> = {};

      return nutritionFacts as NutritionFacts;
    });

    await browser.close();

    const newFood = {
      name: "coles",
      nutritionFacts: [nutritionFacts],
    };

    return newFood;
  } else return undefined;
};
