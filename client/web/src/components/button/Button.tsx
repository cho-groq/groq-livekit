import React, { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  state?: "primary" | "secondary" | "dropdown" | "destructive";
  size?: "small" | "medium" | "large";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  disabled,
  state = "primary",
  size = "small",
  ...allProps
}) => {
  let buttonStyles;
  switch (state) {
    case "secondary":
      buttonStyles =
        "bg-transparent text-groq-control-text hover:text-groq-accent-text-active";
      break;

    case "dropdown":
      "bg-white rounded-sm text-groq-accent-text hover:text-groq-accent-text-active";
      break;

    case "destructive":
      buttonStyles = "bg-[#FFF] text-groq-action-text";
      break;

    default:
      buttonStyles =
        "bg-groq-button-bg hover:bg-groq-button-bg/90 text-groq-button-text hover:border-groq-action-text rounded-[6px] border-[1px]";
      break;
  }

  let sizeStyles;
  switch (size) {
    case "large":
      sizeStyles = "text-[16px] px-6 py-2 font-regular";
      break;

    case "medium":
      sizeStyles = "text-sm px-2 py-2";
      break;

    default: //small
      sizeStyles = "text-xs px-2 py-[6px]";
      break;
  }

  return (
    <button
      className={`active:translate-y-[2px] active:scale-[0.99] hover:-translate-y-[2px] flex flex-row ${
        disabled ? "pointer-events-none" : ""
      } ${size} ${buttonStyles} ${sizeStyles} transition-all ease-out duration-250 ${className}`}
      {...allProps}
    >
      {children}
    </button>
  );
};
