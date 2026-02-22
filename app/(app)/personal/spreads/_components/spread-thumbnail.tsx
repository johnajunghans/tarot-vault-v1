import { calcSpreadDimensions } from "../utils"
import { CardDB } from "@/types/spreads";
import { CARD_HEIGHT, CARD_WIDTH } from "./card";

interface SpreadThumbnailProps {
    width: number;
    height: number;
    cards: CardDB[];
}

function ThumbnailCard({ x, y, r }: { x: number; y: number; r: number }) {
    const cx = x + CARD_WIDTH / 2;
    const cy = y + CARD_HEIGHT / 2;

    return (
        <g transform={r ? `rotate(${r}, ${cx}, ${cy})` : undefined}>
            <rect
                x={x} y={y}
                width={CARD_WIDTH} height={CARD_HEIGHT}
                rx={6}
                className="fill-card stroke-gold"
                strokeWidth={1}
                strokeOpacity={0.4}
            />
            <rect
                x={x + 4} y={y + 4}
                width={CARD_WIDTH - 8} height={CARD_HEIGHT - 8}
                rx={3}
                fill="none"
                className="stroke-gold"
                strokeWidth={0.4}
                strokeOpacity={0.2}
            />
            <rect
                x={x + 7} y={y + 7}
                width={CARD_WIDTH - 14} height={CARD_HEIGHT - 14}
                rx={2}
                className="fill-gold"
                fillOpacity={0.06}
                stroke="none"
            />
            {/* Mini diamond */}
            <polygon
                points={`${cx},${cy - 8} ${cx + 5},${cy} ${cx},${cy + 8} ${cx - 5},${cy}`}
                fill="none"
                className="stroke-gold"
                strokeWidth={0.5}
                strokeOpacity={0.25}
            />
        </g>
    );
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
                    <ThumbnailCard
                        key={card.position}
                        x={card.x}
                        y={card.y}
                        r={card.r}
                    />
                ))
            }
        </svg>
    )
}
