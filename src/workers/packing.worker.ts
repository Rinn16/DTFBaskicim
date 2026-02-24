import { autoPack } from "@/services/packing.service";

self.onmessage = (e: MessageEvent) => {
  const { designs, rollWidthCm, gapCm } = e.data;
  const result = autoPack(designs, rollWidthCm, gapCm);
  self.postMessage(result);
};
