import { X } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";
import { calcSpreadDimensions } from "./spread-functions";
import { CardPosition } from "@/types/spreads";
import { CARD_HEIGHT, CARD_WIDTH } from "./card";
import { cardData } from "./spread-schema";

interface SpreadThumbnailProps {
    width: number;
    height: number;
    cards: CardPosition[];
}

export default function SpreadThumbnail({
    cards,
    width,
    height
}: SpreadThumbnailProps) {

    const bounds = calcSpreadDimensions(cards)
    const cardDataAtOrigin = cards.map(c => {
        return { ...c, x: c.x - bounds.xMin, y: c.y - bounds.yMin }
    })

    return (
        <svg 
            viewBox={`0 0 ${bounds.xMax - bounds.xMin} ${bounds.yMax - bounds.yMin}`}
            width={width}
            height={height}
            overflow="visible"
        >
            {cardDataAtOrigin
                .sort((a, b) => a.z - b.z)
                .map(card => (
                    <rect
                        key={card.position} 
                        x={card.x}
                        y={card.y}
                        width={CARD_WIDTH}
                        height={CARD_HEIGHT}
                        rotate={card.r}
                        rx={5}
                        ry={5}
                        className="stroke-gold fill-gold/10"
                    />
                ))
            }
        </svg>
    )
}