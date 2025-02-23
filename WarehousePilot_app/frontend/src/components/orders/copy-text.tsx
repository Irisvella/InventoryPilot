import { useState } from "react";
import { Tooltip } from "@nextui-org/react"; // Tooltip for better UX
import { Icon } from "@iconify/react"; // Import icons from iconify

interface CopyTextProps {
  text: string; // Define the expected prop type
}

const CopyText: React.FC<CopyTextProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 sec
  };

  return (
    <Tooltip content={copied ? "Copied!" : "Copy"} placement="top">
      <button onClick={handleCopy} className="ml-2 text-gray-500 hover:text-gray-700">
        <Icon icon={copied ? "solar:check-circle-linear" : "solar:copy-linear"} width={18} />
      </button>
    </Tooltip>
  );
};

export default CopyText;
