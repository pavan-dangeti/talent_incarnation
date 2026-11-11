import type { Domain, Question } from "../types";
import { dataAi } from "./data-ai";
import { software } from "./software";
import { uiUx } from "./ui-ux";

export const BANK: Record<Domain, readonly Question[]> = {
  software,
  "data-ai": dataAi,
  "ui-ux": uiUx,
};
