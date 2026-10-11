import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Client from "@/models/Client";

export async function GET() {
  try {
    await connectToDB();
    const clients = await Client.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDB();
    const body = await request.json();
    const newClient = await Client.create(body);
    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectToDB();
    const { id, name, email, phone, company } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 });
    }

    const updated = await Client.findByIdAndUpdate(
      id,
      { name, email, phone, company },
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
      return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 });
    }

    await Client.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}