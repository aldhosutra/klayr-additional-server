import { LiskService } from "@liskscan/lisk-service-client";
import { DEFAULT_SERVICE } from "./default";

export const serviceURL = process.env.SERVICE_URL ?? DEFAULT_SERVICE;
const ssl = (process.env.SSL ?? "false").toLowerCase() === "true";

export const client = new LiskService({
  url: serviceURL,
  disableTLS: !ssl,
});
