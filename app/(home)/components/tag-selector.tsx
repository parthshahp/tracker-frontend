"use client";

import { MultiSelectCombobox } from "@/components/multi-select-combobox";
import type { MultiSelectOption } from "@/components/multi-select-combobox";

export type TagSelectorProps = {
  options: MultiSelectOption[];
  value: MultiSelectOption[];
  onChange: (next: MultiSelectOption[]) => void;
  onCreateOption: (label: string) => Promise<MultiSelectOption | null | void>;
};

export function TagSelector({ options, value, onChange, onCreateOption }: TagSelectorProps) {
  return (
    <MultiSelectCombobox
      id="tag-selector"
      name="tag-selector"
      placeholder="Search tags"
      options={options}
      value={value}
      onChange={onChange}
      onCreateOption={onCreateOption}
    />
  );
}
