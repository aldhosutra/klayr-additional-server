import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fastifyCron from "fastify-cron";
import fastifyRateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";
import {
  GeneratorsResponse,
  NumberStringAndFromToNumber,
  PoSValidatorsResponse,
} from "@liskscan/lisk-service-client";
import { client } from "./service";
import { DEFAULT_PORT, DEFAULT_SERVICE } from "./default";

type ValidatorStatus =
  | "active"
  | "standby"
  | "punished"
  | "banned"
  | "ineligible"
  | "eligible"
  | "all";

const statuses = [
  "all",
  "active",
  "standby",
  "punished",
  "banned",
  "eligible",
  "ineligible",
] as ValidatorStatus[];

const allUsedBlocks: Record<number, number> = {
  23390991: 1701799340,
};
let allValidatorsCache: PoSValidatorsResponse;
let generatorListCache: GeneratorsResponse;
const validatorFilteredCache: Record<
  ValidatorStatus,
  PoSValidatorsResponse["data"]
> = {
  active: [],
  standby: [],
  punished: [],
  banned: [],
  ineligible: [],
  eligible: [],
  all: [],
};
const rewardsEstimatesCache: Record<
  string,
  {
    blockReward: string;
    dailyReward: string;
    monthlyReward: string;
    yearlyReward: string;
  }
> = {};
let lastRewardsUpdated = 0;

const importNextAllocatedTime = () => {
  validatorFilteredCache.active = validatorFilteredCache.active.map((validator) => ({
    ...validator,
    nextAllocatedTime: generatorListCache?.data?.find(
      (generator) => generator.address === validator.address,
    )?.nextAllocatedTime,
  }));
  validatorFilteredCache.all = validatorFilteredCache.all.map((validator) => ({
    ...validator,
    nextAllocatedTime: generatorListCache?.data?.find(
      (generator) => generator.address === validator.address,
    )?.nextAllocatedTime,
  }));
  validatorFilteredCache.eligible = validatorFilteredCache.eligible.map(
    (validator) => ({
      ...validator,
      nextAllocatedTime: generatorListCache?.data?.find(
        (generator) => generator.address === validator.address,
      )?.nextAllocatedTime,
    }),
  );
};

const getRewardsEstimates = async () => {
  // check if last update was more than 5 minutes ago
  console.log(
    "reward update",
    new Date().getTime() - lastRewardsUpdated,
    new Date().getTime() - lastRewardsUpdated > 300000,
  );
  if (new Date().getTime() - lastRewardsUpdated > 300000) {
    const serviceUrl = process.env.SERVICE_URL ?? DEFAULT_SERVICE;
    for (const validator of allValidatorsCache.data) {
      // if (BigInt(validator.validatorWeight) < BigInt(100000000000)) {
      //   rewardsEstimatesCache[validator.address] = {
      //     blockReward: "0",
      //     dailyReward: "0",
      //     monthlyReward: "0",
      //     yearlyReward: "0",
      //   };
      //   continue;
      // }
      const rewards = await fetch(`http://${serviceUrl}/api/v3/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "dynamicReward_getExpectedValidatorRewards",
          params: {
            validatorAddress: validator.address,
          },
        }),
      });
      const rewardsJson = await rewards.json();
      if (rewardsJson.data) {
        rewardsEstimatesCache[validator.address] = rewardsJson.data;
      }
      if (!rewardsEstimatesCache[validator.address]) {
        rewardsEstimatesCache[validator.address] = {
          blockReward: "0",
          dailyReward: "0",
          monthlyReward: "0",
          yearlyReward: "0",
        };
      }
    }
    lastRewardsUpdated = new Date().getTime();
  }
};

const insertRewardsEstimates = () => {
  // for (const validator of validatorFilteredCache.eligible) {
  // statuses.forEach((status) => {
  // const index = validatorFilteredCache[status].findIndex(
  //   (val) => val.address === validator.address,
  // );
  // if (index === -1) {
  //   // console.log("Validator not found", index, validator.address);
  //
  //   return;
  // }
  // console.log(rewardsEstimatesCache[validator.address]);

  // eslint-disable-next-line @typescript-eslint/no-for-in-array,guard-for-in,no-restricted-syntax
  for (const index in allValidatorsCache.data) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    allValidatorsCache.data[index].rewards =
      rewardsEstimatesCache[allValidatorsCache.data[index].address];
  }
  // });
  // }
};

const importLastCommissionIncreaseTime = async () => {
  // eslint-disable-next-line @typescript-eslint/no-for-in-array,guard-for-in,no-restricted-syntax
  for (const index in allValidatorsCache.data) {
    const validator = allValidatorsCache.data[index];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    validator.lastCommissionIncreaseTimestamp =
      allUsedBlocks[validator.lastCommissionIncreaseHeight];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (!validator.lastCommissionIncreaseTimestamp) {
      const block = await client.rpc("get.blocks", {
        height:
          validator.lastCommissionIncreaseHeight.toString() as NumberStringAndFromToNumber,
      });
      if (block.status === "success" && block.data.length > 0) {
        console.log(`New block indexed ${block.data[0].height}`);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        validator.lastCommissionIncreaseTimestamp = block.data[0].timestamp;
        allUsedBlocks[validator.lastCommissionIncreaseHeight] =
          block.data[0].timestamp;
      }
    }
    allValidatorsCache.data[index] = validator;
  }
};

const updateValidatorsCache = async () => {
  const validators = await client.rpc("get.pos.validators", {
    limit: 10000,
    offset: 0,
  });
  if (validators.status === "success") {
    allValidatorsCache = validators;
    await importLastCommissionIncreaseTime();
    await getRewardsEstimates();
    insertRewardsEstimates();
    statuses.forEach((status) => {
      validatorFilteredCache[status] = validators.data.filter((validator) => {
        if (status === "eligible") {
          return (
            validator.status === "active" ||
            (BigInt(validator.validatorWeight) >= BigInt(100000000000) &&
              validator.status === "standby")
          );
        }
        return status === "all" || validator.status === status;
      });
    });
    importNextAllocatedTime();
  }
};

async function main() {
  const fastify = Fastify({
    logger: false,
  });
  await fastify.register(cors, {
    methods: ["GET"],
    origin: "*",
    // put your options here
  });
  client.subscribe("update.generators", async (data) => {
    generatorListCache = data;
    importNextAllocatedTime();
  });

  await fastify.register(fastifyRateLimit, {
    max: 200,
    timeWindow: "10s",
  });

  await fastify.register(fastifyCron, {
    jobs: [
      {
        cronTime: "*/30 * * * * *",
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onTick: updateValidatorsCache,
        start: true,
      },
    ],
  });

  fastify.get(
    "/validators",
    async (_request: FastifyRequest, _reply: FastifyReply) =>
      validatorFilteredCache.all,
  );

  fastify.get(
    "/generators",
    async (_request: FastifyRequest, _reply: FastifyReply) => generatorListCache,
  );

  fastify.get(
    "/validators/:status",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { status } = request.params as { status: ValidatorStatus };

      return validatorFilteredCache[status] || {};
    },
  );

  fastify.get(
    "/validators/stats",
    async (_request: FastifyRequest, _reply: FastifyReply) => ({
      active: validatorFilteredCache.active.length,
      standby: validatorFilteredCache.standby.length,
      punished: validatorFilteredCache.punished.length,
      banned: validatorFilteredCache.banned.length,
      ineligible: validatorFilteredCache.ineligible.length,
      eligible: validatorFilteredCache.eligible.length,
    }),
  );

  fastify.get(
    "/validator/rewards/:address",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { address } = request.params as { address: string };
      const validator = allValidatorsCache.data.find((v) => v.address === address);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return validator?.rewards || {};
    },
  );
  fastify.get(
    "/validator/rewards/multi/:addresses",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { addresses } = request.params as { addresses: string };
      const addressList = addresses.split(",");
      const list: Record<
        string,
        {
          blockReward: string;
          dailyReward: string;
          monthlyReward: string;
          yearlyReward: string;
        }
      > = {};
      for (const address of addressList) {
        const validator = allValidatorsCache.data.find((v) => v.address === address);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        list[address] = validator?.rewards || {
          blockReward: "0",
          dailyReward: "0",
          monthlyReward: "0",
          yearlyReward: "0",
        };
      }

      return list || {};
    },
  );

  fastify.get(
    "/validator/:address",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { address } = request.params as { address: string };
      // const validator = await client.rpc("get.pos.validators", {
      //   address,
      //   limit: 1,
      //   offset: 0,
      // });
      return allValidatorsCache.data.find((v) => v.address === address) || {};
      // return validator;
      // }
      // return {};
    },
  );

  // Run the server!
  try {
    await fastify.listen({
      host: "0.0.0.0",
      port: process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT,
    });
    fastify.cron.startAllJobs();
    console.log("Server started");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// eslint-disable-next-line no-void
void main();
