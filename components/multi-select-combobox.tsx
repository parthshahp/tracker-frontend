"use client";

import * as React from "react";

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

export type MultiSelectOption = {
  label: string;
  value: string;
  isCreateOption?: boolean;
  createLabel?: string;
};

interface MultiSelectComboboxProps {
  id?: string;
  name?: string;
  placeholder?: string;
  emptyText?: string;
  options: MultiSelectOption[];
  onChange?: (values: MultiSelectOption[]) => void;
  onCreateOption?: (label: string) => Promise<MultiSelectOption | null | void>;
}

export function MultiSelectCombobox({
  id,
  name,
  placeholder = "Search options",
  emptyText = "No matches found",
  options,
  onChange,
  onCreateOption,
}: MultiSelectComboboxProps) {
  const anchorRef = useComboboxAnchor();
  const [selectedValues, setSelectedValues] = React.useState<
    MultiSelectOption[]
  >([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    setSelectedValues((current) =>
      current.map((selected) => {
        const updated = options.find((option) => option.value === selected.value);
        return updated ?? selected;
      }),
    );
  }, [options]);

  const handleValueChange = React.useCallback(
    (nextValue: MultiSelectOption[] | null) => {
      const normalized = Array.isArray(nextValue) ? nextValue : [];
      const createCandidate = normalized.find((option) => option.isCreateOption);

      if (createCandidate && onCreateOption) {
        const remaining = normalized.filter((option) => option !== createCandidate);
        setSelectedValues(remaining);
        onChange?.(remaining);
        setSearchQuery("");

        const labelToCreate = createCandidate.createLabel ?? searchQuery.trim();

        if (labelToCreate) {
          void (async () => {
            try {
              const createdOption = await onCreateOption(labelToCreate);
              if (!createdOption) {
                return;
              }

              setSelectedValues((prev) => {
                const next = [
                  ...prev.filter((option) => option.value !== createdOption.value),
                  createdOption,
                ];
                onChange?.(next);
                return next;
              });
            } catch (error) {
              console.error("Failed to create option", error);
            }
          })();
        }

        return;
      }

      setSelectedValues(normalized);
      onChange?.(normalized);
      setSearchQuery("");
    },
    [onChange, onCreateOption, searchQuery],
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
                {option.label}
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
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
