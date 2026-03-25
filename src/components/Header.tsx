const Header = () => {
  return (
    <header className="h-14 bg-background-secondary/80 backdrop-blur-xl border-b border-border-primary flex items-center px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h2 className="text-[15px] font-semibold text-text-primary tracking-tight">Host Management</h2>
      </div>
    </header>
  );
};

export default Header;