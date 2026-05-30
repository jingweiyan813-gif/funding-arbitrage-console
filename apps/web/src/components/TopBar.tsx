type TopBarProps = {
  title: string;
};

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="top-bar">
      <div>
        <span className="top-bar-kicker">Calm Analytics Console</span>
        <h1>{title}</h1>
      </div>
      <div className="top-bar-actions">
        <span className="demo-pill">Demo Mode</span>
        <button aria-label="Notifications" className="icon-button" type="button">!</button>
        <span className="user-dot" aria-label="Demo user" />
      </div>
    </header>
  );
}
