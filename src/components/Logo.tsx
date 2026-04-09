import { Link } from "react-router-dom";
import logo from "@/assets/nama-logo.jpg";
export default function Logo({
  size = 40
}: {
  size?: number;
}) {
  return <Link to="/" className="inline-flex items-center gap-2" aria-label="NAMA University Portal home">
      <img src={logo} alt="NAMA Foundation logo" width={size} height={size} className="nama-logo" />
      <span className="text-lg font-semibold tracking-wide">NAMA Uni-Scholarship</span>
    </Link>;
}