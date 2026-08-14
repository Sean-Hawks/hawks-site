import { redirect } from "next/navigation";

export default function NowRedirectPage() {
  redirect("/blog/");
}
