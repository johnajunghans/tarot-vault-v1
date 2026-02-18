import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
    error?: { message?: string };
}

export default function TextareaField({ label, id, error, ...textareaProps }: TextareaFieldProps) {
    return (
        <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <FieldContent>
                <Textarea
                    id={id}
                    aria-invalid={!!error || undefined}
                    {...textareaProps}
                />
                {error && <FieldError errors={[error]} />}
            </FieldContent>
        </Field>
    );
}
