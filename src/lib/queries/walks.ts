import { prisma } from "@/lib/prisma";

export async function getWalksByShoe(shoeId: string, userId: string) {
  const shoe = await prisma.shoe.findFirst({ where: { id: shoeId, userId } });
  if (!shoe) throw new Error("Shoe not found or unauthorized");

  return prisma.walkLog.findMany({
    where: { shoeId },
    orderBy: { date: "desc" },
  });
}

export async function createWalk(
  userId: string,
  data: { shoeId: string; miles: number; date: Date; notes?: string }
) {
  const shoe = await prisma.shoe.findFirst({ where: { id: data.shoeId, userId } });
  if (!shoe) throw new Error("Shoe not found or unauthorized");

  return prisma.walkLog.create({
    data: {
      shoeId: data.shoeId,
      userId,
      miles: data.miles,
      date: data.date,
      notes: data.notes,
    },
  });
}

export async function updateWalk(
  walkId: string,
  userId: string,
  data: { miles?: number; date?: Date; notes?: string }
) {
  const walk = await prisma.walkLog.findFirst({ where: { id: walkId, userId } });
  if (!walk) throw new Error("Walk not found or unauthorized");

  return prisma.walkLog.update({ where: { id: walkId }, data });
}

export async function deleteWalk(walkId: string, userId: string) {
  const walk = await prisma.walkLog.findFirst({ where: { id: walkId, userId } });
  if (!walk) throw new Error("Walk not found or unauthorized");

  return prisma.walkLog.delete({ where: { id: walkId } });
}
