import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Invoice from "@/models/Invoice";

const PENDING = "Pending Manager Approval";

// NOTE: this app's login is stored in the browser, so the role sent from the
// client is trusted here. It stops accidental approvals, but real protection
// needs server-side sessions.
const isAdmin = (role) => role === "Admin";

// Auto-generate the next invoice number, e.g. INV-0007
async function nextInvoiceNumber() {
  const count = await Invoice.countDocuments({});
  let n = count + 1;
  // Guard against clashes if invoices were deleted
  while (await Invoice.exists({ invoiceNumber: `INV-${String(n).padStart(4, "0")}` })) n++;
  return `INV-${String(n).padStart(4, "0")}`;
}

export async function GET(request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(request.url);
    const submittedBy = searchParams.get("submittedBy")?.trim().toLowerCase();

    // Normal users only ask for their own invoices; admins ask for everything
    const filter = submittedBy ? { uploadedByEmail: submittedBy } : {};
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Submit a new invoice - it ALWAYS starts as awaiting approval
export async function POST(request) {
  try {
    await connectToDB();
    const body = await request.json();
    if (!body.clientName?.trim() || !body.amount) {
      return NextResponse.json({ success: false, error: "Client name and amount required" }, { status: 400 });
    }

    const newInvoice = await Invoice.create({
      invoiceNumber: body.invoiceNumber?.trim() || (await nextInvoiceNumber()),
      clientName: body.clientName.trim(),
      amount: Number(body.amount),
      status: PENDING,
      uploadedBy: body.submittedByName || "Internal Operations",
      uploadedByEmail: (body.submittedByEmail || "").trim().toLowerCase(),
      documentUrl: body.documentUrl || "",
    });
    return NextResponse.json({ success: true, data: newInvoice }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Edit invoice details. Editing a Rejected invoice re-submits it for approval.
export async function PUT(request) {
  try {
    await connectToDB();
    const { id, invoiceNumber, clientName, amount, documentUrl, actorEmail, actorRole } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Invoice ID required" }, { status: 400 });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    if (!isAdmin(actorRole)) {
      const owner = invoice.uploadedByEmail === (actorEmail || "").toLowerCase();
      if (!owner) {
        return NextResponse.json({ success: false, error: "You can only edit your own invoices" }, { status: 403 });
      }
      if (invoice.status !== PENDING && invoice.status !== "Rejected") {
        return NextResponse.json({ success: false, error: "This invoice has already been approved and can no longer be edited" }, { status: 403 });
      }
    }

    if (invoiceNumber?.trim()) invoice.invoiceNumber = invoiceNumber.trim();
    if (clientName?.trim()) invoice.clientName = clientName.trim();
    if (amount !== undefined && amount !== "") invoice.amount = Number(amount);
    if (documentUrl !== undefined) invoice.documentUrl = documentUrl || "";

    // A rejected invoice goes back into the approval queue once corrected
    if (invoice.status === "Rejected") {
      invoice.status = PENDING;
      invoice.approvedBy = "";
      invoice.approvedAt = undefined;
    }

    await invoice.save();
    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Change status only (Approve / Reject / Mark as Paid) - admins only
export async function PATCH(request) {
  try {
    await connectToDB();
    const { id, status, actorName, actorRole } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Invoice ID and status required" }, { status: 400 });
    }
    if (!["Approved", "Rejected", "Paid", PENDING].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }
    if (!isAdmin(actorRole)) {
      return NextResponse.json({ success: false, error: "Only an admin can approve, reject or pay invoices" }, { status: 403 });
    }

    const update = { status };
    if (status === "Approved" || status === "Rejected") {
      update.approvedBy = actorName || "Admin";
      update.approvedAt = new Date();
    }

    const updated = await Invoice.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }
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
    const actorEmail = searchParams.get("actorEmail")?.toLowerCase();
    const actorRole = searchParams.get("actorRole");
    if (!id) {
      return NextResponse.json({ success: false, error: "Invoice ID required" }, { status: 400 });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    if (!isAdmin(actorRole)) {
      const owner = invoice.uploadedByEmail === (actorEmail || "");
      if (!owner || invoice.status !== PENDING) {
        return NextResponse.json({ success: false, error: "You can only delete your own invoices while they are awaiting approval" }, { status: 403 });
      }
    }

    await Invoice.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}