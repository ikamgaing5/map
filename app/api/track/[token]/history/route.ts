import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateDistance } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const link = await prisma.trackingLink.findUnique({
      where: { token },
      select: { id: true, childName: true },
    });

    if (!link) {
      return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
    }

    // Récupérer les 2000 derniers points enregistrés pour ce lien
    const points = await prisma.locationPoint.findMany({
      where: { linkId: link.id },
      orderBy: { timestamp: "asc" },
      take: 2000,
    });

    // Calcul de la distance totale cumulée
    let totalDistanceMeters = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistanceMeters += calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
    }

    return NextResponse.json({
      childName: link.childName,
      totalPoints: points.length,
      totalDistanceMeters: Math.round(totalDistanceMeters),
      points,
    });
  } catch (error) {
    console.error("History track error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer l'historique" },
      { status: 500 }
    );
  }
}

