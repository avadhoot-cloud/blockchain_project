import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, budget, buyerAddress, sellerAddress } = body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        budget: parseFloat(budget),
        buyerAddress,
        sellerAddress: sellerAddress || null,
        status: "CREATED"
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, rejectionCount, rejectionFeedback, githubUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (rejectionCount !== undefined) updateData.rejectionCount = Number(rejectionCount);
    if (rejectionFeedback !== undefined) updateData.rejectionFeedback = rejectionFeedback;
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl;

    const project = await prisma.project.update({
      where: { id: Number(id) },
      data: updateData
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }

    await prisma.project.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}

