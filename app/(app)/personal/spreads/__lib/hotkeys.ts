export function isEditableHotkeyTarget(target: EventTarget | null): target is HTMLElement {
    if (!(target instanceof HTMLElement)) return false

    const isContentEditableTarget = (
        target.isContentEditable ||
        target.contentEditable === 'true' ||
        target.getAttribute('contenteditable') === 'true'
    )

    return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        isContentEditableTarget
    )
}

export function shouldFocusSpreadsSearchHotkey(
    target: EventTarget | null,
    searchInput: HTMLInputElement | null
) {
    if (!isEditableHotkeyTarget(target)) return true

    return target === searchInput
}
