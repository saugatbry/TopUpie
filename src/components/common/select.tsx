import React from "react";
import {
  Select as SelectCN,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ISelectOptions = {
  value: string;
  label: string;
  icon?: React.FC;
};

type Props = {
  placeholder: string;
  placeholderIcon?: React.FC;
  options: ISelectOptions[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
};

function Select(props: Props) {
  const selected = props.options.find((o) => o.value === props.value);

  return (
    <SelectCN value={props.value} onValueChange={props.onChange}>
      <SelectTrigger className={cn("w-[180px]", props.className)}>
        {selected?.icon ? (
          <selected.icon />
        ) : props.placeholderIcon && !selected ? (
          <props.placeholderIcon />
        ) : null}
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent className={cn("z-[101] text-sm", props.className)}>
        <SelectGroup>
          {props.options.map((option, i) => (
            <div key={i} className="flex items-center">
              {option.icon && <option.icon />}
              <SelectItem value={option.value}>{option.label}</SelectItem>
            </div>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectCN>
  );
}

export default Select;
