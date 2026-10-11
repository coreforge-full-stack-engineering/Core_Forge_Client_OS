import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Message from "../../../models/Message";
import User from "@/models/User";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail")?.trim();
    const peerEmail = searchParams.get("peerEmail")?.trim();

    if (!userEmail) {
      return NextResponse.json({ success: false, error: "userEmail required" }, { status: 400 });
    }

    const me = userEmail.toLowerCase();

    // 0. Conversation list: only people this user has actually chatted with
    if (searchParams.get("conversations") === "true") {
      const mine = new RegExp(`^${escapeRegex(userEmail)}$`, "i");
      const all = await Message.find({
        hiddenFor: { $ne: me },$or: [{ senderEmail: { $regex: mine } }, { recipientEmail: {$regex: mine } }],
      }).sort({ createdAt: -1 });

      const map = new Map();
      for (const m of all) {
        const sentByMe = m.senderEmail.toLowerCase() === me;
        const peer = (sentByMe ? m.recipientEmail : m.senderEmail).toLowerCase();
        if (!map.has(peer)) {
          map.set(peer, {
            email: peer,
            name: sentByMe ? null : m.senderName,
            lastMessage: m.content,
            lastAt: m.createdAt,
            unread: 0,
          });
        }
        const entry = map.get(peer);
        if (!entry.name && !sentByMe) entry.name = m.senderName;
        if (!sentByMe && !m.read) entry.unread += 1;
      }

      // Fill in real names / roles from the users collection
      const peerEmails = [...map.keys()];
      const users = await User.find({ email: { $in: peerEmails } }).select("name email role");
      for (const u of users) {
        const entry = map.get(u.email.toLowerCase());
        if (entry) {
          entry.name = u.name;
          entry.role = u.role;
        }
      }
      for (const entry of map.values()) {
        if (!entry.name) entry.name = entry.email.split("@")[0];
      }

      return NextResponse.json({ success: true, data: [...map.values()] });
    }

    // 1. Thread Retrieval (Case-Insensitive Regex)
    if (peerEmail) {
      const history = await Message.find({
        hiddenFor: { $ne: me },$or: [
          {
            senderEmail: { $regex: new RegExp(`^${escapeRegex(userEmail)}$`, "i") },
            recipientEmail: { $regex: new RegExp(`^${escapeRegex(peerEmail)}$`, "i") },
          },
          {
            senderEmail: { $regex: new RegExp(`^${escapeRegex(peerEmail)}$`, "i") },
            recipientEmail: { $regex: new RegExp(`^${escapeRegex(userEmail)}$`, "i") },
          },
        ],
      }).sort({ createdAt: 1 });

      // Mark incoming unread messages as read
      await Message.updateMany(
        {
          senderEmail: { $regex: new RegExp(`^${escapeRegex(peerEmail)}$`, "i") },
          recipientEmail: { $regex: new RegExp(`^${escapeRegex(userEmail)}$`, "i") },
          read: false,
        },
        { $set: { read: true } }
      );

      return NextResponse.json({ success: true, data: history });
    }

    // 2. Unread Badge Count
    const unreadCount = await Message.countDocuments({
      hiddenFor: { $ne: me },
      recipientEmail: { $regex: new RegExp(`^${escapeRegex(userEmail)}$`, "i") },
      read: false,
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDB();
    const body = await request.json();

    if (!body.senderEmail || !body.senderName || !body.recipientEmail || !body.content) {
      return NextResponse.json({ success: false, error: "Missing attributes" }, { status: 400 });
    }

    const newMessage = await Message.create({
      senderEmail: body.senderEmail.trim().toLowerCase(),
      senderName: body.senderName,
      recipientEmail: body.recipientEmail.trim().toLowerCase(),
      content: body.content,
      read: false,
    });

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const peerEmail = searchParams.get("peerEmail")?.trim().toLowerCase();
    const userEmail = searchParams.get("userEmail")?.trim().toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ success: false, error: "userEmail required" }, { status: 400 });
    }

    if (id) {
      const msg = await Message.findById(id);
      if (!msg) {
        return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
      }

      await Message.findByIdAndUpdate(id, { $addToSet: { hiddenFor: userEmail } });

      const updatedMsg = await Message.findById(id);
      if (
        updatedMsg &&
        updatedMsg.hiddenFor.includes(updatedMsg.senderEmail.toLowerCase()) &&
        updatedMsg.hiddenFor.includes(updatedMsg.recipientEmail.toLowerCase())
      ) {
        await Message.findByIdAndDelete(id);
      }

      return NextResponse.json({ success: true });
    }

    if (peerEmail) {
      const between = {
        $or: [
          { senderEmail: userEmail, recipientEmail: peerEmail },
          { senderEmail: peerEmail, recipientEmail: userEmail },
        ],
      };
      await Message.updateMany(between, { $addToSet: { hiddenFor: userEmail } });
      await Message.deleteMany({ ...between, hiddenFor: { $all: [userEmail, peerEmail] } });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "id or peerEmail required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}