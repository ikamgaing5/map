import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const link = await prisma.trackingLink.findUnique({
      where: { token },
      select: {
        id: true,
        childName: true,
        isActive: true,
        expiresAt: true,
        pinCode: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Ce lien de suivi est invalide ou n'existe plus." },
        { status: 404 }
      );
    }

    const isExpired = new Date(link.expiresAt) < new Date();
    if (isExpired) {
      return NextResponse.json(
        { error: "Ce lien de suivi a expiré." },
        { status: 410 }
      );
    }

    if (!link.isActive) {
      return NextResponse.json(
        { error: "Ce lien de suivi a été désactivé par le parent." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      childName: link.childName,
      parentName: link.user.name,
      requiresPin: Boolean(link.pinCode),
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    console.error("Validate token error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du lien." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();
    const {
      pin,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      altitude,
      batteryLevel,
      isCharging,
    } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Coordonnées GPS invalides." },
        { status: 400 }
      );
    }

    const link = await prisma.trackingLink.findUnique({
      where: { token },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Lien de suivi invalide." },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date(link.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Le lien a expiré." },
        { status: 410 }
      );
    }

    // Check if active
    if (!link.isActive) {
      return NextResponse.json(
        { error: "Le suivi est actuellement désactivé." },
        { status: 403 }
      );
    }

    // Check PIN if required
    if (link.pinCode && link.pinCode !== pin) {
      return NextResponse.json(
        { error: "Code PIN incorrect." },
        { status: 401 }
      );
    }

    const now = new Date();

    // 1. Create LocationPoint
    await prisma.locationPoint.create({
      data: {
        linkId: link.id,
        latitude,
        longitude,
        accuracy: typeof accuracy === "number" ? accuracy : null,
        speed: typeof speed === "number" ? speed : null,
        heading: typeof heading === "number" ? heading : null,
        altitude: typeof altitude === "number" ? altitude : null,
        batteryLevel: typeof batteryLevel === "number" ? Math.round(batteryLevel) : null,
        isCharging: typeof isCharging === "boolean" ? isCharging : null,
        timestamp: now,
      },
    });

    // 2. Update TrackingLink state
    await prisma.trackingLink.update({
      where: { id: link.id },
      data: {
        lastLat: latitude,
        lastLng: longitude,
        lastAccuracy: accuracy,
        lastSpeed: speed,
        lastHeading: heading,
        lastBattery: typeof batteryLevel === "number" ? Math.round(batteryLevel) : link.lastBattery,
        isCharging: typeof isCharging === "boolean" ? isCharging : link.isCharging,
        lastSeen: now,
      },
    });

    return NextResponse.json({
      success: true,
      receivedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Ingest location error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la position." },
      { status: 500 }
    );
  }
}

