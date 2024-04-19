import React, { forwardRef } from "react";
import { Button } from "./Button";

type PopupProps = {
    className?: string;
    children: React.ReactNode;
    toggleDialog: () => void;
};

const Popup = forwardRef<HTMLDivElement, PopupProps>((props, ref) => {
  return (
    <dialog ref={ref} className={`popup ${props.className}`}
      onClick={
        (e) => {
          if (e.target === e.currentTarget) {
            props.toggleDialog();
          }
        }
      }
    >
      <div>
        {props.children}
      </div>
    </dialog>
  );
});

Popup.displayName = "Popup";

export default Popup;