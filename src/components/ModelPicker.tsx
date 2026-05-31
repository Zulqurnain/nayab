"use client";
import { MODELS, type ModelId } from "@/lib/types";
import { ChevronDownIcon } from "./icons";

interface Props {
  value: ModelId;
  onChange: (id: ModelId) => void;
  isPaid: boolean;
  onNeedsPaid: () => void;
}

export function ModelPicker({ value, onChange, isPaid, onNeedsPaid }: Props) {
  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value as ModelId;
    const model = MODELS.find((m) => m.id === id);
    if (model?.tier === "paid" && !isPaid) {
      onNeedsPaid();
      return;
    }
    onChange(id);
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        className="appearance-none bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium pl-2.5 pr-6 py-1.5 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer transition-colors"
        title="Select model"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}{m.tier === "paid" ? " ✦" : ""}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-stone-500 pointer-events-none" />
    </div>
  );
}
