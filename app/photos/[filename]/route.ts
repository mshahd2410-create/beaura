import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const allowed = /^578079166[0-9]+(?: \(1\))?\.jpg$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!allowed.test(filename)) return new NextResponse("Not found", { status: 404 });

  try {
    const filePath = path.join(process.cwd(), "app", "photos", "photos", filename);
    const image = await readFile(filePath);
    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
