"use client"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import SpreadThumbnail from "./spread-thumbnail"
import { CardPosition } from "@/types/spreads"
import { cardData } from "./spread-schema"

interface SpreadCardProps {
    name: string
    date: Date
    isDraft?: boolean
    cards: CardPosition[]
}

function formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
}

export default function SpreadCard({ 
    name, 
    date, 
    isDraft,
    cards 
}: SpreadCardProps) {
    return (
        <Card className="shadow-none hover:shadow-sm -translate-y-0 hover:-translate-y-1 duration-150 cursor-pointer">
            <CardHeader>
                <CardTitle>{name}</CardTitle>
                {isDraft && (
                    <CardAction>
                        <Badge variant="secondary">DRAFT</Badge>
                    </CardAction>
                )}
            </CardHeader>
            <CardContent className="flex justify-center">
                <SpreadThumbnail cards={cards} width={150} height={150} />
            </CardContent>
            <CardFooter>
                <span className="text-xs text-muted-foreground">
                    {formatDate(date)}
                </span>
            </CardFooter>
        </Card>
    )
}
