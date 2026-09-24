import { parseNewBusinessHomeData } from "../newBusinessValidation";
import type { NewBusinessHomeData } from "../newBusinessTypes";

export async function getNewBusinessHomeData(signal: AbortSignal): Promise<NewBusinessHomeData> {
  const response = await fetch("/api/home/summary", { cache: "no-store", credentials: "same-origin", signal });
  if (!response.ok) throw new Error(`home_summary_${response.status}`);
  const parsed = parseNewBusinessHomeData(await response.json());
  if (!parsed) throw new Error("invalid_home_summary");
  return parsed;
}
