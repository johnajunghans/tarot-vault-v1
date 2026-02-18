import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

interface SwitchFieldProps {
    label: string;
    id: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    error?: { message?: string };
}

export default function SwitchField({ label, id, checked, onCheckedChange, error }: SwitchFieldProps) {
    return (
        <Field orientation="horizontal" data-invalid={!!error || undefined}>
            <FieldLabel htmlFor={id} className="flex-1">{label}</FieldLabel>
            <FieldContent>
                <Switch
                    id={id}
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    aria-invalid={!!error || undefined}
                />
                {error && <FieldError errors={[error]} />}
            </FieldContent>
        </Field>
    );
}
