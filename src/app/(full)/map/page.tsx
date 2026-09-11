import { permanentRedirect } from "next/navigation";

/** The home page is the atlas now; /map is kept so old links still work. */
export default function MapPage() {
  permanentRedirect("/");
}
