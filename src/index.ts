import express, { Express, Request, Response } from "express";
import { scrapePage } from "./lib/scrape";

const app: Express = express();
const port = 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, this is Express + TypeScript");
});

app.get("/scrape", async (req: Request, res: Response) => {
  await scrapePage(
    "https://www.woolworths.com.au/shop/productdetails/666237/chicken-sandwich-chicken-sandwich-schnitzel"
  );
  res.send("scraped");
});

app.listen(port, () => {
  console.log(`[Server]: I am running at https://localhost:${port}`);
});

export default app;
