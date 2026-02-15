"use client"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface SpreadCardProps {
    name: string
    date: Date
    isDraft?: boolean
}

function formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
}

export default function SpreadCard({ name, date, isDraft }: SpreadCardProps) {
    return (
        <Card size="sm" className="shadow-none hover:shadow-sm -translate-y-0 hover:-translate-y-1 duration-150 cursor-pointer">
            <CardHeader>
                <CardTitle>{name}</CardTitle>
                {isDraft && (
                    <CardAction>
                        <Badge variant="secondary">DRAFT</Badge>
                    </CardAction>
                )}
            </CardHeader>
            <CardFooter>
                <span className="text-xs text-muted-foreground">
                    {formatDate(date)}
                </span>
            </CardFooter>
        </Card>
    )
}
