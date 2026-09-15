import Icon from "./Icon";

// The search box used on every list. A clear button appears once something is
// typed, and Escape clears it too.
export default function SearchInput({ value, onChange, placeholder = "Search", label, className = "" }) {
  return (
    <div className={`search${className ? ` ${className}` : ""}`}>
      <Icon name="search" size={16} color="#5B5470" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label={label || placeholder}
      />
      {value && (
        <button
          type="button"
          className="search-x"
          aria-label="Clear search"
          data-tip="Clear the search (Esc)"
          onClick={() => onChange("")}
        >
          <Icon name="plus" size={14} strokeWidth={2.4} style={{ transform: "rotate(45deg)" }} />
        </button>
      )}
    </div>
  );
}
