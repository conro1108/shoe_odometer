import { Shoe, WalkLog } from "@prisma/client";

export type ShoeWithMileage = Shoe & {
  totalMileage: number;
  walkCount: number;
  lastWalkDate: Date | null;
};

export type WalkLogEntry = WalkLog;
