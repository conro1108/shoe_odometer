import { prisma } from "@/lib/prisma";
import type { ShoeWithMileage } from "@/lib/types";

export async function getShoesByUser(userId: string): Promise<ShoeWithMileage[]> {
  const [shoes, stats] = await Promise.all([
    prisma.shoe.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.walkLog.groupBy({
      by: ["shoeId"],
      where: { shoe: { userId } },
      _sum: { miles: true },
      _count: true,
      _max: { date: true },
    }),
  ]);

  const statsMap = new Map(stats.map((s) => [s.shoeId, s]));

  return shoes.map((shoe) => {
    const stat = statsMap.get(shoe.id);
    return {
      ...shoe,
      totalMileage: shoe.startingMileage + (stat?._sum.miles ?? 0),
      walkCount: stat?._count ?? 0,
      lastWalkDate: stat?._max.date ?? null,
    };
  });
}

export async function getShoeDetail(shoeId: string, userId: string): Promise<ShoeWithMileage | null> {
  const [shoe, stat] = await Promise.all([
    prisma.shoe.findFirst({ where: { id: shoeId, userId } }),
    prisma.walkLog.aggregate({
      where: { shoeId, shoe: { userId } },
      _sum: { miles: true },
      _count: true,
      _max: { date: true },
    }),
  ]);

  if (!shoe) return null;

  return {
    ...shoe,
    totalMileage: shoe.startingMileage + (stat._sum.miles ?? 0),
    walkCount: stat._count,
    lastWalkDate: stat._max.date ?? null,
  };
}

export async function createShoe(
  userId: string,
  data: { name: string; brand: string; photoUrl?: string; startingMileage?: number }
) {
  return prisma.shoe.create({
    data: {
      userId,
      name: data.name,
      brand: data.brand,
      photoUrl: data.photoUrl,
      startingMileage: data.startingMileage ?? 0,
    },
  });
}

export async function updateShoe(
  shoeId: string,
  userId: string,
  data: { name?: string; brand?: string; photoUrl?: string; startingMileage?: number }
) {
  const shoe = await prisma.shoe.findFirst({ where: { id: shoeId, userId } });
  if (!shoe) throw new Error("Shoe not found or unauthorized");

  return prisma.shoe.update({ where: { id: shoeId }, data });
}

export async function deleteShoe(shoeId: string, userId: string) {
  const shoe = await prisma.shoe.findFirst({ where: { id: shoeId, userId } });
  if (!shoe) throw new Error("Shoe not found or unauthorized");

  return prisma.shoe.delete({ where: { id: shoeId } });
}

export async function retireShoe(shoeId: string, userId: string) {
  const shoe = await prisma.shoe.findFirst({ where: { id: shoeId, userId } });
  if (!shoe) throw new Error("Shoe not found or unauthorized");

  return prisma.shoe.update({ where: { id: shoeId }, data: { retiredAt: new Date() } });
}

export async function unretireShoe(shoeId: string, userId: string) {
  const shoe = await prisma.shoe.findFirst({ where: { id: shoeId, userId } });
  if (!shoe) throw new Error("Shoe not found or unauthorized");

  return prisma.shoe.update({ where: { id: shoeId }, data: { retiredAt: null } });
}
