"use client";

import { useEffect, useState } from "react";
import type { TruckConfig } from "@/lib/trucks";
import { DEFAULT_GARAGE, loadGarage, saveGarage } from "@/lib/trucks";
import { GarageScreen } from "./GarageScreen";
import { DriveScreen } from "./DriveScreen";

export default function Game() {
  const [screen, setScreen] = useState<"garage" | "drive">("garage");
  const [trucks, setTrucks] = useState<TruckConfig[]>(DEFAULT_GARAGE);
  const [active, setActive] = useState(0);
  // stars live here so an accidental trip to the garage never wipes the count
  const [stars, setStars] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadGarage();
    if (saved) {
      setTrucks(saved.trucks);
      setActive(saved.active);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    // Safari fires non-standard gesture events for pinch; block two-finger zoom in browser tabs
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", prevent);
    document.addEventListener("gesturechange", prevent);
    return () => {
      document.removeEventListener("gesturestart", prevent);
      document.removeEventListener("gesturechange", prevent);
    };
  }, []);

  useEffect(() => {
    if (ready) saveGarage({ trucks, active });
  }, [trucks, active, ready]);

  if (!ready) return <div className="garage-sky h-full w-full" />;

  return screen === "garage" ? (
    <GarageScreen
      trucks={trucks}
      active={active}
      onSelect={setActive}
      onChange={(t) => setTrucks((ts) => ts.map((x, i) => (i === active ? t : x)))}
      onGo={() => setScreen("drive")}
    />
  ) : (
    <DriveScreen
      config={trucks[active]}
      stars={stars}
      onStars={setStars}
      onHome={() => setScreen("garage")}
    />
  );
}
