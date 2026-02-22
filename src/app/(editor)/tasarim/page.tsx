"use client";

import dynamic from "next/dynamic";
import { DesignSidebar } from "@/components/canvas/design-sidebar";
import { SettingsSidebar } from "@/components/canvas/settings-sidebar";
import { PriceBar } from "@/components/canvas/price-bar";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";

const RollCanvas = dynamic(
  () => import("@/components/canvas/roll-canvas").then((m) => m.RollCanvas),
  { ssr: false }
);

export default function DesignPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Main area: 3 columns */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Upload & Design List */}
        <DesignSidebar />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Canvas top toolbar */}
          <CanvasToolbar />

          {/* Canvas area */}
          <div className="flex-1 relative bg-[#05080c] workspace-grid overflow-auto">
            <RollCanvas />
          </div>
        </div>

        {/* Right Sidebar - Settings */}
        <SettingsSidebar />
      </div>

      {/* Bottom Price Bar */}
      <PriceBar />
    </div>
  );
}
