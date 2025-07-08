import React from "react";
import "./fancy-checkbox.css";

interface FancyCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FancyCheckbox: React.FC<FancyCheckboxProps> = ({ label, ...props }) => (
  <div className="checkbox-wrapper-33">
    <label className="checkbox">
      <input className="checkbox__trigger visuallyhidden" type="checkbox" {...props} />
      <span className="checkbox__symbol">
        <svg aria-hidden="true" className="icon-checkbox" width="28px" height="28px" viewBox="0 0 28 28" version="1" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 14l8 7L24 7" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
      </span>
      <p className="checkbox__textwrapper">{label}</p>
    </label>
  </div>
); 