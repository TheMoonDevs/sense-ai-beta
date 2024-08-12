import { object, string, TypeOf } from "zod";

export const ConfigSchema = object({
  configId: string(),
  configType: string(),
  configApp: string().optional(),
  configData: object({}).optional(),
});
