import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Document from "@/models/Document";

// GET Endpoint: Fetch all uploaded documents
export async function GET() {
  try {
    await connectToDB();
    const docs = await Document.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: docs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST Endpoint: Upload/Log new document record into MongoDB
export async function POST(request) {
  try {
    await connectToDB();
    const body = await request.json();

    const newDoc = await Document.create({
      title: body.title,
      category: body.category || "Internal Brief",
      clientName: body.clientName || "General Operations",
      fileUrl: body.fileUrl || "#",
    });

    return NextResponse.json({ success: true, data: newDoc }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}