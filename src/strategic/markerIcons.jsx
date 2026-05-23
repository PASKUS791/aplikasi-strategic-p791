/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

function IconShell({ children, className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function resolveIconKey(category) {
  if (category?.iconKey) {
    return category.iconKey;
  }

  const lookup = `${category?.icon ?? ""} ${category?.name ?? ""}`.toLowerCase();

  if (lookup.includes("outpost")) {
    return "hostile-outpost";
  }
  if (lookup.includes("rocketeer") || lookup.includes("rpg")) {
    return "rocketeer";
  }
  if (lookup.includes("sniper")) {
    return "sniper";
  }
  if (lookup.includes("vip")) {
    return "vip-target";
  }
  if (lookup.includes("camp") || lookup.includes("ambush")) {
    return "camp-ambush";
  }
  if (lookup.includes("minefield")) {
    return "enemy-minefield";
  }
  if (lookup.includes("machine gun")) {
    return "enemy-machine-gunner";
  }
  if (lookup.includes("heli landing")) {
    return "enemy-heli-landing";
  }
  if (lookup.includes("explosive target")) {
    return "enemy-explosive-target";
  }
  if (lookup.includes("enemy")) {
    return "enemy-unit";
  }
  if (lookup.includes("objective")) {
    return "objective";
  }
  if (lookup.includes("anti-air") || lookup.includes("mortar") || lookup.includes("warning")) {
    return "anti-air";
  }
  if (lookup.includes("resource")) {
    return "resources";
  }
  if (lookup.includes("friendly")) {
    return "friendly";
  }
  if (lookup.includes("bunker")) {
    return "bunker";
  }
  if (lookup.includes("hostile")) {
    return "hostile-location";
  }

  return null;
}

export function MarkerCategoryGlyph({
  category,
  fallbackText = "?",
  className = "h-4 w-4",
}) {
  const iconKey = resolveIconKey(category);

  if (iconKey === "hostile-location") {
    return (
      <IconShell className={className}>
        <path d="M10 2.5 17 6v8L10 17.5 3 14V6L10 2.5Z" />
        <path d="M10 6v8" />
        <path d="M6.5 8h7" />
      </IconShell>
    );
  }

  if (iconKey === "hostile-outpost") {
    return (
      <IconShell className={className}>
        <path d="M4 16V6.5L10 4l6 2.5V16" />
        <path d="M4 16h12" />
        <path d="M7.5 9.5h5" />
        <path d="M10 6.5v6" />
      </IconShell>
    );
  }

  if (iconKey === "objective") {
    return (
      <IconShell className={className}>
        <circle cx="10" cy="10" r="6.2" />
        <circle cx="10" cy="10" r="2.3" />
        <path d="M10 3v2.2" />
        <path d="M10 14.8V17" />
        <path d="M3 10h2.2" />
        <path d="M14.8 10H17" />
      </IconShell>
    );
  }

  if (iconKey === "rocketeer") {
    return (
      <IconShell className={className}>
        <path d="M5 13.5 12.8 5.7" />
        <path d="m11.9 4.8 3.3 3.3" />
        <path d="M8.2 10.3 6 16" />
        <path d="M9.8 8.7 15.5 11" />
      </IconShell>
    );
  }

  if (iconKey === "sniper") {
    return (
      <IconShell className={className}>
        <circle cx="10" cy="10" r="5.5" />
        <path d="M10 3v3" />
        <path d="M10 14v3" />
        <path d="M3 10h3" />
        <path d="M14 10h3" />
      </IconShell>
    );
  }

  if (iconKey === "enemy-unit") {
    return (
      <IconShell className={className}>
        <path d="M10 4.2c1.8 0 3.1 1.2 3.1 2.8S11.8 9.8 10 9.8 6.9 8.6 6.9 7 8.2 4.2 10 4.2Z" />
        <path d="M5.7 15.8c.7-2.2 2.3-3.6 4.3-3.6s3.6 1.4 4.3 3.6" />
      </IconShell>
    );
  }

  if (iconKey === "vip-target") {
    return (
      <IconShell className={className}>
        <path d="m10 3.2 1.7 3.5 3.9.6-2.8 2.7.7 3.9-3.5-1.9-3.5 1.9.7-3.9-2.8-2.7 3.9-.6L10 3.2Z" />
      </IconShell>
    );
  }

  if (iconKey === "camp-ambush") {
    return (
      <IconShell className={className}>
        <path d="M4 14.8 10 5.2l6 9.6" />
        <path d="M10 5.2v9.6" />
        <path d="M6.2 14.8h7.6" />
      </IconShell>
    );
  }

  if (iconKey === "anti-air") {
    return (
      <IconShell className={className}>
        <path d="M10 2.8 17 15H3L10 2.8Z" />
        <path d="M10 7v3.9" />
        <circle cx="10" cy="13.2" r="0.65" fill="currentColor" stroke="none" />
      </IconShell>
    );
  }

  if (iconKey === "enemy-mortar") {
    return (
      <IconShell className={className}>
        <path d="M5.5 13.8h9" />
        <path d="M8 13.8 6.7 9.2" />
        <path d="M12 13.8 13.3 9.2" />
        <path d="M7.4 9.2h5.2l-1.3-3.8H8.7Z" />
      </IconShell>
    );
  }

  if (iconKey === "resources") {
    return (
      <IconShell className={className}>
        <path d="M4 7.5 10 4l6 3.5-6 3L4 7.5Z" />
        <path d="M4 7.5V13l6 3 6-3V7.5" />
        <path d="M10 10.5V16" />
      </IconShell>
    );
  }

  if (iconKey === "enemy-explosive-target") {
    return (
      <IconShell className={className}>
        <path d="M10 3.5v4.2" />
        <path d="M7.2 5.4c-1.7 1.1-2.8 2.9-2.8 5 0 3.3 2.6 6.1 5.6 6.1s5.6-2.8 5.6-6.1c0-2.1-1.1-3.9-2.8-5" />
        <path d="m7.2 12 1.4-1.1 1 1.3 2.2-2.6" />
      </IconShell>
    );
  }

  if (iconKey === "friendly") {
    return (
      <IconShell className={className}>
        <path d="M10 3.5 15.5 6v4.2c0 3.1-2 5.5-5.5 6.8-3.5-1.3-5.5-3.7-5.5-6.8V6L10 3.5Z" />
        <path d="m7.2 10.1 1.8 1.8 3.8-4" />
      </IconShell>
    );
  }

  if (iconKey === "enemy-heli-landing") {
    return (
      <IconShell className={className}>
        <path d="M6 10.2h8" />
        <path d="M8.1 10.2v3.2" />
        <path d="M11.9 10.2v3.2" />
        <path d="M5.4 7.7h9.2" />
        <path d="M10 6V7.7" />
        <path d="M4.2 13.8h11.6" />
      </IconShell>
    );
  }

  if (iconKey === "bunker") {
    return (
      <IconShell className={className}>
        <path d="M3.5 12.5 10 5l6.5 7.5" />
        <path d="M5.5 12.5V16h9v-3.5" />
        <path d="M8 16v-3.2h4V16" />
      </IconShell>
    );
  }

  if (iconKey === "enemy-minefield") {
    return (
      <IconShell className={className}>
        <circle cx="10" cy="10" r="2.2" />
        <path d="M10 3v3" />
        <path d="M10 14v3" />
        <path d="M3 10h3" />
        <path d="M14 10h3" />
        <path d="m5.1 5.1 2.1 2.1" />
        <path d="m12.8 12.8 2.1 2.1" />
        <path d="m14.9 5.1-2.1 2.1" />
        <path d="m7.2 12.8-2.1 2.1" />
      </IconShell>
    );
  }

  if (iconKey === "enemy-machine-gunner") {
    return (
      <IconShell className={className}>
        <path d="M4 11h8.8" />
        <path d="M11.6 9.2h2.6" />
        <path d="M6.2 11v3" />
        <path d="M9.2 11v3" />
        <path d="m13.8 10.1 2.2 1.3" />
      </IconShell>
    );
  }

  return (
    <span className={`grid place-items-center font-bold uppercase ${className}`}>
      {fallbackText}
    </span>
  );
}
