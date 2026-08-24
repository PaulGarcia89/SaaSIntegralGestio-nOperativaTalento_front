import { redirect } from "next/navigation";

export default async function InventoryAssetsAlias({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  redirect(`/inventory/${slug.join("/")}`);
}
