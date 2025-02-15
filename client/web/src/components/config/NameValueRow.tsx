import { ReactNode } from "react";

type NameValueRowProps = {
  name: string;
  value?: ReactNode;
  valueColor?: string;
};

export const NameValueRow: React.FC<NameValueRowProps> = ({
  name,
  value,
  valueColor = "black",
}) => {
  return (
    <div className="flex flex-row w-full items-baseline text-sm">
      <div className="grow shrink-0 text-black">{name}</div>
      <div className={`text-xs shrink text-${valueColor} text-right`}>
        {value}
      </div>
    </div>
  );
};
