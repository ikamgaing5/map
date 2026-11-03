import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const link = await prisma.trackingLink.findUnique({
      where: { id },
    });

    if (!link || link.userId !== user.id) {
      return NextResponse.json(
        { error: "Lien introuvable ou accès refusé." },
        { status: 404 }
      );
    }

    await prisma.trackingLink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Lien supprimé avec succès." });
  } catch (error) {
    console.error("Delete link error:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer ce lien." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const link = await prisma.trackingLink.findUnique({
      where: { id },
    });

    if (!link || link.userId !== user.id) {
      return NextResponse.json(
        { error: "Lien introuvable ou accès refusé." },
        { status: 404 }
      );
    }

    const updated = await prisma.trackingLink.update({
      where: { id },
      data: {
        isActive: typeof body.isActive === "boolean" ? body.isActive : link.isActive,
      },
    });

    return NextResponse.json({ success: true, link: updated });
  } catch (error) {
    console.error("Update link error:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le lien." },
      { status: 500 }
    );
  }
}

