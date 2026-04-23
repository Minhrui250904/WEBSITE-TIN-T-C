function Hero({ article }) {
  if (!article) return null;

  return (
    <article className="hero-card" style={{ backgroundImage: `url(${article.image})` }}>
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="tag">{article.category}</span>
        <h2>{article.title}</h2>
        <p>{article.summary}</p>
        <div className="meta-row">
          <span>{article.author}</span>
          <span>{new Date(article.publishedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    </article>
  );
}

export default Hero;
