import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Asset from "@/models/Asset";

export async function GET() {
  try {
    await connectToDB();
    const assets = await Asset.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: assets });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDB();
    const body = await request.json();
    const newAsset = await Asset.create(body);
    return NextResponse.json({ success: true, data: newAsset }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectToDB();
    const { id, name, category, serialNumber, status, allocatedTo } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Asset ID required" }, { status: 400 });
    }

    const updated = await Asset.findByIdAndUpdate(
      id,
      { name, category, serialNumber, status, allocatedTo },
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
      return NextResponse.json({ success: false, error: "Asset ID required" }, { status: 400 });
    }

    await Asset.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Asset deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}