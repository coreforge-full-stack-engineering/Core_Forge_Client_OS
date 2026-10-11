import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import mongoose from "mongoose";

// Inline Project Schema to bypass import resolution issues
const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["In Progress", "Completed", "On Hold"], default: "In Progress" },
    client: { type: String, default: "" },
  },
  { timestamps: true }
);

const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);

export async function GET() {
  try {
    await connectToDB();
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDB();
    const body = await request.json();
    const newProject = await Project.create(body);
    return NextResponse.json({ success: true, data: newProject }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectToDB();
    const { id, title, description, status, client } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Project ID required" }, { status: 400 });
    }
    const updated = await Project.findByIdAndUpdate(
      id,
      { title, description, status, client },
      { new: true }
    );
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Project ID required" }, { status: 400 });
    }
    await Project.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}