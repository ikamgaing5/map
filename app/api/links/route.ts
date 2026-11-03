import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const links = await prisma.trackingLink.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { locations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const formattedLinks = links.map((link) => {
      const isExpired = new Date(link.expiresAt) < now;
      const effectiveActive = link.isActive && !isExpired;

      return {
        ...link,
        isExpired,
        effectiveActive,
        locationCount: link._count.locations,
      };
    });

    return NextResponse.json({ links: formattedLinks });
  } catch (error) {
    console.error("Fetch links error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les liens de suivi." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { childName, durationHours = 4, pinCode } = await request.json();

    if (!childName || childName.trim().length === 0) {
      return NextResponse.json(
        { error: "Veuillez indiquer le prénom de l'enfant." },
        { status: 400 }
      );
    }

    // Cryptographically secure token (64 hex chars)
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiration date
    const hours = Math.max(1, Math.min(Number(durationHours) || 4, 720)); // entre 1h et 30 jours
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const newLink = await prisma.trackingLink.create({
      data: {
        token,
        childName: childName.trim(),
        pinCode: pinCode && pinCode.trim() ? pinCode.trim() : null,
        userId: user.id,
        expiresAt,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      link: newLink,
    });
  } catch (error) {
    console.error("Create link error:", error);
    return NextResponse.json(
      { error: "Impossible de créer le lien de suivi." },
      { status: 500 }
    );
  }
}

