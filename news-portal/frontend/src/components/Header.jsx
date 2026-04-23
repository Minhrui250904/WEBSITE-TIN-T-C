function Header({ categories }) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <p className="brand-kicker">DAILY EDITION</p>
        <h1>PulseWire</h1>
      </div>
      <nav className="category-nav">
        {categories.map((item) => (
          <button key={item} className="category-chip" type="button">
            {item}
          </button>
        ))}
      </nav>
    </header>
  );
}

export default Header;
