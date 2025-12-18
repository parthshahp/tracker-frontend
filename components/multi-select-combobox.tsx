"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { TagColorDot } from "@/components/tag-color-dot";

export type MultiSelectOption = {
  label: string;
  value: string;
  color?: string | null;
  isCreateOption?: boolean;
  createLabel?: string;
};

interface MultiSelectComboboxProps {
  id?: string;
  name?: string;
  placeholder?: string;
  emptyText?: string;
  options: MultiSelectOption[];
  value?: MultiSelectOption[];
  onChange?: (values: MultiSelectOption[]) => void;
  onCreateOption?: (label: string) => Promise<MultiSelectOption | null | void>;
}

export function MultiSelectCombobox({
  id,
  name,
  placeholder = "Search options",
  emptyText = "No matches found",
  options,
  value,
  onChange,
  onCreateOption,
}: MultiSelectComboboxProps) {
  const anchorRef = useComboboxAnchor();
  const [internalValues, setInternalValues] = React.useState<MultiSelectOption[]>([]);
  const isControlled = value !== undefined;
  const selectedValues = React.useMemo(
    () => (isControlled ? value ?? [] : internalValues),
    [internalValues, isControlled, value],
  );
  const selectedValuesRef = React.useRef<MultiSelectOption[]>(selectedValues);
  React.useEffect(() => {
    selectedValuesRef.current = selectedValues;
  }, [selectedValues]);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (isControlled) return;
    setInternalValues((current) =>
      current.map((selected) => {
        const updated = options.find((option) => option.value === selected.value);
        return updated ?? selected;
      }),
    );
  }, [options, isControlled]);

  const updateSelection = React.useCallback(
    (next: MultiSelectOption[]) => {
      if (!isControlled) {
        setInternalValues(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const applySelection = React.useCallback(
    (updater: (prev: MultiSelectOption[]) => MultiSelectOption[]) => {
      const next = updater(selectedValuesRef.current);
      updateSelection(next);
    },
    [updateSelection],
  );

  const handleValueChange = React.useCallback(
    (nextValue: MultiSelectOption[] | null) => {
      const normalized = Array.isArray(nextValue) ? nextValue : [];
      const createCandidate = normalized.find((option) => option.isCreateOption);

      if (createCandidate && onCreateOption) {
        const remaining = normalized.filter((option) => option !== createCandidate);
        updateSelection(remaining);
        setSearchQuery("");

        const labelToCreate = createCandidate.createLabel ?? searchQuery.trim();

        if (labelToCreate) {
          void (async () => {
            try {
              const createdOption = await onCreateOption(labelToCreate);
              if (!createdOption) {
                return;
              }

              applySelection((prev) => [
                ...prev.filter((option) => option.value !== createdOption.value),
                createdOption,
              ]);
            } catch (error) {
              console.error("Failed to create option", error);
            }
          })();
        }

        return;
      }

      updateSelection(normalized);
      setSearchQuery("");
    },
    [applySelection, onCreateOption, searchQuery, updateSelection],
  );

  const derivedItems = React.useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const baseOptions = options.filter(
      (option) => !selectedValues.some((selected) => selected.value === option.value),
    );

    if (trimmedQuery && onCreateOption) {
      return [
        ...baseOptions,
        {
          label: `Create new tag "${trimmedQuery}"`,
          value: `__create__${trimmedQuery}`,
          isCreateOption: true,
          createLabel: trimmedQuery,
        } satisfies MultiSelectOption,
      ];
    }

    return baseOptions;
  }, [options, selectedValues, searchQuery, onCreateOption]);

  return (
    <Combobox
      items={derivedItems}
      multiple
      name={name}
      value={selectedValues}
      onValueChange={handleValueChange}
      autoHighlight
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
      filter={(item, query) =>
        item.isCreateOption
          ? true
          : item.label.toLowerCase().includes(query.toLowerCase())
      }
    >
      <ComboboxChips ref={anchorRef}>
        <ComboboxValue>
          {(selected) => {
            const entries = Array.isArray(selected)
              ? (selected as MultiSelectOption[])
              : [];

            if (!entries.length) {
              return null;
            }

            return entries.map((option) => (
              <ComboboxChip
                key={option.value}
                className="bg-secondary text-secondary-foreground border border-secondary/40 px-2 py-0.5"
              >
                <span className="flex items-center gap-1.5">
                  <TagColorDot color={option.color} />
                  <span>{option.label}</span>
                </span>
              </ComboboxChip>
            ));
          }}
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          placeholder={placeholder}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.isCreateOption ? (
                <>
                  <PlusIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{item.label}</span>
                </>
              ) : (
                <>
                  <TagColorDot color={item.color} />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
