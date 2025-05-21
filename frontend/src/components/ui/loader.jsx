import { cn } from "../../lib/utils";

export const Loader = ({
  size = "default",
  className,
  colorClassName = "border-brand-yellow",
}) => {
  let sizeClasses = "h-12 w-12 border-4";

  if (size === "sm") {
    sizeClasses = "h-5 w-5 border-2";
  } else if (size === "lg") {
    sizeClasses = "h-16 w-16 border-4";
  } else if (size !== "default") {
    sizeClasses = `${size} border-2`;
  }

  if (size === "default" || size === "lg") {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-screen",
          className
        )}
      >
        <div
          className={cn(
            "animate-spin rounded-full border-t-transparent border-b-transparent",
            sizeClasses,
            colorClassName
          )}
        ></div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-transparent border-b-transparent",
        sizeClasses,
        colorClassName,
        className
      )}
    ></div>
  );
};
