function Sidebar({ latest }) {
  return (
    <aside className="sidebar">
      <h3>Bản tin nhanh</h3>
      <ul>
        {latest.slice(0, 4).map((item) => (
          <li key={item.id}>
            <p className="side-title">{item.title}</p>
            <p className="side-meta">
              {item.author} | {new Date(item.publishedAt).toLocaleDateString("vi-VN")}
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
