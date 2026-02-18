import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

interface SwitchFieldProps {
    label: string;
    id: string;
    description?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    error?: { message?: string };
}

export default function SwitchField({ label, id, description, checked, onCheckedChange, error }: SwitchFieldProps) {
    return (
        <Field orientation="horizontal" data-invalid={!!error || undefined}>
            <FieldContent>
                <FieldLabel htmlFor={id}>{label}</FieldLabel>
                {description && <FieldDescription>{description}</FieldDescription>}
                {error && <FieldError errors={[error]} />}
            </FieldContent>
            <Switch
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
                aria-invalid={!!error || undefined}
            />
        </Field>
    );
}
