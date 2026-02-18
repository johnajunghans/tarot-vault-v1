import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    label: string;
    id: string;
    error?: { message?: string };
}

export default function TextField({ label, id, error, ...inputProps }: TextFieldProps) {
    return (
        <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <FieldContent>
                <Input
                    id={id}
                    type="text"
                    aria-invalid={!!error || undefined}
                    {...inputProps}
                />
                {error && <FieldError errors={[error]} />}
            </FieldContent>
        </Field>
    );
}
