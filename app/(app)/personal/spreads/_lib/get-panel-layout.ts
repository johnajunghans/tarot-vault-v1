import { cookies } from "next/headers";
import { Layout } from "react-resizable-panels";

export async function getPanelLayout(
    groupId: string
) {
    const cookieStore = await cookies()

    // Get react-resizable-panels layout from cookies
    const defaultLayoutString = cookieStore.get(groupId)?.value
    const defaultLayout = defaultLayoutString
        ? (JSON.parse(defaultLayoutString) as Layout)
        : undefined
    
    return defaultLayout
}