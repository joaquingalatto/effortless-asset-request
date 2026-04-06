"use client";

import { useEffect, useState } from "react";
import { useWizard } from "@/lib/wizard-context";
import type { ComponentCatalog, AssetMapping, CatalogComponent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Monitor,
  Smartphone,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  ImageIcon,
  Type,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Alias map for fuzzy matching between plugin names and catalog keys
const ALIAS_MAP: Record<string, string[]> = {
  hero: ["hero_banner", "hero", "hero_carousel"],
  hero_banner: ["hero"],
  hero_carousel: ["hero_carousel", "hero"],
  content_card: ["content_card"],
  campaign_card: ["campaign_card", "campaign_card_full_bleed"],
  general_card: ["general_card"],
  countdown: ["countdown"],
  promo_plus_header: ["promo_plus_header", "promo_header"],
  quiz_question: ["quiz_question", "quiz"],
  campaign_card_full_bleed: ["campaign_card_full_bleed", "campaign_card"],
};

function findCatalogMatch(
  componentName: string,
  suggestedId: string | null,
  catalog: ComponentCatalog
): string {
  // 1. Direct match from plugin's suggested_component_id
  if (suggestedId && catalog[suggestedId]) {
    return suggestedId;
  }

  // 2. Direct match by component_name
  const normalized = componentName.toLowerCase().replace(/[\s-]+/g, "_");
  if (catalog[normalized]) {
    return normalized;
  }

  // 3. Check alias map
  for (const [catalogKey, aliases] of Object.entries(ALIAS_MAP)) {
    if (catalog[catalogKey] && aliases.includes(normalized)) {
      return catalogKey;
    }
  }

  // 4. Partial match - if component name contains a catalog key or vice versa
  for (const key of Object.keys(catalog)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return key;
    }
  }

  return "";
}

export function Step3AssetMapping() {
  const { state, dispatch, nextStep, prevStep } = useWizard();
  const [catalog, setCatalog] = useState<ComponentCatalog | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));
  const [loading, setLoading] = useState(true);

  // Load catalog on mount
  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data) => {
        setCatalog(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load catalog:", err);
        setLoading(false);
      });
  }, []);

  // Initialize mappings when JSON is parsed and catalog is loaded
  useEffect(() => {
    if (!state.requestJSON || !catalog || state.assetMappings.length > 0) return;

    const mappings: AssetMapping[] = state.requestJSON.components.map((comp) => {
      const catalogKey = findCatalogMatch(
        comp.componentName,
        comp.suggestedCatalogId,
        catalog
      );
      const isUnmapped = !catalogKey;
      const warnings: string[] = [];

      if (isUnmapped) {
        warnings.push("Unmapped - no catalog match");
      }
      if (!comp.previewDataUrl) {
        warnings.push("No preview image");
      }

      return {
        id: comp.id,
        componentName: comp.componentLabel || comp.componentName || comp.layerName,
        layerName: comp.layerName,
        catalogKey,
        isUnmapped,
        previewImage: comp.previewDataUrl,
        copyTexts: comp.copyTexts,
        size: comp.size,
        warnings,
      };
    });

    dispatch({ type: "SET_ASSET_MAPPINGS", payload: mappings });
  }, [state.requestJSON, catalog, state.assetMappings.length, dispatch]);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const updateMapping = (index: number, data: Partial<AssetMapping>) => {
    dispatch({ type: "UPDATE_ASSET_MAPPING", payload: { index, data } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e6ff00] border-t-transparent" />
      </div>
    );
  }

  const mappedCount = state.assetMappings.filter((m) => !m.isUnmapped).length;
  const unmappedCount = state.assetMappings.filter((m) => m.isUnmapped).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Asset Mapping & Preview
        </h2>
        <p className="text-muted-foreground">
          Review catalog matching. Components marked as unmapped will still appear in the Excel.
        </p>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            {mappedCount} mapped
          </span>
          {unmappedCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-400">
              <XCircle className="h-4 w-4" />
              {unmappedCount} unmapped
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {state.assetMappings.map((mapping, index) => {
          const catalogEntry = catalog && mapping.catalogKey ? catalog[mapping.catalogKey] : null;
          const isExpanded = expandedItems.has(index);

          return (
            <Collapsible
              key={mapping.id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(index)}
            >
              <div
                className={cn(
                  "rounded-xl border transition-all",
                  mapping.isUnmapped
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-zinc-800 bg-zinc-900/30"
                )}
              >
                {/* Header */}
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between p-4 text-left hover:bg-zinc-800/30 transition-colors rounded-t-xl">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-[#e6ff00] font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {mapping.componentName || "Unnamed Component"}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {mapping.layerName}
                          {catalogEntry && (
                            <span className="text-green-400 ml-2">
                              → {catalogEntry.display_name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {mapping.isUnmapped ? (
                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          Unmapped
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Mapped
                        </span>
                      )}
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-zinc-500 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-zinc-800 p-5 space-y-6">
                    {/* Catalog Match */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Component Catalog Match</Label>
                      <Select
                        value={mapping.catalogKey || "__unmapped__"}
                        onValueChange={(value) => {
                          const isNowUnmapped = value === "__unmapped__";
                          const newWarnings = mapping.warnings.filter(
                            (w) => !w.startsWith("Unmapped")
                          );
                          if (isNowUnmapped) {
                            newWarnings.push("Unmapped - no catalog match");
                          }
                          updateMapping(index, {
                            catalogKey: isNowUnmapped ? "" : value,
                            isUnmapped: isNowUnmapped,
                            warnings: newWarnings,
                          });
                        }}
                      >
                        <SelectTrigger className="bg-zinc-900/50 border-zinc-700">
                          <SelectValue placeholder="Select catalog component" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 max-h-[300px]">
                          <SelectItem
                            value="__unmapped__"
                            className="text-yellow-400 focus:bg-yellow-500/10"
                          >
                            (Unmapped)
                          </SelectItem>
                          {catalog &&
                            Object.entries(catalog).map(([key, value]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="text-zinc-300 focus:bg-[#e6ff00]/10"
                              >
                                {(value as CatalogComponent).display_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preview & Specs */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Preview */}
                      <div className="space-y-3">
                        <Label className="text-zinc-400 text-xs flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Plugin Preview
                        </Label>
                        {mapping.previewImage ? (
                          <div className="relative overflow-hidden rounded-lg bg-zinc-800 p-2">
                            <img
                              src={mapping.previewImage}
                              alt={`${mapping.componentName} preview`}
                              className="w-full object-contain max-h-[200px]"
                            />
                          </div>
                        ) : (
                          <div className="flex h-20 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 text-xs">
                            No preview
                          </div>
                        )}
                        <div className="text-xs text-zinc-500">
                          Original size: {mapping.size.width} x {mapping.size.height}
                        </div>
                      </div>

                      {/* Catalog Specs */}
                      <div className="space-y-3">
                        {catalogEntry ? (
                          <>
                            <Label className="text-zinc-400 text-xs">Catalog Specs</Label>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                {/* Desktop */}
                                <div className="rounded bg-zinc-800 p-3 space-y-1">
                                  <div className="flex items-center gap-1 text-[#e6ff00] text-xs font-medium">
                                    <Monitor className="h-3 w-3" />
                                    Desktop
                                  </div>
                                  <p className="text-white text-xs font-mono">
                                    {catalogEntry.desktop.size}
                                  </p>
                                  <p className="text-zinc-400 text-[10px]">
                                    {catalogEntry.desktop.padding}
                                  </p>
                                </div>
                                {/* Mobile */}
                                <div className="rounded bg-zinc-800 p-3 space-y-1">
                                  <div className="flex items-center gap-1 text-[#e6ff00] text-xs font-medium">
                                    <Smartphone className="h-3 w-3" />
                                    Mobile
                                  </div>
                                  <p className="text-white text-xs font-mono">
                                    {catalogEntry.mobile.size}
                                  </p>
                                  <p className="text-zinc-400 text-[10px]">
                                    {catalogEntry.mobile.padding}
                                  </p>
                                </div>
                              </div>
                              {catalogEntry.format && (
                                <p className="text-xs text-zinc-500">
                                  Format: {catalogEntry.format} | {catalogEntry.max_weight}
                                </p>
                              )}
                              {catalogEntry.editable && (
                                <p className="text-xs text-zinc-500">
                                  Editable: {catalogEntry.editable}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="rounded bg-yellow-500/10 border border-yellow-500/20 p-4">
                            <p className="text-yellow-400 text-sm font-medium">Unmapped Component</p>
                            <p className="text-zinc-400 text-xs mt-1">
                              This component has no catalog match. It will be included in the Excel
                              with its preview but without catalog specs or padding references.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detected Text from Plugin */}
                    <div className="space-y-1">
                      <Label className="text-zinc-400 text-xs flex items-center gap-1">
                        <Type className="h-3 w-3" />
                        Detected Text (from plugin JSON)
                      </Label>
                      {mapping.copyTexts ? (
                        <div className="rounded border border-zinc-700 bg-zinc-800 p-3 text-xs text-zinc-300 max-h-[140px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {mapping.copyTexts}
                        </div>
                      ) : (
                        <div className="rounded border border-zinc-700/50 bg-zinc-800/50 p-3 text-xs text-zinc-500 italic">
                          No text detected for this component
                        </div>
                      )}
                      <p className="text-[10px] text-zinc-600">
                        This text will fill the Copy Reference column in the Excel
                      </p>
                    </div>

                    {/* Demo URL */}
                    {catalogEntry?.demo_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-4 w-4 text-[#e6ff00]" />
                        <a
                          href={catalogEntry.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#e6ff00] hover:underline"
                        >
                          View Demo Reference
                        </a>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          onClick={prevStep}
          variant="outline"
          className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white px-6"
        >
          Back
        </Button>
        <Button
          onClick={nextStep}
          className="bg-[#e6ff00] text-black hover:bg-[#d4eb00] px-8 py-3 text-base font-semibold"
        >
          Continue to Generate
        </Button>
      </div>
    </div>
  );
}
