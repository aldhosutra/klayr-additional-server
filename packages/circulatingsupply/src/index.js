const { DEFAULT_SERVICE_URL } = require("./default");
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3001;

const addresses = [
  "klyqsrqs9b3fgf2wgz2ese5kayrjyozqsk6axar5z",
  "klys9kayrm6z46c5rzdoyq39cxd6dum2kv2bangc7",
  "kly9gw3bwpxt6hx6rautnqhym2em7h8mvkayr9b5o",
  "kly7hrst59kayryo5xz2oz9k8tnbrkjwfforxtkvh",
  "kly9orjkk8gfmqwpfw4akayr999438fpjscdv7dfa",
  "kly5gg3nguuvzpv5hp2xcp6tkayrx4opk29s4jbrd",
  "kly4za3scbovketqoz2kayrbhbzj4j64ordanu9dx",
  "kly5fkayradkwycn3d5cdnhc3rce5y2wj75uogw6n",
  "klyjmn8fm98of92oz323xd2fspsycf5u95hbay9su",
  "klyu9hw585j9fcod9ca5qxeffukhd29pyh9drrzhf",
  "klykjsqffptdvc93bc5kfk5qcrpwx6vcb94d68nc4",
  "klykre4xjbhuk4d3ag3k5kyfmp4zzsr4o6eusux4f",
];
let resultCache = "";

async function cache() {
  const result = await fetch(
    `https://${process.env.SERVICE_URL ?? DEFAULT_SERVICE_URL}/api/v3/token/summary`,
  );
  const json = await result.json();
  const totalSupply = BigInt(json.data.totalSupply[0].amount);
  let nonCirculating = BigInt(0);
  for (const address of addresses) {
    nonCirculating += await getBalance(address);
  }
  const circulatingSupply = (totalSupply - nonCirculating).toString();
  resultCache = `${circulatingSupply.slice(0, circulatingSupply.length - 8)}.${circulatingSupply.slice(circulatingSupply.length - 8)}`;
}

async function getBalance(address) {
  const result = await fetch(
    `https://${process.env.SERVICE_URL ?? DEFAULT_SERVICE_URL}/api/v3/token/balances?address=${address}`,
  );
  const json = await result.json();
  const amount = BigInt(json.data[0].availableBalance);
  const locked = BigInt(json.data[0].lockedBalances?.[0]?.amount ?? "0");
  return amount + locked;
}

async function handle(req, res) {
  cache();
  res.json({ result: resultCache });
}

app.get("/", handle);

app.listen(PORT, () => {
  console.log(`circulatingsupply app running on port ${PORT}`);
});
