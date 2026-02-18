import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "onBlur"> {
    label: string;
    id?: string;
    value: number;
    onChangeValue: (val: number) => void;
    onBlurTransform?: (val: number) => number;
    onBlur?: () => void;
    error?: { message?: string };
}

export default function NumberField({
    label,
    id,
    value,
    onChangeValue,
    onBlurTransform,
    onBlur,
    error,
    ...inputProps
}: NumberFieldProps) {
    return (
        <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <FieldContent>
                <Input
                    id={id}
                    type="number"
                    value={value}
                    aria-invalid={!!error || undefined}
                    onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                            onChangeValue(val);
                        }
                    }}
                    onBlur={(e) => {
                        if (onBlurTransform) {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                                onChangeValue(onBlurTransform(val));
                            }
                        }
                        onBlur?.();
                    }}
                    {...inputProps}
                />
                {error && <FieldError errors={[error]} />}
            </FieldContent>
        </Field>
    );
}
