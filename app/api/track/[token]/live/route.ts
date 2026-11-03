import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const link = await prisma.trackingLink.findUnique({
      where: { token },
      include: {
        _count: {
          select: { locations: true },
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Lien non trouvé" }, { status: 404 });
    }

    const isExpired = new Date(link.expiresAt) < new Date();

    return NextResponse.json({
      id: link.id,
      childName: link.childName,
      isActive: link.isActive,
      isExpired,
      lastLat: link.lastLat,
      lastLng: link.lastLng,
      lastAccuracy: link.lastAccuracy,
      lastSpeed: link.lastSpeed,
      lastHeading: link.lastHeading,
      lastBattery: link.lastBattery,
      isCharging: link.isCharging,
      lastSeen: link.lastSeen,
      totalPoints: link._count.locations,
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    console.error("Live track error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

