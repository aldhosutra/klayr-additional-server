const { DEFAULT_SERVICE_URL } = require("./default");
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

async function handle(req, res) {
  const result = await fetch(
    `https://${process.env.SERVICE_URL ?? DEFAULT_SERVICE_URL}/api/v3/token/summary`,
  );
  const json = await result.json();
  res.json({
    result: `${json.data.totalSupply[0].amount.slice(
      0,
      json.data.totalSupply[0].amount.length - 8,
    )}.${json.data.totalSupply[0].amount.slice(
      json.data.totalSupply[0].amount.length - 8,
    )}`,
  });
}

app.get("/", handle);

app.listen(PORT, () => {
  console.log(`totalsupply app running on port ${PORT}`);
});
