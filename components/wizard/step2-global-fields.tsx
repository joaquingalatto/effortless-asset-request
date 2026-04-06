"use client";

import { useWizard } from "@/lib/wizard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Image, Type, Globe, User, Languages, MessageSquare } from "lucide-react";

const TRANSLATION_LANGUAGES = [
  "NO APLICA",
  "Neutral Spanish",
  "Portuguese",
  "Rioplatense",
  "English (USA)",
];

export function Step2GlobalFields() {
  const { state, dispatch, nextStep, prevStep } = useWizard();
  const { globalFields } = state;

  const updateField = <K extends keyof typeof globalFields>(
    key: K,
    value: typeof globalFields[K]
  ) => {
    dispatch({ type: "SET_GLOBAL_FIELDS", payload: { [key]: value } });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Campaign Details
        </h2>
        <p className="text-muted-foreground">
          Set global defaults for all assets. You can override these per component in the next step.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Master / Key Visual */}
        <div className="space-y-2">
          <Label htmlFor="masterKeyVisual" className="text-zinc-300 flex items-center gap-2">
            <Image className="h-4 w-4 text-[#e6ff00]" />
            Master / Key Visual (Screen Name)
          </Label>
          <Input
            id="masterKeyVisual"
            value={globalFields.masterKeyVisual}
            onChange={(e) => updateField("masterKeyVisual", e.target.value)}
            placeholder="e.g., Summer Campaign Hero"
            className="bg-zinc-900/50 border-zinc-700 focus:border-[#e6ff00] focus:ring-[#e6ff00]/20"
          />
        </div>

        {/* Format Needed */}
        <div className="space-y-3">
          <Label className="text-zinc-300 flex items-center gap-2">
            <Type className="h-4 w-4 text-[#e6ff00]" />
            Format Needed
          </Label>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="formatImage"
                checked={globalFields.formatNeeded.image}
                onCheckedChange={(checked) =>
                  updateField("formatNeeded", {
                    ...globalFields.formatNeeded,
                    image: !!checked,
                  })
                }
                className="border-zinc-600 data-[state=checked]:bg-[#e6ff00] data-[state=checked]:border-[#e6ff00] data-[state=checked]:text-black"
              />
              <Label htmlFor="formatImage" className="text-zinc-300 cursor-pointer">
                Image
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="formatText"
                checked={globalFields.formatNeeded.text}
                onCheckedChange={(checked) =>
                  updateField("formatNeeded", {
                    ...globalFields.formatNeeded,
                    text: !!checked,
                  })
                }
                className="border-zinc-600 data-[state=checked]:bg-[#e6ff00] data-[state=checked]:border-[#e6ff00] data-[state=checked]:text-black"
              />
              <Label htmlFor="formatText" className="text-zinc-300 cursor-pointer">
                Text
              </Label>
            </div>
          </div>
        </div>

        {/* Adaptation Needed */}
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="adaptationNeeded" className="text-zinc-300 flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#e6ff00]" />
              Adaptation Needed?
            </Label>
            <Switch
              id="adaptationNeeded"
              checked={globalFields.adaptationNeeded}
              onCheckedChange={(checked) => updateField("adaptationNeeded", checked)}
              className="data-[state=checked]:bg-[#e6ff00]"
            />
          </div>
          
          {globalFields.adaptationNeeded && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="markets" className="text-zinc-400 text-sm">
                Markets (comma-separated)
              </Label>
              <Input
                id="markets"
                value={globalFields.markets}
                onChange={(e) => updateField("markets", e.target.value)}
                placeholder="e.g., Mexico, Brazil, Argentina, USA"
                className="bg-zinc-900/50 border-zinc-700 focus:border-[#e6ff00] focus:ring-[#e6ff00]/20"
              />
            </div>
          )}
        </div>

        {/* Requester Name */}
        <div className="space-y-2">
          <Label htmlFor="requesterName" className="text-zinc-300 flex items-center gap-2">
            <User className="h-4 w-4 text-[#e6ff00]" />
            Requester Name
          </Label>
          <Input
            id="requesterName"
            value={globalFields.requesterName}
            onChange={(e) => updateField("requesterName", e.target.value)}
            placeholder="Your name"
            className="bg-zinc-900/50 border-zinc-700 focus:border-[#e6ff00] focus:ring-[#e6ff00]/20"
          />
        </div>

        {/* Translation Language */}
        <div className="space-y-2">
          <Label htmlFor="translationLanguage" className="text-zinc-300 flex items-center gap-2">
            <Languages className="h-4 w-4 text-[#e6ff00]" />
            Translation Language
          </Label>
          <Select
            value={globalFields.translationLanguage}
            onValueChange={(value) => updateField("translationLanguage", value)}
          >
            <SelectTrigger className="bg-zinc-900/50 border-zinc-700 focus:border-[#e6ff00] focus:ring-[#e6ff00]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {TRANSLATION_LANGUAGES.map((lang) => (
                <SelectItem
                  key={lang}
                  value={lang}
                  className="text-zinc-300 focus:bg-[#e6ff00]/10 focus:text-white"
                >
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Additional Comments */}
        <div className="space-y-2">
          <Label htmlFor="additionalComments" className="text-zinc-300 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#e6ff00]" />
            Additional Comments / Instructions
          </Label>
          <Textarea
            id="additionalComments"
            value={globalFields.additionalComments}
            onChange={(e) => updateField("additionalComments", e.target.value)}
            placeholder="Any additional notes or instructions..."
            className="min-h-[100px] bg-zinc-900/50 border-zinc-700 focus:border-[#e6ff00] focus:ring-[#e6ff00]/20"
          />
        </div>
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
          Continue to Asset Mapping
        </Button>
      </div>
    </div>
  );
}
