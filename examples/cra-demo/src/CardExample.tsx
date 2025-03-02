import { useState } from 'react';
import copy from 'copy-to-clipboard';

type CardExampleProps = {
  title: string;
  cardNumber: string;
};

const CardExample = ({ title, cardNumber }: CardExampleProps) => {
  const [isCopied, setCopied] = useState(false);

  function handleCopyButtonClick(): void {
    setCopied(true);
    copy(cardNumber);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  }

  return (
    <li>
      {title}
      <svg
        aria-hidden="true"
        onClick={handleCopyButtonClick}
        height="14"
        width="14"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 5h2a3 3 0 0 0 3-3 2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2 3 3 0 0 0 3 3zM6 2a2 2 0 1 1 4 0 1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"
          fillRule="evenodd"
        />
      </svg>
      {isCopied && <div className="alert">Copied!</div>}
    </li>
  );
};

export default CardExample;
