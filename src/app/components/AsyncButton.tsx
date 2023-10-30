import { useState } from "react";

export default function AsyncButton({
  onClick,
  disabled,
  title = "",
}: {
  onClick: () => Promise<void>;
  disabled: boolean;
  title: string;
}) {
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <button
      className={disabled ? "disabled" : ""}
      onClick={async () => {
        if (disabled) return;
        setLoading(true);
        await onClick();
        setLoading(false);
      }}
    >
      {loading ? <div className="loadingIndicator" /> : <p>{title}</p>}
    </button>
  );
}
