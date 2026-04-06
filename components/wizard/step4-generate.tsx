"use client";

import { useState } from "react";
import { useWizard } from "@/lib/wizard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Monitor,
  Smartphone,
  Image,
  Type,
  Globe,
  RefreshCw,
  FileOutput,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Step4Generate() {
  const { state, prevStep, dispatch } = useWizard();
  const [generating, setGenerating] = useState(false);
  const [fileName, setFileName] = useState("asset_request");
  const [result, setResult] = useState<{
    success: boolean;
    componentsProcessed?: number;
    rowsWritten?: number;
    error?: string;
  } | null>(null);

  const { globalFields, assetMappings } = state;

  // Sanitize filename for display
  const sanitizeFileName = (name: string): string => {
    return name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/\s+/g, "_")
      .trim();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);

    const sanitizedName = sanitizeFileName(fileName) || "asset_request";

    try {
      const response = await fetch("/api/generate-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          globalFields,
          assetMappings,
          fileName: sanitizedName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Generation failed");
      }

      const componentsProcessed = parseInt(
        response.headers.get("X-Components-Processed") || "0"
      );
      const rowsWritten = parseInt(
        response.headers.get("X-Rows-Written") || "0"
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizedName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setResult({
        success: true,
        componentsProcessed,
        rowsWritten,
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    dispatch({ type: "RESET" });
  };

  const totalComponents = assetMappings.length;
  const totalRows = totalComponents * 2;
  const mappedCount = assetMappings.filter((m) => !m.isUnmapped).length;
  const unmappedCount = assetMappings.filter((m) => m.isUnmapped).length;
  const formatStr = [
    globalFields.formatNeeded.image && "Image",
    globalFields.formatNeeded.text && "Text",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Generate & Download
        </h2>
        <p className="text-muted-foreground">
          Review your configuration and generate the Excel file
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<FileSpreadsheet className="h-5 w-5" />}
          label="Components"
          value={totalComponents.toString()}
          sublabel={`${mappedCount} mapped, ${unmappedCount} unmapped`}
        />
        <SummaryCard
          icon={<Monitor className="h-5 w-5" />}
          label="Total Rows"
          value={totalRows.toString()}
          sublabel="Desktop + Mobile"
        />
        <SummaryCard
          icon={
            globalFields.formatNeeded.image ? (
              <Image className="h-5 w-5" />
            ) : (
              <Type className="h-5 w-5" />
            )
          }
          label="Format"
          value={formatStr || "None"}
        />
        <SummaryCard
          icon={<Globe className="h-5 w-5" />}
          label="Adaptation"
          value={globalFields.adaptationNeeded ? "Yes" : "No"}
          sublabel={
            globalFields.adaptationNeeded ? globalFields.markets : undefined
          }
        />
      </div>

      {/* Configuration Summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
        <h3 className="font-semibold text-white">Configuration Summary</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Master / Key Visual
            </span>
            <p className="text-zinc-300">
              {globalFields.masterKeyVisual || "(Not set)"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Requester
            </span>
            <p className="text-zinc-300">
              {globalFields.requesterName || "(Not set)"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Translation Language
            </span>
            <p className="text-zinc-300">{globalFields.translationLanguage}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Additional Comments
            </span>
            <p className="text-zinc-300 text-sm line-clamp-2">
              {globalFields.additionalComments || "(None)"}
            </p>
          </div>
        </div>
      </div>

      {/* Components List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
        <h3 className="font-semibold text-white">Components to Generate</h3>

        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {assetMappings.map((mapping, index) => (
            <div
              key={mapping.id}
              className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-[#e6ff00]/10 text-[#e6ff00] text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    {mapping.componentName || "Unnamed"}
                  </p>
                  <p className="text-xs text-zinc-500">{mapping.layerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-zinc-400">
                  <Monitor className="h-3.5 w-3.5" />
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
                {mapping.isUnmapped ? (
                  <span className="text-yellow-400 text-xs px-2 py-0.5 bg-yellow-500/10 rounded">
                    unmapped
                  </span>
                ) : (
                  <span className="text-green-400 text-xs px-2 py-0.5 bg-green-500/10 rounded">
                    mapped
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Output File Name — NEW FEATURE */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
        <Label
          htmlFor="outputFileName"
          className="text-zinc-300 flex items-center gap-2"
        >
          <FileOutput className="h-4 w-4 text-[#e6ff00]" />
          Output file name
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="outputFileName"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="asset_request"
            className="bg-zinc-900/50 border-zinc-700 focus:border-[#e6ff00] focus:ring-[#e6ff00]/20 font-mono"
          />
          <span className="text-zinc-500 text-sm whitespace-nowrap">.xlsx</span>
        </div>
        <p className="text-xs text-zinc-500">
          The downloaded file will be named{" "}
          <span className="text-zinc-300 font-mono">
            {sanitizeFileName(fileName) || "asset_request"}.xlsx
          </span>
        </p>
      </div>

      {/* Result Panel */}
      {result && (
        <div
          className={cn(
            "rounded-xl border p-5",
            result.success
              ? "border-green-500/30 bg-green-500/5"
              : "border-red-500/30 bg-red-500/5"
          )}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-white">
                {result.success
                  ? "Excel Generated Successfully!"
                  : "Generation Failed"}
              </h4>
              {result.success ? (
                <div className="mt-2 space-y-1 text-sm text-zinc-400">
                  <p>Components processed: {result.componentsProcessed}</p>
                  <p>Rows written: {result.rowsWritten}</p>
                  <p>File downloaded to your device</p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-red-400">{result.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <div className="flex gap-2">
          <Button
            onClick={prevStep}
            variant="outline"
            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white px-6"
          >
            Back
          </Button>
          {result?.success && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          )}
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating || assetMappings.length === 0}
          className="bg-[#e6ff00] text-black hover:bg-[#d4eb00] disabled:opacity-50 px-8 py-3 text-base font-semibold"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Generate & Download Excel
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}

function SummaryCard({ icon, label, value, sublabel }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-center gap-2 text-[#e6ff00] mb-2">
        {icon}
        <span className="text-xs text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sublabel && (
        <p className="text-xs text-zinc-500 mt-1 truncate">{sublabel}</p>
      )}
    </div>
  );
}
