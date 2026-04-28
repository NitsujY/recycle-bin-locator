import { useTranslation } from "react-i18next";

export interface DistanceFilterProps {
  value: number;
  onChange: (value: number) => void;
}

const DISTANCE_OPTIONS = [100, 200, 500] as const;

export function DistanceFilter({ value, onChange }: DistanceFilterProps) {
  const { t } = useTranslation();

  return (
    <label className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-sm shadow-sm border border-gray-200">
      <span className="font-medium text-gray-700 hidden sm:inline">
        {t("distance.filter_label", "Range")}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded border border-gray-300 bg-transparent px-1 py-0.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
        aria-label={t("distance.filter_label", "Range")}
      >
        {DISTANCE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option < 1000 ? `${option}m` : `${option / 1000}km`}
          </option>
        ))}
      </select>
    </label>
  );
}

export default DistanceFilter;
