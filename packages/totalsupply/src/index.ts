import { DEFAULT_SERVICE_URL } from "./default";
import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

async function handle(_req: Request, res: Response) {
  try {
    const result = await fetch(
      `https://${process.env.SERVICE_URL ?? DEFAULT_SERVICE_URL}/api/v3/token/summary`,
    );
    const json = await result.json();
    const amount = json.data.totalSupply[0].amount;
    const formatted = `${amount.slice(0, amount.length - 8)}.${amount.slice(amount.length - 8)}`;
    res.json({ result: formatted });
  } catch (err) {
    res.status(500).json({ error: (err as { message: string }).message });
  }
}

app.get("/", handle);

app.get("/api/status", (_req, res) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log(`totalsupply app running on port ${PORT}`);
});
