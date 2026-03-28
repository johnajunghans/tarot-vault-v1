import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "onBlur"> {
    label: string;
    id?: string;
    description?: string;
    value: number;
    onChangeValue: (val: number) => void;
    onBlurTransform?: (val: number) => number;
    onBlur?: () => void;
    error?: { message?: string };
    trailingControls?: React.ReactNode;
    showStepper?: boolean;
}

function parseNumberValue(rawValue: string) {
    if (rawValue.trim() === "") {
        return null;
    }

    const value = Number(rawValue);
    return Number.isNaN(value) ? null : value;
}

function parseBound(bound?: number | string) {
    if (bound === undefined) {
        return undefined;
    }

    const value = typeof bound === "number" ? bound : Number(bound);
    return Number.isNaN(value) ? undefined : value;
}

function getStepValue(step?: number | string) {
    if (step === undefined) {
        return 1;
    }

    const value = typeof step === "number" ? step : Number(step);
    return Number.isNaN(value) || value <= 0 ? 1 : value;
}

function getPrecision(...values: number[]) {
    return values.reduce((maxPrecision, value) => {
        const [, fractional = ""] = value.toString().split(".");
        return Math.max(maxPrecision, fractional.length);
    }, 0);
}

export default function NumberField({
    label,
    id,
    description,
    value,
    onChangeValue,
    onBlurTransform,
    onBlur,
    error,
    trailingControls,
    showStepper = true,
    ...inputProps
}: NumberFieldProps) {
    const minValue = parseBound(inputProps.min);
    const maxValue = parseBound(inputProps.max);
    const stepValue = getStepValue(inputProps.step);
    const isDisabled = !!inputProps.disabled || !!inputProps.readOnly;

    const commitValue = (nextValue: number) => {
        if (Number.isNaN(nextValue)) {
            return;
        }

        onChangeValue(nextValue);
    };

    const handleStep = (direction: -1 | 1) => {
        const precision = getPrecision(value, stepValue);
        const steppedValue = Number((value + direction * stepValue).toFixed(precision));
        const clampedValue = Math.min(
            maxValue ?? steppedValue,
            Math.max(minValue ?? steppedValue, steppedValue),
        );

        commitValue(clampedValue);
    };

    const canDecrement = !isDisabled && (minValue === undefined || value > minValue);
    const canIncrement = !isDisabled && (maxValue === undefined || value < maxValue);
    return (
        <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <FieldContent>
                <div className="flex w-full items-stretch gap-2">
                    <InputGroup className="min-w-0 flex-1">
                        <InputGroupInput
                            id={id}
                            type="number"
                            value={value}
                            aria-invalid={!!error || undefined}
                            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            onChange={(e) => {
                                const nextValue = parseNumberValue(e.target.value);
                                if (nextValue !== null) {
                                    commitValue(nextValue);
                                }
                            }}
                            onBlur={(e) => {
                                const nextValue = parseNumberValue(e.target.value);
                                if (nextValue !== null) {
                                    commitValue(onBlurTransform ? onBlurTransform(nextValue) : nextValue);
                                }
                                onBlur?.();
                            }}
                            {...inputProps}
                        />
                        {showStepper && (
                            <InputGroupAddon
                                align="inline-end"
                                className="h-full shrink-0 gap-0 self-stretch border-l border-input px-0 py-0"
                            >
                                <div className="flex h-full flex-col">
                                    <InputGroupButton
                                        variant="ghost"
                                        size="icon-xs"
                                        className="h-1/2 w-7 rounded-none rounded-tr-[calc(var(--radius)-1px)] border-0 border-b border-b-input"
                                        aria-label={`Increase ${label.toLowerCase()}`}
                                        onClick={() => handleStep(1)}
                                        disabled={!canIncrement}
                                    >
                                        <HugeiconsIcon icon={ArrowUp01Icon} />
                                    </InputGroupButton>
                                    <InputGroupButton
                                        variant="ghost"
                                        size="icon-xs"
                                        className="h-1/2 w-7 rounded-none rounded-br-[calc(var(--radius)-1px)]"
                                        aria-label={`Decrease ${label.toLowerCase()}`}
                                        onClick={() => handleStep(-1)}
                                        disabled={!canDecrement}
                                    >
                                        <HugeiconsIcon icon={ArrowDown01Icon} />
                                    </InputGroupButton>
                                </div>
                            </InputGroupAddon>
                        )}
                    </InputGroup>
                    {!!trailingControls && (
                        <div className="flex items-center gap-2">
                            {trailingControls}
                        </div>
                    )}
                </div>
                {description && <FieldDescription>{description}</FieldDescription>}
                {error && <FieldError errors={[error]} />}
            </FieldContent>
        </Field>
    );
}
