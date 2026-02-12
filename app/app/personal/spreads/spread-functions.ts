import { CARD_HEIGHT, CARD_WIDTH } from "./card";
import { cardData } from "./spread-schema";

export function generateCard(index: number): cardData {
    const CARDS_PER_ROW = 10;
    return {
      name: "",
      description: "",
      allowReverse: true,
      x: 15 + (index % CARDS_PER_ROW) * 105,
      y: 15 + Math.floor(index / CARDS_PER_ROW) * 165,
      r: 0,
      z: 0
    }
  }

// get the rectangular dimensions of a box that will fit the entire spread 
export function calcSpreadDimensions(cards: cardData[]) {
    const xValues = cards.map(c => c.x)
    const xMin = Math.min(...xValues)
    const xMax = Math.max(...xValues) + CARD_WIDTH

    const yValues = cards.map(c => c.y)
    const yMin = Math.min(...yValues)
    const yMax = Math.max(...yValues) + CARD_HEIGHT

    return { xMin, xMax, yMin, yMax }
}