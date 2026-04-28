import {
  ArchiveBoxIcon,
  TrashIcon,
  CubeIcon,
  LightBulbIcon,
  NewspaperIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";
import { MaterialCategory } from "../../types/index";

interface CategoryIconProps {
  category: MaterialCategory;
  className?: string;
}

export function CategoryIcon({ category, className = "h-6 w-6" }: CategoryIconProps) {
  if (category === MaterialCategory.Paper) {
    return <NewspaperIcon className={`${className} text-blue-600`} aria-hidden="true" />;
  }
  if (category === MaterialCategory.Metal) {
    return <Cog6ToothIcon className={`${className} text-yellow-500`} aria-hidden="true" />;
  }
  if (category === MaterialCategory.Plastic) {
    return <TrashIcon className={`${className} text-amber-700`} aria-hidden="true" />;
  }
  if (category === MaterialCategory.Glass) {
    return <ArchiveBoxIcon className={`${className} text-teal-600`} aria-hidden="true" />;
  }
  if (category === MaterialCategory.LightBulb) {
    return <LightBulbIcon className={`${className} text-orange-500`} aria-hidden="true" />;
  }
  if (category === MaterialCategory.Battery) {
    return <BoltIcon className={`${className} text-red-600`} aria-hidden="true" />;
  }
  return <CubeIcon className={`${className} text-gray-500`} aria-hidden="true" />;
}

export default CategoryIcon;
