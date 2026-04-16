import CreateSpread from "./create-spread";
import { getPanelLayout } from "../_lib/get-panel-layout";

interface NewSpreadPageProps {
  searchParams: Promise<{ draft?: string }>
}

export default async function NewSpreadPage({ searchParams }: NewSpreadPageProps) {
  const groupId = "spread-new-layout"
  const [resolvedSearchParams, defaultLayout] = await Promise.all([
    searchParams,
    getPanelLayout(groupId)
  ])

  const draftTimestamp = resolvedSearchParams.draft
    ? Number(resolvedSearchParams.draft)
    : undefined

  return (
    <CreateSpread 
      defaultLayout={defaultLayout} 
      groupId={groupId} 
      loadedDraftDate={draftTimestamp} />
  )
}
