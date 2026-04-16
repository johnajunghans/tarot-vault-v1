import { cookies } from "next/headers";
import CreateSpread from "./create-spread";
import { Layout } from "react-resizable-panels";

interface NewSpreadPageProps {
  searchParams: Promise<{ draft?: string }>
}

export default async function NewSpreadPage({ searchParams }: NewSpreadPageProps) {
  const [cookieStore, resolvedSearchParams] = await Promise.all([
    cookies(),
    searchParams,
  ])
  const groupId = "spread-creation-layout"
  const defaultLayoutString = cookieStore.get(groupId)?.value
  const defaultLayout = defaultLayoutString
    ? (JSON.parse(defaultLayoutString) as Layout)
    : undefined

  const draftTimestamp = resolvedSearchParams.draft
    ? Number(resolvedSearchParams.draft)
    : undefined

  return <CreateSpread defaultLayout={defaultLayout} groupId={groupId} loadedDraftDate={draftTimestamp} />
}
