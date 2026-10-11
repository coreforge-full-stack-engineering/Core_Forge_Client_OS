import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDB();
    // Never send passwords to the browser
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDB();
    const body = await request.json();

    if (!body.name?.trim() || !body.email?.trim() || !body.password) {
      return NextResponse.json(
        { success: false, error: "Name, email and password are required." },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with that email already exists." },
        { status: 409 }
      );
    }

    const newUser = await User.create({
      name: body.name.trim(),
      email,
      password: body.password,
      role: body.role === "Admin" ? "Admin" : "Normal User",
    });

    const safe = newUser.toObject();
    delete safe.password;
    return NextResponse.json({ success: true, data: safe }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectToDB();
    const { id, name, email, role, password } = await request.json();

    const update = { name, email: email?.trim().toLowerCase(), role };
    // Only change the password if a new one was typed in
    if (password) update.password = password;

    const updatedUser = await User.findByIdAndUpdate(id, update, { new: true }).select("-password");
    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}