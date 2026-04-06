"use client";

import { useState, useCallback } from "react";
import { useWizard } from "@/lib/wizard-context";
import type { PluginJSON, PluginComponent, RequestJSON, ParsedComponent } from "@/lib/types";
import { Upload, FileJson, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Filter out header, footer, navbar components
const EXCLUDED_PATTERNS = /^(header|footer|navbar|nav_bar|secondary_navbar|primary_navbar|main_nav|navigation)$/i;

function isExcluded(comp: PluginComponent): boolean {
  const name = (comp.component_name || "").toLowerCase();
  const layer = (comp.layer_name || "").toLowerCase();
  return (
    EXCLUDED_PATTERNS.test(name) ||
    EXCLUDED_PATTERNS.test(layer.replace(/\s+/g, "_")) ||
    name === "header" ||
    name === "footer" ||
    layer === "header" ||
    layer === "footer"
  );
}

function extractTextValue(t: string | { text?: string } | null | undefined): string {
  if (!t) return "";
  if (typeof t === "string") return t.trim();
  if (typeof t === "object" && t.text) return t.text.trim();
  return "";
}

function transformComponent(comp: PluginComponent): ParsedComponent {
  // Concatenate text nodes for copy reference
  // texts can be plain strings OR objects with .text
  const copyTexts = (comp.texts || [])
    .map(extractTextValue)
    .filter((t) => t.length > 0)
    .join("\n");

  return {
    id: comp.node_id || `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    layerName: comp.layer_name || "",
    componentName: comp.component_name || "",
    componentLabel: comp.component_label || comp.layer_name || "",
    catalogMatch: comp.catalog_match || false,
    suggestedCatalogId: comp.suggested_component_id || null,
    size: comp.size || { width: 0, height: 0 },
    specMode: comp.spec_mode || "unknown",
    previewDataUrl: comp.preview_png_data_url || "",
    copyTexts,
  };
}

export function Step1Upload() {
  const { state, dispatch, nextStep } = useWizard();
  const [jsonText, setJsonText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    componentCount: number;
    excludedCount: number;
    componentNames: string[];
    frameName: string;
    warnings: string[];
  } | null>(null);

  const parseAndValidateJSON = useCallback(
    (text: string) => {
      try {
        const parsed: PluginJSON = JSON.parse(text);

        // Validate structure - support both old and new format
        if (!parsed.components || !Array.isArray(parsed.components)) {
          throw new Error("JSON must contain a 'components' array");
        }

        const warnings: string[] = [];
        const allComponents = parsed.components;
        const excluded = allComponents.filter(isExcluded);
        const included = allComponents.filter((c) => !isExcluded(c));

        if (excluded.length > 0) {
          warnings.push(
            `Excluded ${excluded.length} header/footer/nav component(s): ${excluded
              .map((c) => c.layer_name)
              .join(", ")}`
          );
        }

        const componentNames = included.map(
          (c) => c.component_label || c.layer_name || c.component_name
        );

        included.forEach((comp, index) => {
          if (!comp.preview_png_data_url) {
            warnings.push(`${comp.layer_name}: no preview image`);
          }
        });

        const sanitized: RequestJSON = {
          schemaVersion: parsed.schema_version || "unknown",
          sourceFrameName: parsed.source_frame_name || "",
          generatedAt: parsed.generated_at || "",
          components: included.map(transformComponent),
        };

        setParseResult({
          success: true,
          componentCount: included.length,
          excludedCount: excluded.length,
          componentNames,
          frameName: parsed.source_frame_name || "",
          warnings,
        });

        dispatch({ type: "SET_REQUEST_JSON", payload: sanitized });
        // Pre-fill masterKeyVisual with the frame name
        if (parsed.source_frame_name) {
          dispatch({
            type: "SET_GLOBAL_FIELDS",
            payload: { masterKeyVisual: parsed.source_frame_name },
          });
        }
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Invalid JSON format";
        setParseResult({
          success: false,
          componentCount: 0,
          excludedCount: 0,
          componentNames: [],
          frameName: "",
          warnings: [errorMessage],
        });
        dispatch({ type: "SET_PARSE_ERRORS", payload: [errorMessage] });
        return false;
      }
    },
    [dispatch]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    if (text.trim()) {
      parseAndValidateJSON(text);
    } else {
      setParseResult(null);
    }
  };

  const handleFileInput = useCallback(
    (file: File) => {
      if (file && (file.type === "application/json" || file.name.endsWith(".json"))) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setJsonText(text);
          parseAndValidateJSON(text);
        };
        reader.readAsText(file);
      }
    },
    [parseAndValidateJSON]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileInput(file);
    },
    [handleFileInput]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileInput(file);
  };

  const loadSampleJSON = async () => {
    try {
      const resp = await fetch("/plugin-sample.json");
      const text = await resp.text();
      setJsonText(text);
      parseAndValidateJSON(text);
    } catch {
      // ignore
    }
  };

  const canProceed = parseResult?.success && parseResult.componentCount > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Upload Plugin JSON
        </h2>
        <p className="text-muted-foreground">
          Drop or upload your Figma plugin JSON export
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-[#e6ff00] bg-[#e6ff00]/5"
            : "border-zinc-700 hover:border-zinc-500"
        )}
        onClick={() => document.getElementById("json-file-input")?.click()}
      >
        <input
          id="json-file-input"
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
          <Upload className="h-8 w-8 text-[#e6ff00]" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-white">
            Drag & drop your JSON file
          </p>
          <p className="text-sm text-zinc-500">or click to browse, or paste below</p>
        </div>
      </div>

      {/* JSON Textarea */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">
            Paste JSON Content
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSampleJSON}
            className="border-[#e6ff00]/30 bg-transparent text-[#e6ff00] hover:bg-[#e6ff00]/10 hover:text-[#e6ff00]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Load Sample JSON
          </Button>
        </div>
        <Textarea
          value={jsonText}
          onChange={handleTextChange}
          placeholder='{"schema_version": "2.0", "components": [...]}'
          className="min-h-[200px] bg-zinc-900/50 font-mono text-sm border-zinc-700 focus:border-[#e6ff00] focus:ring-[#e6ff00]/20"
        />
      </div>

      {/* Parse Result Panel */}
      {parseResult && (
        <div
          className={cn(
            "rounded-xl border p-5",
            parseResult.success
              ? "border-green-500/30 bg-green-500/5"
              : "border-red-500/30 bg-red-500/5"
          )}
        >
          <div className="flex items-start gap-3">
            {parseResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-white">
                  {parseResult.success ? "Parsed Successfully" : "Parse Error"}
                </h4>
                {parseResult.success && (
                  <p className="text-sm text-zinc-400">
                    {parseResult.frameName && (
                      <span className="text-[#e6ff00]">{parseResult.frameName}</span>
                    )}
                    {" — "}
                    {parseResult.componentCount} component(s) detected
                    {parseResult.excludedCount > 0 && (
                      <span className="text-zinc-500">
                        {" "}({parseResult.excludedCount} excluded)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {parseResult.success && parseResult.componentNames.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Components Detected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parseResult.componentNames.map((name, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                      >
                        <FileJson className="h-3 w-3 text-[#e6ff00]" />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {parseResult.warnings.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    {parseResult.success ? "Warnings" : "Errors"}
                  </p>
                  <ul className="space-y-1">
                    {parseResult.warnings.map((warning, i) => (
                      <li
                        key={i}
                        className={cn(
                          "text-sm",
                          parseResult.success ? "text-yellow-400" : "text-red-400"
                        )}
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={nextStep}
          disabled={!canProceed}
          className="bg-[#e6ff00] text-black hover:bg-[#d4eb00] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-base font-semibold"
        >
          Continue to Campaign Details
        </Button>
      </div>
    </div>
  );
}
