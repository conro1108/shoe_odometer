import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export const getCurrentUser = cache(async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  // Fast path: skip the Clerk user API call for returning users
  const existing = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (existing) return existing;

  // First visit: hydrate from Clerk and create the user
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  try {
    return await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        displayName: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
          : null,
      },
    });
  } catch (e: unknown) {
    // Another concurrent request already created the user — just return it
    if ((e as { code?: string }).code === "P2002") {
      const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
      if (user) return user;
    }
    throw e;
  }
});
