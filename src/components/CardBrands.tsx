const brands = ["Visa", "Mastercard", "Amex", "Discover"];

/**
 * Text marks rather than borrowed logos: they tell the donor which cards work
 * without reproducing brand artwork we would have to keep pixel-perfect.
 */
function CardBrands() {
  return (
    <ul aria-label="Accepted card brands" className="flex flex-wrap items-center gap-1.5">
      {brands.map((brand) => (
        <li
          key={brand}
          className="rounded-md border border-line bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted"
        >
          {brand}
        </li>
      ))}
    </ul>
  );
}

export default CardBrands;
