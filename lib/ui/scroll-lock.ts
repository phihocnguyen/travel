type SavedProperty = { name: string; value: string; priority: string };
type SavedScrollStyle = { element: HTMLElement; properties: SavedProperty[] };

const locks = new Set<symbol>();
let saved: SavedScrollStyle[] = [];

/** Intro and dialogs may overlap; only the final owner restores page scrolling. */
export function lockPageScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  if (locks.size === 0) {
    saved = [document.documentElement, document.body].map(element => ({
      element,
      properties: ["overflow", "overflow-x", "overflow-y"].map(name => ({
        name, value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name),
      })),
    }));
    for (const { element } of saved) element.style.setProperty("overflow", "hidden");
  }
  const owner = Symbol("page-scroll-lock");
  locks.add(owner);
  return () => {
    if (!locks.delete(owner) || locks.size > 0) return;
    for (const { element, properties } of saved) {
      element.style.removeProperty("overflow");
      element.style.removeProperty("overflow-x");
      element.style.removeProperty("overflow-y");
      for (const { name, value, priority } of properties) if (value) element.style.setProperty(name, value, priority);
    }
    saved = [];
  };
}
