import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import type { ComponentCatalog } from "@/lib/types";

export async function GET() {
  try {
    const catalogPath = path.join(process.cwd(), "data", "componentCatalog.json");
    const catalogData = fs.readFileSync(catalogPath, "utf-8");
    const catalog: ComponentCatalog = JSON.parse(catalogData);
    
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Failed to load catalog:", error);
    return NextResponse.json(
      { error: "Failed to load component catalog" },
      { status: 500 }
    );
  }
}
