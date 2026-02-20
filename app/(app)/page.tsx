import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function App() {
  redirect(routes.personal.root);
}