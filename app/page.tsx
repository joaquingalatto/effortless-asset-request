"use client";

import Image from "next/image";
import { WizardProvider } from "@/lib/wizard-context";
import { WizardContainer } from "@/components/wizard/wizard-container";

export default function HomePage() {
  return (
    <WizardProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a]">
        {/* Geometric Background Pattern */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Diagonal Lines */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.03]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="diagonal-lines"
                patternUnits="userSpaceOnUse"
                width="40"
                height="40"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="40" stroke="#e6ff00" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
          </svg>

          {/* Grid Pattern */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.02]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" patternUnits="userSpaceOnUse" width="80" height="80">
                <rect width="80" height="80" fill="none" stroke="#e6ff00" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Corner Accents */}
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#e6ff00]/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#e6ff00]/3 blur-3xl" />

          {/* Subtle horizontal lines */}
          <div className="absolute left-0 top-1/4 h-px w-full bg-gradient-to-r from-transparent via-[#e6ff00]/10 to-transparent" />
          <div className="absolute left-0 top-3/4 h-px w-full bg-gradient-to-r from-transparent via-[#e6ff00]/10 to-transparent" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 mx-auto max-w-[1100px] px-6 py-8">
          {/* Header */}
          <header className="mb-12 text-center">
            {/* Top brand row (VML logo + UX TEAM SVG) */}
            <div className="mb-8 flex items-center justify-center gap-6">
              {/* VML Logo */}
              <Image
                src="/vml_logo.svg"
                alt="VML"
                width={110}
                height={32}
                className="h-8 w-auto object-contain opacity-90"
                priority
              />

              {/* UX TEAM (SVG) */}
              <Image
                src="/ux_team_logo.svg"
                alt="UX TEAM"
                width={250}
                height={25}
                className="h-8 w-auto object-contain opacity-90"
                priority
              />
            </div>

            {/* Title */}
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Effortless{" "}
              <span className="bg-gradient-to-r from-[#e6ff00] to-[#c4d900] bg-clip-text text-transparent">
                Asset Request
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-lg text-zinc-400">
              Transform your Figma exports into production-ready Excel asset requests. Fast, precise, and
              automated.
            </p>
          </header>

          {/* Wizard Card */}
          <main className="relative rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6 backdrop-blur-sm md:p-8 lg:p-10">
            {/* Card glow effect */}
            <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-[#e6ff00]/5 to-transparent" />

            <div className="relative">
              <WizardContainer />
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-zinc-600">
            <p>
              Built for creative workflows · <span className="text-[#e6ff00]/50">VML</span>
            </p>
          </footer>
        </div>
      </div>
    </WizardProvider>
  );
}