import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

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
  const cookieStore = cookies();
  const token = cookieStore.get("lifetrack_session")?.value;
  
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
    return user;
  } catch (error) {
    return null;
  }
}
