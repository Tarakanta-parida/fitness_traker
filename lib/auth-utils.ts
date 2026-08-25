import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { auth, currentUser } from "@clerk/nextjs/server";

const JWT_SECRET = process.env.JWT_SECRET || "lifetrack-super-secret-key-change-in-production";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch (error) {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    // Check if the user exists in our DB linked by clerkId
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        gender: true,
        height: true,
        weight: true,
        goal: true,
        budget: true,
        isOnboarded: true,
        createdAt: true,
        stepsTarget: true,
        sleepTarget: true,
      },
    });

    // If not found, attempt a lazy auto-registration from Clerk details
    if (!user) {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User";

        // Check if a user with this email already exists but lacks clerkId
        const existingByEmail = await prisma.user.findUnique({
          where: { email: primaryEmail },
        });

        if (existingByEmail) {
          // Link existing email user to Clerk
          user = await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { clerkId: userId },
            select: {
              id: true,
              name: true,
              email: true,
              age: true,
              gender: true,
              height: true,
              weight: true,
              goal: true,
              budget: true,
              isOnboarded: true,
              createdAt: true,
              stepsTarget: true,
              sleepTarget: true,
            },
          });
        } else {
          // Create new user record
          user = await prisma.user.create({
            data: {
              name,
              email: primaryEmail,
              clerkId: userId,
              isOnboarded: true,
              age: 28,
              gender: "male",
              height: 175.0,
              weight: 70.0,
              goal: "FITNESS",
              budget: 1400.0,
              stepsTarget: 10000,
              sleepTarget: 8.0,
            },
            select: {
              id: true,
              name: true,
              email: true,
              age: true,
              gender: true,
              height: true,
              weight: true,
              goal: true,
              budget: true,
              isOnboarded: true,
              createdAt: true,
              stepsTarget: true,
              sleepTarget: true,
            },
          });
        }
      }
    }

    return user;
  } catch (error) {
    console.error("Clerk session resolution error:", error);
    return null;
  }
}
