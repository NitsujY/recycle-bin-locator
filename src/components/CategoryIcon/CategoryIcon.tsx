import {
  ArchiveBoxIcon,
  BeakerIcon,
  BoltIcon,
  LightBulbIcon,
  NewspaperIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { MaterialCategory } from "../../types/index";

interface CategoryIconProps {
  category: MaterialCategory;
  className?: string;
}

export function CategoryIcon({ category, className = "h-6 w-6" }: CategoryIconProps) {
  const classes = `${className} text-green-700`;

  if (category === MaterialCategory.Paper) {
    return <NewspaperIcon className={classes} aria-hidden="true" />;
  }
  if (category === MaterialCategory.Plastic) {
    return <BeakerIcon className={classes} aria-hidden="true" />;
  }
  if (category === MaterialCategory.Glass) {
    return <ArchiveBoxIcon className={classes} aria-hidden="true" />;
  }
  if (category === MaterialCategory.LightBulb) {
    return <LightBulbIcon className={classes} aria-hidden="true" />;
  }
  if (category === MaterialCategory.Battery) {
    return <BoltIcon className={classes} aria-hidden="true" />;
  }
  return <Squares2X2Icon className={classes} aria-hidden="true" />;
}

export default CategoryIcon;
