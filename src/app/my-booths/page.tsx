import { redirect } from "next/navigation";

export default function MyBoothsPage() {
  redirect("/dashboard?tab=booths");
}
