import { CardDB, CardForm } from "@/types/spreads";
import {
    calcSpreadDimensions as calcSpreadCardDimensions,
    getGeneratedCardPosition,
} from "./spread-layout";

export function generateCard(index: number): CardForm {
    const { x, y } = getGeneratedCardPosition(index)

    return {
      name: "",
      description: "",
      allowReverse: true,
      x,
      y,
      r: 0,
      z: 0
    }
  }

export function generateCardAt(x: number, y: number): CardForm {
    return {
      name: "",
      description: "",
      allowReverse: true,
      x,
      y,
      r: 0,
      z: 0
    }
  }

export function calcSpreadDimensions(cards: CardDB[]) {
    return calcSpreadCardDimensions(cards)
}
