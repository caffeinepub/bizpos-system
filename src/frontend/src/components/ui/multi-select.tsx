import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

export interface MultiSelectOption {
  value: string;
  label: string;
  meta?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const filtered = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      opt.meta?.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const remove = (optValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optValue));
  };

  // Position the portal dropdown under the trigger
  useLayoutEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 220;

      if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
        setDropdownStyle({
          position: "fixed",
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
          maxHeight: Math.min(dropdownHeight, spaceBelow - 8),
        });
      } else {
        setDropdownStyle({
          position: "fixed",
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
          maxHeight: Math.min(dropdownHeight, spaceAbove - 8),
        });
      }
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        const portal = document.getElementById("multiselect-portal");
        if (portal?.contains(e.target as Node)) return;
        setOpen(false);
        setInputValue("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOptions = value
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean) as MultiSelectOption[];

  const openDropdown = () => {
    if (!disabled) {
      setOpen(true);
      inputRef.current?.focus();
    }
  };

  const dropdownContent = open && !disabled && (
    <div
      id="multiselect-portal"
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-md shadow-lg overflow-y-auto"
    >
      {filtered.length === 0 ? (
        <div className="py-3 px-3 text-sm text-muted-foreground text-center">
          No options found.
        </div>
      ) : (
        <div className="py-1">
          {filtered.map((opt) => {
            const isSelected = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggle(opt.value);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none text-left ${
                  isSelected
                    ? "bg-blue-50 text-blue-800"
                    : "hover:bg-gray-50 text-gray-900"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 12 12"
                      aria-hidden="true"
                    >
                      <title>Selected</title>
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="flex-1 min-w-0">{opt.label}</span>
                {opt.meta && (
                  <span className="flex-shrink-0 text-xs text-muted-foreground font-mono">
                    {opt.meta}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger / input area */}
      <div
        className={`flex flex-wrap gap-1.5 items-center border rounded-md px-3 py-2 min-h-10 cursor-text bg-white transition-colors ${
          open
            ? "ring-2 ring-blue-500 border-blue-500"
            : "border-input hover:border-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={openDropdown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openDropdown();
        }}
      >
        {/* Selected chips */}
        {selectedOptions.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full max-w-[180px]"
          >
            <span className="truncate">{opt.label}</span>
            {!disabled && (
              <button
                type="button"
                onMouseDown={(e) => remove(opt.value, e)}
                className="flex-shrink-0 rounded-full hover:bg-blue-200 p-0.5"
                aria-label={`Remove ${opt.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent placeholder:text-muted-foreground"
          placeholder={value.length === 0 ? placeholder : ""}
          value={inputValue}
          disabled={disabled}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label="Search options"
        />
      </div>

      {/* Portal dropdown — escapes any overflow:hidden ancestor */}
      {typeof document !== "undefined" &&
        ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
}

// Single-select inline searchable dropdown
export interface SingleSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SingleSearchSelectProps {
  options: SingleSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function SingleSearchSelect({
  options,
  value,
  onChange,
  placeholder = "Search and select...",
  disabled = false,
  emptyMessage = "No options found.",
  className = "",
}: SingleSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find((o) => o.value === value);

  const filtered = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      opt.description?.toLowerCase().includes(inputValue.toLowerCase()),
  );

  // Position portal dropdown under (or above) the trigger
  const calcAndSetPos = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 220;

    if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        maxHeight: Math.min(dropdownHeight, spaceBelow - 8),
      });
    } else {
      setDropdownStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        maxHeight: Math.min(dropdownHeight, spaceAbove - 8),
      });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: calcAndSetPos is stable
  useLayoutEffect(() => {
    if (open) calcAndSetPos();
  }, [open]);

  // Reposition on scroll/resize so dropdown follows trigger inside scrollable modals
  // biome-ignore lint/correctness/useExhaustiveDependencies: calcAndSetPos is stable
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", calcAndSetPos, true);
    window.addEventListener("resize", calcAndSetPos);
    return () => {
      window.removeEventListener("scroll", calcAndSetPos, true);
      window.removeEventListener("resize", calcAndSetPos);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        const portal = document.getElementById("singlesearch-portal");
        if (portal?.contains(e.target as Node)) return;
        setOpen(false);
        setInputValue("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
    setInputValue("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setInputValue("");
    inputRef.current?.focus();
  };

  const openDropdown = () => {
    if (!disabled) {
      setOpen(true);
      inputRef.current?.focus();
    }
  };

  const dropdownContent = open && !disabled && (
    <div
      id="singlesearch-portal"
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-md shadow-lg overflow-y-auto"
    >
      {filtered.length === 0 ? (
        <div className="py-3 px-3 text-sm text-muted-foreground text-center">
          {emptyMessage}
        </div>
      ) : (
        <div className="py-1">
          {filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt.value);
              }}
              className={`w-full flex flex-col px-3 py-2 text-sm cursor-pointer select-none text-left hover:bg-gray-50 ${
                value === opt.value ? "bg-blue-50" : ""
              }`}
            >
              <span className="font-medium text-gray-900">{opt.label}</span>
              {opt.description && (
                <span className="text-xs text-muted-foreground mt-0.5">
                  {opt.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex items-center border rounded-md px-3 py-2 min-h-10 bg-white cursor-text transition-colors ${
          open
            ? "ring-2 ring-blue-500 border-blue-500"
            : "border-input hover:border-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={openDropdown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openDropdown();
        }}
      >
        {selectedOption && !open ? (
          <span className="flex-1 text-sm text-gray-900 truncate">
            {selectedOption.label}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-0 outline-none text-sm bg-transparent placeholder:text-muted-foreground"
            placeholder={
              selectedOption && !open ? selectedOption.label : placeholder
            }
            value={inputValue}
            disabled={disabled}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        )}
        {value && !disabled && (
          <button
            type="button"
            onMouseDown={handleClear}
            className="flex-shrink-0 ml-1 rounded-full p-0.5 hover:bg-gray-100 text-gray-400"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Portal dropdown — escapes any overflow:hidden ancestor */}
      {typeof document !== "undefined" &&
        ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
}
