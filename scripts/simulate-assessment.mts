// Simulates synthetic learners of known ability taking the assessment and
// measures how well the engine recovers that ability. Writes
// results/assessment-simulation.json. Deterministic: fixed seeds, no clock in
// the numbers.
//
// This checks the algorithm under its own response model. It does not validate
// the author-assigned difficulty levels against real learners.
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { BANK } from "../src/assessment/bank";
import {
  TEST_LENGTH,
  difficultyToLogit,
  estimate,
  pCorrect,
  progress,
  score,
  seededRandom,
} from "../src/assessment/engine";
import { DOMAINS, type Question, type Response } from "../src/assessment/types";

const LEARNERS_PER_ABILITY = 2000;
const ABILITIES = [-2, -1, 0, 1, 2];

function adaptive(bank: readonly Question[], theta: number, seed: string) {
  const rand = seededRandom(`answers:${seed}`);
  const responses: Response[] = [];
  for (;;) {
    const p = progress(bank, responses, seed);
    if (p.done) return { est: p.estimate, n: responses.length };
    const correct = rand() < pCorrect(theta, difficultyToLogit(p.next!.difficulty));
    responses.push({ questionId: p.next!.id, correct });
  }
}

/** Baseline: the same number of questions, picked at random instead of adaptively. */
function fixedRandom(bank: readonly Question[], theta: number, seed: string) {
  const rand = seededRandom(`baseline:${seed}`);
  const pool = [...bank];
  const items = [];
  for (let i = 0; i < TEST_LENGTH; i++) {
    const [q] = pool.splice(Math.floor(rand() * pool.length), 1);
    const b = difficultyToLogit(q.difficulty);
    items.push({ b, correct: rand() < pCorrect(theta, b) });
  }
  return { est: estimate(items), n: TEST_LENGTH };
}

const round = (x: number, d = 3) => Number(x.toFixed(d));

function summarise(bank: readonly Question[], run: typeof adaptive) {
  const byAbility = ABILITIES.map((theta) => {
    let sum = 0, sq = 0, len = 0, scoreSum = 0, within1 = 0;
    for (let i = 0; i < LEARNERS_PER_ABILITY; i++) {
      const { est, n } = run(bank, theta, `${theta}:${i}`);
      sum += est.theta;
      sq += (est.theta - theta) ** 2;
      len += n;
      scoreSum += score(bank, est).score;
      if (Math.abs(est.theta - theta) <= 1) within1 += 1;
    }
    const N = LEARNERS_PER_ABILITY;
    return {
      trueAbility: theta,
      meanEstimate: round(sum / N),
      bias: round(sum / N - theta),
      rmse: round(Math.sqrt(sq / N)),
      meanQuestions: round(len / N, 2),
      meanScore: round(scoreSum / N, 1),
      withinOneLogit: round(within1 / N),
    };
  });
  const rmse = Math.sqrt(byAbility.reduce((s, r) => s + r.rmse ** 2, 0) / byAbility.length);
  const meanQuestions = byAbility.reduce((s, r) => s + r.meanQuestions, 0) / byAbility.length;
  const withinOneLogit = byAbility.reduce((s, r) => s + r.withinOneLogit, 0) / byAbility.length;
  const monotonic = byAbility.every((r, i) => i === 0 || r.meanEstimate > byAbility[i - 1].meanEstimate);
  return { rmse: round(rmse), withinOneLogit: round(withinOneLogit), meanQuestions: round(meanQuestions, 2), monotonic, byAbility };
}

const domains = Object.fromEntries(
  DOMAINS.map((d) => [
    d,
    { bankSize: BANK[d].length, adaptive: summarise(BANK[d], adaptive), randomBaseline: summarise(BANK[d], fixedRandom) },
  ]),
);

const result = {
  description:
    "Recovery of known ability by the adaptive engine for synthetic learners who answer according to the engine's own 3PL model. Ability is on a logit scale. Not a validation against real learners.",
  baseCommit: execSync("git rev-parse --short HEAD").toString().trim(),
  generatedOn: new Date().toISOString().slice(0, 10),
  config: {
    learnersPerAbility: LEARNERS_PER_ABILITY,
    abilities: ABILITIES,
    testLength: TEST_LENGTH,
  },
  domains,
};

mkdirSync("results", { recursive: true });
writeFileSync("results/assessment-simulation.json", JSON.stringify(result, null, 2) + "\n");

for (const [d, r] of Object.entries(domains)) {
  console.log(
    `${d}: adaptive RMSE ${r.adaptive.rmse}, within one level ${r.adaptive.withinOneLogit}, in ${r.adaptive.meanQuestions} questions | random baseline RMSE ${r.randomBaseline.rmse} in ${r.randomBaseline.meanQuestions}`,
  );
}
console.table(domains.software.adaptive.byAbility);
