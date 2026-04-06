import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import type { AssetMapping, GlobalFields, ComponentCatalog } from "@/lib/types";
import path from "path";
import fs from "fs";

const TEST_ASSET_LINK =
  "https://www.figma.com/design/hlCJB1wZlvcpXwcQrrb6S2/Assets-Request---Figma-Test-Template?node-id=1101-2576&t=q6uxm7nEIUMk8GA3-4";

// Template layout: headers rows 12-15, data block = rows 16-17 (2 rows per component)
const DATA_START_ROW = 16;
const BLOCK_SIZE = 2; // desktop row + mobile row

// Column mapping based on real template
const COL = {
  STATUS: 1,
  FRAMEIO_LINK: 2,
  READY_TO_USE: 3,
  MASTER_KEY_VISUAL: 4,
  FORMAT: 5,
  VISUAL_REFERENCE: 6, // cols 6-7 merged for visual ref
  ADAPTATION_NEEDED: 8,
  SIZE: 9,
  IMAGE_FORMAT: 10,
  MAX_WEIGHT: 11,
  PADDING: 12,
  PADDING_REF: 13,
  DEMO_REFERENCE: 14,
  EDITABLE: 15,
  ASSET_ID: 16,
  COPY_REFERENCE: 17,
  TRANSLATION_LANGUAGE: 18,
  KEYWORD_INSIGHT: 19,
  SPECS_COPY: 20,
  COPY_CREATED: 21,
  ADDITIONAL_COMMENTS: 22,
  TEST_ASSET: 23,
};

// Merged ranges in the template data block (rows 16-17), using 1-based column numbers
// These columns span BOTH rows of the block (vertically merged)
const BLOCK_MERGES_VERTICAL: Array<{ col: number }> = [
  { col: 1 },  // A - STATUS
  { col: 2 },  // B - FRAME.IO LINK
  { col: 3 },  // C - Ready to use
  { col: 4 },  // D - Master key visual
  { col: 5 },  // E - Format
  { col: 10 }, // J - FORMAT (image)
  { col: 11 }, // K - MAX WEIGHT
  { col: 14 }, // N - DEMO REFERENCE
  { col: 15 }, // O - EDITABLE
  { col: 17 }, // Q - Copy Reference
  { col: 19 }, // S - Keyword Insight
  { col: 22 }, // V - Additional Comments
  { col: 23 }, // W - Test asset
];

// F16:G17 is a special 2-col x 2-row merge for visual reference
const VISUAL_REF_MERGE = { startCol: 6, endCol: 7 };

function loadCatalog(): ComponentCatalog {
  const catalogPath = path.join(process.cwd(), "data", "componentCatalog.json");
  const catalogData = fs.readFileSync(catalogPath, "utf-8");
  return JSON.parse(catalogData);
}

// Load a file-based image (from public/ folder) into a buffer
function loadPublicImage(imagePath: string): Buffer | null {
  try {
    if (!imagePath) return null;
    // imagePath is like "/catalog-images/page004_img002.png"
    const fullPath = path.join(process.cwd(), "public", imagePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    }
    return null;
  } catch {
    return null;
  }
}

function base64ToBuffer(dataUrl: string): Buffer | null {
  try {
    if (!dataUrl) return null;
    const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (match) {
      return Buffer.from(match[2], "base64");
    }
    return Buffer.from(dataUrl, "base64");
  } catch {
    return null;
  }
}

function getImageExtension(dataUrl: string): "png" | "jpeg" {
  if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) {
    return "jpeg";
  }
  return "png";
}

// BUG 5 fix: Normalize asset ID naming — no double underscores, no trailing
function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\s()\-]+/g, "_")   // spaces, parens, dashes → underscore
    .replace(/[^a-z0-9_]/g, "")   // remove invalid chars
    .replace(/_+/g, "_")          // collapse multiple underscores
    .replace(/^_|_$/g, "");        // trim leading/trailing underscores
}

function buildAssetId(masterName: string, componentName: string, device: string): string {
  const parts = [
    normalizeSlug(masterName),
    normalizeSlug(componentName),
    device,
  ].filter((p) => p.length > 0);
  return parts.join("_");
}

// Clone cell style from a source cell
function cloneCellStyle(sourceCell: ExcelJS.Cell, targetCell: ExcelJS.Cell): void {
  if (sourceCell.style) {
    targetCell.style = JSON.parse(JSON.stringify(sourceCell.style));
  }
}

// Apply merged ranges for a data block starting at blockRow
function applyBlockMerges(sheet: ExcelJS.Worksheet, blockRow: number): void {
  const row1 = blockRow;
  const row2 = blockRow + 1;

  // Vertical merges (single column, 2 rows)
  for (const m of BLOCK_MERGES_VERTICAL) {
    const startCell = sheet.getCell(row1, m.col).address;
    const endCell = sheet.getCell(row2, m.col).address;
    try {
      sheet.mergeCells(`${startCell}:${endCell}`);
    } catch {
      // Already merged or overlap — ignore
    }
  }

  // Visual reference 2x2 merge (F:G across both rows)
  try {
    const tl = sheet.getCell(row1, VISUAL_REF_MERGE.startCol).address;
    const br = sheet.getCell(row2, VISUAL_REF_MERGE.endCol).address;
    sheet.mergeCells(`${tl}:${br}`);
  } catch {
    // ignore
  }
}

interface ExcelRequest {
  globalFields: GlobalFields;
  assetMappings: AssetMapping[];
  fileName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExcelRequest = await request.json();
    const { globalFields, assetMappings, fileName } = body;

    if (!globalFields || !assetMappings) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const catalog = loadCatalog();

    // Load the real template
    const templatePath = path.join(process.cwd(), "data", "template.xlsx");
    const workbook = new ExcelJS.Workbook();
    let sheet: ExcelJS.Worksheet;

    // Capture template block styles (rows 16-17, all 23 columns)
    const templateStyles: Array<Record<number, ExcelJS.Style>> = [{}, {}];
    const templateHeights: [number, number] = [139, 131];

    if (fs.existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
      sheet = workbook.worksheets[0];

      // Capture styles from template rows 16-17
      for (let offset = 0; offset < BLOCK_SIZE; offset++) {
        const row = sheet.getRow(DATA_START_ROW + offset);
        templateHeights[offset] = row.height || (offset === 0 ? 139 : 131);
        for (let c = 1; c <= 23; c++) {
          const cell = row.getCell(c);
          if (cell.style) {
            templateStyles[offset][c] = JSON.parse(JSON.stringify(cell.style));
          }
        }
      }

      // Unmerge existing data block merges (rows 16-17) so we can rewrite cleanly
      const existingMerges = [...(sheet.model.merges || [])];
      for (const merge of existingMerges) {
        // Only unmerge merges that touch rows >= 16
        const match = merge.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
        if (match) {
          const startRow = parseInt(match[2]);
          if (startRow >= DATA_START_ROW) {
            try {
              sheet.unMergeCells(merge);
            } catch {
              // ignore
            }
          }
        }
      }
    } else {
      // Fallback: create from scratch
      sheet = workbook.addWorksheet("Asset Request", {
        properties: { defaultColWidth: 18 },
      });
    }

    // Format string
    const formatNeeded = globalFields.formatNeeded;
    let formatStr = "";
    if (formatNeeded.image && formatNeeded.text) formatStr = "Image, Text";
    else if (formatNeeded.image) formatStr = "Image";
    else if (formatNeeded.text) formatStr = "Text";

    let componentsProcessed = 0;

    for (let i = 0; i < assetMappings.length; i++) {
      const mapping = assetMappings[i];
      const catalogEntry = mapping.catalogKey
        ? catalog[mapping.catalogKey]
        : null;
      const isMapped = !mapping.isUnmapped && !!catalogEntry;

      const blockRow = DATA_START_ROW + i * BLOCK_SIZE;
      const desktopRowNum = blockRow;
      const mobileRowNum = blockRow + 1;

      // ── Clone styles from template block ──
      for (let offset = 0; offset < BLOCK_SIZE; offset++) {
        const row = sheet.getRow(blockRow + offset);
        row.height = templateHeights[offset];
        for (let c = 1; c <= 23; c++) {
          const style = templateStyles[offset][c];
          if (style) {
            row.getCell(c).style = JSON.parse(JSON.stringify(style));
          }
        }
      }

      // ── Apply merges for this block ──
      applyBlockMerges(sheet, blockRow);

      // ── Asset ID slugs (BUG 5 fix) ──
      const desktopAssetId = buildAssetId(
        globalFields.masterKeyVisual,
        mapping.componentName,
        "desktop"
      );
      const mobileAssetId = buildAssetId(
        globalFields.masterKeyVisual,
        mapping.componentName,
        "mobile"
      );

      // ── Shared/merged cell values (written to row 1 of the block only) ──
      const r1 = sheet.getRow(desktopRowNum);
      r1.getCell(COL.STATUS).value = "";
      r1.getCell(COL.FRAMEIO_LINK).value = "";
      r1.getCell(COL.READY_TO_USE).value = "";
      r1.getCell(COL.MASTER_KEY_VISUAL).value =
        globalFields.masterKeyVisual || "";
      r1.getCell(COL.FORMAT).value = formatStr;
      r1.getCell(COL.VISUAL_REFERENCE).value = ""; // image embedded below

      // Merged columns: IMAGE_FORMAT, MAX_WEIGHT, DEMO_REFERENCE, EDITABLE
      if (isMapped && catalogEntry) {
        r1.getCell(COL.IMAGE_FORMAT).value =
          catalogEntry.format || "JPG O PNG";
        r1.getCell(COL.MAX_WEIGHT).value =
          catalogEntry.max_weight || "Weight: keep under 300KB";
        r1.getCell(COL.DEMO_REFERENCE).value = catalogEntry.demo_url
          ? `${catalogEntry.display_name}: ${catalogEntry.demo_url}`
          : "";
        r1.getCell(COL.EDITABLE).value = catalogEntry.editable || "PS/AI";
      } else {
        r1.getCell(COL.IMAGE_FORMAT).value = "JPG O PNG";
        r1.getCell(COL.MAX_WEIGHT).value = "Weight: keep under 300KB";
        r1.getCell(COL.DEMO_REFERENCE).value =
          "UNMAPPED - needs manual spec";
        r1.getCell(COL.EDITABLE).value = "";
      }

      // Copy Reference (BUG 2 fix) — merged column, write once
      r1.getCell(COL.COPY_REFERENCE).value = mapping.copyTexts || "";

      r1.getCell(COL.KEYWORD_INSIGHT).value = "";
      r1.getCell(COL.ADDITIONAL_COMMENTS).value =
        globalFields.additionalComments || "";
      r1.getCell(COL.TEST_ASSET).value = TEST_ASSET_LINK;

      // ── Per-row values (NOT merged — different desktop/mobile) ──

      // DESKTOP row
      r1.getCell(COL.ADAPTATION_NEEDED).value = globalFields.adaptationNeeded
        ? `Yes - ${globalFields.markets}`
        : "No";
      if (isMapped && catalogEntry) {
        r1.getCell(COL.SIZE).value = catalogEntry.desktop.size;
        r1.getCell(COL.PADDING).value = catalogEntry.desktop.padding;
        r1.getCell(COL.PADDING_REF).value = catalogEntry.desktop.padding;

        // Embed desktop padding reference image in column M (COL.PADDING_REF)
        if (catalogEntry.desktop.padding_reference_image) {
          const padImgBuf = loadPublicImage(catalogEntry.desktop.padding_reference_image);
          if (padImgBuf) {
            try {
              const padImgId = workbook.addImage({ buffer: padImgBuf, extension: "png" });
              sheet.addImage(padImgId, {
                tl: { col: COL.PADDING_REF - 1, row: desktopRowNum - 1 },
                ext: { width: 120, height: 100 },
              });
            } catch (e) {
              console.error("Failed to embed desktop padding ref image for", mapping.componentName, e);
            }
          }
        }
      } else {
        r1.getCell(COL.SIZE).value = `${mapping.size.width} x ${mapping.size.height} (from design)`;
        r1.getCell(COL.PADDING).value = "UNMAPPED";
        r1.getCell(COL.PADDING_REF).value = "";
      }
      r1.getCell(COL.ASSET_ID).value = desktopAssetId;
      r1.getCell(COL.TRANSLATION_LANGUAGE).value =
        globalFields.translationLanguage || "NO APLICA";
      r1.getCell(COL.SPECS_COPY).value = "";
      r1.getCell(COL.COPY_CREATED).value = ""; // Always empty

      // MOBILE row
      const r2 = sheet.getRow(mobileRowNum);
      r2.getCell(COL.ADAPTATION_NEEDED).value = globalFields.adaptationNeeded
        ? `Yes - ${globalFields.markets}`
        : "No";
      if (isMapped && catalogEntry) {
        r2.getCell(COL.SIZE).value = catalogEntry.mobile.size;
        r2.getCell(COL.PADDING).value = catalogEntry.mobile.padding;
        r2.getCell(COL.PADDING_REF).value = catalogEntry.mobile.padding;

        // Embed mobile padding reference image in column M (COL.PADDING_REF)
        if (catalogEntry.mobile.padding_reference_image) {
          const padImgBuf = loadPublicImage(catalogEntry.mobile.padding_reference_image);
          if (padImgBuf) {
            try {
              const padImgId = workbook.addImage({ buffer: padImgBuf, extension: "png" });
              sheet.addImage(padImgId, {
                tl: { col: COL.PADDING_REF - 1, row: mobileRowNum - 1 },
                ext: { width: 120, height: 100 },
              });
            } catch (e) {
              console.error("Failed to embed mobile padding ref image for", mapping.componentName, e);
            }
          }
        }
      } else {
        r2.getCell(COL.SIZE).value = `${mapping.size.width} x ${mapping.size.height} (from design - mobile)`;
        r2.getCell(COL.PADDING).value = "UNMAPPED";
        r2.getCell(COL.PADDING_REF).value = "";
      }
      r2.getCell(COL.ASSET_ID).value = mobileAssetId;
      r2.getCell(COL.TRANSLATION_LANGUAGE).value =
        globalFields.translationLanguage || "NO APLICA";
      r2.getCell(COL.SPECS_COPY).value = "";
      r2.getCell(COL.COPY_CREATED).value = ""; // Always empty

      // ── BUG 1 fix: ONE image per block, placed in the merged F:G area ──
      if (mapping.previewImage) {
        const imgBuffer = base64ToBuffer(mapping.previewImage);
        if (imgBuffer) {
          try {
            const ext = getImageExtension(mapping.previewImage);
            const imageId = workbook.addImage({
              buffer: imgBuffer,
              extension: ext,
            });
            // Place the image spanning the full 2-row merged visual reference area
            sheet.addImage(imageId, {
              tl: {
                col: VISUAL_REF_MERGE.startCol - 1,
                row: desktopRowNum - 1,
              },
              br: {
                col: VISUAL_REF_MERGE.endCol,
                row: mobileRowNum,
              },
            });
          } catch (e) {
            console.error("Failed to embed image for", mapping.componentName, e);
          }
        }
      }

      componentsProcessed++;
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const rowsWritten = componentsProcessed * 2;

    // Sanitize file name
    const sanitizedName = (fileName || "asset_request")
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/\s+/g, "_")
      .trim() || "asset_request";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${sanitizedName}.xlsx"`,
        "X-Components-Processed": componentsProcessed.toString(),
        "X-Rows-Written": rowsWritten.toString(),
      },
    });
  } catch (error) {
    console.error("Excel generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate Excel",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
