type ChatMessageProps = {
  message: string;
  accentColor: string;
  name: string;
  isSelf: boolean;
  hideName?: boolean;
};

export const ChatMessage = ({
  name,
  message,
  accentColor,
  isSelf,
  hideName,
}: ChatMessageProps) => {
  return (
    <div className={`flex flex-col gap-1 pt-1.5`}>
      {!hideName && (
        <div className="text-black uppercase text-xs font-semibold">{name}</div>
      )}
      {!isSelf && (
        <div className={`pr-4 text-black text-sm whitespace-pre-line`}>
          {message}
        </div>
      )}
      {isSelf && (
        <div className="flex items-center justify-end">
          <span
            className={` text-gray-800 text-sm whitespace-pre-line inline-block bg-gray-200 px-3 py-1.5 rounded-full`}
          >
            {message}
          </span>
        </div>
      )}
    </div>
  );
};
