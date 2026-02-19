import { cookies } from "next/headers";
import EditPanelWrapper from "./edit-panel-wrapper";
import { Layout } from "react-resizable-panels";
import { Id } from "@/convex/_generated/dataModel";

interface EditSpreadPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}

export default async function EditSpreadPage({ params, searchParams }: EditSpreadPageProps) {
  const [cookieStore, resolvedParams, resolvedSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ])
  const mode: "view" | "edit" = resolvedSearchParams.mode === "view" ? "view" : "edit"
  const groupId = "spread-creation-layout"
  const defaultLayoutString = cookieStore.get(groupId)?.value
  const defaultLayout = defaultLayoutString
    ? (JSON.parse(defaultLayoutString) as Layout)
    : undefined

  return (
    <EditPanelWrapper
      spreadId={resolvedParams.id as Id<"spreads">}
      defaultLayout={defaultLayout}
      groupId={groupId}
      mode={mode}
    />
  )
}
