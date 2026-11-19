{/* Mintlify evaluates each snippet export in isolation inside the page's MDX
    scope, so everything the component references must live inside this one
    export.

    The carousel only presents: titles, descriptions and media are passed in
    by the page that owns them. Every description is rendered at once and
    stacked in one grid cell so the card keeps the height of the longest one
    and the controls never jump between slides.

    Layout and colour live in styles.css under .feature-carousel. */}

export const FeatureCarousel = ({ label, items }) => {
  const [active, setActive] = useState(0);
  const count = items.length;
  const go = (index) => setActive((index + count) % count);

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") go(active + 1);
    if (event.key === "ArrowLeft") go(active - 1);
  };

  const chevron = (
    <span className="svg-icon" style={{ "--svg-icon": 'url("/images/icons/chevron-right.svg")', "--svg-icon-size": "18px" }} aria-hidden="true" />
  );

  const current = items[active];

  return (
    <section className="feature-carousel" aria-roledescription="carousel" aria-label={label} onKeyDown={onKeyDown}>
      <div className="feature-carousel-media">
        <Frame>
          <img key={current.image} src={current.image} alt={current.alt} />
        </Frame>
        <button type="button" className="feature-carousel-arrow is-previous" aria-label="Previous" onClick={() => go(active - 1)}>
          {chevron}
        </button>
        <button type="button" className="feature-carousel-arrow is-next" aria-label="Next" onClick={() => go(active + 1)}>
          {chevron}
        </button>
      </div>
      <div className="feature-carousel-text" aria-live="polite">
        {items.map((item, index) => (
          <div
            key={item.title}
            className={`feature-carousel-slide${index === active ? " is-active" : ""}`}
            aria-hidden={index !== active}
          >
            <p className="feature-carousel-title">{item.title}</p>
            <p className="feature-carousel-description">{item.description}</p>
          </div>
        ))}
      </div>
      <div className="feature-carousel-dots">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={`feature-carousel-dot${index === active ? " is-active" : ""}`}
            aria-label={`${item.title} (${index + 1} of ${count})`}
            aria-current={index === active ? "true" : undefined}
            onClick={() => go(index)}
          />
        ))}
      </div>
    </section>
  );
};
