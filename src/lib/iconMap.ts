import {
  IconCalendar,
  IconCap,
  IconClock,
  IconHeart,
  IconInstrument,
  IconKey,
  IconMapPin,
  IconMusic,
  IconTicket,
  IconUsers,
} from "../components/Icons";
import type { IconComponent, IconKey as IconKeyType } from "../data/about.types";

/**
 * Maps the string keys stored in `about.json` to their React icon components.
 *
 * Using a `Record` with the `IconKey` union guarantees that every key defined
 * in the type system has a matching component — a missing entry causes a
 * compile-time error.
 */
const iconMap: Record<IconKeyType, IconComponent> = {
  IconCalendar,
  IconCap,
  IconClock,
  IconHeart,
  IconInstrument,
  IconKey,
  IconMapPin,
  IconMusic,
  IconTicket,
  IconUsers,
};

/** Resolve an icon key from JSON into its React component. */
export function resolveIcon(key: IconKeyType): IconComponent {
  return iconMap[key];
}

export default iconMap;
