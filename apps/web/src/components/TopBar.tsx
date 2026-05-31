type TopBarProps = {
  title: string;
};

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="top-bar">
      <div>
        <span className="top-bar-kicker">温和分析工作台</span>
        <h1>{title}</h1>
      </div>
      <div className="top-bar-actions">
        <span className="demo-pill">DEMO</span>
        <button aria-label="通知" className="icon-button" type="button">!</button>
        <span className="user-dot" aria-label="演示用户" />
      </div>
    </header>
  );
}
