import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export const getCurrentUser = cache(async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUserId },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
    },
    create: {
      clerkId: clerkUserId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      displayName: clerkUser.firstName
        ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
        : null,
    },
  });

  return user;
});
