import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { useGSAP } from '@gsap/react'
import {
    CARD_HEIGHT,
    CARD_WIDTH,
} from '../../lib'
import { snapClampAxis } from '../drag/snap'
import { CanvasCard } from '../types'

gsap.registerPlugin(Draggable)

export default function useCanvasCardTransform(
    card: CanvasCard,
    index: number,
    renderRotation: number,
    isViewMode: boolean,
    onDragStart: (index: number, x: number, y: number) => void,
    onDragEnd: (index: number, x: number, y: number) => void,
    onDrag: (index: number, x: number, y: number) => void,
    // onClick: (index: number) => void
) {
    const [isDraggingState, setIsDraggingState] = useState(false)
    const [disableDrag, setDisableDrag] = useState(false)

    const groupRef = useRef<SVGGElement>(null)
    const rotationRef = useRef<SVGGElement>(null)
    const badgeRef = useRef<SVGGElement>(null)
    const draggableRef = useRef<Draggable | null>(null)
    const isDraggingRef = useRef(false)

    useGSAP(
        () => {
            const group = groupRef.current
            if (!group) return

            gsap.set(group, { x: card.x, y: card.y })
            if (rotationRef.current) {
                gsap.set(rotationRef.current, {
                    rotation: renderRotation,
                    svgOrigin: `${CARD_WIDTH / 2} ${CARD_HEIGHT / 2}`,
                })
            }
            if (badgeRef.current) {
                gsap.set(badgeRef.current, {
                    rotation: -renderRotation,
                    svgOrigin: '15 15',
                })
            }
            if (isViewMode) return

            const [instance] = Draggable.create(group, {
                type: 'x,y',
                liveSnap: {
                    x: (value) => snapClampAxis(value, 'x'),
                    y: (value) => snapClampAxis(value, 'y'),
                },
                onDragStart: function () {
                    console.log("drag start")
                    isDraggingRef.current = true
                    setIsDraggingState(true)
                    onDragStart(index, this.x, this.y)
                },
                onDrag: function () {
                    onDrag(index, this.x, this.y)
                },
                onDragEnd: function () {
                    isDraggingRef.current = false
                    setIsDraggingState(false)
                    onDragEnd(index, this.x, this.y)
                },
                // onClick: function () {
                //     onClick(index)
                // },
                cursor: 'pointer',
                activeCursor: 'grabbing',
            })

            draggableRef.current = instance

            return () => {
                instance.kill()
            }
        },
        {
            dependencies: [
                index,
                isViewMode,
                onDragStart,
                onDragEnd,
                onDrag,
                // onClick,
            ],
        }
    )

    useEffect(() => {
        if (disableDrag) {
            draggableRef.current?.disable()
        } else {
            draggableRef.current?.enable()
        }
    }, [disableDrag])

    useEffect(() => {
        if (!groupRef.current || isDraggingRef.current) return
        gsap.set(groupRef.current, { x: card.x, y: card.y })
        draggableRef.current?.update()
    }, [card.x, card.y])

    useEffect(() => {
        const duration = isDraggingRef.current ? 0 : 0.18

        if (rotationRef.current) {
            gsap.to(rotationRef.current, {
                rotation: renderRotation,
                svgOrigin: `${CARD_WIDTH / 2} ${CARD_HEIGHT / 2}`,
                duration,
                ease: 'power2.out',
                overwrite: true,
            })
        }
        if (badgeRef.current) {
            gsap.to(badgeRef.current, {
                rotation: -renderRotation,
                svgOrigin: '15 15',
                duration,
                ease: 'power2.out',
                overwrite: true,
            })
        }
    }, [renderRotation])

    return {
        // refs
        groupRef,
        rotationRef,
        badgeRef,
        draggableRef,
        isDraggingRef,

        // state
        isDraggingState,
        setDisableDrag
    }
}