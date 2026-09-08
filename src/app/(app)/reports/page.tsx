import { redirect } from "next/navigation";

/** Legacy bookmarks no longer expose a cross-module report. */
export default function ReportsPage() { redirect("/dashboard"); }
