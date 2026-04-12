interface SectionHeaderProps {
  id?: string;
  icon: string;
  title: string;
}

export function SectionHeader({ id, icon, title }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <span className="material-symbols-outlined section-icon" aria-hidden>
        {icon}
      </span>
      <h3 id={id}>{title}</h3>
    </div>
  );
}
