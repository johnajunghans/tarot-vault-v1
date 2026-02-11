import { cookies } from "next/headers";
import PanelWrapper from "./panel-wrapper";
import { Layout } from "react-resizable-panels";

export default async function NewSpreadPage() {
  const api = await cookies()
  const groupId = "spread-creation-layout"
  const defaultLayoutString = api.get(groupId)?.value
  const defaultLayout = defaultLayoutString
    ? (JSON.parse(defaultLayoutString) as Layout)
    : undefined

  return <PanelWrapper defaultLayout={defaultLayout} groupId={groupId} />
}
