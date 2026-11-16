import { RevealRule } from "./reveal";
export function SectionHeading({
  number,
  label,
  title,
}: {
  number: string;
  label: string;
  title: string;
}) {
  return (
    <div className="section-heading">
      <div className="section-index">
        <span>{number}</span>
        <span>{label}</span>
      </div>
      <h2>{title}</h2>
      <RevealRule />
    </div>
  );
}
