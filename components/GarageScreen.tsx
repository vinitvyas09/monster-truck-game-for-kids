"use client";

import { useRef, useState } from "react";
import type { TruckConfig } from "@/lib/trucks";
import { BODIES, DECALS, PALETTE, WHEELS, cycle, randomTruck } from "@/lib/trucks";
import { pop, unlockAudio, voice, whoosh } from "@/lib/audio";
import { MonsterTruck } from "./TruckArt";
import { CloudArt, DiceIcon, FlameIcon, PlayIcon, SunArt, TruckIcon, WheelIcon } from "./icons";

type Props = {
  trucks: TruckConfig[];
  active: number;
  onSelect: (i: number) => void;
  onChange: (t: TruckConfig) => void;
  onGo: () => void;
};

export function GarageScreen({ trucks, active, onSelect, onChange, onGo }: Props) {
  const [boing, setBoing] = useState(0);
  const [honking, setHonking] = useState(false);
  const honkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const truck = trucks[active];

  function tweak(partial: Partial<TruckConfig>) {
    unlockAudio();
    pop();
    onChange({ ...truck, ...partial });
    setBoing((b) => b + 1);
  }

  return (
    <div className="garage-sky relative flex h-full w-full select-none flex-col overflow-hidden touch-none">
      {/* sky decorations */}
      <svg className="cloud absolute top-[12%] w-[18vmin]" style={{ animationDuration: "75s" }} viewBox="0 0 140 60" aria-hidden>
        <CloudArt x={0} y={0} />
      </svg>
      <svg
        className="cloud absolute top-[30%] w-[13vmin]"
        style={{ animationDuration: "105s", animationDelay: "-40s" }}
        viewBox="0 0 140 60"
        aria-hidden
      >
        <CloudArt x={0} y={0} />
      </svg>
      <svg className="absolute right-[5%] top-[4%] w-[15vmin]" viewBox="0 0 120 120" aria-hidden>
        <SunArt x={60} y={60} r={32} />
      </svg>
      {/* ground */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] border-t-8 border-[#3f9132] bg-gradient-to-b from-[#7ed957] to-[#52b13c]" />

      {/* top bar: garage slots + title + dice */}
      <div className="safe-t safe-x relative z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="flex gap-2">
          {trucks.map((t, i) => (
            <button
              key={i}
              aria-label={`Truck ${i + 1}`}
              className={`toy-btn h-16 w-20 p-1 sm:h-[72px] sm:w-[92px] ${
                i === active ? "bg-[#ffd43b]" : "bg-white/85"
              }`}
              onPointerDown={() => {
                unlockAudio();
                pop();
                onSelect(i);
                setBoing((b) => b + 1);
              }}
            >
              <MonsterTruck config={t} className="pointer-events-none h-full w-full" />
            </button>
          ))}
        </div>
        <h1 className="game-title pt-1 text-center leading-none">MONSTER GARAGE</h1>
        <button
          aria-label="Surprise truck"
          className="toy-btn h-16 w-16 shrink-0 bg-white/85 p-2.5 sm:h-[72px] sm:w-[72px]"
          onPointerDown={() => tweak(randomTruck())}
        >
          <DiceIcon className="h-full w-full" />
        </button>
      </div>

      {/* the truck on stage, wheels anchored to the grass horizon (the ground
          strip is 30% tall, so this stage ends exactly at its top edge);
          the 8% downward shift compensates for the art's padding below the
          wheels so the tires touch the grass on every screen shape */}
      <div className="pointer-events-none absolute inset-x-0 top-[16%] bottom-[30%] z-10 flex items-end justify-center">
        <div className="aspect-[4/3] h-full max-w-[92vw] translate-y-[8%]">
          <button
            aria-label="Honk"
            className="truck-idle pointer-events-auto h-full w-full cursor-pointer"
            onPointerDown={() => {
              unlockAudio();
              voice(truck.body);
              setBoing((b) => b + 1);
              setHonking(true);
              if (honkTimer.current) clearTimeout(honkTimer.current);
              honkTimer.current = setTimeout(() => setHonking(false), 1000);
            }}
          >
            <div key={boing} className={`boing h-full w-full ${honking ? "voice-flash" : ""}`}>
              <MonsterTruck config={truck} className="pointer-events-none h-full w-full drop-shadow-[0_10px_0_rgba(29,43,79,0.12)]" />
            </div>
          </button>
        </div>
      </div>

      {/* bottom controls */}
      <div className="safe-b safe-x relative z-10 mt-auto flex flex-wrap items-center justify-center gap-2.5 px-3 pb-4 pt-1 sm:gap-3 sm:pb-5">
        <div className="flex gap-2 rounded-full border-4 border-[#1d2b4f] bg-white/85 px-2.5 py-1.5 sm:gap-2.5">
          {PALETTE.map((p) => (
            <button
              key={p.id}
              aria-label={`Paint ${p.id}`}
              className="h-11 w-11 rounded-full border-4 border-[#1d2b4f] transition-transform sm:h-12 sm:w-12"
              style={{
                background: p.main,
                boxShadow: truck.colorId === p.id ? "inset 0 0 0 4px #fff" : "inset 0 -5px 0 rgba(29,43,79,0.25)",
                transform: truck.colorId === p.id ? "scale(1.12)" : undefined,
              }}
              onPointerDown={() => tweak({ colorId: p.id })}
            />
          ))}
        </div>
        <button className="toy-btn h-[76px] w-[76px] gap-0.5 bg-[#4dabf7] p-1.5" onPointerDown={() => tweak({ body: cycle(BODIES, truck.body) })}>
          <TruckIcon className="h-9 w-9" />
          <span className="toy-label">BODY</span>
        </button>
        <button className="toy-btn h-[76px] w-[76px] gap-0.5 bg-[#9775fa] p-1.5" onPointerDown={() => tweak({ wheels: cycle(WHEELS, truck.wheels) })}>
          <WheelIcon className="h-9 w-9" />
          <span className="toy-label">WHEELS</span>
        </button>
        <button className="toy-btn h-[76px] w-[76px] gap-0.5 bg-[#ff922b] p-1.5" onPointerDown={() => tweak({ decal: cycle(DECALS, truck.decal) })}>
          <FlameIcon className="h-9 w-9" />
          <span className="toy-label">STYLE</span>
        </button>
        {/* spacer keeps GO! out of accidental reach while mashing STYLE */}
        <div className="w-2 sm:w-6" aria-hidden />
        <button
          className="toy-btn h-[76px] bg-[#51cf66] px-6"
          onPointerDown={() => {
            unlockAudio();
            whoosh();
            onGo();
          }}
        >
          <span className="flex items-center gap-2">
            <PlayIcon className="h-10 w-10" />
            <span className="text-4xl font-bold tracking-wide text-white [text-shadow:0_3px_0_rgba(29,43,79,0.45)]">GO!</span>
          </span>
        </button>
      </div>
    </div>
  );
}
