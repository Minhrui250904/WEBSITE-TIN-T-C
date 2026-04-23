function ArticleList({ title, articles, compact = false }) {
  return (
    <section className="section-block">
      <div className="section-title-row">
        <h3>{title}</h3>
      </div>
      <div className={`article-grid ${compact ? "compact" : ""}`}>
        {articles.map((item) => (
          <article key={item.id} className="news-card">
            <img src={item.image} alt={item.title} loading="lazy" />
            <div className="news-card-body">
              <span className="tag">{item.category}</span>
              <h4>{item.title}</h4>
              {!compact && <p>{item.summary}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ArticleList;
