import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FormTextareaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name} className="text-muted-foreground">{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue ?? ""} rows={4} />
    </div>
  );
}
