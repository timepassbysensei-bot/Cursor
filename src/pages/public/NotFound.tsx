import { Home, BookOpen, Phone, SearchX } from "lucide-react";
import { ButtonLink } from "../../components/ui/Button";
import { useSeo } from "../../hooks/useSeo";

export default function NotFound() {
  useSeo("Page not found — Bokaro Defence Academy");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-offwhite px-4 py-16 text-center">
      <SearchX className="h-12 w-12 text-saffron" aria-hidden />
      <p className="mt-4 font-display text-5xl font-extrabold text-navy">404</p>
      <h1 className="mt-2 font-display text-xl font-bold text-navy">This page could not be found</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        The link may be outdated or the page may have moved. Try one of these instead:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/"><Home className="h-4 w-4" aria-hidden /> Home</ButtonLink>
        <ButtonLink to="/courses" variant="outline"><BookOpen className="h-4 w-4" aria-hidden /> Courses</ButtonLink>
        <ButtonLink to="/contact" variant="outline"><Phone className="h-4 w-4" aria-hidden /> Contact</ButtonLink>
      </div>
    </div>
  );
}
