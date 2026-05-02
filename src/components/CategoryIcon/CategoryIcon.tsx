import { MaterialCategory } from "../../types/index";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CATEGORY_ICON_MAP: Record<MaterialCategory, string> = {
  [MaterialCategory.Paper]:               `${BASE}/icons/categories/recyclable_1.png`,
  [MaterialCategory.Metal]:              `${BASE}/icons/categories/recyclable_2.png`,
  [MaterialCategory.Plastic]:            `${BASE}/icons/categories/recyclable_3.png`,
  [MaterialCategory.PlasticBottle]:      `${BASE}/icons/categories/recyclable_4.png`,
  [MaterialCategory.Glass]:              `${BASE}/icons/categories/recyclable_5.png`,
  [MaterialCategory.LightBulb]:          `${BASE}/icons/categories/recyclable_6.png`,
  [MaterialCategory.Battery]:            `${BASE}/icons/categories/recyclable_7.png`,
  [MaterialCategory.SmallAppliance]:     `${BASE}/icons/categories/recyclable_8.png`,
  [MaterialCategory.RegulatedEquipment]: `${BASE}/icons/categories/recyclable_9.png`,
  [MaterialCategory.Clothes]:            `${BASE}/icons/categories/recyclable_10.png`,
  [MaterialCategory.Bbq]:                `${BASE}/icons/categories/recyclable_11.png`,
  [MaterialCategory.BeverageCarton]:     `${BASE}/icons/categories/recyclable_12.png`,
  [MaterialCategory.FoodWaste]:          `${BASE}/icons/categories/recyclable_13.png`,
  [MaterialCategory.Other]:              "",
};

interface CategoryIconProps {
  category: MaterialCategory;
  className?: string;
  /** Alt text for the icon image. Defaults to the category string. */
  alt?: string;
}

export function CategoryIcon({ category, className = "h-6 w-6", alt = "" }: CategoryIconProps) {
  const src = CATEGORY_ICON_MAP[category];
  if (!src) {
    // Fallback for "other" — a simple recycling symbol text
    return (
      <span className={`${className} flex items-center justify-center text-gray-500 text-xs font-bold`} aria-hidden="true">
        ♻
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} object-contain`}
      aria-hidden={alt === "" ? "true" : undefined}
    />
  );
}

export default CategoryIcon;
