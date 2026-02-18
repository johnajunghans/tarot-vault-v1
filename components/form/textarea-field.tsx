import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
    description?: string;
    error?: { message?: string };
}

export default function TextareaField({ label, id, description, error, ...textareaProps }: TextareaFieldProps) {
    return (
        <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Textarea
                id={id}
                aria-invalid={!!error || undefined}
                {...textareaProps}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {error && <FieldError errors={[error]} />}
        </Field>
    );
}
