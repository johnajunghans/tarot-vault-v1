import SpreadDetail from "./spread-detail";
import { Id } from "@/convex/_generated/dataModel";
import { getPanelLayout } from "../_lib/get-panel-layout";

interface EditSpreadPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}

export default async function EditSpreadPage({ params, searchParams }: EditSpreadPageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ])
  const mode: "view" | "edit" = resolvedSearchParams.mode === "view" ? "view" : "edit"
  const groupId = "spread-id-layout"
  const defaultLayout = await getPanelLayout(
    groupId
  )

  return (
    <SpreadDetail
      spreadId={resolvedParams.id as Id<"spreads">}
      defaultLayout={defaultLayout}
      groupId={groupId}
      mode={mode}
    />
  )
}
