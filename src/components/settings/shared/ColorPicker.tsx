/**
 * Color picker — labeled color swatch with native color input.
 */
import { useId } from 'react';
import { Label } from '@/components/ui/Label';

type ColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  id?: string;
};

/**
 * Accessible color picker with a labeled swatch and hex display.
 * Uses a native &lt;input type=&quot;color&quot;&gt; under the hood.
 * @param value - Current hex color value
 * @param onChange - Called with the new hex value when the user picks a color
 * @param label - Accessible label (used for sr-only Label; default "Pick color")
 * @param id - Optional id for the input; auto-generated if not provided
 */
export function ColorPicker({ value, onChange, label = 'Pick color', id: providedId }: ColorPickerProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <input
        type="color"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-8 rounded-md cursor-pointer border border-border bg-transparent"
        aria-label={label}
      />
      <span className="text-xs text-muted-foreground font-mono w-20 uppercase tracking-wider">
        {value}
      </span>
    </div>
  );
}
