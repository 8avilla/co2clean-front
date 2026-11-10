import type { ElementType } from 'react';
import {
  FireExtinguisher,
  Factory,
  Car,
  FileText,
  Cloud,
  Zap,
  Trash2,
  Package,
  Cog,
  Snowflake,
  Truck,
  Bus,
  Droplets,
  Thermometer,
  Plane,
  Tag,
} from 'lucide-react';

export const DEFAULT_CATEGORY_ICON_ID = 'Tag';

// Single source of truth for the icons a source category can use
export const CATEGORY_ICONS: Record<string, ElementType> = {
  FireExtinguisher,
  Factory,
  Car,
  FileText,
  Cloud,
  Zap,
  Trash2,
  Package,
  Cog,
  Snowflake,
  Truck,
  Bus,
  Droplets,
  Thermometer,
  Plane,
  Tag,
};

// Icons selectable in the category form
export const SELECTABLE_CATEGORY_ICON_IDS: string[] = Object.keys(CATEGORY_ICONS);

export const getCategoryIcon = (iconId?: string): ElementType =>
  CATEGORY_ICONS[iconId || DEFAULT_CATEGORY_ICON_ID] ?? CATEGORY_ICONS[DEFAULT_CATEGORY_ICON_ID];
